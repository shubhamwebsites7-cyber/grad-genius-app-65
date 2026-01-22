import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import FeedbackDayTracker from '@/components/feedback/FeedbackDayTracker';

// Testing period: 14 days starting from Jan 22, 2026
const TESTING_START_DATE = new Date('2026-01-22T00:00:00+05:30'); // IST
const TOTAL_TESTING_DAYS = 14;

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [todayAlreadySubmitted, setTodayAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit feedback.',
        variant: 'destructive',
      });
      window.location.href = '/login';
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        rating: 5,
        review: review.trim() || null,
        feedback_day: currentDay,
        feedback_date: new Date().toISOString().split('T')[0],
      } as any);

      if (error) throw error;

      setSubmitted(true);
      setCompletedDays([...completedDays, currentDay]);
      setTodayAlreadySubmitted(true);
      
      toast({
        title: 'Thank You!',
        description: `Day ${currentDay} feedback submitted successfully!`,
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit feedback. Please try again.',
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
          <title>Feedback | ExamTrakr</title>
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

  // Success screen after submission
  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Feedback Submitted | ExamTrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
              <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Day {currentDay} Complete!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your feedback. Come back tomorrow!
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
          <title>Feedback | ExamTrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
              <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Today's Feedback Done!</h2>
                  <p className="text-muted-foreground mb-6">
                    You've already submitted feedback for Day {currentDay}. 
                    {currentDay < TOTAL_TESTING_DAYS && " Come back tomorrow!"}
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
        <title>Daily Feedback | ExamTrakr - Closed Testing</title>
        <meta
          name="description"
          content="Submit your daily feedback during the 14-day closed testing period."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Day {currentDay} Feedback</h1>
              <p className="text-muted-foreground">
                Closed Testing • {TOTAL_TESTING_DAYS - currentDay} days remaining
              </p>
            </div>

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

            {/* Feedback Card */}
            <Card>
              <CardContent className="pt-6 pb-6 space-y-4">
                {/* Review Text */}
                <div>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Any bugs, suggestions, or feedback for today? (optional)"
                    rows={4}
                    maxLength={1000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {review.length}/1000
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    `Submit Day ${currentDay} Feedback`
                  )}
                </Button>
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
