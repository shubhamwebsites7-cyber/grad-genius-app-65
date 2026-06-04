-- Focus accountability self-ratings (1-10)
CREATE TABLE IF NOT EXISTS focus_ratings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  rating TINYINT NOT NULL,
  interval_minutes SMALLINT NOT NULL DEFAULT 25,
  suggested_break TINYINT(1) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_focus_rating CHECK (rating BETWEEN 1 AND 10),
  INDEX idx_focus_user_date (user_id, date),
  CONSTRAINT fk_focus_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Average rating per day
-- SELECT date, AVG(rating) AS avg_rating FROM focus_ratings WHERE user_id = ? GROUP BY date ORDER BY date;