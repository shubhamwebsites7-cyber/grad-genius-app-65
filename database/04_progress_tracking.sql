-- =====================================================
-- PROGRESS TRACKING TABLES
-- =====================================================
-- These tables track user progress at multiple levels:
-- Exam → Subject → Topic level progress tracking

-- =====================================================
-- USER EXAM ENROLLMENTS TABLE
-- =====================================================
-- Tracks which exams users have enrolled in
CREATE TABLE public.user_exam_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_id character varying(50) NOT NULL,
  enrolled_at timestamp with time zone NULL DEFAULT now(),
  target_exam_date date NULL,
  is_active boolean NULL DEFAULT true,
  
  CONSTRAINT user_exam_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT user_exam_enrollments_user_id_exam_id_key UNIQUE (user_id, exam_id),
  CONSTRAINT user_exam_enrollments_exam_id_fkey FOREIGN KEY (exam_id) 
    REFERENCES exams (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_exam_enrollments_user 
ON public.user_exam_enrollments USING btree (user_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_exam_enrollments IS 'User exam enrollments';
COMMENT ON COLUMN public.user_exam_enrollments.target_exam_date IS 'User target date for taking the exam';
COMMENT ON COLUMN public.user_exam_enrollments.is_active IS 'Whether enrollment is currently active';

-- =====================================================
-- USER EXAM PROGRESS TABLE
-- =====================================================
-- Overall progress tracking for each enrolled exam
CREATE TABLE public.user_exam_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_id character varying(50) NOT NULL,
  completed_topics integer NULL DEFAULT 0,
  total_topics integer NULL DEFAULT 0,
  progress_percentage numeric(5, 2) NULL DEFAULT 0.00,
  total_time_spent_minutes integer NULL DEFAULT 0,
  last_accessed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  completed_topics_ids text[] NULL DEFAULT ARRAY[]::text[],
  
  CONSTRAINT user_exam_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_exam_progress_user_id_exam_id_key UNIQUE (user_id, exam_id),
  CONSTRAINT user_exam_progress_exam_id_fkey FOREIGN KEY (exam_id) 
    REFERENCES exams (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_exam_progress_user 
ON public.user_exam_progress USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_exam_progress_completed_topics 
ON public.user_exam_progress USING gin (completed_topics_ids) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_exam_progress IS 'Overall exam-level progress tracking';
COMMENT ON COLUMN public.user_exam_progress.completed_topics IS 'Number of topics completed';
COMMENT ON COLUMN public.user_exam_progress.total_topics IS 'Total topics in the exam';
COMMENT ON COLUMN public.user_exam_progress.progress_percentage IS 'Overall completion percentage';
COMMENT ON COLUMN public.user_exam_progress.completed_topics_ids IS 'Array of completed topic IDs';

-- =====================================================
-- USER SUBJECT PROGRESS TABLE
-- =====================================================
-- Subject-level progress tracking
CREATE TABLE public.user_subject_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id character varying(50) NOT NULL,
  completed_topics integer NULL DEFAULT 0,
  total_topics integer NULL DEFAULT 0,
  progress_percentage numeric(5, 2) NULL DEFAULT 0.00,
  time_spent_minutes integer NULL DEFAULT 0,
  last_accessed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_subject_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_subject_progress_user_id_subject_id_key UNIQUE (user_id, subject_id),
  CONSTRAINT user_subject_progress_subject_id_fkey FOREIGN KEY (subject_id) 
    REFERENCES subjects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_subject_progress_user 
ON public.user_subject_progress USING btree (user_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_subject_progress IS 'Subject-level progress tracking';
COMMENT ON COLUMN public.user_subject_progress.time_spent_minutes IS 'Time spent studying this subject';

-- =====================================================
-- USER TOPIC PROGRESS TABLE
-- =====================================================
-- Individual topic-level progress tracking
CREATE TABLE public.user_topic_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id character varying(100) NOT NULL,
  is_completed boolean NULL DEFAULT false,
  is_accessible boolean NULL DEFAULT false,
  completion_percentage numeric(5, 2) NULL DEFAULT 0.00,
  time_spent_minutes integer NULL DEFAULT 0,
  attempts_count integer NULL DEFAULT 0,
  best_score numeric(5, 2) NULL,
  last_accessed_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_topic_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_topic_progress_user_id_topic_id_key UNIQUE (user_id, topic_id),
  CONSTRAINT user_topic_progress_topic_id_fkey FOREIGN KEY (topic_id) 
    REFERENCES topics (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user 
ON public.user_topic_progress USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_topic 
ON public.user_topic_progress USING btree (topic_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_completed 
ON public.user_topic_progress USING btree (user_id, is_completed) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_topic_progress IS 'Individual topic-level progress tracking';
COMMENT ON COLUMN public.user_topic_progress.is_completed IS 'Whether topic is fully completed';
COMMENT ON COLUMN public.user_topic_progress.is_accessible IS 'Whether topic is accessible to user (subscription check)';
COMMENT ON COLUMN public.user_topic_progress.completion_percentage IS 'Percentage of topic completed';
COMMENT ON COLUMN public.user_topic_progress.attempts_count IS 'Number of times user attempted this topic';
COMMENT ON COLUMN public.user_topic_progress.best_score IS 'Best score achieved in this topic';

-- =====================================================
-- TOPIC DIFFICULTY RATINGS TABLE
-- =====================================================
-- User-submitted difficulty ratings for topics
CREATE TABLE public.topic_difficulty_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id character varying(100) NOT NULL,
  user_id uuid NOT NULL,
  difficulty_rating character varying(20) NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT topic_difficulty_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_topic_difficulty_rating UNIQUE (user_id, topic_id),
  CONSTRAINT topic_difficulty_ratings_topic_id_fkey FOREIGN KEY (topic_id) 
    REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT topic_difficulty_ratings_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT topic_difficulty_ratings_difficulty_rating_check CHECK (
    difficulty_rating::text = ANY (ARRAY[
      'Easy'::character varying,
      'Medium'::character varying,
      'Hard'::character varying
    ]::text[])
  )
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_topic_difficulty_ratings_topic_id 
ON public.topic_difficulty_ratings USING btree (topic_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_topic_difficulty_ratings_user_id 
ON public.topic_difficulty_ratings USING btree (user_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.topic_difficulty_ratings IS 'User-submitted difficulty ratings for topics';
COMMENT ON COLUMN public.topic_difficulty_ratings.difficulty_rating IS 'User rating: Easy, Medium, Hard';

-- =====================================================
-- PROGRESS CALCULATION FUNCTIONS
-- =====================================================

-- Function to update exam progress when topic progress changes
CREATE OR REPLACE FUNCTION update_exam_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update subject progress
  UPDATE user_subject_progress 
  SET 
    completed_topics = (
      SELECT COUNT(*) 
      FROM user_topic_progress utp 
      JOIN topics t ON utp.topic_id = t.id 
      WHERE utp.user_id = NEW.user_id 
      AND t.subject_id = (SELECT subject_id FROM topics WHERE id = NEW.topic_id)
      AND utp.is_completed = true
    ),
    total_topics = (
      SELECT COUNT(*) 
      FROM topics t 
      WHERE t.subject_id = (SELECT subject_id FROM topics WHERE id = NEW.topic_id)
      AND t.is_active = true
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id 
  AND subject_id = (SELECT subject_id FROM topics WHERE id = NEW.topic_id);
  
  -- Calculate and update progress percentage
  UPDATE user_subject_progress 
  SET progress_percentage = CASE 
    WHEN total_topics > 0 THEN (completed_topics::numeric / total_topics::numeric) * 100 
    ELSE 0 
  END
  WHERE user_id = NEW.user_id 
  AND subject_id = (SELECT subject_id FROM topics WHERE id = NEW.topic_id);
  
  -- Update exam progress
  UPDATE user_exam_progress 
  SET 
    completed_topics = (
      SELECT COUNT(*) 
      FROM user_topic_progress utp 
      JOIN topics t ON utp.topic_id = t.id 
      JOIN subjects s ON t.subject_id = s.id
      WHERE utp.user_id = NEW.user_id 
      AND s.exam_id = (
        SELECT s2.exam_id 
        FROM topics t2 
        JOIN subjects s2 ON t2.subject_id = s2.id 
        WHERE t2.id = NEW.topic_id
      )
      AND utp.is_completed = true
    ),
    total_topics = (
      SELECT COUNT(*) 
      FROM topics t 
      JOIN subjects s ON t.subject_id = s.id
      WHERE s.exam_id = (
        SELECT s2.exam_id 
        FROM topics t2 
        JOIN subjects s2 ON t2.subject_id = s2.id 
        WHERE t2.id = NEW.topic_id
      )
      AND t.is_active = true
    ),
    updated_at = now()
  WHERE user_id = NEW.user_id 
  AND exam_id = (
    SELECT s.exam_id 
    FROM topics t 
    JOIN subjects s ON t.subject_id = s.id 
    WHERE t.id = NEW.topic_id
  );
  
  -- Calculate and update exam progress percentage
  UPDATE user_exam_progress 
  SET progress_percentage = CASE 
    WHEN total_topics > 0 THEN (completed_topics::numeric / total_topics::numeric) * 100 
    ELSE 0 
  END
  WHERE user_id = NEW.user_id 
  AND exam_id = (
    SELECT s.exam_id 
    FROM topics t 
    JOIN subjects s ON t.subject_id = s.id 
    WHERE t.id = NEW.topic_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress when topic progress changes
CREATE TRIGGER update_progress_on_topic_change
  AFTER INSERT OR UPDATE ON user_topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_progress();
