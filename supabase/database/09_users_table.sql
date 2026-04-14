-- =====================================================
-- USERS TABLE (EXTENDS SUPABASE AUTH)
-- =====================================================
-- This table extends Supabase auth.users with additional user information
-- and provides a bridge between auth.users and application-specific data.

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Extended user information that complements Supabase auth.users
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NULL,
  full_name character varying NOT NULL,
  avatar_url character varying NULL,
  country_code character varying DEFAULT 'US'::character varying,
  timezone character varying DEFAULT 'UTC'::character varying,
  is_email_verified boolean DEFAULT false,
  auth_provider character varying DEFAULT 'email'::character varying,
  auth_provider_id character varying NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone NULL,
  is_active boolean DEFAULT true,
  phone_number character varying NULL,
  
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email 
ON public.users USING btree (email) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_country_code 
ON public.users USING btree (country_code) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_auth_provider 
ON public.users USING btree (auth_provider) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON public.users USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON public.users USING btree (created_at DESC) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Extended user information that complements Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'References auth.users.id - same UUID';
COMMENT ON COLUMN public.users.email IS 'User email address (synced with auth.users)';
COMMENT ON COLUMN public.users.password_hash IS 'Password hash (managed by Supabase Auth)';
COMMENT ON COLUMN public.users.full_name IS 'User full display name';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile picture';
COMMENT ON COLUMN public.users.country_code IS 'ISO country code for localization';
COMMENT ON COLUMN public.users.timezone IS 'User timezone for scheduling';
COMMENT ON COLUMN public.users.is_email_verified IS 'Whether email is verified';
COMMENT ON COLUMN public.users.auth_provider IS 'Authentication provider (email, google, github, etc.)';
COMMENT ON COLUMN public.users.auth_provider_id IS 'Provider-specific user ID';
COMMENT ON COLUMN public.users.last_login_at IS 'Last login timestamp';
COMMENT ON COLUMN public.users.is_active IS 'Whether user account is active';
COMMENT ON COLUMN public.users.phone_number IS 'User phone number for notifications';

-- =====================================================
-- USER SYNC FUNCTIONS
-- =====================================================

-- Function to sync user data from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in public.users when auth.users changes
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    avatar_url,
    is_email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at IS NOT NULL,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', users.full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', users.avatar_url),
    is_email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NEW.updated_at,
    last_login_at = CASE 
      WHEN NEW.last_sign_in_at > OLD.last_sign_in_at THEN NEW.last_sign_in_at
      ELSE users.last_login_at
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth.users changes to public.users
CREATE TRIGGER sync_user_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_from_auth();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete: mark as inactive instead of hard delete
  UPDATE public.users 
  SET is_active = false, updated_at = now()
  WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion (soft delete)
CREATE TRIGGER handle_user_deletion_trigger
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get user profile with auth data
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  email character varying,
  full_name character varying,
  avatar_url character varying,
  country_code character varying,
  timezone character varying,
  is_email_verified boolean,
  auth_provider character varying,
  created_at timestamp with time zone,
  last_login_at timestamp with time zone,
  is_active boolean,
  phone_number character varying,
  user_role public.app_role,
  has_premium boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.country_code,
    u.timezone,
    u.is_email_verified,
    u.auth_provider,
    u.created_at,
    u.last_login_at,
    u.is_active,
    u.phone_number,
    get_user_role(u.id) as user_role,
    has_premium_access(u.id) as has_premium
  FROM public.users u
  WHERE u.id = user_uuid AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_uuid uuid,
  new_full_name character varying DEFAULT NULL,
  new_avatar_url character varying DEFAULT NULL,
  new_country_code character varying DEFAULT NULL,
  new_timezone character varying DEFAULT NULL,
  new_phone_number character varying DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.users 
  SET 
    full_name = COALESCE(new_full_name, full_name),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    country_code = COALESCE(new_country_code, country_code),
    timezone = COALESCE(new_timezone, timezone),
    phone_number = COALESCE(new_phone_number, phone_number),
    updated_at = now()
  WHERE id = user_uuid AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(user_uuid uuid)
RETURNS TABLE(
  total_enrollments bigint,
  active_enrollments bigint,
  completed_topics bigint,
  total_study_time_minutes bigint,
  study_streak_days integer,
  avg_progress_percentage numeric,
  total_bookmarks bigint,
  total_ratings bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uee.exam_id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN uee.is_active THEN uee.exam_id END) as active_enrollments,
    COUNT(DISTINCT CASE WHEN utp.is_completed THEN utp.topic_id END) as completed_topics,
    COALESCE(SUM(utp.time_spent_minutes), 0) as total_study_time_minutes,
    get_user_study_streak(user_uuid) as study_streak_days,
    COALESCE(AVG(uep.progress_percentage), 0) as avg_progress_percentage,
    COUNT(DISTINCT urb.resource_id) as total_bookmarks,
    COUNT(DISTINCT rr.id) as total_ratings
  FROM public.users u
  LEFT JOIN user_exam_enrollments uee ON u.id = uee.user_id
  LEFT JOIN user_exam_progress uep ON u.id = uep.user_id
  LEFT JOIN user_topic_progress utp ON u.id = utp.user_id
  LEFT JOIN user_resource_bookmarks urb ON u.id = urb.user_id
  LEFT JOIN resource_ratings rr ON u.id = rr.user_id
  WHERE u.id = user_uuid AND u.is_active = true
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Public profiles can be viewed by anyone (if we add this feature later)
-- CREATE POLICY "Public profiles viewable" ON public.users
--   FOR SELECT USING (is_profile_public = true);

-- =====================================================
-- SAMPLE DATA SYNC
-- =====================================================

-- Sync existing auth.users to public.users (run once after setup)
-- INSERT INTO public.users (id, email, full_name, is_email_verified, created_at, updated_at)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
--   email_confirmed_at IS NOT NULL as is_email_verified,
--   created_at,
--   updated_at
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION sync_user_from_auth() IS 'Automatically sync user data from auth.users to public.users';
COMMENT ON FUNCTION get_user_profile(uuid) IS 'Get complete user profile with role and subscription info';
COMMENT ON FUNCTION update_user_profile(uuid, character varying, character varying, character varying, character varying, character varying) IS 'Update user profile information';
COMMENT ON FUNCTION get_user_statistics(uuid) IS 'Get comprehensive user statistics and progress data';
