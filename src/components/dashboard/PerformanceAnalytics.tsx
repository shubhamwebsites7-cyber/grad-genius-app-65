import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Timer, Flame, Clock, BookOpen, BarChart3, TrendingUp } from 'lucide-react';

interface DailyData {
  date: string;
  workMinutes: number;
  breakMinutes: number;
  topicsCompleted: number;
}

interface SubjectTime {
  name: string;
  minutes: number;
  percentage: number;
}

const PerformanceAnalytics = () => {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [subjectTimes, setSubjectTimes] = useState<SubjectTime[]>([]);
  const [streak, setStreak] = useState(0);
  const [peakHour, setPeakHour] = useState('');
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(0);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [weeklyTopics, setWeeklyTopics] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await (supabase as any)
      .from('pomodoro_sessions')
      .select('*, subjects(name)')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!sessions || sessions.length === 0) {
      setLoading(false);
      return;
    }

    // Daily aggregation
    const dayMap: Record<string, DailyData> = {};
    const subjectMap: Record<string, { name: string; minutes: number }> = {};
    const hourMap: Record<number, number> = {};
    let totalWork = 0, totalBreak = 0;

    sessions.forEach((s: any) => {
      const date = new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!dayMap[date]) dayMap[date] = { date, workMinutes: 0, breakMinutes: 0, topicsCompleted: 0 };

      if (s.session_type === 'work') {
        dayMap[date].workMinutes += s.duration_minutes;
        totalWork += s.duration_minutes;
      } else {
        dayMap[date].breakMinutes += s.duration_minutes;
        totalBreak += s.duration_minutes;
      }

      // Subject tracking
      const subName = s.subjects?.name || 'Unknown';
      if (!subjectMap[s.subject_id]) subjectMap[s.subject_id] = { name: subName, minutes: 0 };
      if (s.session_type === 'work') subjectMap[s.subject_id].minutes += s.duration_minutes;

      // Peak hour
      const hour = new Date(s.created_at).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + s.duration_minutes;
    });

    setDailyData(Object.values(dayMap).slice(-7));
    setTotalWorkMinutes(totalWork);
    setTotalBreakMinutes(totalBreak);

    // Subject times
    const totalSubjectMins = Object.values(subjectMap).reduce((s, v) => s + v.minutes, 0);
    setSubjectTimes(
      Object.values(subjectMap)
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5)
        .map(s => ({ ...s, percentage: totalSubjectMins > 0 ? Math.round((s.minutes / totalSubjectMins) * 100) : 0 }))
    );

    // Peak hour
    const peak = Object.entries(hourMap).sort(([, a], [, b]) => b - a)[0];
    if (peak) {
      const h = parseInt(peak[0]);
      setPeakHour(h < 6 ? 'Late Night 🌙' : h < 12 ? 'Morning ☀️' : h < 17 ? 'Afternoon 🌤️' : h < 21 ? 'Evening 🌆' : 'Night 🌙');
    }

    // Streak calculation
    const uniqueDates = [...new Set(sessions.filter((s: any) => s.session_type === 'work').map((s: any) => new Date(s.created_at).toDateString()))] as string[];
    uniqueDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (new Date(uniqueDates[i] as string).toDateString() === expected.toDateString()) {
        currentStreak++;
      } else break;
    }
    setStreak(currentStreak);

    // Weekly topics - count unique topics studied in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekTopics = new Set(sessions.filter((s: any) => s.session_type === 'work' && new Date(s.created_at) >= sevenDaysAgo).map((s: any) => s.topic_id));
    setWeeklyTopics(weekTopics.size);

    setLoading(false);
  };

  const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Timer className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-3">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Study Data Yet</h3>
          <p className="text-muted-foreground text-sm">
            Start a Pomodoro session to see your analytics here.
          </p>
        </div>
      </Card>
    );
  }

  const maxDailyMinutes = Math.max(...dailyData.map(d => d.workMinutes + d.breakMinutes), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatMinutes(totalWorkMinutes)}</p>
            <p className="text-xs text-muted-foreground">Total Study</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{peakHour || '-'}</p>
            <p className="text-xs text-muted-foreground">Peak Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{weeklyTopics}</p>
            <p className="text-xs text-muted-foreground">Topics This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Study Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Daily Study Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {dailyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
                  <div className="w-full flex flex-col justify-end h-full gap-0.5">
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${(d.breakMinutes / maxDailyMinutes) * 100}%`, minHeight: d.breakMinutes > 0 ? 4 : 0 }}
                    />
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(d.workMinutes / maxDailyMinutes) * 100}%`, minHeight: d.workMinutes > 0 ? 4 : 0 }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{d.date.split(' ')[1]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary rounded" /> Work</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary/20 rounded" /> Break</div>
          </div>
        </CardContent>
      </Card>

      {/* Work vs Break Ratio */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Work vs Break Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Work</span>
              <span className="font-medium">{formatMinutes(totalWorkMinutes)}</span>
            </div>
            <Progress value={totalWorkMinutes + totalBreakMinutes > 0 ? (totalWorkMinutes / (totalWorkMinutes + totalBreakMinutes)) * 100 : 0} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Break</span>
              <span className="font-medium">{formatMinutes(totalBreakMinutes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Focus */}
      {subjectTimes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Subject Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectTimes.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-medium">{s.percentage}% · {formatMinutes(s.minutes)}</span>
                </div>
                <Progress value={s.percentage} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Study</p>
              <p className="text-lg font-bold text-foreground">
                {formatMinutes(dailyData.reduce((s, d) => s + d.workMinutes, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topics Covered</p>
              <p className="text-lg font-bold text-foreground">{weeklyTopics}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Daily</p>
              <p className="text-lg font-bold text-foreground">
                {formatMinutes(Math.round(dailyData.reduce((s, d) => s + d.workMinutes, 0) / Math.max(dailyData.length, 1)))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-lg font-bold text-foreground">{streak} days 🔥</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics;
