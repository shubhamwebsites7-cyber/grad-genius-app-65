-- Daily feedback tracking for closed testing (14 days)
-- Allows users to submit feedback daily with GitHub-style tracking

-- Drop the old unique constraint (one feedback per user)
-- And recreate table to allow daily feedback

DROP TABLE IF EXISTS public.user_feedback;

CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NULL,
  user_name text NULL,
  rating integer NOT NULL,
  review text NULL,
  feedback_day integer NOT NULL, -- Day 1 to 14
  feedback_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_user_day_key UNIQUE (user_id, feedback_day), -- One feedback per user per day
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT user_feedback_day_check CHECK (feedback_day >= 1 AND feedback_day <= 14)
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON public.user_feedback USING btree (rating) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_feedback_day ON public.user_feedback USING btree (feedback_day) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own feedback" ON public.user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
