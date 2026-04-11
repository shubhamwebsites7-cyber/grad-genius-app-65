-- =====================================================
-- FIX: SUBSCRIPTION EXTENSION LOGIC
-- =====================================================
-- Replaces extend_subscription_with_trial with correct logic:
-- 1. If active subscription exists (expires_at > now) → EXTEND from expires_at
-- 2. If expired subscription exists → UPDATE with new dates from now()
-- 3. If no subscription → INSERT new
-- NEVER creates duplicate rows. NEVER overwrites end date.

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
  v_plan_days INTEGER;
  v_existing RECORD;
  v_new_expires TIMESTAMP WITH TIME ZONE;
  v_new_starts TIMESTAMP WITH TIME ZONE;
  v_new_accumulated INTEGER;
  v_sub_id UUID;
BEGIN
  v_now := NOW();
  v_plan_days := p_duration_months * 30;

  -- Find ANY existing subscription for this user (active or expired, non-trial)
  SELECT * INTO v_existing
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.is_trial = false
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    -- Existing subscription found
    IF v_existing.expires_at > v_now THEN
      -- ACTIVE: extend from current expires_at (DO NOT overwrite)
      v_new_expires := v_existing.expires_at + (v_plan_days || ' days')::INTERVAL;
      v_new_starts := v_existing.starts_at; -- keep original start
    ELSE
      -- EXPIRED: start fresh from now
      v_new_expires := v_now + (v_plan_days || ' days')::INTERVAL;
      v_new_starts := v_now;
    END IF;

    v_new_accumulated := COALESCE(v_existing.accumulated_days, 0) + v_plan_days;

    UPDATE user_subscriptions
    SET plan_id = p_plan_id,
        status = 'active',
        starts_at = v_new_starts,
        expires_at = v_new_expires,
        last_payment_id = p_payment_id,
        purchase_platform = p_purchase_platform,
        accumulated_days = v_new_accumulated,
        updated_at = v_now
    WHERE id = v_existing.id
    RETURNING id INTO v_sub_id;

    RETURN QUERY
    SELECT v_sub_id, v_new_starts, v_new_expires, v_new_accumulated;
  ELSE
    -- No subscription at all → INSERT new
    v_new_starts := v_now;
    v_new_expires := v_now + (v_plan_days || ' days')::INTERVAL;
    v_new_accumulated := v_plan_days;

    INSERT INTO user_subscriptions (
      user_id, plan_id, status, starts_at, expires_at,
      last_payment_id, purchase_platform, accumulated_days,
      is_trial, trial_used, auto_renew
    ) VALUES (
      p_user_id, p_plan_id, 'active', v_new_starts, v_new_expires,
      p_payment_id, p_purchase_platform, v_new_accumulated,
      false, false, true
    )
    RETURNING id INTO v_sub_id;

    RETURN QUERY
    SELECT v_sub_id, v_new_starts, v_new_expires, v_new_accumulated;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.extend_subscription_with_trial IS 
'Extends active subscription from expires_at, or resets expired subscription from now(). Never creates duplicate rows.';
