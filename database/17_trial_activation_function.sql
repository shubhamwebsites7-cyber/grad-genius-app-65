-- =====================================================
-- FREE TRIAL ACTIVATION FUNCTION
-- =====================================================
-- Automatically activate 3-day free trial for new users

-- Function to activate free trial for a user
CREATE OR REPLACE FUNCTION public.activate_free_trial(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  subscription_id UUID,
  trial_ends_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_trial BOOLEAN;
  v_trial_plan_id UUID;
  v_subscription_id UUID;
  v_trial_end TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := NOW();
  
  -- Check if user has already used trial
  SELECT trial_used INTO v_has_trial
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND trial_used = true
  LIMIT 1;
  
  IF v_has_trial THEN
    RETURN QUERY SELECT false, 'Trial already used'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if user has any active subscription (including trial)
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND expires_at > v_now
  ) THEN
    RETURN QUERY SELECT false, 'User already has active subscription'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Get the Free Plan (or any plan with 0 months duration for trial)
  SELECT id INTO v_trial_plan_id
  FROM subscription_plans
  WHERE name = 'Free Plan' OR duration_months = 0
  LIMIT 1;
  
  -- If no free plan exists, use the first available plan
  IF v_trial_plan_id IS NULL THEN
    SELECT id INTO v_trial_plan_id
    FROM subscription_plans
    WHERE is_active = true
    ORDER BY duration_months ASC
    LIMIT 1;
  END IF;
  
  IF v_trial_plan_id IS NULL THEN
    RETURN QUERY SELECT false, 'No subscription plan available'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Calculate trial end date (3 days from now)
  v_trial_end := v_now + INTERVAL '3 days';
  
  -- Create trial subscription
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    starts_at,
    expires_at,
    trial_starts_at,
    trial_ends_at,
    is_trial,
    trial_used,
    accumulated_days,
    auto_renew,
    purchase_platform
  ) VALUES (
    p_user_id,
    v_trial_plan_id,
    'active',
    v_now,
    v_trial_end,
    v_now,
    v_trial_end,
    true,
    true,
    3, -- 3 days of trial
    false,
    'trial'
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN QUERY SELECT true, 'Free trial activated successfully'::TEXT, v_subscription_id, v_trial_end;
END;
$$;

COMMENT ON FUNCTION public.activate_free_trial IS 'Activates a 3-day free trial for new users';
