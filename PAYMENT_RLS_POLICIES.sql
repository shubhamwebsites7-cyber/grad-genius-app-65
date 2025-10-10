-- RLS Policies for Payment Tables

-- Enable RLS on all payment tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Payments table policies
-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert payments (via edge functions with service role)
CREATE POLICY "Service role can insert payments"
ON payments FOR INSERT
TO service_role
WITH CHECK (true);

-- Only system can update payments (via webhooks with service role)
CREATE POLICY "Service role can update payments"
ON payments FOR UPDATE
TO service_role
USING (true);

-- Plan pricing policies
-- Everyone can view active pricing
CREATE POLICY "Anyone can view active pricing"
ON plan_pricing FOR SELECT
TO public
USING (is_active = true);

-- Subscription plans policies
-- Everyone can view active plans
CREATE POLICY "Anyone can view active plans"
ON subscription_plans FOR SELECT
TO public
USING (is_active = true);

-- User subscriptions policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system can insert subscriptions (via edge functions with service role)
CREATE POLICY "Service role can insert subscriptions"
ON user_subscriptions FOR INSERT
TO service_role
WITH CHECK (true);

-- Only system can update subscriptions (via edge functions with service role)
CREATE POLICY "Service role can update subscriptions"
ON user_subscriptions FOR UPDATE
TO service_role
USING (true);

-- Grant necessary permissions
GRANT SELECT ON plan_pricing TO anon, authenticated;
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT ALL ON user_subscriptions TO service_role;
