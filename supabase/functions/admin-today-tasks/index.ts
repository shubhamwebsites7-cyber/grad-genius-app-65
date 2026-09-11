import { authenticatedUser, corsHeaders, isAdmin, serviceClient } from '../_shared/auth.ts';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await authenticatedUser(request);
  if (!user) return json({ error: 'Authentication required' }, 401);
  if (!(await isAdmin(user.id))) return json({ error: 'Admin access required' }, 403);
  const today = new Date().toISOString().slice(0, 10);
  const client = serviceClient();
  const { data: taskRows, error } = await client.from('tasks').select('id,user_id,title,priority,completed').eq('date', today).order('created_at', { ascending: true });
  if (error) return json({ error: error.message }, 500);
  const ids = [...new Set((taskRows ?? []).map((task) => task.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: profiles } = await client.from('profiles').select('user_id,name').in('user_id', ids);
    for (const profile of profiles ?? []) names.set(profile.user_id, profile.name?.trim() || 'GoalGrip member');
  }
  return json({ tasks: (taskRows ?? []).map((task) => ({ ...task, display_name: names.get(task.user_id) ?? 'GoalGrip member' })) });
});