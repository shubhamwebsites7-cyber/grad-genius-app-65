-- =====================================================================
-- Pomodoro Timeline maintenance — run in Supabase SQL editor
--
-- Fixes bad rows that break the /dashboard/pomodoro "24h Timeline"
-- (e.g. shows negative minutes like "-1408m tracked today") and keeps
-- the `date` column aligned with `started_at` so the day ring picks
-- the right sessions.
--
-- Safe to run multiple times. Wrap in a transaction if you want to
-- review row counts before committing.
-- =====================================================================

BEGIN;

-- 1) Delete obviously broken rows: zero/negative duration or end <= start
DELETE FROM public.pomodoro_sessions
WHERE duration_seconds IS NULL
   OR duration_seconds <= 0
   OR ended_at IS NULL
   OR started_at IS NULL
   OR ended_at <= started_at;

-- 2) Cap absurdly long sessions to 24h (prevents an arc wrapping the ring)
UPDATE public.pomodoro_sessions
SET ended_at = started_at + INTERVAL '24 hours',
    duration_seconds = 24 * 60 * 60
WHERE EXTRACT(EPOCH FROM (ended_at - started_at)) > 24 * 60 * 60;

-- 3) Recompute duration_seconds from the actual timestamps
UPDATE public.pomodoro_sessions
SET duration_seconds = GREATEST(
      1,
      ROUND(EXTRACT(EPOCH FROM (ended_at - started_at)))::int
    )
WHERE duration_seconds <> ROUND(EXTRACT(EPOCH FROM (ended_at - started_at)))::int;

-- 4) Realign the `date` column with the day the session STARTED
--    (the 24h ring filters by this column).
UPDATE public.pomodoro_sessions
SET date = (started_at AT TIME ZONE 'UTC')::date
WHERE date IS DISTINCT FROM (started_at AT TIME ZONE 'UTC')::date;

-- 5) Optional: drop any session whose priority is not one of the four
--    categories the UI knows how to render.
DELETE FROM public.pomodoro_sessions
WHERE priority NOT IN ('high', 'medium', 'low', 'break');

-- 6) Sanity check — total real minutes tracked today (UTC).
--    Should match the number in the centre of the 24h Timeline ring.
SELECT
  date,
  COUNT(*)                                     AS sessions,
  ROUND(SUM(duration_seconds) / 60.0)::int     AS minutes_tracked,
  ROUND(SUM(duration_seconds) / 3600.0, 2)     AS hours_tracked
FROM public.pomodoro_sessions
WHERE date = (NOW() AT TIME ZONE 'UTC')::date
GROUP BY date;

COMMIT;