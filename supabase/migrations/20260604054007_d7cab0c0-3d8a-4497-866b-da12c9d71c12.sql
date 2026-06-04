CREATE TABLE public.focus_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  interval_minutes INTEGER NOT NULL DEFAULT 25,
  suggested_break BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_ratings TO authenticated;
GRANT ALL ON public.focus_ratings TO service_role;

ALTER TABLE public.focus_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own focus_ratings" ON public.focus_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own focus_ratings" ON public.focus_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own focus_ratings" ON public.focus_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own focus_ratings" ON public.focus_ratings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_focus_ratings_updated
BEFORE UPDATE ON public.focus_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_focus_ratings_user_date ON public.focus_ratings(user_id, date);