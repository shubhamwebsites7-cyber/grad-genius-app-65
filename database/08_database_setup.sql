-- =====================================================
-- EXAMTRAKR DATABASE COMPLETE SETUP SCRIPT
-- =====================================================
-- This script sets up the complete Examtrakr database schema
-- Run this script in order after setting up Supabase project

-- =====================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location-based features (if needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pg_cron for scheduled tasks (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- STEP 2: CREATE CUSTOM TYPES
-- =====================================================

-- Create app_role enum type
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'premium_user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 3: CREATE CORE UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at column (used by triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update exam requests updated_at
CREATE OR REPLACE FUNCTION update_exam_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce user subscription update rules
CREATE OR REPLACE FUNCTION enforce_user_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing user_id after creation
  IF OLD.user_id != NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id of existing subscription';
  END IF;
  
  -- Prevent changing plan_id for active subscriptions
  IF OLD.plan_id != NEW.plan_id AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot change plan_id of active subscription';
  END IF;
  
  -- Auto-update updated_at
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: DEPLOYMENT ORDER
-- =====================================================

-- The following files should be executed in this order:
-- 1. 01_core_tables.sql          - Core system tables
-- 2. 02_subscription_system.sql  - Payment and subscription tables  
-- 3. 03_exam_structure.sql       - Exam hierarchy tables
-- 4. 04_progress_tracking.sql    - User progress tables
-- 5. 05_resources_system.sql     - Learning resources tables
-- 6. 06_user_management.sql      - User management tables
-- 7. 07_database_functions.sql   - Utility functions
-- 8. 09_users_table.sql          - Extended users table (bridges auth.users)

-- =====================================================
-- STEP 5: POST-SETUP CONFIGURATION
-- =====================================================

-- Enable Row Level Security on all user-facing tables
DO $$
DECLARE
  table_name text;
  tables_to_secure text[] := ARRAY[
    'users',
    'user_subscriptions',
    'payments', 
    'user_exam_enrollments',
    'user_exam_progress',
    'user_subject_progress', 
    'user_topic_progress',
    'topic_difficulty_ratings',
    'resource_ratings',
    'user_resource_bookmarks',
    'user_preferences',
    'user_profiles',
    'user_sessions',
    'user_activity_log',
    'user_feedback',
    'exam_requests'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_secure
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- =====================================================
-- STEP 6: CREATE BASIC RLS POLICIES
-- =====================================================

-- Users can only access their own data
DO $$
DECLARE
  table_name text;
  user_tables text[] := ARRAY[
    'users',
    'user_subscriptions',
    'payments',
    'user_exam_enrollments', 
    'user_exam_progress',
    'user_subject_progress',
    'user_topic_progress',
    'user_resource_bookmarks',
    'user_preferences',
    'user_profiles',
    'user_sessions',
    'user_activity_log',
    'user_feedback',
    'exam_requests'
  ];
BEGIN
  FOREACH table_name IN ARRAY user_tables
  LOOP
    -- Policy for users to access their own data
    EXECUTE format('
      CREATE POLICY "Users can access own data" ON public.%I
      FOR ALL USING (auth.uid() = user_id)
    ', table_name);
    
    -- Policy for admins to access all data
    EXECUTE format('
      CREATE POLICY "Admins can access all data" ON public.%I
      FOR ALL USING (
        EXISTS(
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = ''admin''
        )
      )
    ', table_name);
  END LOOP;
END $$;

-- Special policies for ratings (users can view all, but only edit their own)
CREATE POLICY "Users can view all ratings" ON public.resource_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own ratings" ON public.resource_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.resource_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.resource_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_payments_status_created 
ON public.payments (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_status 
ON public.user_subscriptions (expires_at, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_topic_progress_completed 
ON public.user_topic_progress (is_completed, completed_at) 
WHERE is_completed = true;

CREATE INDEX IF NOT EXISTS idx_activity_log_type_date 
ON public.user_activity_log (activity_type, created_at DESC);

-- =====================================================
-- STEP 8: CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active user subscriptions with plan details
CREATE OR REPLACE VIEW active_user_subscriptions AS
SELECT 
  us.*,
  sp.name as plan_name,
  sp.description as plan_description,
  sp.features as plan_features,
  pp.price,
  pp.currency,
  pp.original_price,
  pp.discount_percentage
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN plan_pricing pp ON sp.id = pp.plan_id AND pp.country_code = 'IN' AND pp.is_active = true
WHERE us.status = 'active' 
AND us.expires_at > now();

-- View for user exam progress with exam details
CREATE OR REPLACE VIEW user_exam_progress_detailed AS
SELECT 
  uep.*,
  e.name as exam_name,
  e.full_name as exam_full_name,
  ec.name as category_name,
  uee.enrolled_at,
  uee.target_exam_date
FROM user_exam_progress uep
JOIN exams e ON uep.exam_id = e.id
LEFT JOIN exam_categories ec ON e.category_id = ec.id
LEFT JOIN user_exam_enrollments uee ON uep.user_id = uee.user_id AND uep.exam_id = uee.exam_id
WHERE uee.is_active = true;

-- View for topic resources with ratings
CREATE OR REPLACE VIEW topic_resources_with_ratings AS
SELECT 
  tr.*,
  t.name as topic_name,
  s.name as subject_name,
  e.name as exam_name,
  COALESCE(ROUND(AVG(rr.rating::numeric), 2), 0) as avg_rating,
  COUNT(rr.id) as total_ratings,
  COUNT(urb.id) as bookmark_count
FROM topic_resources tr
JOIN topics t ON tr.topic_id = t.id
JOIN subjects s ON t.subject_id = s.id
JOIN exams e ON s.exam_id = e.id
LEFT JOIN resource_ratings rr ON tr.id = rr.resource_id
LEFT JOIN user_resource_bookmarks urb ON tr.id = urb.resource_id
WHERE tr.is_active = true
GROUP BY tr.id, t.name, s.name, e.name;

-- =====================================================
-- STEP 9: SETUP SCHEDULED TASKS (if pg_cron available)
-- =====================================================

-- Schedule daily maintenance at 2 AM
-- SELECT cron.schedule('daily-maintenance', '0 2 * * *', 'SELECT run_daily_maintenance();');

-- Schedule session cleanup every hour
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- =====================================================
-- STEP 10: INSERT INITIAL DATA
-- =====================================================

-- Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', '"Examtrakr"', 'Application name', true),
('app_version', '"1.0.0"', 'Current application version', true),
('maintenance_mode', 'false', 'Whether app is in maintenance mode', false),
('max_free_enrollments', '1', 'Maximum exam enrollments for free users', false),
('session_timeout_hours', '24', 'Session timeout in hours', false),
('enable_user_contributions', 'true', 'Allow users to contribute resources', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default exam categories
INSERT INTO public.exam_categories (name, description, icon, color, is_active) VALUES
('Engineering Entrance', 'Engineering entrance exams like JEE, BITSAT', 'engineering', '#3B82F6', true),
('Medical Entrance', 'Medical entrance exams like NEET, AIIMS', 'medical', '#EF4444', true),
('Government Jobs', 'Government job exams like SSC, UPSC', 'government', '#10B981', true),
('Banking & Finance', 'Banking sector exams like IBPS, SBI', 'banking', '#F59E0B', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, duration_months, features, is_popular, is_active) VALUES
('Free Plan', 'Limited access to basic features', 0, '["1 exam enrollment", "Basic resources", "Limited progress tracking"]', false, true),
('Monthly Pro', 'Full access to all exams and resources', 1, '["Unlimited exam access", "All premium resources", "Progress tracking", "Mobile app access"]', false, true),
('Yearly Premium', 'Best value - Full access for 12 months', 12, '["Unlimited exam access", "All premium resources", "Progress tracking", "Mobile app access", "Priority support", "Offline downloads"]', true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert pricing for Indian market
INSERT INTO public.plan_pricing (plan_id, country_code, currency, price, original_price, discount_percentage, is_active) 
SELECT 
  sp.id,
  'IN',
  'INR',
  CASE 
    WHEN sp.name = 'Free Plan' THEN 0.00
    WHEN sp.name = 'Monthly Pro' THEN 89.00
    WHEN sp.name = 'Yearly Premium' THEN 179.00
  END,
  CASE 
    WHEN sp.name = 'Free Plan' THEN NULL
    WHEN sp.name = 'Monthly Pro' THEN 99.00
    WHEN sp.name = 'Yearly Premium' THEN 999.00
  END,
  CASE 
    WHEN sp.name = 'Free Plan' THEN 0
    WHEN sp.name = 'Monthly Pro' THEN 10
    WHEN sp.name = 'Yearly Premium' THEN 82
  END,
  true
FROM public.subscription_plans sp
ON CONFLICT (plan_id, country_code) DO NOTHING;

-- =====================================================
-- STEP 11: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public data
GRANT SELECT ON public.exam_categories TO anon;
GRANT SELECT ON public.exams TO anon;
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.topics TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.plan_pricing TO anon;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Verify functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'EXAMTRAKR DATABASE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public');
  RAISE NOTICE 'Functions created: %', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public');
  RAISE NOTICE 'RLS enabled on: % tables', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true);
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure Supabase Auth settings';
  RAISE NOTICE '2. Set up Edge Functions';
  RAISE NOTICE '3. Configure environment variables';
  RAISE NOTICE '4. Test the application';
  RAISE NOTICE '=================================================';
END $$;
