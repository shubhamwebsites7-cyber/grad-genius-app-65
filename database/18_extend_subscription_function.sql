-- =====================================================
-- EXTEND SUBSCRIPTION WITH ACCUMULATED DAYS
-- =====================================================
-- Function to extend or create subscription with accumulated days from trial

CREATE OR REPLACE FUNCTION public.extend_subscription_with_trial(
  p_user_id UUID,
  p_plan_id UUID,
  p_payment_id UUID,
  p_duration_months INTEGER,
  p_purchase_platform TEXT DEFAULT 'cashfree'
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
  v_now TIMESTAMP WITH TIME ZONE;
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_existing_trial RECORD;
  v_trial_days_remaining INTEGER;
  v_new_subscription_id UUID;
  v_total_days INTEGER;
  v_plan_days INTEGER;
BEGIN
  v_now := NOW();
  
  -- Calculate plan days
  v_plan_days := p_duration_months * 30;
  v_total_days := v_plan_days;
  
  -- Check if user has an active trial
  SELECT * INTO v_existing_trial
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND is_trial = true
  AND status = 'active'
  AND expires_at > v_now
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_trial IS NOT NULL THEN
    -- User has active trial, extend from trial end date
    v_trial_days_remaining := EXTRACT(DAY FROM (v_existing_trial.expires_at - v_now))::INTEGER;
    
    -- Start from now (converting trial to paid)
    v_start_date := v_now;
    
    -- Add remaining trial days + purchased days
    v_end_date := v_now + (v_trial_days_remaining || ' days')::INTERVAL + (v_plan_days || ' days')::INTERVAL;
    v_total_days := v_trial_days_remaining + v_plan_days;
    
    -- Mark trial as inactive
    UPDATE user_subscriptions
    SET status = 'converted',
        updated_at = v_now
    WHERE id = v_existing_trial.id;
  ELSE
    -- No active trial, normal subscription
    v_start_date := v_now;
    v_end_date := v_now + (v_plan_days || ' days')::INTERVAL;
    v_total_days := v_plan_days;
  END IF;
  
  -- Check if user has any existing active subscription (non-trial)
  IF EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND is_trial = false
    AND expires_at > v_now
  ) THEN
    -- Extend existing subscription
    UPDATE user_subscriptions
    SET expires_at = expires_at + (v_plan_days || ' days')::INTERVAL,
        accumulated_days = accumulated_days + v_total_days,
        last_payment_id = p_payment_id,
        updated_at = v_now
    WHERE user_id = p_user_id
    AND status = 'active'
    AND is_trial = false
    RETURNING id INTO v_new_subscription_id;
    
    -- Get updated subscription details
    SELECT 
      id,
      starts_at,
      expires_at,
      accumulated_days
    INTO
      subscription_id,
      starts_at,
      expires_at,
      accumulated_days
    FROM user_subscriptions
    WHERE id = v_new_subscription_id;
  ELSE
    -- Create new subscription
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      last_payment_id,
      purchase_platform,
      accumulated_days,
      is_trial,
      trial_used,
      auto_renew
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      v_start_date,
      v_end_date,
      p_payment_id,
      p_purchase_platform,
      v_total_days,
      false,
      COALESCE(v_existing_trial.trial_used, false),
      true
    )
    RETURNING id, starts_at, expires_at, accumulated_days
    INTO subscription_id, starts_at, expires_at, accumulated_days;
  END IF;
  
  RETURN QUERY
  SELECT subscription_id, starts_at, expires_at, accumulated_days;
END;
$$;

COMMENT ON FUNCTION public.extend_subscription_with_trial IS 'Extends or creates subscription with accumulated days from trial period';
