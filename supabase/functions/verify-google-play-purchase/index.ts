import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ISO8601 trial period ("P3D") → days
const getDaysFromISO = (iso: string | null): number => {
  if (!iso) return 0;
  const match = iso.match(/P(\d+)D/);
  return match ? parseInt(match[1], 10) : 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ------------------ AUTH CHECK ------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header");
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("✅ User authenticated:", user.id);

    // ------------------ BODY PARSE ------------------
    const { purchaseToken, productId, packageName } = await req.json();

    console.log("📦 Purchase request:", { productId, packageName, userId: user.id });

    if (!purchaseToken || !productId || !packageName) {
      throw new Error("Missing required fields: purchaseToken, productId, packageName");
    }

    // ------------------ DUPLICATE CHECK ------------------
    const { data: existing } = await supabase
      .from("payments")
      .select("id, payment_status")
      .eq("google_play_purchase_token", purchaseToken)
      .maybeSingle();

    if (existing && existing.payment_status === "completed") {
      console.log("⚠️ Duplicate purchase detected:", purchaseToken);
      return new Response(
        JSON.stringify({
          success: false,
          error: "This purchase has already been processed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ------------------ GOOGLE JWT CREATION ------------------
    const serviceAccountJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      console.error("❌ GOOGLE_PLAY_SERVICE_ACCOUNT secret not configured");
      throw new Error("Google Play credentials not configured. Please contact support.");
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error("❌ Failed to parse service account JSON:", parseError);
      throw new Error("Invalid Google Play credentials configuration");
    }

    console.log("✅ Service account loaded:", serviceAccount.client_email);

    const pemToBinary = (pem: string): ArrayBuffer => {
      const clean = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s/g, "");
      const binaryString = atob(clean);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer as ArrayBuffer;
    };

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToBinary(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const now = Math.floor(Date.now() / 1000);

    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/androidpublisher",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      },
      privateKey
    );

    console.log("✅ JWT created successfully");

    // ------------------ GET ACCESS TOKEN ------------------
    const accessRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!accessRes.ok) {
      const errorText = await accessRes.text();
      console.error("❌ Google auth failed:", errorText);
      throw new Error("Failed to authenticate with Google");
    }

    const { access_token } = await accessRes.json();
    console.log("✅ Google access token obtained");

    // ------------------ VERIFY GOOGLE PLAY PURCHASE ------------------
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;

    console.log("🔍 Verifying purchase with Google Play API...");

    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error("❌ Google Play verification failed:", errorText);
      throw new Error("Failed to verify purchase with Google Play");
    }

    const purchase = await verifyRes.json();
    console.log("✅ Google Play verification response:", JSON.stringify(purchase, null, 2));

    // ------------------ VALIDATE SUBSCRIPTION STATE ------------------
    if (purchase.subscriptionState !== "SUBSCRIPTION_STATE_ACTIVE" && 
        purchase.subscriptionState !== "SUBSCRIPTION_STATE_IN_TRIAL") {
      console.error("❌ Invalid subscription state:", purchase.subscriptionState);
      throw new Error(`Subscription is not active. State: ${purchase.subscriptionState}`);
    }

    // ------------------ VALIDATE SKU MATCHES ------------------
    const purchasedSku = purchase.lineItems?.[0]?.productId;
    console.log("🔍 SKU validation:", { frontendSku: productId, purchasedSku });

    if (!purchasedSku) {
      console.error("❌ No productId found in Google Play response");
      throw new Error("Invalid purchase: no product ID in response");
    }

    if (purchasedSku !== productId) {
      console.error("❌ SKU mismatch:", { frontendSku: productId, purchasedSku });
      throw new Error(`SKU mismatch: expected ${productId}, got ${purchasedSku}`);
    }

    console.log("✅ SKU validated successfully:", purchasedSku);

    // ------------------ GET PLAN BY GOOGLE PRODUCT ID ------------------
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("google_product_id", productId)
      .maybeSingle();

    if (planError) {
      console.error("❌ Error fetching plan:", planError);
      throw new Error("Failed to fetch subscription plan");
    }

    if (!plan) {
      console.error("❌ No plan found for Google product ID:", productId);
      throw new Error(`No subscription plan configured for product: ${productId}`);
    }

    console.log("✅ Plan found:", plan.name, plan.duration_months, "months");

    // ------------------ TRIAL LOGIC ------------------
    const googleTrialISO = purchase.lineItems?.[0]?.offerDetails?.trialPeriod || null;
    const trialDays = getDaysFromISO(googleTrialISO);
    const isInTrialState = purchase.subscriptionState === "SUBSCRIPTION_STATE_IN_TRIAL";

    console.log("🔍 Trial info:", { googleTrialISO, trialDays, isInTrialState });

    // Has user already used trial?
    const { data: prevSub } = await supabase
      .from("user_subscriptions")
      .select("trial_used, accumulated_days")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasUsedTrial = prevSub?.trial_used === true;
    const previousDays = prevSub?.accumulated_days || 0;

    // Apply trial only if: Google says there's a trial AND user hasn't used trial before
    const applyTrial = (trialDays > 0 || isInTrialState) && !hasUsedTrial;

    console.log("🔍 Trial logic:", { hasUsedTrial, previousDays, applyTrial });

    // Calculate subscription dates
    const start = new Date();
    const effectiveTrialDays = applyTrial ? (trialDays || 3) : 0; // Default 3 days if in trial state
    const trialEnd = new Date(start.getTime() + effectiveTrialDays * 86400000);

    const paidStart = applyTrial ? trialEnd : start;
    const paidEnd = new Date(paidStart);
    paidEnd.setMonth(paidEnd.getMonth() + plan.duration_months);

    const paidDays = Math.floor((paidEnd.getTime() - paidStart.getTime()) / 86400000);
    const totalDays = previousDays + paidDays;

    console.log("📅 Subscription dates:", {
      start: start.toISOString(),
      trialEnd: applyTrial ? trialEnd.toISOString() : null,
      paidEnd: paidEnd.toISOString(),
      totalDays
    });

    // ------------------ PAYMENT RECORD ------------------
    const micros = purchase.lineItems?.[0]?.priceAmountMicros || 0;
    const amount = Number(micros) / 1_000_000;
    const currency = purchase.lineItems?.[0]?.priceCurrencyCode || "USD";

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount,
        currency,
        payment_method: "google_play",
        payment_status: "completed",
        external_payment_id: purchase.latestOrderId || purchaseToken,
        platform: "google_play",
        google_play_purchase_token: purchaseToken,
        google_play_product_id: productId,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("❌ Failed to create payment record:", paymentError);
      throw new Error("Failed to record payment");
    }

    console.log("✅ Payment record created:", payment.id);

    // ------------------ UPSERT SUBSCRIPTION ------------------
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        starts_at: start.toISOString(),
        expires_at: paidEnd.toISOString(),
        payment_method: "google_play",
        external_subscription_id: purchase.latestOrderId || purchaseToken,
        last_payment_id: payment.id,
        purchase_platform: "google_play",
        is_trial: applyTrial,
        trial_used: applyTrial ? true : hasUsedTrial,
        trial_starts_at: applyTrial ? start.toISOString() : null,
        trial_ends_at: applyTrial ? trialEnd.toISOString() : null,
        accumulated_days: totalDays,
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (subError) {
      console.error("❌ Failed to create subscription:", subError);
      throw new Error("Failed to create subscription");
    }

    console.log("✅ Subscription created/updated:", subscription.id);

    // Link payment → subscription
    await supabase
      .from("payments")
      .update({ subscription_id: subscription.id })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: "active",
          expiresAt: paidEnd.toISOString(),
          isTrial: applyTrial,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("❌ Error:", err.message, err.stack);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});