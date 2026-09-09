# GoalGrip Journey Removal and User Leaderboard

## Goal
Remove the My Journey page completely and add a signed-in leaderboard with Today, Weekly, and Monthly tabs. Preserve the existing visual language, navigation behavior, task/goal flows, and all other functionality.

## Product changes

1. **Remove My Journey**
   - Remove the `/dashboard/analytics` route and its page from the dashboard.
   - Remove Journey from desktop sidebar and mobile navigation.
   - Remove Journey-only landing-page copy so the public description reflects Todo, Goals, Pomodoro, and Leaderboard.
   - Do not remove Vercel Analytics/Speed Insights; those are app telemetry, not the Journey page.

2. **Add Leaderboard page**
   - Add a protected `/dashboard/leaderboard` page in the same layout and styling system.
   - Add one tab control with `Today`, `Weekly`, and `Monthly` views.
   - Rank users from highest to lowest completed-task count for the selected period.
   - Include every user with at least one completed task in that period, including the signed-in user.
   - Display each user’s profile display name; use a neutral fallback label when a profile name is unavailable.
   - Show rank, display name, and completed task count, with a clear empty state when no qualifying users exist.
   - Add Leaderboard to both desktop sidebar and mobile bottom navigation where Journey currently appears.

3. **Preserve and verify user ownership**
   - Keep task, goal, tip, Pomodoro, and profile mutations tied to the authenticated user ID already used by the app.
   - Verify the existing RLS policies continue to permit each signed-in user to create and manage their own daily tasks, goals, and related personal data.
   - Do not broaden task or goal row visibility to other users for the leaderboard.

## Database and security

- Add a Supabase migration for a `get_leaderboard(period)` security-definer RPC that:
  - accepts only `today`, `week`, or `month`;
  - counts only completed rows in `public.tasks` for the matching date range;
  - joins `public.profiles` internally to obtain display names;
  - returns only display name and aggregate completed-task count (no user IDs, emails, titles, or task rows);
  - returns users with at least one completed task, ordered by count descending and name ascending;
  - uses a fixed `search_path` and grants execute only to authenticated users.
- Keep RLS enabled on the underlying tables and do not add public/anonymous access.
- Confirm grants and policy ordering in the migration before execution.
- Add the corresponding MySQL-compatible leaderboard query/documentation for future Laravel + MySQL integration without changing the live frontend data source.

## Files likely to change

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/Landing.tsx`
- `src/pages/Leaderboard.tsx` (new)
- `supabase/migrations/` (created by the migration tool)
- `database/mysql/analytics.sql` and/or `database/README.md` for the future-backend query
- Remove `src/pages/Analytics.tsx` after all references are removed.

## Validation

- Confirm no dashboard route or navigation item points to Journey/Analytics.
- Confirm signed-out users are redirected by the existing protected dashboard route.
- Confirm a signed-in user can still create a task and goal under their own account.
- Confirm leaderboard tabs call the RPC and sort counts correctly.
- Confirm a user with no completed task is omitted, while users with at least one completed task are included.
- Verify desktop and mobile navigation retain their current structure and responsive behavior.
