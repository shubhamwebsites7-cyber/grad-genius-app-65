-- Drop removed feature tables
DROP TABLE IF EXISTS public.exercise_completions CASCADE;
DROP TABLE IF EXISTS public.weights CASCADE;
DROP TABLE IF EXISTS public.calories CASCADE;
DROP TABLE IF EXISTS public.focus_ratings CASCADE;

-- Notification settings (one row per user)
CREATE TABLE public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_all BOOLEAN NOT NULL DEFAULT true,
  morning BOOLEAN NOT NULL DEFAULT true,
  todo BOOLEAN NOT NULL DEFAULT true,
  pomodoro BOOLEAN NOT NULL DEFAULT true,
  motivational BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their notification settings"
ON public.notification_settings FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();