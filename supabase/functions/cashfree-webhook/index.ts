import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.info('cashfree-webhook initialized');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate content type
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('Invalid content-type:', contentType);
      return new Response(JSON.stringify({
        error: 'Invalid content-type, expected application/json'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse webhook payload
    let webhookData;
    try {
      webhookData = await req.json();
    } catch (err) {
      console.error('Failed to parse JSON payload:', err);
      return new Response(JSON.stringify({
        error: 'Invalid JSON payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Cashfree webhook received:', JSON.stringify(webhookData));

    // Validate payload structure
    if (!webhookData || typeof webhookData !== 'object') {
      console.error('Empty or invalid payload');
      return new Response(JSON.stringify({
        error: 'Empty or invalid payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract order details (Cashfree sends data in data object)
    const { order_id, order_status } = webhookData?.data || webhookData;

    if (!order_id) {
      console.error('Missing order_id in webhook data');
      return new Response(JSON.stringify({
        error: 'Invalid webhook data: missing order_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing webhook for order: ${order_id}, status: ${order_status}`);

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('external_payment_id', order_id)
      .maybeSingle();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      throw new Error('Database error while fetching payment');
    }

    if (!payment) {
      console.error('Payment not found for order_id:', order_id);
      return new Response(JSON.stringify({
        error: 'Payment record not found',
        order_id
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Payment found: ${payment.id}, current status: ${payment.payment_status}`);

    // Map Cashfree status to our payment status
    let newStatus = 'pending';
    if (order_status === 'PAID') {
      newStatus = 'completed';
    } else if (order_status === 'ACTIVE') {
      newStatus = 'pending';
    } else if (order_status === 'EXPIRED' || order_status === 'CANCELLED') {
      newStatus = 'failed';
    }

    console.log(`Updating payment status from ${payment.payment_status} to ${newStatus}`);

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw new Error('Failed to update payment status');
    }

    // If payment is successful, create/update subscription
    if (newStatus === 'completed') {
      console.log(`Payment successful, creating subscription for user: ${payment.user_id}`);

      // Get plan details
      const { data: plan, error: planError } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('id', payment.plan_id)
        .single();

      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        throw new Error('Plan not found');
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

      console.log(`Subscription will expire at: ${expiresAt.toISOString()}`);

      // Check for existing active subscription
      const { data: existingSubscription } = await supabaseClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingSubscription) {
        console.log(`Expiring existing subscription: ${existingSubscription.id}`);
        // Expire the old subscription
        await supabaseClient
          .from('user_subscriptions')
          .update({ 
            status: 'expired', 
            updated_at: now.toISOString() 
          })
          .eq('id', existingSubscription.id);
      }

      // Create new subscription
      const { error: subscriptionError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: payment.user_id,
          plan_id: payment.plan_id,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_method: 'cashfree',
          external_subscription_id: order_id,
          auto_renew: false
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw new Error('Failed to create subscription');
      }

      console.log(`✅ Subscription created successfully for user: ${payment.user_id}`);
    }

    console.log(`✅ Webhook processed successfully for order: ${order_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: newStatus,
        order_id,
        message: 'Webhook processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in cashfree-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
