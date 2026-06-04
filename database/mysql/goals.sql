-- Long-term goals
CREATE TABLE IF NOT EXISTS goals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  priority ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_goals_user (user_id),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Health & lifestyle tips / personal guidelines
CREATE TABLE IF NOT EXISTS tips (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tips_user (user_id),
  CONSTRAINT fk_tips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO goals (id, user_id, title, priority, completed) VALUES
 ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Run a half-marathon','high',0),
 ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Read 24 books this year','medium',0);

INSERT INTO tips (id, user_id, title, description) VALUES
 ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Hydrate','Drink 2L of water per day.');

-- Goal progress query
-- SELECT priority, SUM(completed)/COUNT(*) AS progress FROM goals WHERE user_id = ? GROUP BY priority;