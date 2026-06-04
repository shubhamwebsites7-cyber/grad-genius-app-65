-- Aggregated analytics views / queries

-- Daily productivity score (50% tasks completed / 10, 40% focus hours / 8, 10% avg focus rating / 10)
CREATE OR REPLACE VIEW v_daily_productivity AS
SELECT
  u.id AS user_id,
  d.date AS date,
  COALESCE(t.completed_count, 0) AS tasks_completed,
  COALESCE(p.focus_hours, 0) AS focus_hours,
  COALESCE(f.avg_rating, 0) AS avg_focus_rating,
  ROUND(
    LEAST(1, COALESCE(t.completed_count,0)/10) * 50 +
    LEAST(1, COALESCE(p.focus_hours,0)/8) * 40 +
    COALESCE(f.avg_rating,0)/10 * 10
  ) AS productivity_score
FROM users u
JOIN (
  SELECT DISTINCT date FROM tasks
  UNION SELECT DISTINCT date FROM pomodoro_sessions
  UNION SELECT DISTINCT date FROM focus_ratings
) d
LEFT JOIN (
  SELECT user_id, date, SUM(completed) AS completed_count
  FROM tasks GROUP BY user_id, date
) t ON t.user_id = u.id AND t.date = d.date
LEFT JOIN (
  SELECT user_id, date, SUM(duration_seconds)/3600 AS focus_hours
  FROM pomodoro_sessions WHERE priority <> 'break'
  GROUP BY user_id, date
) p ON p.user_id = u.id AND p.date = d.date
LEFT JOIN (
  SELECT user_id, date, AVG(rating) AS avg_rating
  FROM focus_ratings GROUP BY user_id, date
) f ON f.user_id = u.id AND f.date = d.date;

-- Consistency streak helper: counts consecutive days with any activity
-- SELECT user_id, COUNT(*) AS streak_days FROM v_daily_productivity WHERE user_id = ? AND productivity_score > 0;