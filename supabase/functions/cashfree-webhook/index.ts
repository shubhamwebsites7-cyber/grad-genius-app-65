import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-idempotency-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
console.info('🚀 Cashfree Webhook Initialized — LIVE PRODUCTION MODE');
// ✅ Updated signature verification based on Cashfree latest docs
async function verifyCashfreeSignature(rawBody: string, signature: string, timestamp: string, secretKey: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(timestamp + rawBody); // timestamp + raw payload, no separator
    const key = await crypto.subtle.importKey('raw', keyData, {
      name: 'HMAC',
      hash: 'SHA-256'
    }, false, [
      'sign'
    ]);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    // Standard Base64 encoding (not Base64URL)
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    return signature === expectedSignature;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}
serve(async (req)=>{
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
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
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'Invalid content-type, expected application/json'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const rawBody = await req.text();
    let webhookData;
    try {
      webhookData = JSON.parse(rawBody);
    } catch  {
      return new Response(JSON.stringify({
        error: 'Invalid JSON payload'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Ignore test events
    const isTestWebhook = webhookData?.type === 'TEST' || !webhookData?.data?.order?.order_id;
    if (isTestWebhook) {
      console.log('✅ Test webhook received from Cashfree');
      return new Response(JSON.stringify({
        success: true,
        message: 'Test webhook received successfully',
        redirect_url: 'https://www.examtrakr.com/profile?payment_status=success',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ Verify signature
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    if (!CASHFREE_SECRET_KEY || !signature || !timestamp) {
      return new Response(JSON.stringify({
        error: 'Missing signature or secret key'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp, CASHFREE_SECRET_KEY);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return new Response(JSON.stringify({
        error: 'Invalid signature'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Webhook signature verified successfully');
    // ✅ Idempotency check
    const idempotencyKey = req.headers.get('x-idempotency-header');
    if (idempotencyKey) {
      const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
      const { data: existing } = await supabase.from('payments').select('id').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (existing) {
        console.log('⚠️ Duplicate webhook detected, skipping processing');
        return new Response(JSON.stringify({
          success: true,
          message: 'Duplicate webhook, ignored'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Extract data
    const orderData = webhookData?.data?.order || webhookData?.data || webhookData;
    const paymentData = webhookData?.data?.payment || {};
    const customerDetails = webhookData?.data?.customer_details || {};
    const { order_id, order_status } = orderData;
    const customer_phone = customerDetails?.customer_phone || null;
    if (!order_id) {
      return new Response(JSON.stringify({
        error: 'Missing order_id in webhook data'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`🚀 Processing webhook for Order ID: ${order_id}`);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Find payment
    const { data: payment, error: paymentError } = await supabase.from('payments').select('*').eq('external_payment_id', order_id).maybeSingle();
    if (paymentError) throw new Error(`Database error: ${paymentError.message}`);
    if (!payment) return new Response(JSON.stringify({
      error: 'Payment record not found',
      order_id
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    // Determine payment status
    let newStatus = 'pending';
    const status = paymentData.payment_status?.toUpperCase();
    if (order_status === 'PAID' || status === 'SUCCESS') newStatus = 'completed';
    else if (status === 'FAILED' || order_status === 'CANCELLED' || order_status === 'EXPIRED') newStatus = 'failed';
    const updateData: {
      payment_status: string;
      updated_at: string;
      phone_number?: string;
      payment_method?: string;
      idempotency_key?: string;
    } = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (customer_phone && !payment.phone_number) updateData.phone_number = customer_phone;
    if (paymentData.payment_method) updateData.payment_method = paymentData.payment_method;
    if (idempotencyKey) updateData.idempotency_key = idempotencyKey;
    const { error: updateError } = await supabase.from('payments').update(updateData).eq('id', payment.id);
    if (updateError) throw new Error(`Failed to update payment: ${updateError.message}`);
    // ✅ If payment completed → activate subscription
    if (newStatus === 'completed') {
      const { data: plan, error: planError } = await supabase.from('subscription_plans').select('*').eq('id', payment.plan_id).single();
      if (planError || !plan) throw new Error(`Plan not found: ${planError?.message}`);
      
      // Use extend_subscription_with_trial to handle trial accumulation
      const { data: subscriptionResult, error: subError } = await supabase
        .rpc('extend_subscription_with_trial', {
          p_user_id: payment.user_id,
          p_plan_id: payment.plan_id,
          p_payment_id: payment.id,
          p_duration_months: plan.duration_months,
          p_purchase_platform: 'cashfree'
        });

      if (subError) throw new Error(`Failed to create/extend subscription: ${subError.message}`);

      if (!subscriptionResult || subscriptionResult.length === 0) {
        throw new Error('No subscription created');
      }

      const newSubscription = subscriptionResult[0];
      
      // Update payment with subscription_id
      await supabase.from('payments').update({
        subscription_id: newSubscription.subscription_id,
        updated_at: new Date().toISOString()
      }).eq('id', payment.id);
    }
    const redirectUrl = newStatus === 'completed' ? 'https://www.examtrakr.com/profile?payment_status=success' : 'https://www.examtrakr.com/profile?payment_status=failure';
    console.log(`✅ Webhook processed successfully — Status: ${newStatus}`);
    return new Response(JSON.stringify({
      success: true,
      status: newStatus,
      order_id,
      message: 'Webhook processed successfully',
      redirect_url: redirectUrl,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Webhook error:', errorMsg);
    return new Response(JSON.stringify({
      error: errorMsg,
      success: false,
      redirect_url: 'https://www.examtrakr.com/profile?payment_status=failure',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
