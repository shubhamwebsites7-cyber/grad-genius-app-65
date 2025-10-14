import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('create-cashfree-order initialized - Production Ready');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Authenticate user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Authentication failed:', userError?.message);
      throw new Error('Unauthorized - Invalid token');
    }

    // Parse and validate request body
    const requestBody = await req.json();
    const { plan_id, pricing_id, phone_number } = requestBody;

    if (!plan_id) {
      throw new Error('Missing required field: plan_id');
    }

    console.log('Processing payment order:', {
      user_id: user.id,
      plan_id,
      pricing_id,
      phone_number: phone_number ? 'provided' : 'not provided'
    });

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan fetch error:', planError?.message);
      throw new Error(`Plan not found: ${planError?.message || 'Invalid plan_id'}`);
    }

    // Fetch pricing details with fallback logic
    let pricingQuery = supabaseClient
      .from('plan_pricing')
      .select('*')
      .eq('plan_id', plan_id)
      .eq('is_active', true);

    if (pricing_id) {
      pricingQuery = pricingQuery.eq('id', pricing_id);
    } else {
      // Default to Indian pricing for production
      pricingQuery = pricingQuery.eq('country_code', 'IN');
    }

    const { data: pricing, error: pricingError } = await pricingQuery.single();

    if (pricingError || !pricing) {
      console.error('Pricing fetch error:', pricingError?.message);
      throw new Error(`Pricing not found: ${pricingError?.message || 'No active pricing available'}`);
    }

    // Validate environment variables
    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const CASHFREE_ENVIRONMENT = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production';

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('Missing Cashfree credentials');
      throw new Error('Payment gateway configuration error');
    }

    // Generate unique order ID with timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const orderId = `examtrakr_${timestamp}_${randomStr}`;
    
    const orderAmount = Number(pricing.price);
    const orderCurrency = pricing.currency || 'INR';

    // Validate phone number format
    let customerPhone = phone_number;
    if (!customerPhone) {
      // Use a default phone number if not provided
      customerPhone = '+919999999999';
    } else if (!customerPhone.startsWith('+91')) {
      customerPhone = `+91${customerPhone.replace(/\D/g, '')}`;
    }

    console.log('Order details:', {
      orderId,
      orderAmount,
      orderCurrency,
      plan_name: plan.name,
      environment: CASHFREE_ENVIRONMENT
    });

    // Create payment record in database first
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
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

    if (paymentError) {
      console.error('Payment record creation failed:', paymentError);
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    console.log('Payment record created successfully:', payment.id);

    // Prepare Cashfree order payload
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
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
      },
      order_note: `Subscription: ${plan.name} - User: ${user.id}`,
    };

    // Determine API URL based on environment
    const apiUrl = CASHFREE_ENVIRONMENT === 'production' 
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    console.log('Making Cashfree API request:', {
      url: apiUrl,
      order_id: orderId,
      amount: orderAmount
    });

    // Create order with Cashfree API
    const cashfreeResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderPayload),
    });

    const responseText = await cashfreeResponse.text();
    console.log('Cashfree API response:', {
      status: cashfreeResponse.status,
      statusText: cashfreeResponse.statusText,
      body: responseText
    });

    if (!cashfreeResponse.ok) {
      // Update payment record as failed
      await supabaseClient
        .from('payments')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      throw new Error(`Cashfree API error: ${cashfreeResponse.status} - ${responseText}`);
    }

    const cashfreeData = JSON.parse(responseText);

    // Validate Cashfree response
    if (!cashfreeData.payment_session_id || !cashfreeData.order_token) {
      console.error('Invalid Cashfree response:', cashfreeData);
      throw new Error('Invalid response from payment gateway');
    }

    console.log('Cashfree order created successfully:', {
      payment_session_id: cashfreeData.payment_session_id,
      order_token: cashfreeData.order_token
    });

    // Return success response with all necessary data
    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cashfreeData.payment_session_id,
        order_token: cashfreeData.order_token,
        order_id: orderId,
        amount: orderAmount,
        currency: orderCurrency,
        plan_name: plan.name,
        environment: CASHFREE_ENVIRONMENT,
        payment_id: payment.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in create-cashfree-order:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});