-- Tasks (daily todos with priority)
CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'low',
  completed TINYINT(1) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tasks_user_date (user_id, date),
  INDEX idx_tasks_completed (user_id, completed),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample
INSERT INTO tasks (id, user_id, title, priority, completed, date) VALUES
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Ship audit report','high',1,CURDATE()),
 ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Review PR backlog','medium',0,CURDATE()),
 ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Read 20 pages','low',0,CURDATE());

-- Analytics queries
-- Completion rate by day (last 30 days)
-- SELECT date, SUM(completed) AS completed, COUNT(*) AS total
-- FROM tasks WHERE user_id = ? AND date >= (CURDATE() - INTERVAL 30 DAY)
-- GROUP BY date ORDER BY date;