import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('create-cashfree-order function initialized');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    const { plan_id, pricing_id, amount, currency, phone_number } = requestBody;

    if (!plan_id || !phone_number) {
      throw new Error('Missing required fields: plan_id or phone_number');
    }

    console.log('Creating order for user:', user.id, 'plan:', plan_id);

    // Create service role client for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch plan details
    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan fetch error:', planError);
      throw new Error('Plan not found');
    }

    // Fetch pricing - use provided pricing_id or fetch for India
    let pricing;
    if (pricing_id) {
      const { data: pricingData, error: pricingError } = await serviceClient
        .from('plan_pricing')
        .select('*')
        .eq('id', pricing_id)
        .eq('is_active', true)
        .single();
      
      if (pricingError || !pricingData) {
        console.error('Pricing fetch error:', pricingError);
        throw new Error('Pricing not found');
      }
      pricing = pricingData;
    } else {
      // Fallback to India pricing
      const { data: pricingData, error: pricingError } = await serviceClient
        .from('plan_pricing')
        .select('*')
        .eq('plan_id', plan_id)
        .eq('country_code', 'IN')
        .eq('is_active', true)
        .single();

      if (pricingError || !pricingData) {
        console.error('Pricing fetch error:', pricingError);
        throw new Error('Pricing not found for India');
      }
      pricing = pricingData;
    }

    // Use provided amount or pricing amount
    const orderAmount = amount || pricing.price;
    const orderCurrency = currency || pricing.currency;
    const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`;

    console.log('Order details:', { orderId, orderAmount, orderCurrency });

    // Create payment record in database
    const { data: payment, error: paymentError } = await serviceClient
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        amount: orderAmount,
        currency: orderCurrency,
        payment_method: 'cashfree',
        payment_status: 'pending',
        external_payment_id: orderId,
        phone_number: phone_number,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error('Failed to create payment record');
    }

    console.log('Payment record created:', payment.id);

    // Get Cashfree credentials
    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const CASHFREE_ENVIRONMENT = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production';

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error('Cashfree credentials not configured');
    }

    console.log('Using Cashfree environment:', CASHFREE_ENVIRONMENT);

    // Use appropriate API endpoint based on environment
    const cashfreeApiUrl = CASHFREE_ENVIRONMENT === 'production' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    // Get origin for return URL
    const origin = req.headers.get('origin') || 'https://examtrakr.com';

    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email,
        customer_phone: phone_number,
      },
      order_meta: {
        return_url: `${origin}/profile?payment_status=success`,
        notify_url: 'https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook',
      },
    };

    console.log('Calling Cashfree API with order:', orderId);

    const cashfreeResponse = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderPayload),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeData);
      throw new Error(`Cashfree API error: ${cashfreeData.message || JSON.stringify(cashfreeData)}`);
    }

    console.log('Cashfree order created successfully:', orderId);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: cashfreeData.payment_session_id,
        order_token: cashfreeData.order_token,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-cashfree-order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});