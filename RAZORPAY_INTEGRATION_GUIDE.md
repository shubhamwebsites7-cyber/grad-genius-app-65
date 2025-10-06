# Razorpay Payment Gateway Integration Guide

## Overview
This guide provides step-by-step instructions for integrating Razorpay payment gateway into your ExamTrakr web application using Lovable Cloud (Supabase) backend.

---

## Prerequisites
- Active Lovable Cloud integration (Supabase backend)
- Razorpay account (https://razorpay.com)
- Basic understanding of React and TypeScript

---

## Step 1: Razorpay Account Setup

### 1.1 Create Razorpay Account
1. Visit [https://razorpay.com](https://razorpay.com)
2. Click "Sign Up" and complete registration
3. Verify your email and phone number
4. Complete KYC (Know Your Customer) verification for live mode

### 1.2 Get API Keys
1. Log in to Razorpay Dashboard
2. Navigate to **Settings** → **API Keys**
3. Generate API keys:
   - **Test Mode Keys** (for development):
     - Key ID: `rzp_test_XXXXXXXXXXXXXXXX`
     - Key Secret: `XXXXXXXXXXXXXXXXXXXXXXXX`
   - **Live Mode Keys** (for production):
     - Key ID: `rzp_live_XXXXXXXXXXXXXXXX`
     - Key Secret: `XXXXXXXXXXXXXXXXXXXXXXXX`
4. **IMPORTANT**: Keep the Key Secret confidential - never expose it in frontend code

### 1.3 Configure Webhook
1. Go to **Settings** → **Webhooks**
2. Click "Add New Webhook"
3. Enter webhook URL: `https://[your-project-id].supabase.co/functions/v1/razorpay-webhook`
4. Select events to listen:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`
5. Note the **Webhook Secret** for verification

---

## Step 2: Store Razorpay Secrets in Lovable Cloud

### 2.1 Add Secrets via Lovable Interface
You need to add these three secrets:

1. **RAZORPAY_KEY_ID**
   - Value: Your Razorpay Key ID (rzp_test_xxx or rzp_live_xxx)
   - Used in: Frontend and Edge Functions

2. **RAZORPAY_KEY_SECRET**
   - Value: Your Razorpay Key Secret
   - Used in: Edge Functions only (server-side)

3. **RAZORPAY_WEBHOOK_SECRET**
   - Value: Your Razorpay Webhook Secret
   - Used in: Webhook verification

### 2.2 How to Add Secrets
Ask the Lovable AI to add these secrets by saying:
> "Please add Razorpay secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET"

The AI will provide a button to securely input these values.

---

## Step 3: Database Schema for Payments

### 3.1 Create Payments Table
Run this SQL in Supabase SQL Editor:

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL, -- Amount in paise (INR)
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  plan_type TEXT CHECK (plan_type IN ('basic', 'premium')),
  receipt TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  captured_at TIMESTAMPTZ,
  failed_reason TEXT
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();
```

### 3.2 Update Subscriptions Table
Run this SQL to link payments with subscriptions:

```sql
-- Add payment reference to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT REFERENCES public.payments(razorpay_order_id),
ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order_id 
  ON public.subscriptions(razorpay_order_id);
```

---

## Step 4: Backend Implementation (Edge Functions)

### 4.1 Create Order Edge Function
**File**: `supabase/functions/create-razorpay-order/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get request data
    const { amount, planType, notes } = await req.json();

    // Validate amount (must be in paise, minimum 100 paise = 1 INR)
    if (!amount || amount < 100) {
      throw new Error('Invalid amount');
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        planType: planType,
        ...notes,
      },
    });

    console.log('Razorpay order created:', order.id);

    // Save order to database
    const { data: payment, error: dbError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: amount,
        currency: 'INR',
        status: 'created',
        plan_type: planType,
        receipt: order.receipt,
        notes: order.notes,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save payment record');
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: Deno.env.get('RAZORPAY_KEY_ID'),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### 4.2 Verify Payment Edge Function
**File**: `supabase/functions/verify-razorpay-payment/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    
    const hmac = createHmac("sha256", secret);
    hmac.update(text);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      throw new Error('Invalid signature');
    }

    console.log('Payment signature verified successfully');

    // Update payment record
    const { data: payment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'captured',
        captured_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update payment status');
    }

    // Update subscription if payment is for a plan
    if (payment.plan_type) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      await supabaseClient.from('subscriptions').upsert({
        user_id: user.id,
        plan_type: payment.plan_type,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        razorpay_order_id: razorpay_order_id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: 'INR',
      });
    }

    return new Response(
      JSON.stringify({ success: true, payment }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### 4.3 Webhook Handler Edge Function
**File**: `supabase/functions/razorpay-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

serve(async (req) => {
  try {
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
    const body = await req.text();

    // Verify webhook signature
    const hmac = createHmac("sha256", webhookSecret);
    hmac.update(body);
    const generated_signature = hmac.digest("hex");

    if (signature !== generated_signature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await supabaseClient
          .from('payments')
          .update({
            status: 'captured',
            razorpay_payment_id: event.payload.payment.entity.id,
            captured_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', event.payload.payment.entity.order_id);
        break;

      case 'payment.failed':
        await supabaseClient
          .from('payments')
          .update({
            status: 'failed',
            failed_reason: event.payload.payment.entity.error_description,
          })
          .eq('razorpay_order_id', event.payload.payment.entity.order_id);
        break;

      case 'payment.authorized':
        await supabaseClient
          .from('payments')
          .update({
            status: 'authorized',
            razorpay_payment_id: event.payload.payment.entity.id,
          })
          .eq('razorpay_order_id', event.payload.payment.entity.order_id);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
```

### 4.4 Update supabase/config.toml
Add these functions to your config:

```toml
[functions.create-razorpay-order]
verify_jwt = true

[functions.verify-razorpay-payment]
verify_jwt = true

[functions.razorpay-webhook]
verify_jwt = false  # Webhooks don't use JWT
```

---

## Step 5: Frontend Implementation

### 5.1 Install Razorpay SDK
Add Razorpay checkout script to `index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 5.2 Create Payment Hook
**File**: `src/hooks/useRazorpay.tsx`

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RazorpayOptions {
  amount: number; // Amount in rupees (will be converted to paise)
  planType: 'basic' | 'premium';
  onSuccess: (paymentId: string) => void;
  onFailure?: (error: any) => void;
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initiatePayment = async ({
    amount,
    planType,
    onSuccess,
    onFailure,
  }: RazorpayOptions) => {
    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please login to continue');
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: amount * 100, // Convert to paise
            planType,
            notes: {
              userEmail: user.email,
            },
          },
        }
      );

      if (error) throw error;

      const { orderId, amount: orderAmount, currency, keyId } = data;

      // Initialize Razorpay
      const options = {
        key: keyId,
        amount: orderAmount,
        currency: currency,
        name: 'ExamTrakr',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-razorpay-payment',
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              }
            );

            if (verifyError) throw verifyError;

            toast({
              title: 'Payment Successful!',
              description: 'Your subscription has been activated.',
            });

            onSuccess(response.razorpay_payment_id);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'Please contact support.',
              variant: 'destructive',
            });
            onFailure?.(error);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment.',
            });
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
      onFailure?.(error);
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading };
};
```

### 5.3 Update Pricing Page
**File**: `src/pages/Pricing.tsx` (Add payment integration)

```typescript
import { useRazorpay } from '@/hooks/useRazorpay';
import { useNavigate } from 'react-router-dom';

// Inside your Pricing component:
const { initiatePayment, loading } = useRazorpay();
const navigate = useNavigate();

const handleSubscribe = (planType: 'basic' | 'premium', amount: number) => {
  initiatePayment({
    amount,
    planType,
    onSuccess: (paymentId) => {
      console.log('Payment successful:', paymentId);
      navigate('/profile'); // Redirect to profile after success
    },
    onFailure: (error) => {
      console.error('Payment failed:', error);
    },
  });
};

// In your JSX:
<Button
  onClick={() => handleSubscribe('premium', 499)}
  disabled={loading}
>
  {loading ? 'Processing...' : 'Subscribe Now'}
</Button>
```

---

## Step 6: Testing

### 6.1 Test Mode Credentials
Use these test cards in Razorpay test mode:

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

### 6.2 Testing Checklist
- [ ] Create order successfully
- [ ] Payment UI opens correctly
- [ ] Successful payment is verified
- [ ] Payment record saved in database
- [ ] Subscription is activated
- [ ] Failed payment is handled
- [ ] Webhook receives events
- [ ] User redirected after payment

---

## Step 7: Go Live

### 7.1 Complete KYC
- Submit business documents to Razorpay
- Wait for approval (usually 24-48 hours)

### 7.2 Switch to Live Keys
1. Update secrets with live keys:
   - RAZORPAY_KEY_ID → rzp_live_xxx
   - RAZORPAY_KEY_SECRET → live secret
2. Update webhook URL to production
3. Test with real payment (small amount)

### 7.3 Production Checklist
- [ ] KYC approved
- [ ] Live keys configured
- [ ] Webhook URL updated
- [ ] SSL certificate active
- [ ] Test real payment
- [ ] Monitor payment logs
- [ ] Set up email notifications

---

## Step 8: Security Best Practices

### 8.1 Key Security
- ✅ Never expose Key Secret in frontend
- ✅ Always verify signatures
- ✅ Use HTTPS only
- ✅ Store secrets in Lovable Cloud
- ✅ Validate webhook signatures

### 8.2 Amount Validation
- ✅ Validate amounts server-side
- ✅ Use integers (paise) not decimals
- ✅ Set minimum/maximum limits
- ✅ Log all transactions

### 8.3 Error Handling
- ✅ Handle network failures
- ✅ Implement retry logic
- ✅ Log errors properly
- ✅ Show user-friendly messages

---

## Troubleshooting

### Common Issues

1. **"Invalid Key ID"**
   - Check if RAZORPAY_KEY_ID is set correctly
   - Ensure you're using test keys in test mode

2. **"Signature Verification Failed"**
   - Verify RAZORPAY_KEY_SECRET is correct
   - Check signature calculation logic

3. **"Webhook Not Receiving Events"**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Review Razorpay dashboard webhook logs

4. **"Payment Record Not Saving"**
   - Check RLS policies
   - Verify user is authenticated
   - Review Supabase logs

---

## Support & Resources

- **Razorpay Documentation**: https://razorpay.com/docs
- **Razorpay Test Mode**: https://razorpay.com/docs/payments/payments/test-card-details
- **Webhook Events**: https://razorpay.com/docs/webhooks
- **Lovable Cloud Docs**: https://docs.lovable.dev/features/cloud
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## Payment Flow Diagram

```
User clicks "Subscribe"
    ↓
Frontend calls create-razorpay-order edge function
    ↓
Edge function creates order in Razorpay
    ↓
Order saved in payments table (status: created)
    ↓
Razorpay checkout modal opens
    ↓
User enters card details and pays
    ↓
Razorpay processes payment
    ↓
Payment success callback triggered
    ↓
Frontend calls verify-razorpay-payment edge function
    ↓
Edge function verifies signature
    ↓
Payment status updated (status: captured)
    ↓
Subscription activated in database
    ↓
Webhook receives confirmation (async)
    ↓
User redirected to success page
```

---

## Pricing Examples

### Basic Plan: ₹299/month
```typescript
handleSubscribe('basic', 299);
```

### Premium Plan: ₹499/month
```typescript
handleSubscribe('premium', 499);
```

---

## Next Steps

1. ✅ Set up Razorpay account
2. ✅ Add secrets to Lovable Cloud
3. ✅ Run database migration SQL
4. ✅ Create edge functions
5. ✅ Implement frontend integration
6. ✅ Test in test mode
7. ✅ Complete KYC
8. ✅ Switch to live mode
9. ✅ Monitor payments

**Remember**: Always test thoroughly in test mode before going live!
