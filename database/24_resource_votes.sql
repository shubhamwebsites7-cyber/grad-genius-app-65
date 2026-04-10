-- =====================================================
-- RESOURCE VOTES TABLE (Upvote System)
-- =====================================================
-- Replaces rating-based helpful system with simple upvote toggle

CREATE TABLE IF NOT EXISTS public.resource_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.topic_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (resource_id, user_id)
);

-- Enable RLS
ALTER TABLE public.resource_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all votes" ON public.resource_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON public.resource_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.resource_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Admin policy
CREATE POLICY "Admins can manage all votes" ON public.resource_votes
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_resource_votes_resource_id ON public.resource_votes(resource_id);
CREATE INDEX idx_resource_votes_user_id ON public.resource_votes(user_id);

-- Permissions
GRANT ALL ON public.resource_votes TO authenticated;
GRANT SELECT ON public.resource_votes TO anon;
