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
import { CheckCircle2, Loader2, LogIn, Star } from 'lucide-react';

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_feedback')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          setAlreadySubmitted(true);
        }
      } catch (error) {
        console.error('Error checking feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingFeedback();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from('user_feedback').upsert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        rating,
        review: review.trim() || null,
      } as any, { onConflict: 'user_id' });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: '🎉 Thank You!',
        description: 'Your feedback has been submitted successfully.',
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Feedback | ExamTracker</title></Helmet>
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

  if (!user) {
    return (
      <>
        <Helmet><title>Feedback | ExamTracker</title></Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="text-center">
                  <LogIn className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                  <p className="text-muted-foreground mb-6">
                    Please login to submit your feedback.
                  </p>
                </div>
                <Button asChild variant="hero" className="w-full">
                  <a href="/login">Login</a>
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (submitted || alreadySubmitted) {
    return (
      <>
        <Helmet><title>Feedback | ExamTracker</title></Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">🎉 Thank You!</h2>
                  <p className="text-muted-foreground">
                    Your feedback has been submitted successfully.
                  </p>
                </div>
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
        <title>Feedback | ExamTracker</title>
        <meta name="description" content="Share your feedback about ExamTracker." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="pt-6 pb-6 space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-2">Your Feedback</h1>
                  <p className="text-muted-foreground text-sm">
                    Help us improve ExamTracker
                  </p>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Us *</label>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Review (Optional)</label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">{review.length}/500</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
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
