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

    const { plan_id, phone_number } = await req.json();

    if (!plan_id || !phone_number) {
      throw new Error('Missing required fields: plan_id or phone_number');
    }

    // Fetch plan details
    const { data: plan, error: planError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Fetch pricing for India
    const { data: pricing, error: pricingError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
      .from('plan_pricing')
      .select('*')
      .eq('plan_id', plan_id)
      .eq('country_code', 'IN')
      .eq('is_active', true)
      .single();

    if (pricingError || !pricing) {
      throw new Error('Pricing not found for India');
    }

    const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`;
    const orderAmount = pricing.price;
    const orderCurrency = pricing.currency;

    // Create payment record
    const { data: payment, error: paymentError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
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

    // Create Cashfree order
    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error('Cashfree credentials not configured');
    }

    const cashfreeApiUrl = 'https://sandbox.cashfree.com/pg/orders'; // Use 'https://api.cashfree.com/pg/orders' for production

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
        return_url: `${req.headers.get('origin') || 'https://examtrakr.com'}/profile?payment=success`,
        notify_url: 'https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook',
      },
    };

    console.log('Creating Cashfree order:', orderId);

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
      throw new Error(`Cashfree API error: ${cashfreeData.message || 'Unknown error'}`);
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
