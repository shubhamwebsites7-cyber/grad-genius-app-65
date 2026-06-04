-- Pomodoro sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  task_id CHAR(36) NULL,
  priority ENUM('high','medium','low','break') NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  duration_seconds INT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pomo_user_date (user_id, date),
  INDEX idx_pomo_task (task_id),
  CONSTRAINT fk_pomo_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pomo_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample
INSERT INTO pomodoro_sessions (id, user_id, task_id, priority, started_at, ended_at, duration_seconds, date) VALUES
 ('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','high', NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 5 MINUTE, 1500, CURDATE()),
 ('50000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',NULL,'break', NOW() - INTERVAL 5 MINUTE, NOW(), 300, CURDATE());

-- Daily focus hours (excluding breaks)
-- SELECT date, SUM(duration_seconds)/3600 AS focus_hours FROM pomodoro_sessions
-- WHERE user_id = ? AND priority <> 'break' GROUP BY date ORDER BY date;