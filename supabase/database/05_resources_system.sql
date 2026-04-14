-- =====================================================
-- LEARNING RESOURCES SYSTEM TABLES
-- =====================================================
-- These tables manage learning resources, ratings, and bookmarks
-- for topics within the exam preparation system.

-- =====================================================
-- TOPIC RESOURCES TABLE
-- =====================================================
-- Learning materials for each topic (videos, PDFs, links, etc.)
CREATE TABLE public.topic_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id character varying(100) NOT NULL,
  title character varying(500) NOT NULL,
  description text NULL,
  resource_type character varying(20) NOT NULL,
  url character varying(1000) NOT NULL,
  thumbnail_url character varying(1000) NULL,
  duration_minutes integer NULL,
  file_size_mb numeric(8, 2) NULL,
  is_premium boolean NULL DEFAULT false,
  is_user_contributed boolean NULL DEFAULT false,
  contributed_by_user_id uuid NULL,
  admin_approved boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  is_active boolean NULL DEFAULT true,
  
  CONSTRAINT topic_resources_pkey PRIMARY KEY (id),
  CONSTRAINT topic_resources_topic_id_fkey FOREIGN KEY (topic_id) 
    REFERENCES topics (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_topic_resources_topic 
ON public.topic_resources USING btree (topic_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.topic_resources IS 'Learning resources for topics (videos, PDFs, links, etc.)';
COMMENT ON COLUMN public.topic_resources.resource_type IS 'Type: video, pdf, link, article, quiz, etc.';
COMMENT ON COLUMN public.topic_resources.url IS 'Resource URL or file path';
COMMENT ON COLUMN public.topic_resources.duration_minutes IS 'Duration for video/audio resources';
COMMENT ON COLUMN public.topic_resources.file_size_mb IS 'File size for downloadable resources';
COMMENT ON COLUMN public.topic_resources.is_premium IS 'Whether resource requires premium subscription';
COMMENT ON COLUMN public.topic_resources.is_user_contributed IS 'Whether resource was contributed by user';
COMMENT ON COLUMN public.topic_resources.admin_approved IS 'Whether user-contributed resource is approved';

-- =====================================================
-- RESOURCE RATINGS TABLE
-- =====================================================
-- User ratings and reviews for learning resources
CREATE TABLE public.resource_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  review_text text NULL,
  is_helpful_count integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT resource_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT resource_ratings_resource_id_user_id_key UNIQUE (resource_id, user_id),
  CONSTRAINT resource_ratings_resource_id_fkey FOREIGN KEY (resource_id) 
    REFERENCES topic_resources (id) ON DELETE CASCADE,
  CONSTRAINT resource_ratings_rating_check CHECK (
    rating >= 1 AND rating <= 5
  )
) TABLESPACE pg_default;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource 
ON public.resource_ratings USING btree (resource_id) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.resource_ratings IS 'User ratings and reviews for learning resources';
COMMENT ON COLUMN public.resource_ratings.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN public.resource_ratings.review_text IS 'Optional text review';
COMMENT ON COLUMN public.resource_ratings.is_helpful_count IS 'Number of users who found this review helpful';

-- =====================================================
-- USER RESOURCE BOOKMARKS TABLE
-- =====================================================
-- User bookmarks for quick access to favorite resources
CREATE TABLE public.user_resource_bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_resource_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT user_resource_bookmarks_user_id_resource_id_key UNIQUE (user_id, resource_id),
  CONSTRAINT user_resource_bookmarks_resource_id_fkey FOREIGN KEY (resource_id) 
    REFERENCES topic_resources (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Comments for documentation
COMMENT ON TABLE public.user_resource_bookmarks IS 'User bookmarks for quick access to resources';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample resources for JEE Physics Mechanics
INSERT INTO public.topic_resources (topic_id, title, description, resource_type, url, duration_minutes, is_premium, is_active) VALUES
('JEE_PHYSICS_MECHANICS', 'Newton Laws of Motion - Video Lecture', 'Comprehensive video explaining Newton three laws with examples', 'video', 'https://youtube.com/watch?v=sample1', 45, false, true),
('JEE_PHYSICS_MECHANICS', 'Mechanics Problem Set - PDF', 'Collection of 100+ mechanics problems with solutions', 'pdf', 'https://examtrakr.com/resources/mechanics-problems.pdf', NULL, true, true),
('JEE_PHYSICS_MECHANICS', 'Interactive Mechanics Simulator', 'Online tool to visualize mechanics concepts', 'interactive', 'https://examtrakr.com/simulators/mechanics', NULL, true, true);

-- Insert sample resources for JEE Chemistry Organic
INSERT INTO public.topic_resources (topic_id, title, description, resource_type, url, duration_minutes, is_premium, is_active) VALUES
('JEE_CHEMISTRY_ORGANIC', 'Organic Chemistry Basics', 'Introduction to organic chemistry concepts', 'video', 'https://youtube.com/watch?v=sample2', 60, false, true),
('JEE_CHEMISTRY_ORGANIC', 'Reaction Mechanisms Guide', 'Detailed guide on organic reaction mechanisms', 'pdf', 'https://examtrakr.com/resources/organic-mechanisms.pdf', NULL, true, true),
('JEE_CHEMISTRY_ORGANIC', 'Organic Chemistry Practice Quiz', 'Interactive quiz with 50 questions', 'quiz', 'https://examtrakr.com/quizzes/organic-chemistry', 30, false, true);

-- Insert sample resources for JEE Math Calculus
INSERT INTO public.topic_resources (topic_id, title, description, resource_type, url, duration_minutes, is_premium, is_active) VALUES
('JEE_MATH_CALCULUS', 'Differential Calculus Masterclass', 'Complete course on differential calculus', 'video', 'https://youtube.com/watch?v=sample3', 120, true, true),
('JEE_MATH_CALCULUS', 'Integration Techniques', 'Various integration methods and tricks', 'article', 'https://examtrakr.com/articles/integration-techniques', NULL, false, true),
('JEE_MATH_CALCULUS', 'Calculus Formula Sheet', 'Quick reference for all calculus formulas', 'pdf', 'https://examtrakr.com/resources/calculus-formulas.pdf', NULL, false, true);

-- =====================================================
-- RESOURCE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to calculate average rating for a resource
CREATE OR REPLACE FUNCTION calculate_resource_rating(resource_uuid uuid)
RETURNS TABLE(avg_rating numeric, total_ratings bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating::numeric), 2) as avg_rating,
    COUNT(*) as total_ratings
  FROM resource_ratings 
  WHERE resource_id = resource_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's bookmark status for a resource
CREATE OR REPLACE FUNCTION is_resource_bookmarked(user_uuid uuid, resource_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_resource_bookmarks 
    WHERE user_id = user_uuid AND resource_id = resource_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to toggle bookmark status
CREATE OR REPLACE FUNCTION toggle_resource_bookmark(user_uuid uuid, resource_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_bookmarked boolean;
BEGIN
  -- Check if already bookmarked
  SELECT is_resource_bookmarked(user_uuid, resource_uuid) INTO is_bookmarked;
  
  IF is_bookmarked THEN
    -- Remove bookmark
    DELETE FROM user_resource_bookmarks 
    WHERE user_id = user_uuid AND resource_id = resource_uuid;
    RETURN false;
  ELSE
    -- Add bookmark
    INSERT INTO user_resource_bookmarks (user_id, resource_id) 
    VALUES (user_uuid, resource_uuid);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RESOURCE VIEWS FOR EASY QUERYING
-- =====================================================

-- View to get resources with ratings and bookmark status
CREATE OR REPLACE VIEW resource_details AS
SELECT 
  tr.*,
  COALESCE(rating_stats.avg_rating, 0) as avg_rating,
  COALESCE(rating_stats.total_ratings, 0) as total_ratings,
  t.name as topic_name,
  s.name as subject_name,
  e.name as exam_name
FROM topic_resources tr
LEFT JOIN (
  SELECT 
    resource_id,
    ROUND(AVG(rating::numeric), 2) as avg_rating,
    COUNT(*) as total_ratings
  FROM resource_ratings 
  GROUP BY resource_id
) rating_stats ON tr.id = rating_stats.resource_id
JOIN topics t ON tr.topic_id = t.id
JOIN subjects s ON t.subject_id = s.id
JOIN exams e ON s.exam_id = e.id
WHERE tr.is_active = true;

-- Comments for view
COMMENT ON VIEW resource_details IS 'Complete resource information with ratings and hierarchy details';
