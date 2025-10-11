import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
}

console.info('cashfree-webhook initialized');

// Helper function to verify Cashfree webhook signature using Web Crypto API
async function verifyCashfreeSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secretKey: string
): Promise<boolean> {
  try {
    // Cashfree signature format: timestamp.payload
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(signedPayload);

    // Import key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    
    // Convert to base64
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = btoa(String.fromCharCode(...signatureArray));
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

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

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Parse webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch (err) {
      console.error('Failed to parse JSON payload:', err);
      return new Response(JSON.stringify({
        error: 'Invalid JSON payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Optional: Verify Cashfree webhook signature for production security
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    if (CASHFREE_SECRET_KEY) {
      const signature = req.headers.get('x-webhook-signature');
      const timestamp = req.headers.get('x-webhook-timestamp');
      
      if (signature && timestamp) {
        const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp, CASHFREE_SECRET_KEY);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return new Response(JSON.stringify({
            error: 'Invalid signature'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        console.log('✅ Webhook signature verified');
      } else {
        console.warn('⚠️ Signature headers missing, skipping verification');
      }
    }

    console.log('Cashfree webhook received for order:', webhookData?.data?.order?.order_id);

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

    // Extract order details (Cashfree sends data in nested structure)
    const orderData = webhookData?.data?.order || webhookData?.data || webhookData;
    const paymentData = webhookData?.data?.payment || {};
    const customerDetails = webhookData?.data?.customer_details || orderData?.customer_details || {};
    
    const { 
      order_id, 
      order_status,
      order_amount,
      order_currency 
    } = orderData;
    
    const customer_phone = customerDetails?.customer_phone || null;
    const customer_email = customerDetails?.customer_email || null;

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

    // Prepare update data
    const updateData: any = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add customer phone if available and not already stored
    if (customer_phone && !payment.customer_phone) {
      updateData.customer_phone = customer_phone;
      console.log(`Storing customer phone: ${customer_phone.substring(0, 4)}****`);
    }

    // Add payment metadata if available
    if (paymentData.payment_method) {
      updateData.payment_method = paymentData.payment_method;
    }

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update(updateData)
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
