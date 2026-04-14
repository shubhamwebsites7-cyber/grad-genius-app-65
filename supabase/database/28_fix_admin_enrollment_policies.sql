-- =====================================================
-- FIX: Admin RLS policies for enrollment-related tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Ensure is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = user_uuid
      AND role = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- =====================================================
-- USER_EXAM_ENROLLMENTS - Enable RLS + Fix policies
-- =====================================================
ALTER TABLE public.user_exam_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on this table to start clean
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can access own data" ON public.user_exam_enrollments;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
ON public.user_exam_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own enrollments
CREATE POLICY "Users can insert own enrollments"
ON public.user_exam_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments
CREATE POLICY "Users can update own enrollments"
ON public.user_exam_enrollments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view ALL enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.user_exam_enrollments FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- USER_EXAM_PROGRESS - Enable RLS + Fix policies
-- =====================================================
ALTER TABLE public.user_exam_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.user_exam_progress;
DROP POLICY IF EXISTS "Users can access own data" ON public.user_exam_progress;

CREATE POLICY "Users can view own progress"
ON public.user_exam_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.user_exam_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_exam_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON public.user_exam_progress FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- TOPIC_RESOURCES - Admin can see ALL (including unapproved)
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.topic_resources;
DROP POLICY IF EXISTS "Admins can view all resources" ON public.topic_resources;

CREATE POLICY "Admins can view all resources"
ON public.topic_resources FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all resources"
ON public.topic_resources FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- USER_FEEDBACK - Admin can see all feedback
-- =====================================================
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can access own data" ON public.user_feedback;

CREATE POLICY "Users can view own feedback"
ON public.user_feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
ON public.user_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.user_feedback FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- PAYMENTS - Admin can see all payments
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- USER_SUBSCRIPTIONS - Admin can see all subscriptions
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- VERIFICATION: Check all policies are in place
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN (
  'user_exam_enrollments', 
  'user_exam_progress', 
  'topic_resources', 
  'user_feedback',
  'payments',
  'user_subscriptions'
)
ORDER BY tablename, policyname;
