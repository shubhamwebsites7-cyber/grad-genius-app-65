## Goal
Slim the app to **Todo, Goals, Pomodoro, Analytics** only, remove Exercise/Weight/Calories and the entire Focus Accountability/Rating system, add a rule-based Smart Notification system with settings and PWA push support, and prepare the project for Android TWA + Play Store while keeping the current UI untouched.

---

## 1. Feature Audit (current state)

**Existing & keeping**
- Todo: daily tasks, calendar, H/M/L priorities, progress bar, weekly→1Y analytics
- Goals: long-term goals, priorities, tips ("Health & Lifestyle Tips" → will be renamed/repurposed as "Things To Remember")
- Pomodoro: 25/5, 45/15, task selection, start/pause/reset, 24h ring, weekly→1Y analytics
- Analytics: productivity score, KPIs, trends
- PWA: manifest + `public/sw.js` (basic cache), install button, assetlinks.json (TWA-ready stub)

**To remove**
- Pages: `Exercise.tsx`, `Weight.tsx`, `CalendarView.tsx` (calories tracker — dashboard index, will be replaced by Todo as the default landing)
- Components: `FocusAccountability.tsx`
- Supabase tables: `exercise_completions`, `weights`, `calories`, `focus_ratings`
- SQL files for removed modules
- Routes and nav entries for removed pages
- Dead imports/icons

**Missing / partial**
- "Things To Remember" section in Goals (currently only tips list)
- Smart rule-based notifications + settings UI
- Web Push (currently only basic cache SW, no `Notification` / `showNotification` scheduling)
- `notification_settings` table
- MySQL scripts for removed modules need deletion; `notification_settings.sql` needs creation

---

## 2. Removal Plan

Delete files:
- `src/pages/Exercise.tsx`, `src/pages/Weight.tsx`, `src/pages/CalendarView.tsx`
- `src/components/FocusAccountability.tsx`
- `database/mysql/` — remove any Exercise/Weight/Calories SQL (none exist yet for those, but verify)
- Drop unused Supabase tables via migration: `exercise_completions`, `weights`, `calories`, `focus_ratings`

Update:
- `src/App.tsx` — remove routes for `calories`, `weight`, `exercise`; make `Todo` the dashboard index
- `src/components/AppSidebar.tsx` + `Layout.tsx` — remove nav items for Calories/Weight/Exercise; remove FocusAccountability usage in `Pomodoro.tsx`
- `src/pages/Pomodoro.tsx` — strip `<FocusAccountability />` mount and any focus-rating references

---

## 3. New: Smart Notification System (no AI)

Files:
- `src/lib/notifications/rules.ts` — pure functions taking `{name, todos, goals, pomodoro}` → list of `{id, title, body, category}`
- `src/lib/notifications/scheduler.ts` — schedules via `setTimeout` + `navigator.serviceWorker.ready.showNotification`; morning reminder fires at 08:00 local; inactivity check every 2h; pomodoro complete already triggered from Pomodoro page
- `src/hooks/useNotifications.tsx` — permission request, registration, settings hookup
- `src/pages/Settings.tsx` — Notification Settings page (toggles: Enable All, Morning, Todo, Pomodoro, Motivational)
- Settings persisted in `localStorage` + synced to Supabase `notification_settings` table when authenticated

Categories map 1:1 to user toggles. Each rule checks its toggle before firing.

---

## 4. PWA / Push

- Extend `public/sw.js`:
  - `push` event → `self.registration.showNotification(...)`
  - `notificationclick` → focus or open `/dashboard/todo`
- Keep existing cache logic and dynamic version
- Add `src/lib/notifications/permission.ts` helper
- No external push server — use local scheduled notifications via SW `showNotification` (works for Website + installed PWA + Desktop PWA). Document that true server push would need VAPID; out of scope.

---

## 5. TWA Readiness

- Verify `public/.well-known/assetlinks.json` exists (it does)
- Ensure `manifest.json` has: `id`, `start_url: "/dashboard/todo"`, `scope: "/"`, `display: "standalone"`, `theme_color`, `background_color`, maskable icons (already present — audit and patch if missing fields)
- Add `<meta name="mobile-web-app-capable">` etc. in `index.html` if absent
- No Android code

---

## 6. Database Changes

Supabase migration:
- `DROP TABLE` for `exercise_completions`, `weights`, `calories`, `focus_ratings` (with policy cleanup)
- `CREATE TABLE public.notification_settings` (user_id PK, enable_all, morning, todo, pomodoro, motivational booleans, timestamps) + GRANTs + RLS

MySQL (`database/mysql/`):
- Delete `focus_ratings.sql`
- Add `notification_settings.sql`
- Update `install.sql` and `README.md`
- Keep: `users.sql`, `todos.sql`, `goals.sql`, `pomodoro_sessions.sql`, `subscriptions.sql`, `analytics.sql`

---

## 7. Reports (delivered in final message)

After implementation, the closing message will include:
Feature Audit · Removed · Missing→Implemented · Navigation · Routes · DB · SQL · Notifications · PWA · TWA · Dependency Cleanup · Folder Structure.

---

## Confirmation needed
1. OK to **drop the Supabase tables** `exercise_completions`, `weights`, `calories`, `focus_ratings` (data is lost permanently)?
2. New default landing route after removing Calories dashboard → **`/dashboard/todo`** — OK?
3. Add a new **`/dashboard/settings`** route for notification toggles — OK?

Reply "go" (with any changes to the three questions) and I'll execute the full plan.