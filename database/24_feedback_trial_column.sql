-- Add claimed_trial column to track if user claimed 14-day premium trial
-- Run this migration to update the user_feedback table

-- Add claimed_trial column
ALTER TABLE public.user_feedback
ADD COLUMN IF NOT EXISTS claimed_trial boolean NULL DEFAULT false;

-- Add index for quick lookups of trial claims
CREATE INDEX IF NOT EXISTS idx_user_feedback_claimed_trial 
ON public.user_feedback USING btree (claimed_trial) 
WHERE claimed_trial = true;

-- Comment for documentation
COMMENT ON COLUMN public.user_feedback.claimed_trial IS 'Whether user claimed the 14-day premium trial reward for submitting feedback';
