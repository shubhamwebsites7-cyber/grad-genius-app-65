-- Subscription plans (placeholder for future monetization / Laravel integration)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  interval_unit ENUM('month','year') NOT NULL DEFAULT 'month',
  features JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active','trialing','canceled','past_due','expired') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  external_id VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_sub_user (user_id),
  CONSTRAINT fk_usersub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_usersub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO subscription_plans (id, code, name, price_cents, currency, interval_unit, features) VALUES
 ('60000000-0000-0000-0000-000000000001','free','Free',0,'USD','month', JSON_OBJECT('analytics','basic')),
 ('60000000-0000-0000-0000-000000000002','pro','Pro',900,'USD','month', JSON_OBJECT('analytics','advanced','focus_reminders',true));