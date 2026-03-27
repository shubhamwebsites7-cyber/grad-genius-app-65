-- =====================================================
-- REMOVE LEGACY subjects.exam_id COLUMN
-- =====================================================
-- This migration removes the direct exam_id foreign key
-- from the subjects table. All exam-subject relationships
-- are now handled via the exam_subjects junction table.
--
-- PREREQUISITES:
--   1. Junction tables (exam_subjects, exam_topics) must exist
--   2. Data must be migrated (run 29_normalized_junction_tables.sql first)
--   3. All frontend code must use junction tables (no subjects.exam_id references)
-- =====================================================

-- Step 1: Verify junction data exists before dropping
-- Run this SELECT first to confirm data is populated:
-- SELECT COUNT(*) FROM exam_subjects;
-- SELECT COUNT(*) FROM exam_topics;

-- Step 2: Drop the foreign key constraint
ALTER TABLE public.subjects 
  DROP CONSTRAINT IF EXISTS subjects_exam_id_fkey;

-- Step 3: Drop the index on exam_id
DROP INDEX IF EXISTS idx_subjects_exam_id;

-- Step 4: Drop the exam_id column
ALTER TABLE public.subjects 
  DROP COLUMN IF EXISTS exam_id;

-- Step 5: Update comments
COMMENT ON TABLE public.subjects IS 'Global subjects library - linked to exams via exam_subjects junction table';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, verify:
-- 1. subjects table no longer has exam_id column
-- 2. exam_subjects junction table has all mappings
-- 3. Frontend pages load correctly
