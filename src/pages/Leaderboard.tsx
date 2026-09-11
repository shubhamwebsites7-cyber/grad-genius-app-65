import { useCallback, useEffect, useState } from 'react';
import { Medal, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Period = 'today' | 'week' | 'month';
type Entry = { display_name: string; completed_count: number };

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>('today');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Please sign in again.');
      const response = await supabase.functions.invoke('leaderboard', {
        body: { period },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.error) throw response.error;
      setEntries((response.data?.entries ?? []) as Entry[]);
    } catch (error) {
      setEntries([]);
      toast({
        title: 'Could not load leaderboard',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Completed tasks, ranked from highest to lowest.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Refresh leaderboard">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {period === 'today' ? "Today's" : period === 'week' ? 'This week’s' : 'This month’s'} completed tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading leaderboard…</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No completed tasks for this period yet.</p>
          ) : entries.map((entry, index) => (
            <div key={`${entry.display_name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-7 text-center font-semibold text-muted-foreground">{index + 1}</span>
                {index < 3 ? <Medal className="h-4 w-4 text-primary" /> : <span className="w-4" />}
                <span className="truncate font-medium">{entry.display_name}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold">{entry.completed_count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}