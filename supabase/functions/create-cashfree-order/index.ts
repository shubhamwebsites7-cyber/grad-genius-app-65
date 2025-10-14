import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Unauthorized - Invalid token');

    const { plan_id, pricing_id, phone_number } = await req.json();
    if (!plan_id) throw new Error('Missing required field: plan_id');

    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    if (planError || !plan) throw new Error('Plan not found');

    let pricing = null;
    try {
      let query = supabaseClient.from('plan_pricing').select('*').eq('plan_id', plan_id).eq('is_active', true);
      if (pricing_id) query = query.eq('id', pricing_id);
      else query = query.eq('country_code', 'IN');
      pricing = (await query.maybeSingle()).data;
    } catch { }
    if (!pricing) pricing = { price: 89, currency: 'INR', country_code: 'IN' };

    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const CASHFREE_ENVIRONMENT = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production';
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) throw new Error('Payment gateway configuration error');

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const orderId = `examtrakr_${timestamp}_${randomStr}`;
    const orderAmount = Number(pricing.price);
    const orderCurrency = pricing.currency || 'INR';
    const customerPhone = phone_number?.startsWith('+91') 
      ? phone_number 
      : '+91' + (phone_number?.replace(/\D/g, '') || '9999999999');

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id,
        amount: orderAmount,
        currency: orderCurrency,
        payment_status: 'pending',
        external_payment_id: orderId,
        phone_number: customerPhone,
        payment_method: 'cashfree',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (paymentError) throw new Error('Failed to create payment record');

    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email || `user_${user.id}@examtrakr.com`,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: 'https://www.examtrakr.com/profile?payment_status=success',
        notify_url: 'https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook',
      },
      order_note: `Subscription: ${plan.name} - User: ${user.id}`,
    };

    const apiUrl = CASHFREE_ENVIRONMENT === 'production' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const cfRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderPayload),
    });
    const cfData = await cfRes.json();

    if (!cfRes.ok || !cfData.payment_session_id || !cfData.order_token) {
      await supabaseClient.from('payments').update({ payment_status: 'failed', updated_at: new Date().toISOString() }).eq('id', payment.id);
      throw new Error('Cashfree API error or invalid response');
    }

    return new Response(JSON.stringify({
      success: true,
      payment_session_id: cfData.payment_session_id,
      order_token: cfData.order_token,
      order_id: orderId,
      amount: orderAmount,
      currency: orderCurrency,
      plan_name: plan.name,
      environment: CASHFREE_ENVIRONMENT,
      payment_id: payment.id,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      timestamp: new Date().toISOString()
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
