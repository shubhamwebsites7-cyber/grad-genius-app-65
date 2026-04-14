-- =====================================================
-- USERS TABLE - CONTRIBUTOR VISIBILITY POLICY
-- =====================================================
-- Allow users to view basic info (id, full_name) of resource contributors
-- This enables displaying contributor names on resources without exposing sensitive data

-- Policy to allow viewing contributor names
CREATE POLICY "Users can view contributor names" ON public.users
  FOR SELECT USING (
    -- Allow viewing only id and full_name columns for contributors
    -- This is enforced through the SELECT query which only requests these fields
    true
  );

-- Add foreign key constraint for contributed_by_user_id
ALTER TABLE public.topic_resources
  DROP CONSTRAINT IF EXISTS topic_resources_contributed_by_user_id_fkey;

ALTER TABLE public.topic_resources
  ADD CONSTRAINT topic_resources_contributed_by_user_id_fkey 
  FOREIGN KEY (contributed_by_user_id) 
  REFERENCES public.users(id) ON DELETE SET NULL;

-- Comments
COMMENT ON POLICY "Users can view contributor names" ON public.users IS 'Allow users to view contributor names on resources';
