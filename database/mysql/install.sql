-- Master installer — runs all module scripts in dependency order.
-- Usage: mysql -u USER -p DBNAME < database/mysql/install.sql

SET FOREIGN_KEY_CHECKS = 0;

SOURCE database/mysql/users.sql;
SOURCE database/mysql/todos.sql;
SOURCE database/mysql/goals.sql;
SOURCE database/mysql/pomodoro_sessions.sql;
SOURCE database/mysql/notification_settings.sql;
SOURCE database/mysql/subscriptions.sql;
SOURCE database/mysql/analytics.sql;

SET FOREIGN_KEY_CHECKS = 1;