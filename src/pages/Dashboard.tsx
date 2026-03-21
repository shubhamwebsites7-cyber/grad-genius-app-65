import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, BookOpen, Award, ArrowRight, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLoadingSkeleton } from '@/components/dashboard/DashboardLoadingSkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface Subject {
  name: string;
  progress: number;
  completed: number;
  total: number;
}

interface EnrolledExam {
  id: string;
  name: string;
  type: string;
  progress: number;
  completedTopics: number;
  totalTopics: number;
  enrolledStudents: string;
  subjects: Subject[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledExams, setEnrolledExams] = useState<EnrolledExam[]>([]);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState({
    percentage: 0,
    completedTopics: 0,
    totalTopics: 0
  });


  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const userId = user.id;

      // Fetch user's enrolled exams with progress
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_exam_enrollments')
        .select(`
          exam_id,
          exams (
            id,
            name,
            enrollment_count,
            exam_categories (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setEnrolledExams([]);
        setLoading(false);
        return;
      }

      const examIds = enrollments.map((e: any) => e.exam_id);

      // Fetch progress for each enrolled exam
      const { data: progressData, error: progressError } = await supabase
        .from('user_exam_progress')
        .select('*')
        .eq('user_id', userId)
        .in('exam_id', examIds);

      if (progressError) throw progressError;

      // Fetch subjects for each exam
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          id,
          exam_id,
          name
        `)
        .in('exam_id', examIds)
        .eq('is_active', true)
        .order('display_order');

      if (subjectsError) throw subjectsError;

      // Fetch topics for each subject to calculate subject-level progress
      const subjectIds = subjectsData?.map((s: any) => s.id) || [];
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, subject_id')
        .in('subject_id', subjectIds)
        .eq('is_active', true);

      if (topicsError) throw topicsError;

      // Build enrolled exams with complete data
      const examsWithProgress: EnrolledExam[] = enrollments.map((enrollment: any) => {
        const exam = enrollment.exams;
        const progress: any = progressData?.find((p: any) => p.exam_id === enrollment.exam_id);
        const examSubjects = subjectsData?.filter((s: any) => s.exam_id === enrollment.exam_id) || [];

        // Calculate subject progress
        const subjects: Subject[] = examSubjects.map((subject: any) => {
          const subjectTopics = topicsData?.filter((t: any) => t.subject_id === subject.id) || [];
          const totalTopics = subjectTopics.length;
          const completedTopics = subjectTopics.filter((t: any) => 
            progress?.completed_topics_ids?.includes(t.id)
          ).length;
          const subjectProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          return {
            name: subject.name,
            progress: subjectProgress,
            completed: completedTopics,
            total: totalTopics
          };
        });

        const examProgress = progress?.progress_percentage || 0;
        const completedTopics = progress?.completed_topics || 0;
        const totalTopics = progress?.total_topics || 0;

        return {
          id: exam.id,
          name: exam.name,
          type: exam.exam_categories?.name || 'General',
          progress: examProgress,
          completedTopics,
          totalTopics,
          enrolledStudents: `${exam.enrollment_count?.toLocaleString() || '0'}+`,
          subjects
        };
      });

      setEnrolledExams(examsWithProgress);

      // Calculate overall progress
      const totalCompleted = examsWithProgress.reduce((sum, exam) => sum + exam.completedTopics, 0);
      const totalAll = examsWithProgress.reduce((sum, exam) => sum + exam.totalTopics, 0);
      const overallPercentage = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

