import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AdminTask = { id: string; display_name: string; title: string; priority: string; completed: boolean };

export default function AdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Please sign in again.');
      const response = await supabase.functions.invoke('admin-today-tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.error) throw response.error;
      setTasks((response.data?.tasks ?? []) as AdminTask[]);
    } catch (error) {
      setTasks([]);
      toast({
        title: 'Admin access required',
        description: error instanceof Error ? error.message : 'You cannot view these tasks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const grouped = tasks.reduce<Record<string, AdminTask[]>>((groups, task) => {
    (groups[task.display_name] ??= []).push(task);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Today’s tasks</h1></div>
          <p className="text-sm text-muted-foreground">Admin-only view of what users are completing today.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Refresh today’s tasks"><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {loading ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading today’s tasks…</CardContent></Card>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No tasks have been added today.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, userTasks]) => (
            <Card key={name}>
              <CardHeader className="pb-3"><CardTitle className="text-base">{name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {userTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {task.completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className={task.completed ? 'truncate line-through text-muted-foreground' : 'truncate'}>{task.title}</span>
                    </div>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">{task.priority}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}