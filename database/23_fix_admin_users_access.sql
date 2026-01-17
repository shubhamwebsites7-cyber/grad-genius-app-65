-- =====================================================
-- FIX ADMIN ACCESS TO USERS TABLE
-- =====================================================
-- This migration fixes the admin access to view all users
-- by creating a SECURITY DEFINER function to avoid RLS recursion

-- =====================================================
-- CREATE SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- =====================================================
-- This function checks if a user has a specific role
-- Using SECURITY DEFINER to bypass RLS on user_roles table

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- =====================================================
-- DROP EXISTING ADMIN POLICIES ON USERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- =====================================================
-- CREATE NEW ADMIN POLICIES USING SECURITY DEFINER FUNCTION
-- =====================================================

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = id  -- Users can always see themselves
    OR public.has_role(auth.uid(), 'admin')  -- Admins can see everyone
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id  -- Users can update themselves
    OR public.has_role(auth.uid(), 'admin')  -- Admins can update everyone
  );

-- =====================================================
-- ENABLE RLS ON user_roles IF NOT ALREADY ENABLED
-- =====================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow the has_role function to read user_roles (via SECURITY DEFINER)
-- But users should only see their own roles directly
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- DROP OLD USER-ONLY POLICIES (they're now combined above)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.has_role IS 'Check if a user has a specific role - uses SECURITY DEFINER to bypass RLS';
