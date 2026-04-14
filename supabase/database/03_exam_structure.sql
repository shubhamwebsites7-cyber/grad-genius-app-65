-- =====================================================
-- EXAM STRUCTURE TABLES
-- =====================================================
-- These tables define the hierarchical structure of exams:
-- Categories → Exams → Subjects → Topics

-- =====================================================
-- EXAM CATEGORIES TABLE
-- =====================================================
-- Top-level categorization of exams (Engineering, Medical, etc.)
CREATE TABLE public.exam_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(100) NOT NULL,
  description text NULL,
  icon character varying(50) NULL,
  color character varying(7) NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT exam_categories_pkey PRIMARY KEY (id),
  CONSTRAINT exam_categories_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.exam_categories IS 'Top-level exam categories (Engineering, Medical, etc.)';
COMMENT ON COLUMN public.exam_categories.name IS 'Category name (e.g., Engineering Entrance, Medical Entrance)';
COMMENT ON COLUMN public.exam_categories.icon IS 'Icon identifier for UI display';
COMMENT ON COLUMN public.exam_categories.color IS 'Hex color code for category theming';

-- =====================================================
-- EXAMS TABLE
-- =====================================================
-- Individual exams within categories (JEE, NEET, etc.)
CREATE TABLE public.exams (
  id character varying(50) NOT NULL,
  name character varying(255) NOT NULL,
  full_name character varying(500) NULL,
  category_id uuid NULL,
  description text NULL,
  exam_type character varying(100) NOT NULL,
  total_marks integer NULL,
  duration_minutes integer NULL,
  is_active boolean NULL DEFAULT true,
  enrollment_count integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_category_id_fkey FOREIGN KEY (category_id) 
    REFERENCES exam_categories (id)
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exams_category 
ON public.exams USING btree (category_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.exams IS 'Individual exams (JEE, NEET, GATE, etc.)';
COMMENT ON COLUMN public.exams.id IS 'Unique exam identifier (e.g., JEE_MAIN, NEET_UG)';
COMMENT ON COLUMN public.exams.name IS 'Short exam name for display';
COMMENT ON COLUMN public.exams.full_name IS 'Full official exam name';
COMMENT ON COLUMN public.exams.exam_type IS 'Type of exam (entrance, competitive, etc.)';
COMMENT ON COLUMN public.exams.enrollment_count IS 'Number of users enrolled';

-- =====================================================
-- SUBJECTS TABLE
-- =====================================================
-- Subjects within each exam (Physics, Chemistry, etc.)
CREATE TABLE public.subjects (
  id character varying(50) NOT NULL,
  exam_id character varying(50) NOT NULL,
  name character varying(255) NOT NULL,
  total_marks integer NULL,
  display_order integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_exam_id_fkey FOREIGN KEY (exam_id) 
    REFERENCES exams (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subjects_exam_id 
ON public.subjects USING btree (exam_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.subjects IS 'Subjects within exams (Physics, Chemistry, Math, etc.)';
COMMENT ON COLUMN public.subjects.id IS 'Unique subject identifier (e.g., JEE_PHYSICS)';
COMMENT ON COLUMN public.subjects.exam_id IS 'Parent exam reference';
COMMENT ON COLUMN public.subjects.total_marks IS 'Maximum marks for this subject';
COMMENT ON COLUMN public.subjects.display_order IS 'Order for UI display';

-- =====================================================
-- TOPICS TABLE
-- =====================================================
-- Individual topics within subjects
CREATE TABLE public.topics (
  id character varying(100) NOT NULL,
  subject_id character varying(50) NOT NULL,
  name character varying(255) NOT NULL,
  marks integer NULL,
  difficulty character varying(20) NULL DEFAULT 'Medium'::character varying,
  display_order integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT topics_pkey PRIMARY KEY (id),
  CONSTRAINT topics_subject_id_fkey FOREIGN KEY (subject_id) 
    REFERENCES subjects (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id 
ON public.topics USING btree (subject_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.topics IS 'Individual topics within subjects';
COMMENT ON COLUMN public.topics.id IS 'Unique topic identifier (e.g., JEE_PHYSICS_MECHANICS)';
COMMENT ON COLUMN public.topics.subject_id IS 'Parent subject reference';
COMMENT ON COLUMN public.topics.marks IS 'Typical marks weightage for this topic';
COMMENT ON COLUMN public.topics.difficulty IS 'Difficulty level: Easy, Medium, Hard';
COMMENT ON COLUMN public.topics.display_order IS 'Order for UI display';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample exam categories
INSERT INTO public.exam_categories (name, description, icon, color, is_active) VALUES
('Engineering Entrance', 'Engineering entrance exams like JEE, BITSAT', 'engineering', '#3B82F6', true),
('Medical Entrance', 'Medical entrance exams like NEET, AIIMS', 'medical', '#EF4444', true),
('Government Jobs', 'Government job exams like SSC, UPSC', 'government', '#10B981', true),
('Banking & Finance', 'Banking sector exams like IBPS, SBI', 'banking', '#F59E0B', true);

-- Insert sample exams
INSERT INTO public.exams (id, name, full_name, category_id, description, exam_type, total_marks, duration_minutes, is_active) 
SELECT 
  'JEE_MAIN',
  'JEE Main',
  'Joint Entrance Examination Main',
  ec.id,
  'National level engineering entrance exam for admission to NITs, IIITs and other engineering colleges',
  'entrance',
  300,
  180,
  true
FROM public.exam_categories ec WHERE ec.name = 'Engineering Entrance'
UNION ALL
SELECT 
  'NEET_UG',
  'NEET UG',
  'National Eligibility cum Entrance Test (Undergraduate)',
  ec.id,
  'National level medical entrance exam for MBBS and BDS admissions',
  'entrance',
  720,
  180,
  true
FROM public.exam_categories ec WHERE ec.name = 'Medical Entrance';

-- Insert sample subjects for JEE Main
INSERT INTO public.subjects (id, exam_id, name, total_marks, display_order, is_active) VALUES
('JEE_PHYSICS', 'JEE_MAIN', 'Physics', 100, 1, true),
('JEE_CHEMISTRY', 'JEE_MAIN', 'Chemistry', 100, 2, true),
('JEE_MATHEMATICS', 'JEE_MAIN', 'Mathematics', 100, 3, true);

-- Insert sample subjects for NEET
INSERT INTO public.subjects (id, exam_id, name, total_marks, display_order, is_active) VALUES
('NEET_PHYSICS', 'NEET_UG', 'Physics', 180, 1, true),
('NEET_CHEMISTRY', 'NEET_UG', 'Chemistry', 180, 2, true),
('NEET_BIOLOGY', 'NEET_UG', 'Biology', 360, 3, true);

-- Insert sample topics for JEE Physics
INSERT INTO public.topics (id, subject_id, name, marks, difficulty, display_order, is_active) VALUES
('JEE_PHYSICS_MECHANICS', 'JEE_PHYSICS', 'Mechanics', 25, 'Medium', 1, true),
('JEE_PHYSICS_THERMODYNAMICS', 'JEE_PHYSICS', 'Thermodynamics', 15, 'Hard', 2, true),
('JEE_PHYSICS_WAVES', 'JEE_PHYSICS', 'Waves and Sound', 20, 'Medium', 3, true),
('JEE_PHYSICS_ELECTROMAGNETISM', 'JEE_PHYSICS', 'Electromagnetism', 25, 'Hard', 4, true),
('JEE_PHYSICS_OPTICS', 'JEE_PHYSICS', 'Optics', 15, 'Easy', 5, true);

-- Insert sample topics for JEE Chemistry
INSERT INTO public.topics (id, subject_id, name, marks, difficulty, display_order, is_active) VALUES
('JEE_CHEMISTRY_ORGANIC', 'JEE_CHEMISTRY', 'Organic Chemistry', 35, 'Hard', 1, true),
('JEE_CHEMISTRY_INORGANIC', 'JEE_CHEMISTRY', 'Inorganic Chemistry', 30, 'Medium', 2, true),
('JEE_CHEMISTRY_PHYSICAL', 'JEE_CHEMISTRY', 'Physical Chemistry', 35, 'Hard', 3, true);

-- Insert sample topics for JEE Mathematics
INSERT INTO public.topics (id, subject_id, name, marks, difficulty, display_order, is_active) VALUES
('JEE_MATH_CALCULUS', 'JEE_MATHEMATICS', 'Calculus', 30, 'Hard', 1, true),
('JEE_MATH_ALGEBRA', 'JEE_MATHEMATICS', 'Algebra', 25, 'Medium', 2, true),
('JEE_MATH_COORDINATE_GEOMETRY', 'JEE_MATHEMATICS', 'Coordinate Geometry', 25, 'Medium', 3, true),
('JEE_MATH_TRIGONOMETRY', 'JEE_MATHEMATICS', 'Trigonometry', 20, 'Easy', 4, true);
