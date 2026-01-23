-- Update user_feedback table to support quiz-based feedback
-- Adds columns for quiz answers, score, and time taken

-- Add new columns for quiz data
ALTER TABLE public.user_feedback 
ADD COLUMN IF NOT EXISTS quiz_answers jsonb NULL,
ADD COLUMN IF NOT EXISTS quiz_score integer NULL,
ADD COLUMN IF NOT EXISTS time_taken_seconds integer NULL;

-- Add constraint for quiz_score (0-25 questions)
ALTER TABLE public.user_feedback 
ADD CONSTRAINT user_feedback_quiz_score_check 
CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 25));

-- Add constraint for minimum time (90 seconds)
ALTER TABLE public.user_feedback 
ADD CONSTRAINT user_feedback_time_check 
CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 90);

-- Create index for quiz analytics
CREATE INDEX IF NOT EXISTS idx_user_feedback_quiz_score 
ON public.user_feedback USING btree (quiz_score) TABLESPACE pg_default;

-- Comment for documentation
COMMENT ON COLUMN public.user_feedback.quiz_answers IS 'JSON array of user answers for each question';
COMMENT ON COLUMN public.user_feedback.quiz_score IS 'Number of correct answers (0-25)';
COMMENT ON COLUMN public.user_feedback.time_taken_seconds IS 'Time taken to complete quiz in seconds (min 90)';
