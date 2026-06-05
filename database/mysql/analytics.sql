-- Aggregated analytics views / queries

-- Daily productivity score (60% tasks completed / 10, 40% focus hours / 8)
CREATE OR REPLACE VIEW v_daily_productivity AS
SELECT
  u.id AS user_id,
  d.date AS date,
  COALESCE(t.completed_count, 0) AS tasks_completed,
  COALESCE(p.focus_hours, 0) AS focus_hours,
  ROUND(
    LEAST(1, COALESCE(t.completed_count,0)/10) * 60 +
    LEAST(1, COALESCE(p.focus_hours,0)/8) * 40
  ) AS productivity_score
FROM users u
JOIN (
  SELECT DISTINCT date FROM tasks
  UNION SELECT DISTINCT date FROM pomodoro_sessions
) d
LEFT JOIN (
  SELECT user_id, date, SUM(completed) AS completed_count
  FROM tasks GROUP BY user_id, date
) t ON t.user_id = u.id AND t.date = d.date
LEFT JOIN (
  SELECT user_id, date, SUM(duration_seconds)/3600 AS focus_hours
  FROM pomodoro_sessions WHERE priority <> 'break'
  GROUP BY user_id, date
) p ON p.user_id = u.id AND p.date = d.date;

-- Consistency streak helper: counts consecutive days with any activity
-- SELECT user_id, COUNT(*) AS streak_days FROM v_daily_productivity WHERE user_id = ? AND productivity_score > 0;