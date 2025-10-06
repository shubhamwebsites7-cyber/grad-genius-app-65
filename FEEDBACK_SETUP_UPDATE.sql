-- Update user_feedback table to include user_email and user_name columns
-- Run this in your Supabase SQL Editor after running FEEDBACK_SETUP.sql

-- Add new columns to user_feedback table
ALTER TABLE public.user_feedback 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN public.user_feedback.user_email IS 'Email of the user who submitted feedback';
COMMENT ON COLUMN public.user_feedback.user_name IS 'Name of the user who submitted feedback';
