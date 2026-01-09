import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Target, 
  BookOpen, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface WeakArea {
  name: string;
  examName: string;
  progress: number;
}

interface Suggestion {
  type: 'not_started' | 'revision' | 'focus';
  topic: string;
  examName: string;
  reason: string;
}

const AIMentor = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [enrolledExamsCount, setEnrolledExamsCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchMentorData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);

      // Fetch user's enrolled exams with progress
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('user_exam_enrollments')
        .select(`
          exam_id,
          exams (
            id,
            name
          )
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setEnrolledExamsCount(0);
        setLoading(false);
        return;
      }

      setEnrolledExamsCount(enrollments.length);
      const examIds = enrollments.map((e: any) => e.exam_id);

      // Fetch progress for each enrolled exam
      const { data: progressData, error: progressError } = await supabase
        .from('user_exam_progress')
        .select('*')
        .eq('user_id', user!.id)
        .in('exam_id', examIds);

      if (progressError) throw progressError;

      // Calculate overall progress
      const totalCompleted = progressData?.reduce((sum: number, p: any) => sum + (p.completed_topics || 0), 0) || 0;
      const totalTopics = progressData?.reduce((sum: number, p: any) => sum + (p.total_topics || 0), 0) || 0;
      const overallPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;
      setOverallProgress(overallPct);

      // Fetch subjects for weak area analysis
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, exam_id, name')
        .in('exam_id', examIds)
        .eq('is_active', true);

      if (subjectsError) throw subjectsError;

      // Fetch topics for analysis
      const subjectIds = subjectsData?.map((s: any) => s.id) || [];
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('id, subject_id, name')
        .in('subject_id', subjectIds)
        .eq('is_active', true);

      if (topicsError) throw topicsError;

      // Build exam name lookup
      const examNameMap: Record<string, string> = {};
      enrollments.forEach((e: any) => {
        if (e.exams) examNameMap[e.exam_id] = e.exams.name;
      });

      // Build subject to exam map
      const subjectToExamMap: Record<string, { examId: string; subjectName: string }> = {};
      subjectsData?.forEach((s: any) => {
        subjectToExamMap[s.id] = { examId: s.exam_id, subjectName: s.name };
      });

      // Analyze weak areas (subjects with < 30% progress)
      const weakAreasList: WeakArea[] = [];
      const suggestionsList: Suggestion[] = [];
      const notStartedTopics: { topic: string; examName: string }[] = [];

      subjectsData?.forEach((subject: any) => {
        const subjectTopics = topicsData?.filter((t: any) => t.subject_id === subject.id) || [];
        const progress: any = progressData?.find((p: any) => p.exam_id === subject.exam_id);
        const completedIds: string[] = progress?.completed_topics_ids || [];
        
        const completedCount = subjectTopics.filter((t: any) => completedIds.includes(t.id)).length;
        const totalCount = subjectTopics.length;
        const subjectProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Identify weak areas
        if (totalCount > 0 && subjectProgress < 30 && completedCount > 0) {
          weakAreasList.push({
            name: subject.name,
            examName: examNameMap[subject.exam_id] || 'Unknown Exam',
            progress: subjectProgress
          });
        }

        // Find not started topics
        subjectTopics.forEach((topic: any) => {
          if (!completedIds.includes(topic.id)) {
            notStartedTopics.push({
              topic: topic.name,
              examName: examNameMap[subject.exam_id] || 'Unknown Exam'
            });
          }
        });
      });

      // Create AI suggestions
      if (notStartedTopics.length > 0) {
        const randomNotStarted = notStartedTopics[Math.floor(Math.random() * notStartedTopics.length)];
        suggestionsList.push({
          type: 'not_started',
          topic: randomNotStarted.topic,
          examName: randomNotStarted.examName,
          reason: 'Start this topic to expand your knowledge'
        });
      }

      if (weakAreasList.length > 0) {
        const weakestArea = weakAreasList.sort((a, b) => a.progress - b.progress)[0];
        suggestionsList.push({
          type: 'revision',
          topic: weakestArea.name,
          examName: weakestArea.examName,
          reason: `Only ${weakestArea.progress}% complete - needs attention`
        });
      }

      // Daily focus recommendation
      if (notStartedTopics.length > 0 || weakAreasList.length > 0) {
        const focusTopic = weakAreasList.length > 0 
          ? { topic: weakAreasList[0].name, examName: weakAreasList[0].examName }
          : notStartedTopics[0];
        
        suggestionsList.push({
          type: 'focus',
          topic: focusTopic.topic,
          examName: focusTopic.examName,
          reason: 'Recommended focus for today'
        });
      }

      setWeakAreas(weakAreasList.slice(0, 3));
      setSuggestions(suggestionsList.slice(0, 3));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching mentor data:', err);
      setLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    if (overallProgress >= 80) return "🎉 Outstanding! You're almost exam-ready. Keep pushing!";
    if (overallProgress >= 60) return "💪 Great progress! Stay consistent and you'll ace it.";
    if (overallProgress >= 40) return "📚 Good start! Focus on your weak areas now.";
    if (overallProgress >= 20) return "🌱 You're building momentum. Every topic counts!";
    return "🚀 Let's begin your journey. Start with one topic today!";
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 61) return 'success';
    if (percentage >= 31) return 'warning';
    return 'destructive';
  };

  if (!user) {
    return (
      <>
        <Helmet>
          <title>AI Mentor - Examtrakr | Your Personal Study Guide</title>
          <meta name="description" content="Get personalized exam preparation guidance from your AI Mentor on Examtrakr." />
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">AI Mentor</h1>
              <p className="text-muted-foreground mb-6">
                Login to get personalized study recommendations and track your progress.
              </p>
              <Button asChild variant="hero">
                <Link to="/login">Login to Continue</Link>
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Mentor - Examtrakr | Your Personal Study Guide</title>
        <meta name="description" content="Get personalized exam preparation guidance from your AI Mentor on Examtrakr." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* AI Mentor Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse">
                <Brain className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">AI Mentor</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Hi, I'm your AI Mentor. I help you track your exam preparation and improve daily.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : enrolledExamsCount === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="space-y-4">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Exams Enrolled</h3>
                  <p className="text-muted-foreground text-sm">
                    Enroll in an exam to get personalized AI guidance
                  </p>
                  <Button asChild variant="hero">
                    <Link to="/exams">
                      Browse Exams
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current Status Card */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" />
                      Your Preparation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                    </div>
                    <Progress 
                      value={overallProgress} 
                      variant={getProgressVariant(overallProgress)}
                      className="h-3" 
                    />
                    
                    {/* Motivational Message */}
                    <div className="bg-background/80 rounded-lg p-3 border border-border/50">
                      <p className="text-sm font-medium text-center">
                        {getMotivationalMessage()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weak Areas */}
                {weakAreas.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Areas Needing Attention
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {weakAreas.map((area, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                          >
                            <div>
                              <p className="font-medium text-sm">{area.name}</p>
                              <p className="text-xs text-muted-foreground">{area.examName}</p>
                            </div>
                            <Badge variant="outline" className="text-warning border-warning/30">
                              {area.progress}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {suggestions.map((suggestion, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg border border-border bg-accent/30 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                suggestion.type === 'not_started' ? 'bg-primary/10 text-primary' :
                                suggestion.type === 'revision' ? 'bg-warning/10 text-warning' :
                                'bg-success/10 text-success'
                              }`}>
                                {suggestion.type === 'not_started' && <BookOpen className="h-4 w-4" />}
                                {suggestion.type === 'revision' && <TrendingUp className="h-4 w-4" />}
                                {suggestion.type === 'focus' && <Flame className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{suggestion.topic}</p>
                                <p className="text-xs text-muted-foreground">{suggestion.examName}</p>
                                <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Working Features */}
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      How I Help You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Analyze your syllabus completion
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Identify weak and strong areas
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Suggest next best topic to study
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Encourage consistency and discipline
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Quick Action */}
                <div className="text-center">
                  <Button asChild variant="hero" size="lg">
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>

        <div className="hidden sm:block">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default AIMentor;
