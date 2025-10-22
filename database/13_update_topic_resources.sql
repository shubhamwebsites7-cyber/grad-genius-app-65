-- Remove unnecessary columns from topic_resources table
ALTER TABLE public.topic_resources 
DROP COLUMN IF EXISTS file_size_mb,
DROP COLUMN IF EXISTS duration_minutes,
DROP COLUMN IF EXISTS thumbnail_url;

-- Drop the existing foreign key constraint
ALTER TABLE public.topic_resources
DROP CONSTRAINT IF EXISTS topic_resources_topic_id_fkey;

-- Recreate without foreign key to allow both topic_id and section_id (subject_id)
-- This allows storing resources at subject level without duplication
-- When topic_id contains a section_id, it's a subject-level resource
-- When topic_id contains a topic_id, it's a topic-specific resource

-- Add a comment to clarify the usage
COMMENT ON COLUMN public.topic_resources.topic_id IS 'Can store either a topic_id for topic-specific resources or a section_id for subject-level resources';
