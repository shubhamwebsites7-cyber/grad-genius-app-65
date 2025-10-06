-- =====================================================
-- USER FEEDBACK TABLE
-- Stores user feedback responses from the feedback quiz
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Question 1: How helpful is ExamTrakr?
    helpfulness TEXT NOT NULL CHECK (helpfulness IN ('very_helpful', 'somewhat_helpful', 'neutral', 'not_helpful')),
    
    -- Question 2: How easy is it to use?
    ease_of_use TEXT NOT NULL CHECK (ease_of_use IN ('very_easy', 'easy', 'average', 'difficult')),
    
    -- Question 3: Design and speed
    design_speed TEXT NOT NULL CHECK (design_speed IN ('yes_great', 'okay', 'needs_improvement')),
    
    -- Question 4: Would recommend?
    recommendation TEXT NOT NULL CHECK (recommendation IN ('definitely', 'maybe', 'no')),
    
    -- Question 5: Pricing preference
    pricing_preference TEXT NOT NULL CHECK (pricing_preference IN ('0', '79', '89', '99+')),
    
    -- Question 6: Improvement suggestion (text field)
    improvement_suggestion TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one feedback per user
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feedback
CREATE POLICY "Users can insert their own feedback"
    ON public.user_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
    ON public.user_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
    ON public.user_feedback
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback (assumes has_role function exists from ADMIN_SETUP.sql)
CREATE POLICY "Admins can view all feedback"
    ON public.user_feedback
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- =====================================================
-- EXAM REQUESTS TABLE
-- Stores user requests for new exams to be added
-- =====================================================

CREATE TABLE IF NOT EXISTS public.exam_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_name VARCHAR(100) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_requests
CREATE POLICY "Users can insert their own exam requests"
    ON public.exam_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own exam requests"
    ON public.exam_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins can view and manage all exam requests
CREATE POLICY "Admins can view all exam requests"
    ON public.exam_requests
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exam requests"
    ON public.exam_requests
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_exam_requests_user_id ON public.exam_requests(user_id);
CREATE INDEX idx_exam_requests_status ON public.exam_requests(status);
CREATE INDEX idx_exam_requests_created_at ON public.exam_requests(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_exam_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_requests_updated_at
    BEFORE UPDATE ON public.exam_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_requests_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.user_feedback IS 'Stores user feedback from the interactive quiz';
COMMENT ON TABLE public.exam_requests IS 'Stores user requests for new exams to be added to the platform';
COMMENT ON COLUMN public.user_feedback.helpfulness IS 'How helpful is ExamTrakr for exam preparation';
COMMENT ON COLUMN public.user_feedback.ease_of_use IS 'How easy is the website to use';
COMMENT ON COLUMN public.user_feedback.design_speed IS 'User opinion on design and speed';
COMMENT ON COLUMN public.user_feedback.recommendation IS 'Would user recommend to friends';
COMMENT ON COLUMN public.user_feedback.pricing_preference IS 'Pricing preference for unlimited exams';
COMMENT ON COLUMN public.user_feedback.improvement_suggestion IS 'User suggestions for improvements';
COMMENT ON COLUMN public.exam_requests.status IS 'Status of the exam request: pending, approved, rejected, or implemented';
