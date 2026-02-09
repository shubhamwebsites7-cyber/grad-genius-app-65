import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, LogIn } from 'lucide-react';
import FeedbackDayTracker from '@/components/feedback/FeedbackDayTracker';
import DailyQuiz from '@/components/feedback/DailyQuiz';

// Testing period: 10 days starting from Feb 8, 2026 (active until Feb 17, 2026)
const TESTING_START_DATE = new Date('2026-02-08T00:00:00+05:30'); // IST
const TOTAL_TESTING_DAYS = 10;

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [todayAlreadySubmitted, setTodayAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Calculate current testing day
  const calculateCurrentDay = () => {
    const now = new Date();
    const diffTime = now.getTime() - TESTING_START_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(Math.max(diffDays, 1), TOTAL_TESTING_DAYS);
  };

  useEffect(() => {
    setCurrentDay(calculateCurrentDay());

    const fetchUserFeedback = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_feedback')
          .select('feedback_day')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const days = data.map((f: any) => f.feedback_day);
          setCompletedDays(days);
          
          // Check if today is already submitted
          const today = calculateCurrentDay();
          if (days.includes(today)) {
            setTodayAlreadySubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserFeedback();
  }, [user]);

  const handleQuizSubmit = async (answers: number[], score: number, timeTaken: number) => {
    if (!user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        feedback_day: currentDay,
        feedback_date: new Date().toISOString().split('T')[0],
        quiz_answers: answers,
        quiz_score: score,
        time_taken_seconds: timeTaken,
      } as any);

      if (error) throw error;

      setQuizScore(score);
      setSubmitted(true);
      setCompletedDays([...completedDays, currentDay]);
      setTodayAlreadySubmitted(true);
      
      toast({
        title: '🎉 बधाई हो!',
        description: `Day ${currentDay} क्विज़ पूर्ण! स्कोर: ${score}/25`,
      });
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'सबमिशन विफल',
        description: error.message || 'कृपया पुनः प्रयास करें।',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Daily Quiz | ExamTracker</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Daily Quiz | ExamTracker</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="text-center">
                  <LogIn className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">लॉगिन आवश्यक</h2>
                  <p className="text-muted-foreground mb-6">
                    क्विज़ में भाग लेने के लिए कृपया लॉगिन करें।
                  </p>
                </div>

                <Button asChild variant="hero" className="w-full">
                  <a href="/login">लॉगिन करें</a>
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Success screen after submission
  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Quiz Complete | ExamTracker</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">🎉 Day {currentDay} पूर्ण!</h2>
                  <p className="text-3xl font-bold text-primary mb-2">
                    {quizScore}/25
                  </p>
                  <p className="text-muted-foreground">
                    कल फिर से आएं!
                  </p>
                </div>
                
                <FeedbackDayTracker
                  completedDays={completedDays}
                  currentDay={currentDay}
                  totalDays={TOTAL_TESTING_DAYS}
                />

                <Button asChild variant="hero" className="w-full">
                  <a href="/exams">Explore Exams</a>
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Already submitted today
  if (todayAlreadySubmitted) {
    return (
      <>
        <Helmet>
          <title>Daily Quiz | ExamTracker</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">आज का क्विज़ पूर्ण!</h2>
                  <p className="text-muted-foreground mb-6">
                    Day {currentDay} के लिए आपने पहले ही क्विज़ दिया है।
                    {currentDay < TOTAL_TESTING_DAYS && " कल फिर आएं!"}
                  </p>
                </div>

                <FeedbackDayTracker
                  completedDays={completedDays}
                  currentDay={currentDay}
                  totalDays={TOTAL_TESTING_DAYS}
                />

                <Button asChild variant="hero" className="w-full">
                  <a href="/exams">Explore Exams</a>
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Daily Quiz | ExamTracker - Closed Testing</title>
        <meta
          name="description"
          content="Take the daily quiz during the 14-day closed testing period."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-lg mx-auto">

            {/* Progress Tracker */}
            <Card className="mb-6">
              <CardContent className="pt-6 pb-4">
                <FeedbackDayTracker
                  completedDays={completedDays}
                  currentDay={currentDay}
                  totalDays={TOTAL_TESTING_DAYS}
                />
              </CardContent>
            </Card>

            {/* Quiz Card */}
            <Card>
              <CardContent className="pt-6 pb-6">
                <DailyQuiz
                  onSubmit={handleQuizSubmit}
                  submitting={submitting}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Feedback;
