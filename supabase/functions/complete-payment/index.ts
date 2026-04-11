import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
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
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!order_id) {
      return new Response(JSON.stringify({
        error: 'Missing order_id'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Processing order:', order_id);
    // Find the pending payment
    const { data: payment, error: paymentError } = await supabaseClient.from('payments').select('*').eq('external_payment_id', order_id).eq('payment_status', 'pending').single();
    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(JSON.stringify({
        error: 'Payment not found or not pending',
        order_id
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Found payment:', payment.id);
    // Get the subscription plan
    const { data: plan, error: planError } = await supabaseClient.from('subscription_plans').select('*').eq('id', payment.plan_id).single();
    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return new Response(JSON.stringify({
        error: 'Subscription plan not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Found plan:', plan.name);
    
    // Use extend_subscription to create/extend subscription
    const { data: subscriptionResult, error: subscriptionError } = await supabaseClient
      .rpc('extend_subscription', {
        p_user_id: payment.user_id,
        p_plan_id: payment.plan_id,
        p_payment_id: payment.id,
        p_duration_months: plan.duration_months,
        p_purchase_platform: 'cashfree'
      });

    if (subscriptionError) {
      console.error('Failed to create/extend subscription:', subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    if (!subscriptionResult || subscriptionResult.length === 0) {
      throw new Error('No subscription created');
    }

    const newSubscription = subscriptionResult[0];
    console.log('Created/extended subscription:', newSubscription.subscription_id);
    
    // Update payment status to completed and link to subscription
    const { error: updatePaymentError } = await supabaseClient.from('payments').update({
      payment_status: 'completed',
      subscription_id: newSubscription.subscription_id,
      updated_at: new Date().toISOString()
    }).eq('id', payment.id);
    
    if (updatePaymentError) {
      console.error('Failed to update payment:', updatePaymentError);
      throw new Error(`Failed to update payment: ${updatePaymentError.message}`);
    }
    
    console.log('Payment updated to completed and linked to subscription');
    console.log('✅ Payment completion successful');
    return new Response(JSON.stringify({
      success: true,
      message: 'Payment completed and subscription created',
      order_id,
      payment_id: payment.id,
      subscription_id: newSubscription.subscription_id,
      plan_name: plan.name,
      expires_at: newSubscription.expires_at,
      accumulated_days: newSubscription.accumulated_days,
      amount: payment.amount,
      currency: payment.currency
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error completing payment:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
