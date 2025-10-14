import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('=== MANUAL PAYMENT COMPLETION START ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { order_id, admin_key } = await req.json();
    
    // Simple admin authentication (replace with proper auth)
    const expectedAdminKey = Deno.env.get('ADMIN_COMPLETION_KEY') || 'admin123';
    if (admin_key !== expectedAdminKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing order:', order_id);

    // Find the pending payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('external_payment_id', order_id)
      .eq('payment_status', 'pending')
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(JSON.stringify({ 
        error: 'Payment not found or not pending',
        order_id 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found payment:', payment.id);

    // Get the subscription plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', payment.plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return new Response(JSON.stringify({ 
        error: 'Subscription plan not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found plan:', plan.name);

    // Update payment status to completed
    const { error: updatePaymentError } = await supabaseClient
      .from('payments')
      .update({
        payment_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Failed to update payment:', updatePaymentError);
      throw new Error(`Failed to update payment: ${updatePaymentError.message}`);
    }

    console.log('Payment updated to completed');

    // Calculate expiration date
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

    // Deactivate any existing active subscriptions for this user
    const { error: deactivateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        status: 'expired',
        updated_at: now.toISOString(),
      })
      .eq('user_id', payment.user_id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error('Failed to deactivate existing subscriptions:', deactivateError);
    } else {
      console.log('Deactivated existing subscriptions');
    }

    // Create new subscription
    const { data: newSubscription, error: subscriptionError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: 'cashfree',
        external_subscription_id: order_id,
        auto_renew: false,
        last_payment_id: payment.id,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    console.log('Created subscription:', newSubscription.id);

    // Update payment with subscription_id
    const { error: linkError } = await supabaseClient
      .from('payments')
      .update({
        subscription_id: newSubscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (linkError) {
      console.error('Failed to link payment to subscription:', linkError);
    } else {
      console.log('Linked payment to subscription');
    }

    console.log('✅ Payment completion successful');

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment completed and subscription created',
      order_id,
      payment_id: payment.id,
      subscription_id: newSubscription.id,
      plan_name: plan.name,
      expires_at: expiresAt.toISOString(),
      amount: payment.amount,
      currency: payment.currency
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error completing payment:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
