import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  email: string;
  total_completed_topics: number;
  total_topics: number;
  avg_progress: number;
  exams_enrolled: number;
}

export const LeaderboardSection: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Fetch all user_exam_progress with user info
      const { data: progressData, error: progressError } = await supabase
        .from('user_exam_progress')
        .select('user_id, completed_topics, total_topics, progress_percentage, exam_id');

      if (progressError) throw progressError;

      if (!progressData || progressData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Aggregate per user
      const userMap = new Map<string, {
        total_completed: number;
        total_topics: number;
        progress_sum: number;
        exam_count: number;
      }>();

      progressData.forEach((row: any) => {
        const existing = userMap.get(row.user_id) || {
          total_completed: 0,
          total_topics: 0,
          progress_sum: 0,
          exam_count: 0,
        };
        existing.total_completed += row.completed_topics || 0;
        existing.total_topics += row.total_topics || 0;
        existing.progress_sum += Number(row.progress_percentage) || 0;
        existing.exam_count += 1;
        userMap.set(row.user_id, existing);
      });

      // Fetch user names
      const userIds = Array.from(userMap.keys());
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      if (usersError) throw usersError;

      const usersMap = new Map<string, { full_name: string; email: string }>();
      (usersData || []).forEach((u: any) => {
        usersMap.set(u.id, { full_name: u.full_name, email: u.email });
      });

      // Build leaderboard
      const entries: LeaderboardEntry[] = [];
      userMap.forEach((stats, userId) => {
        const userInfo = usersMap.get(userId);
        entries.push({
          user_id: userId,
          full_name: userInfo?.full_name || 'Unknown',
          email: userInfo?.email || '',
          total_completed_topics: stats.total_completed,
          total_topics: stats.total_topics,
          avg_progress: stats.exam_count > 0 ? stats.progress_sum / stats.exam_count : 0,
          exams_enrolled: stats.exam_count,
        });
      });

      // Sort by completed topics descending, then avg progress
      entries.sort((a, b) => {
        if (b.total_completed_topics !== a.total_completed_topics) {
          return b.total_completed_topics - a.total_completed_topics;
        }
        return b.avg_progress - a.avg_progress;
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    if (progress >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Syllabus Leaderboard</h2>
          <p className="text-muted-foreground">Overall progress across all exams and students</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Syllabus Leaderboard</h2>
        <p className="text-muted-foreground">Overall syllabus completion ranked across all students and exams</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderboard.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.length > 0
                ? (leaderboard.reduce((sum, e) => sum + e.avg_progress, 0) / leaderboard.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Topics Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard.reduce((sum, e) => sum + e.total_completed_topics, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Rankings</CardTitle>
          <CardDescription>Sorted by total completed topics across all enrolled exams</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No progress data available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Exams</TableHead>
                  <TableHead>Completed Topics</TableHead>
                  <TableHead>Total Topics</TableHead>
                  <TableHead>Avg Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow key={entry.user_id}>
                    <TableCell>{getRankIcon(index)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.full_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.exams_enrolled}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{entry.total_completed_topics}</TableCell>
                    <TableCell>{entry.total_topics}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getProgressColor(entry.avg_progress)}`}>
                        {entry.avg_progress.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
