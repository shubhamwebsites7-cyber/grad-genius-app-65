-- =====================================================
-- REMOVE FREE TRIAL FUNCTIONALITY
-- =====================================================
-- This script removes the 3-day free trial feature

-- 1. Drop the trial activation function
DROP FUNCTION IF EXISTS public.activate_free_trial(UUID);

-- 2. Drop the trial check function
DROP FUNCTION IF EXISTS public.has_user_used_trial(UUID);

-- 3. Update any existing trial subscriptions to regular status
-- (Mark them as expired if trial_ends_at has passed, or convert to regular if still valid)
UPDATE public.user_subscriptions
SET 
  is_trial = false,
  trial_starts_at = NULL,
  trial_ends_at = NULL
WHERE is_trial = true;

-- 4. Optional: Drop the trial-related index (can keep for backward compatibility)
-- DROP INDEX IF EXISTS idx_user_subscriptions_trial;

-- 5. Update get_subscription_progress function to remove trial logic
CREATE OR REPLACE FUNCTION public.get_subscription_progress(p_user_id UUID)
RETURNS TABLE(
  total_days INTEGER,
  elapsed_days INTEGER,
  remaining_days INTEGER,
  progress_percentage INTEGER,
  is_in_trial BOOLEAN,
  trial_days_total INTEGER,
  trial_days_elapsed INTEGER,
  accumulated_total_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_now TIMESTAMP;
BEGIN
  v_now := NOW();
  
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_subscription IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0, false, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Calculate current subscription period (no trial)
  total_days := GREATEST(1, EXTRACT(DAY FROM (v_subscription.expires_at - v_subscription.starts_at))::INTEGER);
  
  -- Calculate elapsed days in current subscription
  elapsed_days := LEAST(
    total_days,
    GREATEST(0, EXTRACT(DAY FROM (v_now - v_subscription.starts_at))::INTEGER)
  );
  
  -- Calculate remaining days
  remaining_days := GREATEST(0, EXTRACT(DAY FROM (v_subscription.expires_at - v_now))::INTEGER + 1);
  
  -- Calculate progress percentage
  progress_percentage := CASE 
    WHEN total_days > 0 
    THEN LEAST(100, (elapsed_days * 100 / total_days))
    ELSE 0
  END;
  
  -- Trial values always false/0 (trial removed)
  is_in_trial := false;
  trial_days_total := 0;
  trial_days_elapsed := 0;
  accumulated_total_days := COALESCE(v_subscription.accumulated_days, 0);
  
  RETURN QUERY SELECT 
    total_days,
    elapsed_days,
    remaining_days,
    progress_percentage,
    is_in_trial,
    trial_days_total,
    trial_days_elapsed,
    accumulated_total_days;
END;
$$;

COMMENT ON FUNCTION public.get_subscription_progress IS 'Calculates subscription progress (trial functionality removed)';

-- 6. Update extend_subscription_with_trial to remove trial logic
CREATE OR REPLACE FUNCTION public.extend_subscription_with_trial(
  p_user_id UUID,
  p_plan_id UUID,
  p_payment_id UUID,
  p_duration_months INTEGER DEFAULT 1,
  p_payment_method TEXT DEFAULT 'cashfree',
  p_external_sub_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  subscription_id UUID,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  accumulated_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_start TIMESTAMP WITH TIME ZONE;
  v_end TIMESTAMP WITH TIME ZONE;
  v_subscription_id UUID;
  v_days INTEGER;
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := NOW();
  
  -- Check for existing active subscription
  SELECT * INTO v_existing
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND expires_at > v_now
  ORDER BY expires_at DESC
  LIMIT 1;
  
  IF v_existing IS NOT NULL THEN
    -- Extend existing subscription
    v_start := v_existing.starts_at;
    v_end := v_existing.expires_at + (p_duration_months || ' months')::INTERVAL;
    v_days := COALESCE(v_existing.accumulated_days, 0) + (p_duration_months * 30);
    
    UPDATE user_subscriptions
    SET 
      expires_at = v_end,
      last_payment_id = p_payment_id,
      accumulated_days = v_days,
      updated_at = v_now
    WHERE id = v_existing.id
    RETURNING id INTO v_subscription_id;
  ELSE
    -- Create new subscription (no trial)
    v_start := v_now;
    v_end := v_now + (p_duration_months || ' months')::INTERVAL;
    v_days := p_duration_months * 30;
    
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      is_trial,
      trial_used,
      accumulated_days,
      auto_renew,
      payment_method,
      external_subscription_id,
      last_payment_id,
      purchase_platform
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      v_start,
      v_end,
      false,
      false,
      v_days,
      false,
      p_payment_method,
      p_external_sub_id,
      p_payment_id,
      p_payment_method
    )
    RETURNING id INTO v_subscription_id;
  END IF;
  
  RETURN QUERY SELECT v_subscription_id, v_start, v_end, v_days;
END;
$$;

COMMENT ON FUNCTION public.extend_subscription_with_trial IS 'Creates or extends subscription (trial functionality removed)';
