CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NULL,
  priority TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pomodoro sessions"
ON public.pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pomodoro sessions"
ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro sessions"
ON public.pomodoro_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro sessions"
ON public.pomodoro_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_pomodoro_sessions_user_date ON public.pomodoro_sessions(user_id, date);

CREATE TRIGGER update_pomodoro_sessions_updated_at
BEFORE UPDATE ON public.pomodoro_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();