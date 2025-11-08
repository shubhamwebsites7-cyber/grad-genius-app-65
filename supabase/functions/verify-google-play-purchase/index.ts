import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseRequest {
  purchaseToken: string;
  productId: string;
  packageName: string;
  planId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { purchaseToken, productId, packageName, planId }: PurchaseRequest = await req.json();

    console.log('🔍 Verifying Google Play purchase:', { 
      userId: user.id, 
      productId, 
      packageName,
      planId 
    });

    // Check for duplicate purchase token
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, payment_status')
      .eq('google_play_purchase_token', purchaseToken)
      .maybeSingle();

    if (existingPayment) {
      if (existingPayment.payment_status === 'completed') {
        console.log('⚠️ Purchase already processed:', purchaseToken);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'This purchase has already been processed' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get Google Play service account credentials
    const serviceAccountJson = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      console.error('❌ Google Play service account not configured');
      throw new Error('Payment verification not configured. Please contact support.');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // Get access token for Google Play API
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = btoa(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    // Note: In production, use proper JWT signing with RS256
    // This is simplified for demonstration
    const jwt = `${jwtHeader}.${jwtPayload}`;

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Google API access token');
    }

    const { access_token } = await tokenResponse.json();

    // Verify purchase with Google Play API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;
    
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.text();
      console.error('❌ Google Play verification failed:', errorData);
      throw new Error('Failed to verify purchase with Google Play');
    }

    const purchaseData = await verifyResponse.json();
    
    console.log('✅ Google Play verification successful:', purchaseData);

    // Check purchase state
    const subscriptionState = purchaseData.subscriptionState;
    if (subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
      throw new Error('Subscription is not active');
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, duration_months')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid plan ID');
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    // Extract price from Google Play response (in micros)
    const priceMicros = purchaseData.lineItems?.[0]?.priceAmountMicros || 0;
    const amount = Number(priceMicros) / 1000000;
    const currency = purchaseData.lineItems?.[0]?.priceCurrencyCode || 'USD';

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: amount,
        currency: currency,
        payment_method: 'google_play',
        payment_status: 'completed',
        external_payment_id: purchaseData.latestOrderId || purchaseToken,
        platform: 'google_play',
        google_play_purchase_token: purchaseToken,
        google_play_product_id: productId,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('❌ Failed to create payment record:', paymentError);
      throw new Error('Failed to record payment');
    }

    console.log('✅ Payment record created:', payment.id);

    // Create or update subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        starts_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
        payment_method: 'google_play',
        external_subscription_id: purchaseData.latestOrderId || purchaseToken,
        last_payment_id: payment.id,
        purchase_platform: 'google_play',
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('❌ Failed to create subscription:', subscriptionError);
      throw new Error('Failed to create subscription');
    }

    console.log('✅ Subscription created:', subscription.id);

    // Update payment with subscription_id
    await supabase
      .from('payments')
      .update({ subscription_id: subscription.id })
      .eq('id', payment.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        subscription: {
          id: subscription.id,
          status: 'active',
          expiresAt: endDate.toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to verify purchase' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});