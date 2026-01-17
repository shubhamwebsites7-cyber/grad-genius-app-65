-- =====================================================
-- ADMIN RLS POLICIES FOR USERS TABLE
-- =====================================================
-- Allow admins to view and manage all users
-- Uses the user_roles table to check admin status

-- Create a security definer function to check if user is admin
-- This prevents recursive RLS issues
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view contributor names" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy for admins to view ALL users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for admins to update all users
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- USER_SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;

-- Policy for admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- USER_EXAM_ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Drop existing admin policy if exists
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.user_exam_enrollments;

-- Policy for admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.user_exam_enrollments FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Check if user has admin role - uses SECURITY DEFINER to bypass RLS';
COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Users can view their own profile data';
COMMENT ON POLICY "Admins can view all users" ON public.users IS 'Admins can view all user profiles';
COMMENT ON POLICY "Users can update own profile" ON public.users IS 'Users can update their own profile';
COMMENT ON POLICY "Admins can update all users" ON public.users IS 'Admins can update any user profile';
