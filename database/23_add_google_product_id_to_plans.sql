-- =====================================================
-- ADD GOOGLE PRODUCT ID TO SUBSCRIPTION PLANS
-- =====================================================
-- This column is REQUIRED for the edge function to map
-- Google Play SKUs to internal subscription plans.

-- Add google_product_id column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS google_product_id TEXT;

-- Add unique constraint to prevent duplicate mappings
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_google_product_id 
ON public.subscription_plans(google_product_id) 
WHERE google_product_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.subscription_plans.google_product_id IS 'Google Play Console product ID (SKU) for this plan';

-- Update existing plans with correct Google Play product IDs
-- Map by duration_months since that's the reliable identifier

-- 1 month plan
UPDATE public.subscription_plans 
SET google_product_id = 'examtrakr_1month' 
WHERE duration_months = 1 
  AND google_product_id IS NULL
  AND is_active = true;

-- 3 month plan  
UPDATE public.subscription_plans 
SET google_product_id = 'examtrakr_3month' 
WHERE duration_months = 3 
  AND google_product_id IS NULL
  AND is_active = true;

-- 6 month plan
UPDATE public.subscription_plans 
SET google_product_id = 'examtrakr_6month' 
WHERE duration_months = 6 
  AND google_product_id IS NULL
  AND is_active = true;

-- 12 month plan
UPDATE public.subscription_plans 
SET google_product_id = 'examtrakr_12month' 
WHERE duration_months = 12 
  AND google_product_id IS NULL
  AND is_active = true;

-- Verify the mapping
-- SELECT id, name, duration_months, google_product_id FROM subscription_plans WHERE is_active = true;
