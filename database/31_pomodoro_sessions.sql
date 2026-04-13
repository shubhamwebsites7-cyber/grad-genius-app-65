-- Pomodoro Study Sessions Table
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('work', 'break')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own pomodoro sessions"
ON public.pomodoro_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own pomodoro sessions"
ON public.pomodoro_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_created_at ON public.pomodoro_sessions(created_at);
CREATE INDEX idx_pomodoro_sessions_user_exam ON public.pomodoro_sessions(user_id, exam_id);
