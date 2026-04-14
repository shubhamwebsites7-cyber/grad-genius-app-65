-- =====================================================
-- NORMALIZED JUNCTION TABLES FOR CONTENT REUSABILITY
-- =====================================================
-- These tables enable subjects, topics, and resources to be
-- shared across multiple exams without data duplication.
-- 
-- Architecture:
--   Global: subjects → topics → topic_resources (exist once)
--   Junction: exam_subjects, exam_topics (link content to exams)
--   Exam-specific: user_exam_progress, user_exam_enrollments
-- =====================================================

-- =====================================================
-- EXAM_SUBJECTS JUNCTION TABLE
-- =====================================================
-- Links subjects to exams with exam-specific metadata
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id character varying(50) NOT NULL,
  subject_id character varying(50) NOT NULL,
  marks integer NULL,
  display_order integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT exam_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT exam_subjects_exam_subject_unique UNIQUE (exam_id, subject_id),
  CONSTRAINT exam_subjects_exam_id_fkey FOREIGN KEY (exam_id) 
    REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT exam_subjects_subject_id_fkey FOREIGN KEY (subject_id) 
    REFERENCES subjects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id 
ON public.exam_subjects USING btree (exam_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject_id 
ON public.exam_subjects USING btree (subject_id) TABLESPACE pg_default;

-- Comments
COMMENT ON TABLE public.exam_subjects IS 'Junction table linking subjects to exams for content reusability';
COMMENT ON COLUMN public.exam_subjects.marks IS 'Exam-specific marks for this subject (overrides subject default)';
COMMENT ON COLUMN public.exam_subjects.display_order IS 'Display order within this specific exam';

-- =====================================================
-- EXAM_TOPICS JUNCTION TABLE
-- =====================================================
-- Links topics to exams with exam-specific metadata
CREATE TABLE IF NOT EXISTS public.exam_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id character varying(50) NOT NULL,
  subject_id character varying(50) NOT NULL,
  topic_id character varying(100) NOT NULL,
  marks integer NULL,
  display_order integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT exam_topics_pkey PRIMARY KEY (id),
  CONSTRAINT exam_topics_exam_topic_unique UNIQUE (exam_id, topic_id),
  CONSTRAINT exam_topics_exam_id_fkey FOREIGN KEY (exam_id) 
    REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT exam_topics_subject_id_fkey FOREIGN KEY (subject_id) 
    REFERENCES subjects (id) ON DELETE CASCADE,
  CONSTRAINT exam_topics_topic_id_fkey FOREIGN KEY (topic_id) 
    REFERENCES topics (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exam_topics_exam_id 
ON public.exam_topics USING btree (exam_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_exam_topics_subject_id 
ON public.exam_topics USING btree (subject_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_exam_topics_topic_id 
ON public.exam_topics USING btree (topic_id) TABLESPACE pg_default;

-- Comments
COMMENT ON TABLE public.exam_topics IS 'Junction table linking topics to exams for content reusability';
COMMENT ON COLUMN public.exam_topics.subject_id IS 'Subject this topic belongs to within this exam context';
COMMENT ON COLUMN public.exam_topics.marks IS 'Exam-specific marks for this topic (overrides topic default)';
COMMENT ON COLUMN public.exam_topics.display_order IS 'Display order within this specific exam-subject';

-- =====================================================
-- MIGRATE EXISTING DATA INTO JUNCTION TABLES
-- =====================================================

-- Populate exam_subjects from existing subjects.exam_id
INSERT INTO public.exam_subjects (exam_id, subject_id, marks, display_order, is_active)
SELECT s.exam_id, s.id, s.total_marks, s.display_order, s.is_active
FROM public.subjects s
WHERE s.exam_id IS NOT NULL
ON CONFLICT (exam_id, subject_id) DO NOTHING;

-- Populate exam_topics from existing topics via subjects
INSERT INTO public.exam_topics (exam_id, subject_id, topic_id, marks, display_order, is_active)
SELECT s.exam_id, s.id, t.id, t.marks, t.display_order, t.is_active
FROM public.topics t
JOIN public.subjects s ON t.subject_id = s.id
WHERE s.exam_id IS NOT NULL
ON CONFLICT (exam_id, topic_id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR JUNCTION TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_topics ENABLE ROW LEVEL SECURITY;

-- Everyone can read junction tables (public exam structure)
CREATE POLICY "Anyone can view exam_subjects"
ON public.exam_subjects FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can view exam_topics"
ON public.exam_topics FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can modify junction tables
CREATE POLICY "Admins can manage exam_subjects"
ON public.exam_subjects FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage exam_topics"
ON public.exam_topics FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON public.exam_subjects TO anon;
GRANT ALL ON public.exam_subjects TO authenticated;
GRANT SELECT ON public.exam_topics TO anon;
GRANT ALL ON public.exam_topics TO authenticated;
