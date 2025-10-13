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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get request body
    const { plan_id, pricing_id, amount, currency, phone_number } = await req.json()

    if (!plan_id || !pricing_id || !amount || !currency) {
      throw new Error('Missing required parameters')
    }

    if (!phone_number || !/^\d{10}$/.test(phone_number)) {
      throw new Error('Valid 10-digit phone number is required')
    }

    // Get user profile for customer details
    const { data: profile } = await supabaseClient
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create order ID
    const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`

    // Get Cashfree credentials
    const appId = Deno.env.get('CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')

    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials not configured')
    }

    // Cashfree API endpoint (production)
    const cashfreeUrl = 'https://api.cashfree.com/pg/orders'

    // Prepare Cashfree order payload
    const cashfreePayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email || profile?.email || '',
        customer_phone: phone_number,
        customer_name: profile?.full_name || 'User'
      },
      order_meta: {
        return_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/cashfree-webhook?order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/cashfree-webhook`
      },
      order_note: `Subscription plan purchase - Plan ID: ${plan_id}`
    }

    console.log('Creating Cashfree order:', cashfreePayload)

    // Create order with Cashfree
    const cashfreeResponse = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey
      },
      body: JSON.stringify(cashfreePayload)
    })

    if (!cashfreeResponse.ok) {
      const errorText = await cashfreeResponse.text()
      console.error('Cashfree API error:', errorText)
      throw new Error(`Cashfree API error: ${errorText}`)
    }

    const cashfreeData = await cashfreeResponse.json()
    console.log('Cashfree order created:', cashfreeData)

    // Store payment record in database
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        amount: amount,
        currency: currency,
        payment_method: 'cashfree',
        payment_status: 'pending',
        external_payment_id: orderId,
        phone_number: phone_number,
        created_at: new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error storing payment record:', paymentError)
    }

    return new Response(
      JSON.stringify({
        order_id: orderId,
        payment_session_id: cashfreeData.payment_session_id,
        order_status: cashfreeData.order_status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-cashfree-order:', error)
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
