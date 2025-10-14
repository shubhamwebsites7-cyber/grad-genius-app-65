import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare global Deno for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Type definitions
interface PricingData {
  price: number;
  currency: string;
  country_code: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Input validation helpers
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const sanitizePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const startTime = Date.now();
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  // ALWAYS log in production for debugging
  console.log('=== CREATE CASHFREE ORDER START ===');
  console.log('Request method:', req.method);
  console.log('Environment:', Deno.env.get('ENVIRONMENT'));
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      throw new Error('Missing required environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Invalid or missing authorization header');
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ User authenticated:', user.id);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('📦 Request body received:', {
      has_plan_id: !!requestBody.plan_id,
      has_pricing_id: !!requestBody.pricing_id,
      has_phone_number: !!requestBody.phone_number
    });
    
    const { plan_id, pricing_id, phone_number } = requestBody;
    
    // Validate required fields
    if (!plan_id || typeof plan_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid plan_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!isValidUUID(plan_id)) {
      return new Response(JSON.stringify({ error: 'Invalid plan_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (pricing_id && (!isValidUUID(pricing_id))) {
      return new Response(JSON.stringify({ error: 'Invalid pricing_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!phone_number || typeof phone_number !== 'string' || !isValidPhoneNumber(phone_number)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid phone_number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch and validate subscription plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('id, name, duration_months, is_active')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();
      
    if (planError || !plan) {
      if (isDevelopment) {
        console.log('Plan error:', planError);
        console.log('Plan ID searched:', plan_id);
      }
      return new Response(JSON.stringify({ error: 'Plan not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (isDevelopment) console.log('Plan found:', plan.name);

    // Fetch pricing information
    let pricing: PricingData | null = null;
    try {
      let query = supabaseClient
        .from('plan_pricing')
        .select('price, currency, country_code')
        .eq('plan_id', plan_id)
        .eq('is_active', true);
        
      if (pricing_id) {
        query = query.eq('id', pricing_id);
      } else {
        query = query.eq('country_code', 'IN');
      }
      
      const pricingResult = await query.maybeSingle();
      pricing = pricingResult.data as PricingData | null;
      
      if (isDevelopment) console.log('Pricing query result:', pricingResult);
    } catch (pricingError) {
      if (isDevelopment) console.log('Pricing query error:', pricingError);
    }
    
    // Use fallback pricing if not found
    if (!pricing) {
      pricing = { price: 89, currency: 'INR', country_code: 'IN' };
      if (isDevelopment) console.log('Using fallback pricing:', pricing);
    } else {
      if (isDevelopment) console.log('Using database pricing:', pricing);
    }
    
    // Validate pricing data (pricing is guaranteed to be non-null here)
    if (!pricing.price || pricing.price <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid pricing configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate Cashfree configuration
    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const CASHFREE_ENVIRONMENT = Deno.env.get('CASHFREE_ENVIRONMENT') || 'production';
    
    console.log('💳 Cashfree configuration check:');
    console.log('CASHFREE_APP_ID:', CASHFREE_APP_ID ? 'Present' : '❌ MISSING');
    console.log('CASHFREE_SECRET_KEY:', CASHFREE_SECRET_KEY ? 'Present' : '❌ MISSING');
    console.log('CASHFREE_ENVIRONMENT:', CASHFREE_ENVIRONMENT);
    
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error('❌ Missing Cashfree credentials');
      return new Response(JSON.stringify({ 
        error: 'Payment gateway configuration error',
        details: 'Missing Cashfree APP_ID or SECRET_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate order details
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID().split('-')[0]; // More secure random string
    const orderId = `examtrakr_${timestamp}_${randomStr}`;
    const orderAmount = Math.round(Number(pricing.price) * 100) / 100; // Round to 2 decimal places
    const orderCurrency = pricing.currency || 'INR';
    const customerPhone = sanitizePhoneNumber(phone_number);

    // Validate order amount
    if (orderAmount < 1 || orderAmount > 100000) {
      return new Response(JSON.stringify({ error: 'Invalid order amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (isDevelopment) {
      console.log('Order details:');
      console.log('Order ID:', orderId);
      console.log('Amount:', orderAmount);
      console.log('Currency:', orderCurrency);
      console.log('Phone:', customerPhone);
    }

    // Create payment record
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
      .select('id')
      .single();
      
    if (paymentError) {
      if (isDevelopment) console.log('Payment record creation error:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (isDevelopment) console.log('Payment record created:', payment.id);

    // Prepare Cashfree order payload
    const baseUrl = Deno.env.get('SITE_URL') || 'https://www.examtrakr.com';
    const webhookUrl = Deno.env.get('WEBHOOK_URL') || 'https://bjndsotwbzmuqwdikdaq.supabase.co/functions/v1/cashfree-webhook';
    
    const orderPayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: user.id.substring(0, 50), // Limit length for Cashfree
        customer_email: user.email || `user_${user.id.substring(0, 8)}@examtrakr.com`,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${baseUrl}/profile?payment_status=success`,
        notify_url: webhookUrl,
      },
      order_note: `Subscription: ${plan.name.substring(0, 100)} - User: ${user.id.substring(0, 8)}`,
    };

    const apiUrl = CASHFREE_ENVIRONMENT === 'production' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    console.log('🚀 Calling Cashfree API:', apiUrl);
    console.log('Order payload:', JSON.stringify(orderPayload, null, 2));

    // Call Cashfree API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let cfRes;
    try {
      cfRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
        },
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Cashfree API fetch error:', fetchError);
      
      await supabaseClient.from('payments')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      
      return new Response(JSON.stringify({ 
        error: 'Payment gateway timeout or network error',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    clearTimeout(timeoutId);
    
    console.log('📨 Cashfree API response status:', cfRes.status);
    console.log('Response headers:', Object.fromEntries(cfRes.headers.entries()));
    
    let cfData;
    try {
      cfData = await cfRes.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse Cashfree response:', jsonError);
      
      await supabaseClient.from('payments')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      
      return new Response(JSON.stringify({ error: 'Invalid response from payment gateway' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('📋 Cashfree API response data:', JSON.stringify(cfData, null, 2));

    // Handle Cashfree API errors
    if (!cfRes.ok) {
      console.error('❌ Cashfree API error:', {
        status: cfRes.status,
        message: cfData?.message,
        error: cfData?.error,
        fullResponse: cfData
      });
      
      await supabaseClient.from('payments')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      
      const errorMessage = cfData?.message || cfData?.error || 'Payment gateway error';
      return new Response(JSON.stringify({ 
        error: errorMessage,
        cashfree_error: cfData
      }), {
        status: cfRes.status === 400 ? 400 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract payment session details
    const paymentSessionId = cfData.payment_session_id || cfData.session_id;
    
    console.log('🔑 Payment session details:', { 
      has_session_id: !!paymentSessionId,
      cf_order_id: cfData.cf_order_id
    });
    
    // Validate required response field
    if (!paymentSessionId) {
      console.error('❌ Missing payment_session_id:', {
        received_fields: Object.keys(cfData),
        payment_session_id: paymentSessionId
      });
      
      await supabaseClient.from('payments')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
      
      return new Response(JSON.stringify({ 
        error: 'Invalid payment session response',
        details: 'Missing payment_session_id'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return success response
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Request completed successfully in ${responseTime}ms`);
    console.log('📤 Returning response with session_id:', paymentSessionId?.substring(0, 20) + '...');
    
    return new Response(JSON.stringify({
      success: true,
      payment_session_id: paymentSessionId,
      order_id: orderId,
      amount: orderAmount,
      currency: orderCurrency,
      plan_name: plan.name,
      environment: CASHFREE_ENVIRONMENT,
      payment_id: payment.id,
    }), {
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      } 
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('=== ❌ ERROR OCCURRED ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error(`Request failed in ${responseTime}ms`);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
        statusCode = 401;
        errorMessage = 'Unauthorized';
      } else if (error.message.includes('not found') || error.message.includes('Not found')) {
        statusCode = 404;
        errorMessage = 'Resource not found';
      } else if (error.message.includes('Invalid') || error.message.includes('Missing')) {
        statusCode = 400;
        errorMessage = isDevelopment ? error.message : 'Bad request';
      } else {
        errorMessage = isDevelopment ? error.message : 'Internal server error';
      }
    }
    
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
      timestamp: new Date().toISOString()
    }), { 
      status: statusCode, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      } 
    });
  }
});
