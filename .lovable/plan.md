## Scope

Five changes across the app:

### 1. Todo page — top progress bar
- Add a 10-task progress bar at the top of `/dashboard/todo` showing `completed / 10`.
- Bar is segmented into 10 cells; each filled cell colored by that task's priority (red=high, yellow=medium, green=low). Empty cells use muted color.
- Order: high → medium → low (matching existing list order).

### 2. Todo page — calendar arrow dropdown
- Replace the always-visible date picker with a small chevron/arrow button next to the date label.
- Click toggles a smooth animated dropdown containing the existing `Calendar` (shadcn) for picking another day.

### 3. New Pomodoro page (`/dashboard/pomodoro`)
- Add nav item "Pomodoro" (Timer icon) to `Layout` navigation.
- Page contents:
  - **Task selector**: scrollable dropdown of today's tasks (max ~10). Shows priority dot.
  - **Quick complete**: checkmark button next to selected task to mark it done (updates `tasks.completed`).
  - **Preset selector**: `25/5` (default) or `45/15`.
  - **Circular timer**: SVG circular progress, green stroke during work, red during break, animated countdown (mm:ss in center), Start / Pause / Reset.
  - **Calendar dropdown**: pick any day to view that day's pomodoro data.
  - **24h daily timeline**: circular ring representing 24h. Each completed pomodoro / break renders as a colored arc by category (high=red, medium=yellow, low=green, break=blue, waste=muted gray for unaccounted time).
  - **Weekly column chart**: stacked bars for last 7 days; segments are total hours of high / medium / low / break / waste.
- New `pomodoro_sessions` table: `id, user_id, task_id (nullable), priority (high/medium/low/break), started_at, ended_at, duration_seconds, date`. RLS: user owns rows.

### 4. Layout navigation — desktop in top navbar, mobile stays bottom
- In `Layout.tsx`, render the nav items inline in the header on `md+` (hidden on mobile) and hide the bottom footer nav on `md+` (visible only on mobile).
- Add Pomodoro item to the same list.

### 5. Types & data
- Migration creates `pomodoro_sessions` with RLS + updated_at trigger.
- Pomodoro page reads/writes via supabase client; aggregates client-side for circular + bar charts.

## Technical notes

- Circular timer + 24h ring built with plain SVG (no new deps); column chart uses existing `recharts`.
- Use `framer-motion` (already common) only if available; otherwise CSS transitions for the calendar dropdown.
- Colors come from semantic tokens / existing priority classes — no hex in components.
- Active timer state lives in the page component (not persisted across reload); a session row is inserted only when a work/break interval completes.

## Files

- `supabase/migrations/<new>.sql` — `pomodoro_sessions` + RLS + trigger.
- `src/pages/Pomodoro.tsx` — new page.
- `src/App.tsx` — add `/dashboard/pomodoro` route.
- `src/components/Layout.tsx` — desktop top nav + mobile bottom nav, add Pomodoro item.
- `src/pages/Todo.tsx` — top 10-cell progress bar + calendar arrow dropdown.
