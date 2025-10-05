-- ============================================================
-- SUPABASE DATABASE SETUP INSTRUCTIONS
-- ============================================================
-- Run these SQL commands in your Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query
-- ============================================================

-- 1. CREATE USER SYNC TRIGGER
-- This trigger automatically creates a user record in public.users 
-- when a new user signs up via Supabase Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    auth_provider, 
    auth_provider_id, 
    is_email_verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'email',
    NEW.id::text,
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON USERS TABLE
-- This ensures users can only access their own data
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- 3. CREATE USER ROLES SYSTEM (OPTIONAL - For Admin Access)
-- This creates a role-based access control system
-- ============================================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
-- This function is critical for preventing RLS recursion issues
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
-- 4. ASSIGN ADMIN ROLE TO YOUR USER (OPTIONAL)
-- Replace 'your-user-id-here' with your actual user ID
-- You can find your user ID in: Authentication -> Users
-- ============================================================

-- Example: Uncomment and replace the UUID with your actual user ID
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'admin');


-- ============================================================
-- 5. UPDATE RLS POLICIES FOR OTHER TABLES (IMPORTANT!)
-- Add RLS policies to secure your other tables
-- Below are examples - customize based on your needs
-- ============================================================

-- Example: user_exam_enrollments
ALTER TABLE public.user_exam_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enrollments"
  ON public.user_exam_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
  ON public.user_exam_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Example: user_exam_progress
ALTER TABLE public.user_exam_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.user_exam_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_exam_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_exam_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Example: Admin can read all data (optional)
CREATE POLICY "Admins can read all progress"
  ON public.user_exam_progress FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 6. NEXT STEPS
-- ============================================================
-- 1. Run all the SQL commands above in your Supabase SQL Editor
-- 2. Go to Authentication -> URL Configuration and set:
--    - Site URL: Your app's URL (e.g., https://yourapp.lovable.app)
--    - Redirect URLs: Add your app URL + any preview URLs
-- 3. (Optional) Disable email confirmation for testing:
--    Authentication -> Settings -> Enable email confirmations = OFF
-- 4. Test signup and login functionality
-- 5. Check that user records are created in both auth.users and public.users
-- ============================================================
