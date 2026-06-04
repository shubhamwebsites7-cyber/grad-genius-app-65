import { useEffect, useMemo, useState } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Daily {
  date: string;
  label: string;
  tasksCompleted: number;
  focusHours: number;
  avgFocusRating: number;
  productivity: number;
  consistent: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [days, setDays] = useState<Daily[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date();
      const start = subDays(today, 29);
      const startStr = format(start, 'yyyy-MM-dd');

      const [tasksRes, sessionsRes, ratingsRes, goalsRes] = await Promise.all([
        supabase.from('tasks').select('date, completed').eq('user_id', user.id).gte('date', startStr),
        (supabase as any).from('pomodoro_sessions').select('date, duration_seconds, priority').eq('user_id', user.id).gte('date', startStr),
        (supabase as any).from('focus_ratings').select('date, rating').eq('user_id', user.id).gte('date', startStr),
        supabase.from('goal').select('completed').eq('user_id', user.id),
      ]);

      const tasks = tasksRes.data || [];
      const sessions = sessionsRes.data || [];
      const ratings = ratingsRes.data || [];

      const dayList = eachDayOfInterval({ start, end: today });
      const built: Daily[] = dayList.map((d) => {
        const ds = format(d, 'yyyy-MM-dd');
        const tDay = tasks.filter((t: any) => t.date === ds);
        const completed = tDay.filter((t: any) => t.completed).length;
        const focusSec = sessions
          .filter((s: any) => s.date === ds && s.priority !== 'break')
          .reduce((a: number, s: any) => a + s.duration_seconds, 0);
        const focusH = focusSec / 3600;
        const rDay = ratings.filter((r: any) => r.date === ds);
        const avgR = rDay.length ? rDay.reduce((a: number, r: any) => a + r.rating, 0) / rDay.length : 0;

        // Productivity score: 50% tasks (out of 10) + 40% focus (cap 8h) + 10% rating
        const taskPct = Math.min(1, completed / 10);
        const focusPct = Math.min(1, focusH / 8);
        const ratingPct = avgR ? avgR / 10 : 0;
        const score = Math.round((taskPct * 50 + focusPct * 40 + ratingPct * 10));

        return {
          date: ds,
          label: format(d, 'dd'),
          tasksCompleted: completed,
          focusHours: +focusH.toFixed(2),
          avgFocusRating: +avgR.toFixed(1),
          productivity: score,
          consistent: completed > 0 || focusH > 0 ? 1 : 0,
        };
      });
      setDays(built);
    })();
  }, [user]);

  const kpis = useMemo(() => {
    if (!days.length) return { today: 0, avg: 0, streak: 0, totalFocus: 0, totalTasks: 0 };
    const today = days[days.length - 1];
    const avg = Math.round(days.reduce((a, d) => a + d.productivity, 0) / days.length);
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].consistent) streak++;
      else break;
    }
    const totalFocus = +days.reduce((a, d) => a + d.focusHours, 0).toFixed(1);
    const totalTasks = days.reduce((a, d) => a + d.tasksCompleted, 0);
    return { today: today.productivity, avg, streak, totalFocus, totalTasks };
  }, [days]);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto pb-20">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Productivity, focus, and consistency — last 30 days</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 sm:mb-6">
        <Kpi label="Today" value={`${kpis.today}`} suffix="/100" />
        <Kpi label="30-day avg" value={`${kpis.avg}`} suffix="/100" />
        <Kpi label="Streak" value={`${kpis.streak}`} suffix="d" />
        <Kpi label="Focus" value={`${kpis.totalFocus}`} suffix="h" />
        <Kpi label="Tasks done" value={`${kpis.totalTasks}`} suffix="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader><CardTitle>Daily productivity score</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="productivity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Focus hours vs tasks completed</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="focusHours" fill="hsl(var(--primary))" maxBarSize={20} />
                <Bar dataKey="tasksCompleted" fill="hsl(var(--accent))" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Average focus rating (self-reported)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Line type="monotone" dataKey="avgFocusRating" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl sm:text-2xl font-bold mt-1">
          {value}<span className="text-sm font-normal text-muted-foreground">{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}