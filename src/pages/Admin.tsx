import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Row {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  total: number;
  done: number;
}

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: profiles }, { data: todos }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }),
        supabase.from('todos').select('user_id, is_completed'),
      ]);
      const list = (profiles ?? []).map((p) => {
        const mine = (todos ?? []).filter((t) => t.user_id === p.id);
        return {
          ...p,
          total: mine.length,
          done: mine.filter((t) => t.is_completed).length,
        } as Row;
      });
      setRows(list);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">You do not have access to this page.</p>
        </main>
      </div>
    );
  }

  const totalTasks = rows.reduce((s, r) => s + r.total, 0);
  const doneTasks = rows.reduce((s, r) => s + r.done, 0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin — TaskFlow</title>
        <meta name="description" content="Admin overview of TaskFlow users and task activity." />
      </Helmet>
      <AppHeader />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Users</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{rows.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Tasks</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalTasks}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{doneTasks}</CardContent></Card>
        </div>

        <Card className="mt-6">
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.full_name || r.email || 'User'}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                    </div>
                    <p className="text-muted-foreground">{r.done}/{r.total} done</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
