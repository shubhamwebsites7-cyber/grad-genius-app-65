import { authenticatedUser, corsHeaders, serviceClient } from '../_shared/auth.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await authenticatedUser(request);
  if (!user) return json({ error: 'Authentication required' }, 401);
  const body = await request.json().catch(() => ({}));
  const period = body.period;
  const days = period === 'today' ? 0 : period === 'week' ? 6 : period === 'month' ? 29 : -1;
  if (days < 0) return json({ error: 'Invalid period' }, 400);
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const client = serviceClient();
  const rows: { user_id: string }[] = [];
  for (let page = 0; page < 100; page += 1) {
    const { data, error } = await client.from('tasks').select('user_id').eq('completed', true).gte('date', startDate).lte('date', today).range(page * 1000, page * 1000 + 999);
    if (error) return json({ error: error.message }, 500);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const ids = [...new Set(rows.map((row) => row.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data } = await client.from('profiles').select('user_id,name').in('user_id', ids);
    for (const profile of data ?? []) names.set(profile.user_id, profile.name?.trim() || 'GoalGrip member');
  }
  const counts = new Map<string, { display_name: string; completed_count: number }>();
  for (const row of rows) {
    const display_name = names.get(row.user_id) ?? 'GoalGrip member';
    const current = counts.get(row.user_id) ?? { display_name, completed_count: 0 };
    current.completed_count += 1;
    counts.set(row.user_id, current);
  }
  return json({ entries: [...counts.values()].sort((a, b) => b.completed_count - a.completed_count || a.display_name.localeCompare(b.display_name)) });
});