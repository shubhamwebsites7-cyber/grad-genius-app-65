-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================
-- These tables provide the foundation for the Examtrakr application
-- including application settings, user roles, and session management.

-- =====================================================
-- APP SETTINGS TABLE
-- =====================================================
-- Stores application-wide configuration settings
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key character varying(100) NOT NULL,
  setting_value jsonb NOT NULL,
  description text NULL,
  is_public boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT app_settings_pkey PRIMARY KEY (id),
  CONSTRAINT app_settings_setting_key_key UNIQUE (setting_key)
) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.app_settings IS 'Application-wide configuration settings';
COMMENT ON COLUMN public.app_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.app_settings.setting_value IS 'JSON value of the setting';
COMMENT ON COLUMN public.app_settings.is_public IS 'Whether setting can be accessed by frontend';

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
-- Manages user role assignments (admin, user, etc.)
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
COMMENT ON COLUMN public.user_roles.role IS 'Role type (admin, user, moderator, etc.)';

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================
-- Manages user session tokens for enhanced security
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token character varying(255) NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  ip_address inet NULL,
  user_agent text NULL,
  
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
ON public.user_sessions USING btree (user_id, expires_at) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_sessions IS 'User session management for enhanced security';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique session token for authentication';
COMMENT ON COLUMN public.user_sessions.expires_at IS 'When the session expires';
COMMENT ON COLUMN public.user_sessions.ip_address IS 'IP address of the session';
COMMENT ON COLUMN public.user_sessions.user_agent IS 'Browser user agent string';

-- =====================================================
-- EXAM REQUESTS TABLE
-- =====================================================
-- Stores user requests for new exams to be added
CREATE TABLE public.exam_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exam_name character varying(100) NOT NULL,
  exam_type character varying(50) NOT NULL,
  reason text NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT exam_requests_pkey PRIMARY KEY (id),
  CONSTRAINT exam_requests_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT exam_requests_status_check CHECK (
    status = ANY (ARRAY[
      'pending'::text,
      'approved'::text,
      'rejected'::text,
      'implemented'::text
    ])
  )
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exam_requests_user_id 
ON public.exam_requests USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_exam_requests_status 
ON public.exam_requests USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_exam_requests_created_at 
ON public.exam_requests USING btree (created_at DESC) TABLESPACE pg_default;

-- Trigger for updated_at
CREATE TRIGGER exam_requests_updated_at 
BEFORE UPDATE ON exam_requests 
FOR EACH ROW 
EXECUTE FUNCTION update_exam_requests_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.exam_requests IS 'User requests for new exams to be added';
COMMENT ON COLUMN public.exam_requests.exam_name IS 'Requested exam name';
COMMENT ON COLUMN public.exam_requests.exam_type IS 'Type of exam requested';
COMMENT ON COLUMN public.exam_requests.status IS 'Request status (pending, approved, rejected, implemented)';
COMMENT ON COLUMN public.exam_requests.admin_notes IS 'Admin notes on the request';

-- =====================================================
-- USER FEEDBACK TABLE
-- =====================================================
-- Collects user feedback about the application
CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  helpfulness text NOT NULL,
  ease_of_use text NOT NULL,
  design_speed text NOT NULL,
  recommendation text NOT NULL,
  pricing_preference text NOT NULL,
  improvement_suggestion text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  user_email text NULL,
  user_name text NULL,
  
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_user_id_key UNIQUE (user_id),
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  
  -- Check constraints for enum values
  CONSTRAINT user_feedback_helpfulness_check CHECK (
    helpfulness = ANY (ARRAY[
      'very_helpful'::text,
      'somewhat_helpful'::text,
      'neutral'::text,
      'not_helpful'::text
    ])
  ),
  CONSTRAINT user_feedback_ease_of_use_check CHECK (
    ease_of_use = ANY (ARRAY[
      'very_easy'::text,
      'easy'::text,
      'average'::text,
      'difficult'::text
    ])
  ),
  CONSTRAINT user_feedback_design_speed_check CHECK (
    design_speed = ANY (ARRAY[
      'yes_great'::text,
      'okay'::text,
      'needs_improvement'::text
    ])
  ),
  CONSTRAINT user_feedback_recommendation_check CHECK (
    recommendation = ANY (ARRAY[
      'definitely'::text,
      'maybe'::text,
      'no'::text
    ])
  ),
  CONSTRAINT user_feedback_pricing_preference_check CHECK (
    pricing_preference = ANY (ARRAY[
      '0'::text,
      '79'::text,
      '89'::text,
      '99+'::text
    ])
  )
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id 
ON public.user_feedback USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at 
ON public.user_feedback USING btree (created_at DESC) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_feedback IS 'User feedback collection for application improvement';
COMMENT ON COLUMN public.user_feedback.helpfulness IS 'How helpful user finds the application';
COMMENT ON COLUMN public.user_feedback.ease_of_use IS 'How easy the application is to use';
COMMENT ON COLUMN public.user_feedback.design_speed IS 'Feedback on design and speed';
COMMENT ON COLUMN public.user_feedback.recommendation IS 'Would user recommend to others';
COMMENT ON COLUMN public.user_feedback.pricing_preference IS 'User pricing preference';
COMMENT ON COLUMN public.user_feedback.improvement_suggestion IS 'User suggestions for improvement';
