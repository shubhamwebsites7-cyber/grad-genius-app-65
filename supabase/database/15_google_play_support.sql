-- =====================================================
-- GOOGLE PLAY BILLING SUPPORT
-- =====================================================
-- Add columns to support Google Play Billing purchases

-- Add platform tracking to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'cashfree',
ADD COLUMN IF NOT EXISTS google_play_purchase_token TEXT,
ADD COLUMN IF NOT EXISTS google_play_product_id TEXT;

-- Add index for Google Play purchase token lookups
CREATE INDEX IF NOT EXISTS idx_payments_google_play_token 
ON public.payments(google_play_purchase_token) 
WHERE google_play_purchase_token IS NOT NULL;

-- Add index for platform
CREATE INDEX IF NOT EXISTS idx_payments_platform 
ON public.payments(platform);

-- Add platform tracking to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS purchase_platform TEXT DEFAULT 'cashfree';

-- Add index for purchase platform
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_platform 
ON public.user_subscriptions(purchase_platform);

-- Add comments
COMMENT ON COLUMN public.payments.platform IS 'Payment platform: cashfree, google_play';
COMMENT ON COLUMN public.payments.google_play_purchase_token IS 'Google Play purchase token for verification';
COMMENT ON COLUMN public.payments.google_play_product_id IS 'Google Play product/SKU ID';
COMMENT ON COLUMN public.user_subscriptions.purchase_platform IS 'Platform where subscription was purchased';