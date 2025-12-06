-- Simplified user_feedback table: Only star rating and review text
-- This replaces the previous multi-question feedback table

-- Drop existing table and recreate with simplified schema
DROP TABLE IF EXISTS public.user_feedback;

CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NULL,
  user_name text NULL,
  rating integer NOT NULL,
  review text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_user_id_key UNIQUE (user_id),
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_feedback_rating_check CHECK (rating >= 1 AND rating <= 5)
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON public.user_feedback USING btree (rating) TABLESPACE pg_default;

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
