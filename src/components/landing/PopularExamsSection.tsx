import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Users, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const formatStudentCount = (count: number): string => {
  if (count >= 100000) return `${Math.floor(count / 100000)}L+`;
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-4 w-28 mb-6" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const PopularExamsSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [enrollingId, setEnrollingId] = React.useState<string | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ['popular-exams-landing', user?.id],
    queryFn: async () => {
      // Fetch top 6 exams with category
      const { data: examsData, error } = await supabase
        .from('exams')
        .select(`
          id, name, full_name, enrollment_count,
          exam_categories(id, name, color)
        `)
        .eq('is_active', true)
        .order('enrollment_count', { ascending: false })
        .limit(6);

      if (error) throw error;

      const examIds = (examsData || []).map((e: any) => e.id);

      // Fetch subjects and topic counts in parallel
      const [subjectsRes, topicsRes, enrollmentsRes] = await Promise.all([
        (supabase as any)
          .from('exam_subjects')
          .select('exam_id, subjects(id, name)')
          .in('exam_id', examIds)
          .eq('is_active', true),
        (supabase as any)
          .from('exam_topics')
          .select('exam_id')
          .in('exam_id', examIds)
          .eq('is_active', true),
        user
          ? supabase
              .from('user_exam_enrollments')
              .select('exam_id')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .in('exam_id', examIds)
          : Promise.resolve({ data: [] }),
      ]);

      const topicCountMap: Record<string, number> = {};
      (topicsRes.data || []).forEach((t: any) => {
        topicCountMap[t.exam_id] = (topicCountMap[t.exam_id] || 0) + 1;
      });

      const subjectMap: Record<string, { id: string; name: string }[]> = {};
      (subjectsRes.data || []).forEach((es: any) => {
        if (!subjectMap[es.exam_id]) subjectMap[es.exam_id] = [];
        if (es.subjects) subjectMap[es.exam_id].push(es.subjects);
      });

      const enrolledSet = new Set(
        ((enrollmentsRes as any).data || []).map((e: any) => e.exam_id)
      );

      return (examsData || []).map((exam: any) => ({
        id: exam.id,
        name: exam.name,
        fullName: exam.full_name || exam.name,
        students: formatStudentCount(exam.enrollment_count || 0),
        topics: topicCountMap[exam.id] || 0,
        subjects: subjectMap[exam.id] || [],
        categoryName: exam.exam_categories?.name || 'General',
        categoryColor: exam.exam_categories?.color || undefined,
        isEnrolled: enrolledSet.has(exam.id),
      }));
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const handleEnroll = async (examId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setEnrollingId(examId);
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subData) {
        const { count } = await supabase
          .from('user_exam_enrollments')
          .select('exam_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);
        if (count && count >= 1) {
          navigate('/pricing');
          return;
        }
      }

      const { error } = await supabase
        .from('user_exam_enrollments')
        .insert({ user_id: user.id, exam_id: examId, is_active: true } as any);
      if (error) throw error;

      toast({ title: 'Enrolled Successfully' });
      // Refetch will update the card
    } catch (err: any) {
      toast({ title: 'Enrollment Failed', description: err.message, variant: 'destructive' });
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <Badge variant="outline" className="px-4 py-2 text-sm font-semibold border-primary text-primary">
              Most Popular
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Top Competitive{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Exams
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start tracking your preparation for the most sought-after competitive exams
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {(exams || []).map((exam, index) => (
              <Card
                key={exam.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl">{exam.name}</CardTitle>
                    <Badge
                      className="flex-shrink-0 text-xs"
                      style={{
                        backgroundColor: exam.categoryColor ? `${exam.categoryColor}20` : undefined,
                        color: exam.categoryColor || undefined,
                        borderColor: exam.categoryColor || undefined,
                      }}
                    >
                      {exam.categoryName}
                    </Badge>
                  </div>
                  {exam.fullName !== exam.name && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{exam.fullName}</p>
                  )}
                  {/* Subject badges */}
                  {exam.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {exam.subjects.map((s: any) => (
                        <Badge key={s.id} variant="outline" className="text-xs">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{exam.students}</span>
                      <span className="ml-1">Students</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{exam.topics}</span>
                      <span className="ml-1">Topics</span>
                    </div>
                  </div>

                  {/* Action Buttons - same as Exams page */}
                  <div className="flex gap-3">
                    {exam.isEnrolled ? (
                      <Button asChild variant="hero" className="flex-1">
                        <Link to={`/exam/${exam.id}`}>Continue</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="hero"
                        className="flex-1"
                        onClick={() => handleEnroll(exam.id)}
                        disabled={enrollingId === exam.id}
                      >
                        {enrollingId === exam.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          'Enroll'
                        )}
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to={`/exam/${exam.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button variant="outline" size="lg" asChild>
            <Link to="/exams">
              View All Exams
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
