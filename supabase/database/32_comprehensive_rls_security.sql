-- =====================================================
-- COMPREHENSIVE RLS SECURITY FOR ALL EXPOSED TABLES
-- =====================================================
-- Run this in Supabase SQL Editor
-- This file enables RLS and adds proper policies for ALL tables

-- =====================================================
-- HELPER FUNCTION: Check active subscription
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND expires_at > now()
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO anon;

-- =====================================================
-- 1. EXAMS TABLE
-- =====================================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active exams" ON public.exams;
CREATE POLICY "Anyone can view active exams" ON public.exams
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 2. EXAM_CATEGORIES TABLE
-- =====================================================
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.exam_categories;
CREATE POLICY "Anyone can view categories" ON public.exam_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.exam_categories;
CREATE POLICY "Admins can manage categories" ON public.exam_categories
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 3. SUBJECTS TABLE
-- =====================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subjects" ON public.subjects;
CREATE POLICY "Anyone can view active subjects" ON public.subjects
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 4. TOPICS TABLE
-- =====================================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active topics" ON public.topics;
CREATE POLICY "Anyone can view active topics" ON public.topics
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;
CREATE POLICY "Admins can manage topics" ON public.topics
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 5. EXAM_SUBJECTS JUNCTION TABLE
-- =====================================================
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active exam_subjects" ON public.exam_subjects;
CREATE POLICY "Anyone can view active exam_subjects" ON public.exam_subjects
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage exam_subjects" ON public.exam_subjects;
CREATE POLICY "Admins can manage exam_subjects" ON public.exam_subjects
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 6. EXAM_TOPICS JUNCTION TABLE
-- =====================================================
ALTER TABLE public.exam_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active exam_topics" ON public.exam_topics;
CREATE POLICY "Anyone can view active exam_topics" ON public.exam_topics
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage exam_topics" ON public.exam_topics;
CREATE POLICY "Admins can manage exam_topics" ON public.exam_topics
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 7. TOPIC_RESOURCES TABLE (CRITICAL - PREMIUM LOGIC)
-- =====================================================
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view approved non-premium resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Subscribers can view premium resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Users can view own contributed resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Users can insert own resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.topic_resources;

-- Public: can only see approved, active, NON-premium resources
CREATE POLICY "Anyone can view approved non-premium resources" ON public.topic_resources
  FOR SELECT USING (
    is_active = true 
    AND admin_approved = true 
    AND (is_premium = false OR is_premium IS NULL)
  );

-- Premium subscribers: can also see premium resources
CREATE POLICY "Subscribers can view premium resources" ON public.topic_resources
  FOR SELECT TO authenticated USING (
    is_active = true 
    AND admin_approved = true 
    AND is_premium = true
    AND public.has_active_subscription(auth.uid())
  );

-- Users can always see their own contributed resources (pending or approved)
CREATE POLICY "Users can view own contributed resources" ON public.topic_resources
  FOR SELECT TO authenticated USING (
    contributed_by_user_id = auth.uid()
  );

-- Authenticated users can contribute resources
CREATE POLICY "Users can insert own resources" ON public.topic_resources
  FOR INSERT TO authenticated WITH CHECK (
    contributed_by_user_id = auth.uid()
    AND is_user_contributed = true
    AND admin_approved = false
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all resources" ON public.topic_resources
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 8. RESOURCE_RATINGS TABLE
-- =====================================================
ALTER TABLE public.resource_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.resource_ratings;
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.resource_ratings;

CREATE POLICY "Anyone can view ratings" ON public.resource_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.resource_ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON public.resource_ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ratings" ON public.resource_ratings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 9. USER_RESOURCE_BOOKMARKS TABLE
-- =====================================================
ALTER TABLE public.user_resource_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.user_resource_bookmarks;

CREATE POLICY "Users can view own bookmarks" ON public.user_resource_bookmarks
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bookmarks" ON public.user_resource_bookmarks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks" ON public.user_resource_bookmarks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 10. RESOURCE_VOTES TABLE
-- =====================================================
ALTER TABLE public.resource_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON public.resource_votes;
DROP POLICY IF EXISTS "Users can manage own votes" ON public.resource_votes;

CREATE POLICY "Anyone can view votes" ON public.resource_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON public.resource_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own votes" ON public.resource_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 11. USER_EXAM_ENROLLMENTS TABLE
-- =====================================================
ALTER TABLE public.user_exam_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.user_exam_enrollments;

CREATE POLICY "Users can view own enrollments" ON public.user_exam_enrollments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own enrollments" ON public.user_exam_enrollments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments" ON public.user_exam_enrollments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Admin override (from file 28)
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.user_exam_enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.user_exam_enrollments
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 12. USER_EXAM_PROGRESS TABLE
-- =====================================================
ALTER TABLE public.user_exam_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Users can upsert own progress" ON public.user_exam_progress;

CREATE POLICY "Users can view own progress" ON public.user_exam_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress" ON public.user_exam_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON public.user_exam_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 13. TOPIC_DIFFICULTY_RATINGS TABLE
-- =====================================================
ALTER TABLE public.topic_difficulty_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view difficulty ratings" ON public.topic_difficulty_ratings;
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.topic_difficulty_ratings;

CREATE POLICY "Anyone can view difficulty ratings" ON public.topic_difficulty_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can upsert own difficulty ratings" ON public.topic_difficulty_ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own difficulty ratings" ON public.topic_difficulty_ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 14. USER_FEEDBACK TABLE
-- =====================================================
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;

CREATE POLICY "Users can view own feedback" ON public.user_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feedback" ON public.user_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage feedback" ON public.user_feedback
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 15. POMODORO_SESSIONS TABLE
-- =====================================================
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pomodoro sessions" ON public.pomodoro_sessions;

CREATE POLICY "Users can view own pomodoro sessions" ON public.pomodoro_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pomodoro sessions" ON public.pomodoro_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pomodoro sessions" ON public.pomodoro_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =====================================================
-- 16. EXAM_REQUESTS TABLE
-- =====================================================
ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can insert requests" ON public.exam_requests;

CREATE POLICY "Users can view own requests" ON public.exam_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert requests" ON public.exam_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage requests" ON public.exam_requests
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 17. ACCOUNT_DELETION_REQUESTS TABLE
-- =====================================================
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Anyone can insert deletion requests" ON public.account_deletion_requests;

CREATE POLICY "Users can view own deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert deletion requests" ON public.account_deletion_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage deletion requests" ON public.account_deletion_requests
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- 18. PRICING_OFFERS TABLE
-- =====================================================
ALTER TABLE public.pricing_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active offers" ON public.pricing_offers;

CREATE POLICY "Anyone can view active offers" ON public.pricing_offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage offers" ON public.pricing_offers
  FOR ALL USING (public.is_admin(auth.uid()));

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.has_active_subscription(uuid) IS 'Check if user has an active, non-expired subscription - SECURITY DEFINER to bypass RLS';
