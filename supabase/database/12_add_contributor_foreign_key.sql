-- =====================================================
-- ADD FOREIGN KEY FOR CONTRIBUTOR IN TOPIC_RESOURCES
-- =====================================================
-- This adds the missing foreign key relationship between 
-- topic_resources.contributed_by_user_id and users.id

-- Add foreign key constraint for contributed_by_user_id
ALTER TABLE public.topic_resources
  DROP CONSTRAINT IF EXISTS topic_resources_contributed_by_user_id_fkey;

ALTER TABLE public.topic_resources
  ADD CONSTRAINT topic_resources_contributed_by_user_id_fkey 
  FOREIGN KEY (contributed_by_user_id) 
  REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_topic_resources_contributor 
  ON public.topic_resources(contributed_by_user_id);

-- Comment
COMMENT ON CONSTRAINT topic_resources_contributed_by_user_id_fkey 
  ON public.topic_resources IS 'Links resources to their contributor user';
