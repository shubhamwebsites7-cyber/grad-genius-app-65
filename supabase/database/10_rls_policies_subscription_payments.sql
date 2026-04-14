-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR SUBSCRIPTIONS & PAYMENTS
-- =====================================================
-- This file adds RLS policies to allow users to view their own subscription and payment data

-- =====================================================
-- ENABLE RLS ON SUBSCRIPTION & PAYMENT TABLES
-- =====================================================

-- Enable RLS on subscription-related tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (handled by backend)
CREATE POLICY "Users can create own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (for cancellation, etc.)
CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================

-- Users can view their own payment history
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create payment records (handled during checkout)
CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments can be updated (for status changes from webhooks)
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);

-- =====================================================
-- SUBSCRIPTION PLANS & PRICING POLICIES
-- =====================================================

-- Everyone can view active subscription plans
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Everyone can view active pricing
CREATE POLICY "Anyone can view active pricing" ON public.plan_pricing
  FOR SELECT USING (is_active = true);

-- =====================================================
-- ADMIN POLICIES
-- =====================================================

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can manage subscription plans
CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can manage pricing
CREATE POLICY "Admins can manage pricing" ON public.plan_pricing
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own subscriptions" ON public.user_subscriptions IS 
  'Allow users to view their own subscription records';

COMMENT ON POLICY "Users can view own payments" ON public.payments IS 
  'Allow users to view their own payment history';

COMMENT ON POLICY "Anyone can view active plans" ON public.subscription_plans IS 
  'Allow anyone to view active subscription plans for the pricing page';

COMMENT ON POLICY "Anyone can view active pricing" ON public.plan_pricing IS 
  'Allow anyone to view active pricing for the pricing page';
