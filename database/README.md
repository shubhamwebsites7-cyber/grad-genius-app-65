# Database — MySQL scripts

Production-ready MySQL schema for the entire GoalGrip application (current + newly added modules). Designed for a future Laravel + MySQL backend; the live app currently runs against Supabase Postgres with equivalent schema.

## Layout

```
database/mysql/
├── users.sql                # auth users + profiles
├── todos.sql                # tasks (daily todos)
├── goals.sql                # long-term goals + tips/guidelines
├── pomodoro_sessions.sql    # focus + break sessions
├── notification_settings.sql # per-user notification toggles
├── subscriptions.sql        # plans + user subscriptions
├── analytics.sql            # v_daily_productivity view + helper queries
└── install.sql              # master installer
```

## Install

```
mysql -u root -p goalgrip < database/mysql/install.sql
```

## Notes

- All tables use `CHAR(36)` UUIDs to match Supabase IDs.
- `ENUM` is used for `priority` to mirror the application contract.
- The `v_daily_productivity` view computes the same productivity score used by the in-app Analytics page (60% tasks / 40% focus).
- Sample data is included for the demo user `00000000-0000-0000-0000-000000000001`.