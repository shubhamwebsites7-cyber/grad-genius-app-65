import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid Google Play product IDs - MUST match Play Console exactly
const VALID_PRODUCT_IDS = [
  'examtrakr_1month',
  'examtrakr_3month',
  'examtrakr_6month',
  'examtrakr_12month'
];

// Map product ID to duration months
const PRODUCT_DURATION_MAP: Record<string, number> = {
  'examtrakr_1month': 1,
  'examtrakr_3month': 3,
  'examtrakr_6month': 6,
  'examtrakr_12month': 12
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

    // ------------------ VALIDATE PRODUCT ID ------------------
    if (!VALID_PRODUCT_IDS.includes(productId)) {
      console.error("❌ Invalid product ID:", productId);
      console.error("❌ Valid IDs are:", VALID_PRODUCT_IDS);
      throw new Error(`Invalid product ID: ${productId}. Must be one of: ${VALID_PRODUCT_IDS.join(', ')}`);
    }
    console.log("✅ Product ID validated:", productId);

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
    console.log("🔍 Verify URL:", verifyUrl);

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
    const validStates = [
      "SUBSCRIPTION_STATE_ACTIVE",
      "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
      "SUBSCRIPTION_STATE_PENDING"
    ];
    
    if (!validStates.includes(purchase.subscriptionState)) {
      console.error("❌ Invalid subscription state:", purchase.subscriptionState);
      throw new Error(`Subscription is not active. State: ${purchase.subscriptionState}`);
    }
    console.log("✅ Subscription state valid:", purchase.subscriptionState);

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

    // ------------------ GET DURATION FROM PRODUCT ID ------------------
    const durationMonths = PRODUCT_DURATION_MAP[productId];
    if (!durationMonths) {
      console.error("❌ No duration mapping for product:", productId);
      throw new Error(`No duration configured for product: ${productId}`);
    }
    console.log("✅ Duration determined:", durationMonths, "months");

    // ------------------ GET OR CREATE PLAN ------------------
    // Try to find plan by google_product_id first
    let { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("google_product_id", productId)
      .maybeSingle();

    if (planError) {
      console.error("❌ Error fetching plan by google_product_id:", planError);
    }

    // If not found, try by duration
    if (!plan) {
      console.log("🔍 Plan not found by google_product_id, trying by duration...");
      const { data: planByDuration, error: durationError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("duration_months", durationMonths)
        .eq("is_active", true)
        .maybeSingle();
      
      if (durationError) {
        console.error("❌ Error fetching plan by duration:", durationError);
      }
      
      plan = planByDuration;
    }

    if (!plan) {
      console.error("❌ No plan found for product:", productId, "duration:", durationMonths);
      throw new Error(`No subscription plan configured for product: ${productId}`);
    }

    console.log("✅ Plan found:", plan.name, plan.duration_months, "months");

    // ------------------ ACKNOWLEDGE PURCHASE (CRITICAL) ------------------
    // Note: For subscriptionsv2, acknowledgement is done via the subscriptions.acknowledge endpoint
    const acknowledgeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}:acknowledge`;
    
    console.log("🔔 Acknowledging purchase with Google Play API...");
    
    try {
      const ackRes = await fetch(acknowledgeUrl, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (ackRes.ok) {
        console.log("✅ Purchase acknowledged successfully via Google Play API");
      } else {
        const ackError = await ackRes.text();
        console.warn("⚠️ Acknowledgement response:", ackRes.status, ackError);
        // Continue - purchase might already be acknowledged
        if (ackRes.status === 400 && ackError.includes("already acknowledged")) {
          console.log("✅ Purchase was already acknowledged");
        }
      }
    } catch (ackError: any) {
      console.warn("⚠️ Backend acknowledgement error (continuing):", ackError.message);
      // Don't fail the whole flow - subscription was created
    }

    // ------------------ CALCULATE SUBSCRIPTION DATES ------------------
    const start = new Date();
    const paidEnd = new Date(start);
    paidEnd.setMonth(paidEnd.getMonth() + durationMonths);

    const paidDays = Math.floor((paidEnd.getTime() - start.getTime()) / 86400000);

    console.log("📅 Subscription dates:", {
      start: start.toISOString(),
      paidEnd: paidEnd.toISOString(),
      paidDays
    });

    // ------------------ PAYMENT RECORD ------------------
    const micros = purchase.lineItems?.[0]?.autoRenewingPlan?.priceAmountMicros || 
                   purchase.lineItems?.[0]?.priceAmountMicros || 0;
    const amount = Number(micros) / 1_000_000;
    const currency = purchase.lineItems?.[0]?.autoRenewingPlan?.priceCurrencyCode || 
                     purchase.lineItems?.[0]?.priceCurrencyCode || "INR";

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
        is_trial: false,
        trial_used: false,
        trial_starts_at: null,
        trial_ends_at: null,
        accumulated_days: paidDays,
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

    console.log("✅ Payment linked to subscription");
    console.log("=== PURCHASE FLOW COMPLETE ===");

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          status: "active",
          expiresAt: paidEnd.toISOString(),
          durationMonths: durationMonths,
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
