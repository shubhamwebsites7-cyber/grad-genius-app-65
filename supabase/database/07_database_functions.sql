-- =====================================================
-- DATABASE UTILITY FUNCTIONS & TRIGGERS
-- =====================================================
-- Common functions and triggers used across the Examtrakr database
-- for maintaining data integrity and automating common tasks.

-- =====================================================
-- UTILITY FUNCTIONS
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
-- SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to check if user can enroll in exam (subscription limits)
CREATE OR REPLACE FUNCTION can_user_enroll_in_exam(user_uuid uuid, exam_id_param character varying(50))
RETURNS boolean AS $$
DECLARE
  has_premium boolean;
  current_enrollments integer;
  max_enrollments integer := 1; -- Free users can enroll in 1 exam
BEGIN
  -- Check if user has premium access
  SELECT has_premium_access(user_uuid) INTO has_premium;
  
  -- Premium users have unlimited enrollments
  IF has_premium THEN
    RETURN true;
  END IF;
  
  -- Count current active enrollments for free users
  SELECT COUNT(*) INTO current_enrollments
  FROM user_exam_enrollments
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Check if user is already enrolled in this specific exam
  IF EXISTS(
    SELECT 1 FROM user_exam_enrollments 
    WHERE user_id = user_uuid 
    AND exam_id = exam_id_param 
    AND is_active = true
  ) THEN
    RETURN true; -- Already enrolled, allow access
  END IF;
  
  -- Check enrollment limit
  RETURN current_enrollments < max_enrollments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access premium topic
CREATE OR REPLACE FUNCTION can_user_access_topic(user_uuid uuid, topic_id_param character varying(100))
RETURNS boolean AS $$
DECLARE
  has_premium boolean;
  topic_requires_premium boolean;
  user_enrolled boolean;
BEGIN
  -- Check if user has premium access
  SELECT has_premium_access(user_uuid) INTO has_premium;
  
  -- Premium users can access all topics
  IF has_premium THEN
    RETURN true;
  END IF;
  
  -- Check if topic requires premium (based on resources)
  SELECT EXISTS(
    SELECT 1 FROM topic_resources 
    WHERE topic_id = topic_id_param 
    AND is_premium = true 
    AND is_active = true
  ) INTO topic_requires_premium;
  
  -- If topic doesn't require premium, allow access
  IF NOT topic_requires_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user is enrolled in the exam containing this topic
  SELECT EXISTS(
    SELECT 1 FROM user_exam_enrollments uee
    JOIN subjects s ON s.exam_id = uee.exam_id
    JOIN topics t ON t.subject_id = s.id
    WHERE uee.user_id = user_uuid 
    AND t.id = topic_id_param
    AND uee.is_active = true
  ) INTO user_enrolled;
  
  -- Free users can access basic content of enrolled exams
  RETURN user_enrolled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROGRESS CALCULATION FUNCTIONS
-- =====================================================

-- Function to calculate user's overall progress across all exams
CREATE OR REPLACE FUNCTION calculate_user_overall_progress(user_uuid uuid)
RETURNS TABLE(
  total_enrolled_exams integer,
  total_completed_topics integer,
  total_available_topics integer,
  overall_progress_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uee.exam_id)::integer as total_enrolled_exams,
    COALESCE(SUM(uep.completed_topics), 0)::integer as total_completed_topics,
    COALESCE(SUM(uep.total_topics), 0)::integer as total_available_topics,
    CASE 
      WHEN COALESCE(SUM(uep.total_topics), 0) > 0 
      THEN ROUND((COALESCE(SUM(uep.completed_topics), 0)::numeric / SUM(uep.total_topics)::numeric) * 100, 2)
      ELSE 0.00
    END as overall_progress_percentage
  FROM user_exam_enrollments uee
  LEFT JOIN user_exam_progress uep ON uee.user_id = uep.user_id AND uee.exam_id = uep.exam_id
  WHERE uee.user_id = user_uuid AND uee.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's study streak
CREATE OR REPLACE FUNCTION get_user_study_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  streak_days integer := 0;
  current_date date := CURRENT_DATE;
  check_date date;
BEGIN
  -- Start from yesterday and count backwards
  check_date := current_date - 1;
  
  WHILE EXISTS(
    SELECT 1 FROM user_topic_progress 
    WHERE user_id = user_uuid 
    AND DATE(last_accessed_at) = check_date
  ) LOOP
    streak_days := streak_days + 1;
    check_date := check_date - 1;
  END LOOP;
  
  -- Check if user studied today
  IF EXISTS(
    SELECT 1 FROM user_topic_progress 
    WHERE user_id = user_uuid 
    AND DATE(last_accessed_at) = current_date
  ) THEN
    streak_days := streak_days + 1;
  END IF;
  
  RETURN streak_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get exam popularity statistics
