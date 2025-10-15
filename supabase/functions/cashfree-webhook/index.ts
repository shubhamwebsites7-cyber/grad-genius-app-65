import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

console.info('🚀 Cashfree Webhook Initialized — LIVE PRODUCTION MODE');

// ✅ Secure HMAC signature verification using Cashfree's Base64URL format
async function verifyCashfreeSignature(payload: string, signature: string, timestamp: string, secretKey: string): Promise<boolean> {
  try {
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(signedPayload);
    const key = await crypto.subtle.importKey('raw', keyData, {
      name: 'HMAC',
      hash: 'SHA-256'
    }, false, [
      'sign'
    ]);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // Base64URL encoding
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
  // Allow only POST method
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
    if (CASHFREE_SECRET_KEY && signature && timestamp) {
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
    } else {
      console.error('❌ Missing signature or secret key');
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
    // Find payment in database
    const { data: payment, error: paymentError } = await supabase.from('payments').select('*').eq('external_payment_id', order_id).maybeSingle();
    if (paymentError) throw new Error(`Database error: ${paymentError.message}`);
    if (!payment) {
      return new Response(JSON.stringify({
        error: 'Payment record not found',
        order_id
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ Determine payment status
    let newStatus = 'pending';
    const status = paymentData.payment_status?.toUpperCase();
    if (order_status === 'PAID' || status === 'SUCCESS') newStatus = 'completed';
    else if (status === 'FAILED' || order_status === 'CANCELLED') newStatus = 'failed';
    else if (order_status === 'EXPIRED') newStatus = 'failed';
    const updateData: any = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    };
    if (customer_phone && !payment.phone_number) updateData.phone_number = customer_phone;
    if (paymentData.payment_method) updateData.payment_method = paymentData.payment_method;
    const { error: updateError } = await supabase.from('payments').update(updateData).eq('id', payment.id);
    if (updateError) throw new Error(`Failed to update payment: ${updateError.message}`);
    // ✅ If payment successful → activate subscription
    if (newStatus === 'completed') {
      const { data: plan, error: planError } = await supabase.from('subscription_plans').select('*').eq('id', payment.plan_id).single();
      if (planError || !plan) throw new Error(`Plan not found: ${planError?.message}`);
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);
      // Expire previous subscriptions
      await supabase.from('user_subscriptions').update({
        status: 'expired',
        updated_at: now.toISOString()
      }).eq('user_id', payment.user_id).eq('status', 'active');
      // Create new active subscription
      const { data: newSubscription, error: subError } = await supabase.from('user_subscriptions').insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: 'cashfree',
        external_subscription_id: order_id,
        auto_renew: false,
        last_payment_id: payment.id
      }).select().single();
      if (subError) throw new Error(`Failed to create subscription: ${subError.message}`);
      // Update payment with subscription_id
      await supabase.from('payments').update({
        subscription_id: newSubscription.id,
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
