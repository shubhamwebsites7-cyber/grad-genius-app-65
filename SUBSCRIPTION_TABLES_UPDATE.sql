-- ============================================
-- SUBSCRIPTION TABLES UPDATE & SECURITY SETUP
-- ============================================
-- IMPORTANT: Run CREATE_PROFILES_TABLE.sql FIRST!
-- Then run these queries to fix foreign keys and add RLS policies

-- Step 1: Fix user_subscriptions foreign key (if you have 'users' table, change to 'profiles')
-- First, drop the existing incorrect foreign key
ALTER TABLE public.user_subscriptions 
  DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;

-- Add correct foreign key referencing profiles table
ALTER TABLE public.user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 2: Enable RLS on all subscription tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 3: Add updated_at trigger to subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON public.subscription_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 4: Add updated_at trigger to plan_pricing
DROP TRIGGER IF EXISTS update_plan_pricing_updated_at ON public.plan_pricing;
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TRIGGER update_plan_pricing_updated_at 
  BEFORE UPDATE ON public.plan_pricing 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Add updated_at trigger to user_subscriptions (already has column)
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON public.user_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES FOR SUBSCRIPTION_PLANS
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can insert subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can delete subscription plans" ON public.subscription_plans;

-- Public can view active plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all plans
CREATE POLICY "Admins can insert subscription plans"
  ON public.subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscription plans"
  ON public.subscription_plans
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscription plans"
  ON public.subscription_plans
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR PLAN_PRICING
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view active plan pricing" ON public.plan_pricing;
DROP POLICY IF EXISTS "Admins can insert plan pricing" ON public.plan_pricing;
DROP POLICY IF EXISTS "Admins can update plan pricing" ON public.plan_pricing;
DROP POLICY IF EXISTS "Admins can delete plan pricing" ON public.plan_pricing;

-- Public can view active pricing
CREATE POLICY "Anyone can view active plan pricing"
  ON public.plan_pricing
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all pricing
CREATE POLICY "Admins can insert plan pricing"
  ON public.plan_pricing
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plan pricing"
  ON public.plan_pricing
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plan pricing"
  ON public.plan_pricing
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR USER_SUBSCRIPTIONS
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription settings" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.user_subscriptions;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only system/admin can create subscriptions (via payment gateway callback)
CREATE POLICY "Admins can insert subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can update their own subscription settings (like auto_renew)
CREATE POLICY "Users can update own subscription settings"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update all subscriptions
CREATE POLICY "Admins can update all subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete subscriptions
CREATE POLICY "Admins can delete subscriptions"
  ON public.user_subscriptions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- COLUMN-LEVEL RESTRICTION: user_subscriptions
-- Prevent non-admins from changing restricted columns
-- ============================================

CREATE OR REPLACE FUNCTION public.enforce_user_subscription_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- Users may only toggle auto_renew
    IF NEW.user_id <> OLD.user_id
       OR NEW.plan_id <> OLD.plan_id
       OR NEW.status <> OLD.status
       OR NEW.starts_at <> OLD.starts_at
       OR NEW.expires_at <> OLD.expires_at
       OR COALESCE(NEW.payment_method,'') <> COALESCE(OLD.payment_method,'')
       OR COALESCE(NEW.external_subscription_id,'') <> COALESCE(OLD.external_subscription_id,'')
    THEN
      RAISE EXCEPTION 'You can only update auto_renew on your subscription.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_user_subscription_update ON public.user_subscriptions;

CREATE TRIGGER trg_enforce_user_subscription_update
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_subscription_update();

-- ============================================
-- HELPER FUNCTION: Get User's Active Subscription
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id UUID,
  plan_name TEXT,
  duration_months INTEGER,
  status VARCHAR(20),
  expires_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id,
    us.plan_id,
    sp.name,
    sp.duration_months,
    us.status,
    us.expires_at
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.expires_at > NOW()
  ORDER BY us.expires_at DESC
  LIMIT 1;
$$;

-- ============================================
-- HELPER FUNCTION: Check if User is Subscribed
-- ============================================

CREATE OR REPLACE FUNCTION public.is_user_subscribed(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND expires_at > NOW()
  );
$$;

-- ============================================
-- HELPER FUNCTION: Get User Subscription Tier
-- Returns 'free' or 'paid'
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1
        FROM user_subscriptions
        WHERE user_id = user_uuid
          AND status = 'active'
          AND expires_at > NOW()
      ) THEN 'paid'
      ELSE 'free'
    END;
$$;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify everything is set up correctly
-- ============================================

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('subscription_plans', 'plan_pricing', 'user_subscriptions');

-- Check policies
-- SELECT tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('subscription_plans', 'plan_pricing', 'user_subscriptions');

-- Test subscription functions
-- SELECT * FROM public.get_user_active_subscription(auth.uid());
-- SELECT public.is_user_subscribed(auth.uid());
-- SELECT public.get_user_subscription_tier(auth.uid());