CREATE OR REPLACE FUNCTION get_exam_popularity_stats()
RETURNS TABLE(
  exam_id character varying(50),
  exam_name character varying(255),
  enrollment_count bigint,
  avg_progress_percentage numeric,
  total_topics integer,
  avg_completion_time_days numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as exam_id,
    e.name as exam_name,
    COUNT(DISTINCT uee.user_id) as enrollment_count,
    COALESCE(ROUND(AVG(uep.progress_percentage), 2), 0) as avg_progress_percentage,
    COUNT(DISTINCT t.id)::integer as total_topics,
    COALESCE(ROUND(AVG(EXTRACT(days FROM (utp.completed_at - uee.enrolled_at))), 1), 0) as avg_completion_time_days
  FROM exams e
  LEFT JOIN user_exam_enrollments uee ON e.id = uee.exam_id AND uee.is_active = true
  LEFT JOIN user_exam_progress uep ON uee.user_id = uep.user_id AND uee.exam_id = uep.exam_id
  LEFT JOIN subjects s ON e.id = s.exam_id AND s.is_active = true
  LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
  LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.is_completed = true
  WHERE e.is_active = true
  GROUP BY e.id, e.name
  ORDER BY enrollment_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get resource engagement statistics
CREATE OR REPLACE FUNCTION get_resource_engagement_stats()
RETURNS TABLE(
  resource_id uuid,
  resource_title character varying(500),
  resource_type character varying(20),
  topic_name character varying(255),
  avg_rating numeric,
  total_ratings bigint,
  bookmark_count bigint,
  engagement_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id as resource_id,
    tr.title as resource_title,
    tr.resource_type,
    t.name as topic_name,
    COALESCE(ROUND(AVG(rr.rating::numeric), 2), 0) as avg_rating,
    COUNT(DISTINCT rr.id) as total_ratings,
    COUNT(DISTINCT urb.id) as bookmark_count,
    -- Engagement score: weighted combination of ratings and bookmarks
    COALESCE(
      ROUND(
        (AVG(rr.rating::numeric) * 0.6) + 
        (LOG(1 + COUNT(DISTINCT urb.id)) * 0.4), 
        2
      ), 
      0
    ) as engagement_score
  FROM topic_resources tr
  JOIN topics t ON tr.topic_id = t.id
  LEFT JOIN resource_ratings rr ON tr.id = rr.resource_id
  LEFT JOIN user_resource_bookmarks urb ON tr.id = urb.resource_id
  WHERE tr.is_active = true
  GROUP BY tr.id, tr.title, tr.resource_type, t.name
  ORDER BY engagement_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DATA MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to archive old user activity logs
CREATE OR REPLACE FUNCTION archive_old_activity_logs(days_to_keep integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  archived_count integer;
BEGIN
  -- Move old logs to archive table (create if not exists)
  CREATE TABLE IF NOT EXISTS user_activity_log_archive (
    LIKE user_activity_log INCLUDING ALL
  );
  
  -- Insert old records into archive
  INSERT INTO user_activity_log_archive
  SELECT * FROM user_activity_log
  WHERE created_at < (CURRENT_DATE - days_to_keep);
  
  -- Delete old records from main table
  DELETE FROM user_activity_log
  WHERE created_at < (CURRENT_DATE - days_to_keep);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update exam enrollment counts
CREATE OR REPLACE FUNCTION update_exam_enrollment_counts()
RETURNS void AS $$
BEGIN
  UPDATE exams 
  SET enrollment_count = (
    SELECT COUNT(DISTINCT user_id)
    FROM user_exam_enrollments 
    WHERE exam_id = exams.id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEDULED MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to run daily maintenance tasks
CREATE OR REPLACE FUNCTION run_daily_maintenance()
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  expired_sessions integer;
  archived_logs integer;
BEGIN
  -- Clean up expired sessions
  SELECT cleanup_expired_sessions() INTO expired_sessions;
  result := result || jsonb_build_object('expired_sessions_cleaned', expired_sessions);
  
  -- Update enrollment counts
  PERFORM update_exam_enrollment_counts();
  result := result || jsonb_build_object('enrollment_counts_updated', true);
  
  -- Archive old activity logs (keep 90 days)
  SELECT archive_old_activity_logs(90) INTO archived_logs;
  result := result || jsonb_build_object('activity_logs_archived', archived_logs);
  
  -- Update statistics
  ANALYZE;
  result := result || jsonb_build_object('statistics_updated', true);
  
  -- Log maintenance completion
  INSERT INTO user_activity_log (user_id, activity_type, activity_data)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'daily_maintenance',
    result
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamps';
COMMENT ON FUNCTION can_user_enroll_in_exam(uuid, character varying) IS 'Check if user can enroll in exam based on subscription limits';
COMMENT ON FUNCTION can_user_access_topic(uuid, character varying) IS 'Check if user can access topic based on subscription and enrollment';
COMMENT ON FUNCTION calculate_user_overall_progress(uuid) IS 'Calculate user overall progress across all enrolled exams';
COMMENT ON FUNCTION get_user_study_streak(uuid) IS 'Get user consecutive study days streak';
COMMENT ON FUNCTION run_daily_maintenance() IS 'Run daily database maintenance tasks';
