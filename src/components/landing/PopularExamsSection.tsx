import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Users, BookOpen, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const GRADIENTS = [
  { gradient: 'from-rose-500 to-pink-600', bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20' },
  { gradient: 'from-blue-500 to-cyan-600', bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' },
  { gradient: 'from-violet-500 to-purple-600', bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20' },
  { gradient: 'from-orange-500 to-amber-600', bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20' },
  { gradient: 'from-emerald-500 to-teal-600', bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20' },
  { gradient: 'from-indigo-500 to-blue-600', bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20' },
];

const formatStudentCount = (count: number): string => {
  if (count >= 100000) return `${Math.floor(count / 100000)}L+`;
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
};

interface ExamCardProps {
  name: string;
  fullName: string;
  students: string;
  topics: string;
  gradient: string;
  bgGradient: string;
  index: number;
}

const ExamCard = React.memo(({ name, fullName, students, topics, gradient, bgGradient, index }: ExamCardProps) => (
  <Card 
    className={`overflow-hidden animate-fade-in bg-gradient-to-br ${bgGradient}`}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {fullName}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} opacity-10`}></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2 text-primary" />
          <span className="font-semibold text-foreground">{students}</span>
          <span className="ml-1">Students</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-2 text-primary" />
          <span className="font-semibold text-foreground">{topics}</span>
          <span className="ml-1">Topics</span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        asChild
      >
        <Link to="/signup">
          Start Tracking
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </CardContent>
  </Card>
));

ExamCard.displayName = 'ExamCard';

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
  const { data: exams, isLoading } = useQuery({
    queryKey: ['popular-exams-landing'],
    queryFn: async () => {
      // Fetch top 6 exams by enrollment count
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('id, name, full_name, enrollment_count')
        .eq('is_active', true)
        .order('enrollment_count', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch topic counts per exam via exam_topics junction
      const examIds = (examsData || []).map(e => e.id);
      const { data: topicCounts } = await (supabase as any)
        .from('exam_topics')
        .select('exam_id')
        .in('exam_id', examIds)
        .eq('is_active', true);

      // Count topics per exam
      const topicCountMap: Record<string, number> = {};
      (topicCounts || []).forEach((t: any) => {
        topicCountMap[t.exam_id] = (topicCountMap[t.exam_id] || 0) + 1;
      });

      return (examsData || []).map((exam: any, index: number) => ({
        name: exam.name,
        fullName: exam.full_name || exam.name,
        students: formatStudentCount(exam.enrollment_count || 0),
        topics: `${topicCountMap[exam.id] || 0}+`,
        ...GRADIENTS[index % GRADIENTS.length],
      }));
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const totalExams = useMemo(() => exams?.length || 0, [exams]);

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
              <ExamCard key={exam.name} {...exam} index={index} />
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
