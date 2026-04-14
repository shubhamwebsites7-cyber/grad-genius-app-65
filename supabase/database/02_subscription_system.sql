-- =====================================================
-- SUBSCRIPTION & PAYMENT SYSTEM TABLES
-- =====================================================
-- These tables handle the complete subscription and payment flow
-- including plans, pricing, payments, and user subscriptions.

-- =====================================================
-- SUBSCRIPTION PLANS TABLE
-- =====================================================
-- Defines available subscription plans (Monthly, Yearly, etc.)
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text NULL,
  duration_months integer NOT NULL,
  features jsonb NULL,
  is_popular boolean NULL DEFAULT false,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
BEFORE UPDATE ON subscription_plans 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans (Monthly, Yearly, etc.)';
COMMENT ON COLUMN public.subscription_plans.name IS 'Plan name (e.g., Monthly Pro, Yearly Premium)';
COMMENT ON COLUMN public.subscription_plans.duration_months IS 'Plan duration in months';
COMMENT ON COLUMN public.subscription_plans.features IS 'JSON array of plan features';
COMMENT ON COLUMN public.subscription_plans.is_popular IS 'Whether to highlight as popular plan';

-- =====================================================
-- PLAN PRICING TABLE
-- =====================================================
-- Regional pricing for subscription plans
CREATE TABLE public.plan_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  country_code character varying(2) NOT NULL,
  currency character varying(3) NOT NULL,
  price numeric(10, 2) NOT NULL,
  original_price numeric(10, 2) NULL,
  discount_percentage integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT plan_pricing_pkey PRIMARY KEY (id),
  CONSTRAINT plan_pricing_plan_id_country_code_key UNIQUE (plan_id, country_code),
  CONSTRAINT plan_pricing_plan_id_fkey FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER update_plan_pricing_updated_at 
BEFORE UPDATE ON plan_pricing 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.plan_pricing IS 'Regional pricing for subscription plans';
COMMENT ON COLUMN public.plan_pricing.country_code IS 'ISO 2-letter country code (IN, US, etc.)';
COMMENT ON COLUMN public.plan_pricing.currency IS 'Currency code (INR, USD, etc.)';
COMMENT ON COLUMN public.plan_pricing.price IS 'Current selling price';
COMMENT ON COLUMN public.plan_pricing.original_price IS 'Original price before discount';
COMMENT ON COLUMN public.plan_pricing.discount_percentage IS 'Discount percentage applied';

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
-- Records all payment transactions
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  amount numeric(10, 2) NOT NULL,
  currency character varying(3) NOT NULL,
  payment_method character varying(50) NULL,
  payment_status character varying(20) NULL DEFAULT 'pending'::character varying,
  external_payment_id character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  phone_number character varying(15) NULL,
  subscription_id uuid NULL,
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans (id),
  CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) 
    REFERENCES user_subscriptions (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
ON public.payments USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id 
ON public.payments USING btree (subscription_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.payments IS 'Payment transaction records';
COMMENT ON COLUMN public.payments.amount IS 'Payment amount in specified currency';
COMMENT ON COLUMN public.payments.payment_status IS 'Status: pending, completed, failed, refunded';
COMMENT ON COLUMN public.payments.external_payment_id IS 'Payment gateway transaction ID';
COMMENT ON COLUMN public.payments.subscription_id IS 'Linked subscription (set after successful payment)';

-- =====================================================
-- USER SUBSCRIPTIONS TABLE
-- =====================================================
-- Active user subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status character varying(20) NULL DEFAULT 'active'::character varying,
  starts_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  auto_renew boolean NULL DEFAULT true,
  payment_method character varying(50) NULL,
  external_subscription_id character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  last_payment_id uuid NULL,
  
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_last_payment_fkey FOREIGN KEY (last_payment_id) 
    REFERENCES payments (id),
  CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user 
ON public.user_subscriptions USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
ON public.user_subscriptions USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_last_payment_id 
ON public.user_subscriptions USING btree (last_payment_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
ON public.user_subscriptions USING btree (user_id) TABLESPACE pg_default;

-- Triggers
CREATE TRIGGER trg_enforce_user_subscription_update 
BEFORE UPDATE ON user_subscriptions 
FOR EACH ROW 
EXECUTE FUNCTION enforce_user_subscription_update();

CREATE TRIGGER update_user_subscriptions_updated_at 
BEFORE UPDATE ON user_subscriptions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.user_subscriptions IS 'Active user subscriptions';
COMMENT ON COLUMN public.user_subscriptions.status IS 'Subscription status: active, expired, cancelled';
COMMENT ON COLUMN public.user_subscriptions.starts_at IS 'When subscription becomes active';
COMMENT ON COLUMN public.user_subscriptions.expires_at IS 'When subscription expires';
COMMENT ON COLUMN public.user_subscriptions.auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN public.user_subscriptions.last_payment_id IS 'Reference to the payment that created/renewed this subscription';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, description, duration_months, features, is_popular, is_active) VALUES
('Monthly Pro', 'Full access to all exams and resources', 1, '["Unlimited exam access", "All premium resources", "Progress tracking", "Mobile app access"]', false, true),
('Yearly Premium', 'Best value - Full access for 12 months', 12, '["Unlimited exam access", "All premium resources", "Progress tracking", "Mobile app access", "Priority support", "Offline downloads"]', true, true),
('Free Plan', 'Limited access to basic features', 0, '["1 exam enrollment", "Basic resources", "Limited progress tracking"]', false, true);

-- Insert sample pricing (Indian market)
INSERT INTO public.plan_pricing (plan_id, country_code, currency, price, original_price, discount_percentage, is_active) 
SELECT 
  sp.id,
  'IN',
  'INR',
  CASE 
    WHEN sp.name = 'Monthly Pro' THEN 89.00
    WHEN sp.name = 'Yearly Premium' THEN 179.00
    ELSE 0.00
  END,
  CASE 
    WHEN sp.name = 'Monthly Pro' THEN 99.00
    WHEN sp.name = 'Yearly Premium' THEN 999.00
    ELSE NULL
  END,
  CASE 
    WHEN sp.name = 'Monthly Pro' THEN 10
    WHEN sp.name = 'Yearly Premium' THEN 82
    ELSE 0
  END,
  true
FROM public.subscription_plans sp
WHERE sp.name IN ('Monthly Pro', 'Yearly Premium', 'Free Plan');
