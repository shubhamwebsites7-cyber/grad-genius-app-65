-- ============================================================
-- ADMIN SETUP SQL SCRIPT
-- ============================================================
-- Run these SQL commands in your Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query
-- ============================================================

-- ============================================================
-- 1. CREATE ROLE ENUM TYPE
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================================
-- 2. CREATE USER ROLES TABLE
-- ============================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE RLS POLICIES FOR USER_ROLES TABLE
-- ============================================================

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert new roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. CREATE SECURITY DEFINER FUNCTION (CRITICAL!)
-- This function prevents RLS recursion issues
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================================
-- 6. GRANT EXECUTE PERMISSIONS ON has_role FUNCTION
-- This is CRITICAL for the function to work properly
-- ============================================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;

-- ============================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ============================================================
-- 8. ASSIGN ADMIN ROLE TO YOUR USER
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID in: Authentication -> Users
-- ============================================================

-- UNCOMMENT AND REPLACE THE USER ID BELOW:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin');

-- For your specific user ID:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('c5247f86-29b0-446b-a976-25309a61975c', 'admin');

-- ============================================================
-- 9. VERIFICATION QUERIES
-- Run these to verify everything is set up correctly
-- ============================================================

-- Check if the enum was created
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'app_role';

-- Check if the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- Check if the function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'has_role';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Test the has_role function (replace with your user ID)
-- SELECT public.has_role('YOUR_USER_ID_HERE'::uuid, 'admin'::app_role);

-- View all user roles
SELECT ur.id, ur.user_id, ur.role, ur.created_at, u.email
FROM public.user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id;

-- ============================================================
-- 10. TROUBLESHOOTING
-- ============================================================

-- If you get "infinite recursion" errors, make sure:
-- 1. The has_role function has SECURITY DEFINER
-- 2. The function is used in policies, not direct table queries
-- 3. The GRANT EXECUTE commands were run

-- If you get "permission denied" errors:
-- 1. Run the GRANT EXECUTE commands again
-- 2. Make sure RLS is enabled on user_roles
-- 3. Verify the user_roles policies exist

-- If admin dashboard shows "Access Denied":
-- 1. Verify your user ID matches the one in user_roles
-- 2. Test: SELECT public.has_role(auth.uid(), 'admin');
-- 3. Check browser console for errors
-- 4. Make sure you're logged in with the correct account

-- ============================================================
-- COMPLETE! 
-- ============================================================
-- Next steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Uncomment and update the INSERT statement in section 8
-- 3. Run the verification queries in section 9
-- 4. Log in to your app and navigate to /admin-dashboard
-- ============================================================
