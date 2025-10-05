-- Create plan_pricing table
CREATE TABLE IF NOT EXISTS public.plan_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  country_code character varying(2) NOT NULL,
  currency character varying(3) NOT NULL,
  price numeric(10, 2) NOT NULL,
  original_price numeric(10, 2) NULL,
  discount_percentage integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT plan_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT plan_pricing_plan_id_country_code_key UNIQUE (plan_id, country_code),
  CONSTRAINT plan_pricing_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable RLS on plan_pricing table
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active pricing
CREATE POLICY "Allow public read access to active pricing"
  ON public.plan_pricing
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create policy for authenticated users to read all pricing
CREATE POLICY "Allow authenticated users to read all pricing"
  ON public.plan_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Sample pricing data for India (INR)
-- First, get the plan IDs (you'll need to replace these with actual IDs from your subscription_plans table)
-- Example insert statements (replace the plan_id values with actual UUIDs from your subscription_plans table):

-- INSERT INTO public.plan_pricing (plan_id, country_code, currency, price, original_price, discount_percentage, is_active)
-- VALUES 
--   -- 1 Month Plan for India
--   ('YOUR_1_MONTH_PLAN_ID', 'IN', 'INR', 89.00, 119.00, 25, true),
--   -- 3 Months Plan for India (Popular)
--   ('YOUR_3_MONTHS_PLAN_ID', 'IN', 'INR', 179.00, 357.00, 50, true),
--   -- 6 Months Plan for India
--   ('YOUR_6_MONTHS_PLAN_ID', 'IN', 'INR', 269.00, 714.00, 62, true),
--   -- 12 Months Plan for India
--   ('YOUR_12_MONTHS_PLAN_ID', 'IN', 'INR', 359.00, 1428.00, 75, true),
  
--   -- 1 Month Plan for US
--   ('YOUR_1_MONTH_PLAN_ID', 'US', 'USD', 3.99, 4.99, 20, true),
--   -- 3 Months Plan for US (Popular)
--   ('YOUR_3_MONTHS_PLAN_ID', 'US', 'USD', 6.99, 14.97, 53, true),
--   -- 6 Months Plan for US
--   ('YOUR_6_MONTHS_PLAN_ID', 'US', 'USD', 9.99, 29.94, 67, true),
--   -- 12 Months Plan for US
--   ('YOUR_12_MONTHS_PLAN_ID', 'US', 'USD', 12.99, 59.88, 78, true);

-- IMPORTANT: To insert sample data, follow these steps:
-- 1. First, check your subscription_plans table to get the actual plan IDs:
--    SELECT id, name, duration_months FROM subscription_plans ORDER BY duration_months;
--
-- 2. Then replace 'YOUR_X_PLAN_ID' in the INSERT statements above with the actual UUIDs
--
-- 3. Uncomment and run the INSERT statements

-- Example query to verify your pricing data:
-- SELECT 
--   sp.name,
--   sp.duration_months,
--   pp.country_code,
--   pp.currency,
--   pp.price,
--   pp.original_price,
--   pp.discount_percentage
-- FROM subscription_plans sp
-- LEFT JOIN plan_pricing pp ON sp.id = pp.plan_id
-- ORDER BY sp.duration_months, pp.country_code;
