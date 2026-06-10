import { useEffect, useMemo, useRef, useState } from 'react';
import { format, subDays, subMonths, eachDayOfInterval, eachWeekOfInterval, endOfWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Pause, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, CalendarIcon, Timer as TimerIcon, Check } from 'lucide-react';
import { addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, CartesianGrid } from 'recharts';
import { notifyPomodoroComplete } from '@/lib/notifications/scheduler';

type Priority = 'high' | 'medium' | 'low';
type Category = Priority | 'break';

interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  date: string;
}

interface PomoSession {
  id: string;
  task_id: string | null;
  priority: Category;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  date: string;
}

const PRESETS = {
  classic: { work: 25 * 60, break: 5 * 60, label: '25 / 5' },
  long: { work: 45 * 60, break: 15 * 60, label: '45 / 15' },
} as const;
type PresetKey = keyof typeof PRESETS;

const CATEGORY_COLOR: Record<Category, string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#22c55e',
  break: '#3b82f6',
};

const fmtMs = (ms: number) => {
  const totalMs = Math.max(0, ms);
  const m = Math.floor(totalMs / 60000).toString().padStart(2, '0');
  const s = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
  const cs = Math.floor((totalMs % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${s}.${cs}`;
};

function CircularTimer({
  totalMs,
  remainingMs,
  mode,
}: {
  totalMs: number;
  remainingMs: number;
  mode: 'work' | 'break' | 'idle';
}) {
  const size = 240;
  const stroke = 10;
  const rings = [
    { r: (size - stroke) / 2, color: mode === 'break' ? '#ef4444' : '#22c55e', progress: totalMs > 0 ? 1 - remainingMs / totalMs : 0 },
    { r: (size - stroke) / 2 - (stroke + 4), color: '#3b82f6', progress: 1 - ((remainingMs % 60000) / 60000) },
  ];
  return (
    <svg width={size} height={size} className="mx-auto">
      {rings.map((ring, i) => {
        const c = 2 * Math.PI * ring.r;
        const dash = c * ring.progress;
        return (
          <g key={i}>
            <circle cx={size / 2} cy={size / 2} r={ring.r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={ring.r}
              stroke={ring.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={c / 4}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <text x="50%" y="48%" textAnchor="middle" className="fill-foreground" fontSize="30" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {fmtMs(remainingMs)}
      </text>
      <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground" fontSize="12">
        {mode === 'break' ? 'Break' : mode === 'work' ? 'Focus' : 'Ready'} · mm:ss.cs
      </text>
    </svg>
  );
}

function DayRing({ sessions, dateStr }: { sessions: PomoSession[]; dateStr: string }) {
  const size = 260;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const dayStart = new Date(`${dateStr}T00:00:00`).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const arcs = sessions
    .filter((s) => s.date === dateStr)
    .map((s) => {
      const start = Math.max(0, new Date(s.started_at).getTime() - dayStart) / dayMs;
      const end = Math.min(1, new Date(s.ended_at).getTime() - dayStart) / dayMs;
      return { start, end, color: CATEGORY_COLOR[s.priority] };
    });

  const polar = (frac: number) => {
    const a = -Math.PI / 2 + frac * 2 * Math.PI;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const arcPath = (s: number, e: number) => {
    if (e <= s) return '';
    const p1 = polar(s);
    const p2 = polar(e);
    const large = e - s > 0.5 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle cx={cx} cy={cy} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
      {arcs.map((a, i) => (
        <path key={i} d={arcPath(a.start, a.end)} stroke={a.color} strokeWidth={stroke} fill="none" strokeLinecap="butt" />
      ))}
      {/* Minute dots */}
      {Array.from({ length: 1440 }).map((_, m) => {
        const p = polar(m / 1440);
        const isHour = m % 60 === 0;
        return (
          <circle
            key={m}
            cx={p.x}
            cy={p.y}
            r={isHour ? 1.2 : 0.4}
            className={isHour ? 'fill-foreground/60' : 'fill-muted-foreground/40'}
          />
        );
      })}
      {/* Hour numbers 0-23, placed inside the ring */}
      {Array.from({ length: 24 }).map((_, h) => {
        const a = -Math.PI / 2 + (h / 24) * 2 * Math.PI;
        const tr = r - stroke / 2 - 10;
        const x = cx + tr * Math.cos(a);
        const y = cy + tr * Math.sin(a);
        return (
          <text
            key={h}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            className="fill-muted-foreground"
          >
            {h}
          </text>
        );
      })}
      <text x="50%" y="48%" textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="700">
        {Math.round(arcs.reduce((acc, a) => acc + (a.end - a.start) * 24 * 60, 0))}m
      </text>
      <text x="50%" y="58%" textAnchor="middle" className="fill-muted-foreground" fontSize="11">
        tracked today
      </text>
    </svg>
  );
}

export default function Pomodoro() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetKey>('classic');
  const [mode, setMode] = useState<'work' | 'break' | 'idle'>('idle');
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(PRESETS.classic.work * 1000);
  const intervalStartRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<PomoSession[]>([]);
  const [daySessions, setDaySessions] = useState<PomoSession[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '1m' | '3m' | '6m' | '1y'>('7d');

  const total = mode === 'break' ? PRESETS[preset].break : PRESETS[preset].work;
  const totalMs = total * 1000;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  // Fetch today's tasks
  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at')
      .then(({ data }) => setTasks(((data || []) as Task[])));
  }, [user]);

  // Fetch sessions and aggregate based on selected chart period
  const fetchSessions = async () => {
    if (!user) return;
    try {
      const today = new Date();
      let startDate: Date;
      let groupMode: 'day' | 'week';
      switch (chartPeriod) {
        case '7d': startDate = subDays(today, 6); groupMode = 'day'; break;
        case '1m': startDate = subDays(today, 29); groupMode = 'day'; break;
        case '3m': startDate = subMonths(today, 3); groupMode = 'week'; break;
        case '6m': startDate = subMonths(today, 6); groupMode = 'week'; break;
        case '1y': startDate = subMonths(today, 12); groupMode = 'week'; break;
        default: startDate = subDays(today, 6); groupMode = 'day';
      }
      const { data, error } = await (supabase as any)
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .limit(5000);
      if (error) throw error;
      const rows = (data || []) as PomoSession[];
      setSessions(rows);

      const sumCat = (subset: PomoSession[], cat: Category) =>
        subset.filter((r) => r.priority === cat).reduce((a, r) => a + r.duration_seconds, 0) / 3600;

      if (groupMode === 'day') {
        const days = eachDayOfInterval({ start: startDate, end: today });
        setWeekData(
          days.map((d) => {
            const ds = format(d, 'yyyy-MM-dd');
            const subset = rows.filter((r) => r.date === ds);
            return {
              label: format(d, 'dd'),
              high: +sumCat(subset, 'high').toFixed(2),
              medium: +sumCat(subset, 'medium').toFixed(2),
              low: +sumCat(subset, 'low').toFixed(2),
              break: +sumCat(subset, 'break').toFixed(2),
            };
          })
        );
      } else {
        const weeks = eachWeekOfInterval({ start: startDate, end: today });
        setWeekData(
          weeks.map((wkStart, idx) => {
            const wkEnd = endOfWeek(wkStart);
            const subset = rows.filter((r) => {
              const d = new Date(r.date);
              return d >= wkStart && d <= wkEnd;
            });
            return {
              label: `${format(wkStart, 'MMM')} ${format(wkStart, 'dd')}`,
              key: `${idx}-${format(wkStart, 'yyyy-MM-dd')}`,
              high: +sumCat(subset, 'high').toFixed(2),
              medium: +sumCat(subset, 'medium').toFixed(2),
              low: +sumCat(subset, 'low').toFixed(2),
              break: +sumCat(subset, 'break').toFixed(2),
            };
          })
        );
      }
    } catch (e) {
      console.error('fetchSessions error', e);
      setWeekData([]);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, chartPeriod]);

  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch sessions for the 24h timeline of the selected viewDate
  useEffect(() => {
    if (!user) return;
    const ds = format(viewDate, 'yyyy-MM-dd');
    (supabase as any)
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', ds)
      .then(({ data }: any) => setDaySessions((data || []) as PomoSession[]));
  }, [user, viewDate, sessions]);

  // Timer ticking
  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    let last = performance.now();
    tickRef.current = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setRemainingMs((r) => {
        const next = r - delta;
        if (next <= 0) {
          handleIntervalComplete();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, preset]);

  const recordSession = async (cat: Category, durationSec: number) => {
    if (!user) return;
    const ended = new Date();
    const started = new Date(ended.getTime() - durationSec * 1000);
    await (supabase as any).from('pomodoro_sessions').insert([
      {
        user_id: user.id,
        task_id: cat === 'break' ? null : selectedTaskId,
        priority: cat,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_seconds: durationSec,
        date: format(ended, 'yyyy-MM-dd'),
      },
    ]);
    fetchSessions();
  };

  const handleIntervalComplete = async () => {
    setRunning(false);
    const finishedMode = mode;
    const dur = finishedMode === 'break' ? PRESETS[preset].break : PRESETS[preset].work;
    const cat: Category = finishedMode === 'break' ? 'break' : (selectedTask?.priority || 'low');
    await recordSession(cat, dur);
    if (finishedMode === 'work') {
      setMode('break');
      setRemainingMs(PRESETS[preset].break * 1000);
      toast({ title: 'Focus complete', description: 'Time for a break!' });
      notifyPomodoroComplete();
    } else {
      setMode('idle');
      setRemainingMs(PRESETS[preset].work * 1000);
      toast({ title: 'Break done', description: 'Ready for next pomodoro.' });
    }
  };

  const start = () => {
    if (mode === 'idle') {
      if (!selectedTaskId) {
        toast({ title: 'Pick a task', description: 'Select a task to focus on.', variant: 'destructive' });
        return;
      }
      setMode('work');
      setRemainingMs(PRESETS[preset].work * 1000);
    }
    intervalStartRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setMode('idle');
    setRemainingMs(PRESETS[preset].work * 1000);
  };

  useEffect(() => {
    if (mode === 'idle') setRemainingMs(PRESETS[preset].work * 1000);
  }, [preset, mode]);

  const completeSelectedTask = async () => {
    if (!selectedTask) return;
    const { error } = await supabase.from('tasks').update({ completed: !selectedTask.completed }).eq('id', selectedTask.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, completed: !t.completed } : t)));
  };

  const priorityDot = (p: Priority) =>
    p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500';

  const viewDateStr = format(viewDate, 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <TimerIcon className="h-6 w-6 text-primary" /> Pomodoro
          </h1>
          <p className="text-muted-foreground text-sm">Focus and track your time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Timer card */}
        <Card>
          <CardHeader>
            <CardTitle>Focus Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task</label>
              <div className="flex gap-2">
                <Select value={selectedTaskId ?? ''} onValueChange={(v) => setSelectedTaskId(v || null)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choose a task..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {tasks.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No tasks for today</div>
                    )}
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${priorityDot(t.priority)}`} />
                          <span className={t.completed ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTask && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={completeSelectedTask}
                    title={selectedTask.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    <Check className={`h-4 w-4 ${selectedTask.completed ? 'text-primary' : ''}`} />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Preset</label>
              <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)} disabled={running}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">25 min work / 5 min break</SelectItem>
                  <SelectItem value="long">45 min work / 15 min break</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CircularTimer totalMs={totalMs} remainingMs={remainingMs} mode={mode} />

            <div className="flex gap-2 justify-center">
              {!running ? (
                <Button onClick={start}>
                  <Play className="h-4 w-4 mr-1" /> Start
                </Button>
              ) : (
                <Button onClick={pause} variant="secondary">
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              )}
              <Button onClick={reset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Day ring */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>24h Timeline</CardTitle>
              <div className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1 py-0.5 text-xs">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(addDays(viewDate, -1))} aria-label="Previous day">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-1 tabular-nums whitespace-nowrap">{format(viewDate, 'MMM do, yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(addDays(viewDate, 1))} aria-label="Next day">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Open calendar">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="center" sideOffset={6} className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={viewDate}
                      onSelect={(d) => { if (d) { setViewDate(d); setCalendarOpen(false); } }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DayRing sessions={daySessions} dateStr={viewDateStr} />
            <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs">
              {(['high', 'medium', 'low', 'break'] as const).map((c) => (
                <span key={c} className="flex items-center gap-1.5 capitalize">
                  <span className="h-3 w-3 rounded-sm" style={{ background: CATEGORY_COLOR[c] }} />
                  {c}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time analytics chart */}
      <Card className="mt-4 sm:mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>
              {chartPeriod === '7d' ? 'Last 7 Days'
                : chartPeriod === '1m' ? 'Last 1 Month'
                : chartPeriod === '3m' ? 'Last 3 Months'
                : chartPeriod === '6m' ? 'Last 6 Months'
                : 'Last 1 Year'}
            </CardTitle>
            <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as typeof chartPeriod)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months (weekly)</SelectItem>
                <SelectItem value="6m">6 Months (weekly)</SelectItem>
                <SelectItem value="1y">1 Year (weekly)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="overflow-x-auto [&_.recharts-wrapper_*]:outline-none [&_.recharts-surface]:outline-none">
            <div style={{ minWidth: `${Math.max(500, weekData.length * 38)}px` }} className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} height={30} />
                  <YAxis
                    domain={[0, 24]}
                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'hrs', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(v: number, name: string) => [`${Number(v).toFixed(2)}h`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="high" stackId="a" fill={CATEGORY_COLOR.high} maxBarSize={24} />
                  <Bar dataKey="medium" stackId="a" fill={CATEGORY_COLOR.medium} maxBarSize={24} />
                  <Bar dataKey="low" stackId="a" fill={CATEGORY_COLOR.low} maxBarSize={24} />
                  <Bar dataKey="break" stackId="a" fill={CATEGORY_COLOR.break} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}