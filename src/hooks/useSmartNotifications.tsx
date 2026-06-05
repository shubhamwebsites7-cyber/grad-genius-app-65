import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startSmartReminders } from '@/lib/notifications/scheduler';

/** Mount once (inside Layout) to start the background reminder loop. */
export function useSmartNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    startSmartReminders(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [tasksRes, goalsRes, profileRes] = await Promise.all([
        supabase.from('tasks').select('completed').eq('user_id', user.id).eq('date', today),
        supabase.from('goal').select('completed').eq('user_id', user.id),
        supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle(),
      ]);
      const tasks = tasksRes.data || [];
      const goals = goalsRes.data || [];
      return {
        name: (profileRes.data as any)?.name || user.email?.split('@')[0] || 'there',
        todosTotal: tasks.length,
        todosCompleted: tasks.filter((t: any) => t.completed).length,
        goalsPending: goals.filter((g: any) => !g.completed).length,
      };
    });
  }, [user]);
}