      setOverallProgress({
        percentage: overallPercentage,
        completedTopics: totalCompleted,
        totalTopics: totalAll
      });

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  // Get progress variant based on percentage
  const getProgressVariant = (percentage: number) => {
    if (percentage >= 61) return 'success';
    if (percentage >= 31) return 'warning';
    return 'destructive';
  };

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 61) return 'text-success';
    if (percentage >= 31) return 'text-warning';
    return 'text-destructive';
  };

  // Handle exam deletion
  const handleDeleteExam = async (examId: string, examName: string) => {
    try {
      setDeletingExamId(examId);
      
      // Delete user enrollment
      const { error: deleteError } = await supabase
        .from('user_exam_enrollments')
        .delete()
        .eq('user_id', user!.id)
        .eq('exam_id', examId);

      if (deleteError) throw deleteError;

      // Delete user progress
      await supabase
        .from('user_exam_progress')
        .delete()
        .eq('user_id', user!.id)
        .eq('exam_id', examId);

      toast({
        title: "Exam removed",
        description: `${examName} has been removed from your dashboard.`,
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Error deleting exam:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingExamId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - ExamTracker | Track Your Study Progress</title>
        <meta 
          name="description" 
          content="View your personalized exam preparation dashboard with progress tracking and analytics on ExamTracker." 
        />
        <link rel="canonical" href="/dashboard" />
        <meta name="robots" content="noindex, nofollow" />
        <meta 
          name="description" 
          content="Monitor your exam preparation progress, view analytics, and track your performance across all subjects and topics." 
        />
        <link rel="canonical" href="/dashboard" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        {loading ? (
          <DashboardLoadingSkeleton />
        ) : (
          <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Hi, let's continue your preparation!
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-col lg:items-end gap-4">
                <div className="flex gap-3 lg:self-end">
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link to="/exams">
                      <BookOpen className="h-4 w-4" />
                      Explore Exams
                    </Link>
                  </Button>
                  <Button asChild variant="hero" className="flex items-center gap-2">
                    <Link to="/exams/add">
                      <Plus className="h-4 w-4" />
                      Add Exam
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Overall Progress Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Exam Progress
                </CardTitle>
                <CardDescription>
                  Your progress across all enrolled exams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-2xl font-bold ${getProgressColor(overallProgress.percentage)}`}>
                      {overallProgress.percentage}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {overallProgress.completedTopics}/{overallProgress.totalTopics} topics completed
                    </span>
                  </div>
                  <Progress 
                    value={overallProgress.percentage} 
                    variant={getProgressVariant(overallProgress.percentage)}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enrolled Exams Overview */}
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-semibold text-foreground">Enrolled Exams</h2>
              {enrolledExams.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center space-y-4">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No Enrolled Exams</h3>
                    <p className="text-muted-foreground">
                      Start your preparation by enrolling in an exam
                    </p>
                    <Button asChild variant="hero">
                      <Link to="/exams">Browse Exams</Link>
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {enrolledExams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {exam.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {exam.completedTopics}/{exam.totalTopics} topics completed
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            {exam.type}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                disabled={deletingExamId === exam.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove this exam?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <span className="font-semibold">{exam.name}</span> from your dashboard? 
                                  This will delete all your progress data for this exam. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExam(exam.id, exam.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Exam
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Exam Overall Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Exam Progress</span>
                          <span className={`font-bold ${getProgressColor(exam.progress)}`}>
                            {exam.progress}%
                          </span>
                        </div>
                        <Progress 
                          value={exam.progress} 
                          variant={getProgressVariant(exam.progress)}
                          className="h-2" 
                        />
                      </div>

                      {/* Subject Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Subject Breakdown</h4>
                        <div className="space-y-3">
                          {exam.subjects.map((subject, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{subject.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {subject.completed}/{subject.total}
                                  </span>
                                  <span className={`text-xs font-medium ${getProgressColor(subject.progress)}`}>
                                    {subject.progress}%
                                  </span>
                                </div>
                              </div>
                              <Progress 
                                value={subject.progress} 
                                variant={getProgressVariant(subject.progress)}
                                className="h-1.5" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Enrolled Students */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Enrolled Students:</span>
                        <span className="font-medium text-success">{exam.enrolledStudents}</span>
                      </div>

                      {/* CTA Button */}
                      <Button className="w-full" variant="hero" asChild>
                        <Link to={`/exam/${exam.id}`}>
                          Continue Learning
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Unlock all topics & resources with a premium plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get access to unlimited practice tests, detailed analytics, and more!
                    </p>
                  </div>
                  <Button asChild variant="cta" size="lg" className="sm:shrink-0">
                    <Link to="/pricing">Upgrade Plan</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </main>
        )}
        
        <Footer />
      </div>
    </>
  );
};

export default Dashboard;