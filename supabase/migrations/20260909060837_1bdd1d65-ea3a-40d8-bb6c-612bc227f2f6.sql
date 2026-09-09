CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text)
RETURNS TABLE(display_name text, completed_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_date date;
BEGIN
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