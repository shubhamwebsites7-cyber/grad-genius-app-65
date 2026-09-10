CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('shubhamchoudhary7225@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

CREATE POLICY "Admins can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text)
RETURNS TABLE(display_name text, completed_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date date;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_period = 'today' THEN
    start_date := CURRENT_DATE;
  ELSIF p_period = 'week' THEN
    start_date := CURRENT_DATE - 6;
  ELSIF p_period = 'month' THEN
    start_date := CURRENT_DATE - 29;
  ELSE
    RAISE EXCEPTION 'Invalid leaderboard period';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(BTRIM(p.name), ''), 'GoalGrip member') AS display_name,
    COUNT(*)::bigint AS completed_count
  FROM public.tasks AS t
  LEFT JOIN public.profiles AS p ON p.user_id = t.user_id
  WHERE t.completed = true
    AND t.date >= start_date
    AND t.date <= CURRENT_DATE
  GROUP BY t.user_id, COALESCE(NULLIF(BTRIM(p.name), ''), 'GoalGrip member')
  ORDER BY completed_count DESC, display_name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_leaderboard(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;