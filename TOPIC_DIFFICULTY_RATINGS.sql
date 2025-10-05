-- Create topic difficulty ratings table
CREATE TABLE IF NOT EXISTS public.topic_difficulty_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id VARCHAR(100) NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty_rating VARCHAR(20) NOT NULL CHECK (difficulty_rating IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_topic_difficulty_rating UNIQUE(user_id, topic_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_topic_difficulty_ratings_topic_id ON public.topic_difficulty_ratings(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_difficulty_ratings_user_id ON public.topic_difficulty_ratings(user_id);

-- Enable RLS
ALTER TABLE public.topic_difficulty_ratings ENABLE ROW LEVEL SECURITY;

-- Allow users to read all difficulty ratings
CREATE POLICY "Allow users to read all difficulty ratings"
  ON public.topic_difficulty_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own difficulty ratings
CREATE POLICY "Allow users to insert their own difficulty ratings"
  ON public.topic_difficulty_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own difficulty ratings
CREATE POLICY "Allow users to update their own difficulty ratings"
  ON public.topic_difficulty_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own difficulty ratings
CREATE POLICY "Allow users to delete their own difficulty ratings"
  ON public.topic_difficulty_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to calculate average difficulty for a topic
-- Returns a difficulty string based on weighted average: Easy=1, Medium=2, Hard=3
CREATE OR REPLACE FUNCTION public.get_topic_calculated_difficulty(p_topic_id VARCHAR(100))
RETURNS VARCHAR(20)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_avg_difficulty NUMERIC;
  v_count INTEGER;
BEGIN
  -- Calculate weighted average and count
  SELECT 
    AVG(CASE 
      WHEN difficulty_rating = 'Easy' THEN 1
      WHEN difficulty_rating = 'Medium' THEN 2
      WHEN difficulty_rating = 'Hard' THEN 3
      ELSE 2
    END),
    COUNT(*)
  INTO v_avg_difficulty, v_count
  FROM public.topic_difficulty_ratings
  WHERE topic_id = p_topic_id;
  
  -- If no ratings, return NULL (will use default from topics table)
  IF v_count = 0 OR v_avg_difficulty IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert average back to difficulty string
  IF v_avg_difficulty <= 1.5 THEN
    RETURN 'Easy';
  ELSIF v_avg_difficulty <= 2.5 THEN
    RETURN 'Medium';
  ELSE
    RETURN 'Hard';
  END IF;
END;
$$;
