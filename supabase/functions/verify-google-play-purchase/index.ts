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

    // Check if user has already used trial
    const { data: existingTrialSub } = await supabase
      .from('user_subscriptions')
      .select('id, accumulated_days')
      .eq('user_id', user.id)
      .eq('trial_used', true)
      .maybeSingle();

    const hasUsedTrial = !!existingTrialSub;
    const previousAccumulatedDays = existingTrialSub?.accumulated_days || 0;

    // Calculate subscription dates with 3-day trial
    const startDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 days trial

    // Determine if this is a trial subscription
    const isTrial = !hasUsedTrial && (
      purchaseData.lineItems?.[0]?.offerDetails?.basePlanId?.includes('trial') ||
      purchaseData.subscriptionState === 'SUBSCRIPTION_STATE_IN_TRIAL'
    );

    // If user gets trial, paid period starts after trial ends
    const paidStartDate = isTrial ? trialEndDate : startDate;
    const paidEndDate = new Date(paidStartDate);
    paidEndDate.setMonth(paidEndDate.getMonth() + plan.duration_months);

    // Calculate total days for this subscription (including trial if applicable)
    const subscriptionDays = Math.floor((paidEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAccumulatedDays = previousAccumulatedDays + subscriptionDays;

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

    // Create or update subscription with trial and accumulated days
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        starts_at: startDate.toISOString(),
        expires_at: paidEndDate.toISOString(),
        payment_method: 'google_play',
        external_subscription_id: purchaseData.latestOrderId || purchaseToken,
        last_payment_id: payment.id,
        purchase_platform: 'google_play',
        // Trial fields
        is_trial: isTrial,
        trial_starts_at: isTrial ? startDate.toISOString() : null,
        trial_ends_at: isTrial ? trialEndDate.toISOString() : null,
        trial_used: true, // Mark that user has used their trial
        accumulated_days: totalAccumulatedDays,
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
          expiresAt: paidEndDate.toISOString(),
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