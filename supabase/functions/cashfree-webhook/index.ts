import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse webhook data
    const webhookData = await req.json()
    console.log('Cashfree webhook received:', webhookData)

    const { order_id, order_status } = webhookData?.data || webhookData

    if (!order_id) {
      throw new Error('Invalid webhook data: missing order_id')
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('external_payment_id', order_id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', order_id)
      throw new Error('Payment record not found')
    }

    // Update payment status based on Cashfree response
    let newStatus = 'pending'
    if (order_status === 'PAID') {
      newStatus = 'completed'
    } else if (order_status === 'ACTIVE') {
      newStatus = 'pending'
    } else if (order_status === 'EXPIRED' || order_status === 'CANCELLED') {
      newStatus = 'failed'
    }

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        payment_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      throw updateError
    }

    // If payment is successful, create/update subscription
    if (newStatus === 'completed') {
      // Get plan details
      const { data: plan } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('id', payment.plan_id)
        .single()

      if (plan) {
        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months)

        // Check for existing active subscription
        const { data: existingSubscription } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', payment.user_id)
          .eq('status', 'active')
          .single()

        if (existingSubscription) {
          // Expire the old subscription and create new one
          await supabaseClient
            .from('user_subscriptions')
            .update({ status: 'expired', updated_at: now.toISOString() })
            .eq('id', existingSubscription.id)
        }

        // Create new subscription
        const { error: subscriptionError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: 'cashfree',
            external_subscription_id: order_id,
            auto_renew: false
          })

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError)
        } else {
          console.log('Subscription created successfully for user:', payment.user_id)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in cashfree-webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
