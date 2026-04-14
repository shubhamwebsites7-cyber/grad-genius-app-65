-- =====================================================
-- FREE TRIAL SUPPORT - 3 DAYS
-- =====================================================
-- Add free trial tracking and subscription progress

-- Add free trial tracking columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accumulated_days INTEGER DEFAULT 0;

-- Add index for trial queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial 
ON public.user_subscriptions(user_id, is_trial, trial_ends_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
ON public.user_subscriptions(user_id, status);

-- Comments
COMMENT ON COLUMN public.user_subscriptions.trial_starts_at IS 'When free trial started';
COMMENT ON COLUMN public.user_subscriptions.trial_ends_at IS 'When free trial ends (3 days)';
COMMENT ON COLUMN public.user_subscriptions.is_trial IS 'Whether user is currently in trial period';
COMMENT ON COLUMN public.user_subscriptions.trial_used IS 'Whether user has already used their free trial';
COMMENT ON COLUMN public.user_subscriptions.accumulated_days IS 'Total days accumulated from all purchases and upgrades';

-- Function to check if user has used trial
CREATE OR REPLACE FUNCTION public.has_user_used_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_id = p_user_id 
    AND trial_used = true
  );
END;
$$;

-- Function to calculate subscription progress with accumulated days
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
  v_total_accumulated INTEGER;
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
  
  -- Calculate trial info (3 days)
  trial_days_total := CASE 
    WHEN v_subscription.trial_starts_at IS NOT NULL 
    THEN 3
    ELSE 0
  END;
  
  trial_days_elapsed := CASE 
    WHEN v_subscription.is_trial AND v_now < v_subscription.trial_ends_at
    THEN LEAST(3, EXTRACT(DAY FROM (v_now - v_subscription.trial_starts_at))::INTEGER)
    WHEN v_subscription.trial_starts_at IS NOT NULL
    THEN 3
    ELSE 0
  END;
  
  is_in_trial := v_subscription.is_trial AND v_now < v_subscription.trial_ends_at;
  
  -- Get total accumulated days from all user's subscriptions
  SELECT COALESCE(SUM(accumulated_days), 0) INTO v_total_accumulated
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  -- Calculate current subscription period
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
  
  accumulated_total_days := v_total_accumulated;
  
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

-- Function to get all subscription history for a user
CREATE OR REPLACE FUNCTION public.get_user_subscription_history(p_user_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  plan_name TEXT,
  duration_days INTEGER,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  is_trial BOOLEAN,
  purchase_platform TEXT,
  accumulated_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    sp.name,
    EXTRACT(DAY FROM (us.expires_at - us.starts_at))::INTEGER,
    us.starts_at,
    us.expires_at,
    us.status,
    us.is_trial,
    us.purchase_platform,
    us.accumulated_days
  FROM user_subscriptions us
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
  ORDER BY us.created_at DESC;
END;
$$;
