-- Migration: Allow daily feedback submissions instead of one-time
-- This enables users to submit feedback once per day for 14 days

-- Step 1: Drop the unique constraint on user_id to allow multiple entries
ALTER TABLE public.user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_user_id_key;

-- Step 2: Add a unique constraint on user_id + date to allow one feedback per day
ALTER TABLE public.user_feedback
ADD CONSTRAINT user_feedback_user_id_date_key 
UNIQUE (user_id, (created_at::date));

-- Step 3: Add feedback_day column to track which day of the 14-day challenge
ALTER TABLE public.user_feedback
ADD COLUMN IF NOT EXISTS feedback_day integer NULL;

-- Step 4: Add index for efficient daily lookups
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_date 
ON public.user_feedback (user_id, (created_at::date));

-- Note: Run this in Supabase SQL Editor
