-- =====================================================
-- USER MANAGEMENT & AUTHENTICATION TABLES
-- =====================================================
-- These tables extend Supabase auth with additional user management
-- features including roles, sessions, and user preferences.

-- =====================================================
-- USER ROLES ENUM TYPE
-- =====================================================
-- Define custom enum type for user roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'premium_user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Comments for enum
COMMENT ON TYPE public.app_role IS 'Application user roles: admin, moderator, user, premium_user';

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
-- Assigns roles to users for access control
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';
COMMENT ON COLUMN public.user_roles.role IS 'User role: admin, moderator, user, premium_user';

-- =====================================================
-- USER SESSIONS TABLE (Enhanced)
-- =====================================================
-- Manages user session tokens with enhanced security features
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token character varying(255) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  ip_address inet NULL,
  user_agent text NULL,
  device_info jsonb NULL,
  is_active boolean NULL DEFAULT true,
  last_activity_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_session_token_key UNIQUE (session_token),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
ON public.user_sessions USING btree (session_token) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON public.user_sessions USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
ON public.user_sessions USING btree (expires_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
ON public.user_sessions USING btree (user_id, expires_at) 
WHERE is_active = true TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_sessions IS 'Enhanced user session management with device tracking';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique session token for authentication';
COMMENT ON COLUMN public.user_sessions.device_info IS 'JSON object with device information';
COMMENT ON COLUMN public.user_sessions.is_active IS 'Whether session is currently active';
COMMENT ON COLUMN public.user_sessions.last_activity_at IS 'Last activity timestamp for session';

-- =====================================================
-- USER PREFERENCES TABLE
-- =====================================================
-- Stores user preferences and settings
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_settings jsonb NULL DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "study_reminders": true,
    "progress_updates": true
  }'::jsonb,
  theme_preference character varying(20) NULL DEFAULT 'system',
  language_preference character varying(10) NULL DEFAULT 'en',
  timezone character varying(50) NULL DEFAULT 'UTC',
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_preferences_theme_check CHECK (
    theme_preference IN ('light', 'dark', 'system')
  )
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON public.user_preferences USING btree (user_id) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at 
BEFORE UPDATE ON user_preferences 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.user_preferences IS 'User preferences and settings';
COMMENT ON COLUMN public.user_preferences.preferences IS 'General user preferences as JSON';
COMMENT ON COLUMN public.user_preferences.notification_settings IS 'Notification preferences';
COMMENT ON COLUMN public.user_preferences.theme_preference IS 'UI theme: light, dark, system';
COMMENT ON COLUMN public.user_preferences.language_preference IS 'Preferred language code';
COMMENT ON COLUMN public.user_preferences.timezone IS 'User timezone for scheduling';

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
-- Extended user profile information
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name character varying(100) NULL,
  bio text NULL,
  avatar_url character varying(500) NULL,
  phone_number character varying(20) NULL,
  date_of_birth date NULL,
  education_level character varying(50) NULL,
  target_exams text[] NULL DEFAULT ARRAY[]::text[],
  study_goals jsonb NULL,
  is_profile_public boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_profiles_target_exams 
ON public.user_profiles USING gin (target_exams) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.user_profiles.display_name IS 'User display name (different from auth name)';
COMMENT ON COLUMN public.user_profiles.target_exams IS 'Array of exam IDs user is targeting';
COMMENT ON COLUMN public.user_profiles.study_goals IS 'JSON object with study goals and targets';
COMMENT ON COLUMN public.user_profiles.is_profile_public IS 'Whether profile is visible to other users';

-- =====================================================
-- USER ACTIVITY LOG TABLE
-- =====================================================
-- Tracks user activities for analytics and debugging
CREATE TABLE public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type character varying(50) NOT NULL,
  activity_data jsonb NULL,
  ip_address inet NULL,
  user_agent text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id 
ON public.user_activity_log USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at 
ON public.user_activity_log USING btree (created_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type 
ON public.user_activity_log USING btree (activity_type) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_activity_log IS 'User activity tracking for analytics';
COMMENT ON COLUMN public.user_activity_log.activity_type IS 'Type of activity (login, study, payment, etc.)';
COMMENT ON COLUMN public.user_activity_log.activity_data IS 'Additional activity data as JSON';

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS public.app_role AS $$
DECLARE
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role
  FROM user_roles 
  WHERE user_id = user_uuid 
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'premium_user' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user'::public.app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION has_premium_access(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user has active subscription
  RETURN EXISTS(
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND us.expires_at > now()
    AND sp.name != 'Free Plan'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_uuid uuid,
  activity_type_param character varying(50),
  activity_data_param jsonb DEFAULT NULL,
  ip_address_param inet DEFAULT NULL,
  user_agent_param text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO user_activity_log (
    user_id, 
    activity_type, 
    activity_data, 
    ip_address, 
    user_agent
  ) VALUES (
    user_uuid,
    activity_type_param,
    activity_data_param,
    ip_address_param,
    user_agent_param
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO user_activity_log (user_id, activity_type, activity_data)
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'session_cleanup',
    jsonb_build_object('deleted_sessions', deleted_count);
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user-related tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable" ON public.user_profiles
  FOR SELECT USING (is_profile_public = true);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- User activity log policies
CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (for users with admin role)
CREATE POLICY "Admins can view all data" ON public.user_activity_log
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Note: Sample data for users should be created through Supabase Auth
-- This is just for reference on how roles would be assigned

/*
-- Example: Assign admin role to a user (replace with actual user ID)
INSERT INTO public.user_roles (user_id, role) VALUES
('00000000-0000-0000-0000-000000000000', 'admin');

-- Example: Create user preferences
INSERT INTO public.user_preferences (user_id, preferences, theme_preference) VALUES
('00000000-0000-0000-0000-000000000000', 
 '{"study_hours_per_day": 4, "preferred_study_time": "morning"}',
 'dark');

-- Example: Create user profile
INSERT INTO public.user_profiles (user_id, display_name, education_level, target_exams) VALUES
('00000000-0000-0000-0000-000000000000',
 'John Doe',
 'undergraduate',
 ARRAY['JEE_MAIN', 'JEE_ADVANCED']);
*/
