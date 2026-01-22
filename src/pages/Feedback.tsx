import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, Star, Gift } from 'lucide-react';

// Trial reward is available from Jan 22, 2026
const TRIAL_START_DATE = new Date('2026-01-22T00:00:00Z');
const TRIAL_DAYS = 14;

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [claimTrial, setClaimTrial] = useState(true);
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false);
  const [isTrialAvailable, setIsTrialAvailable] = useState(false);

  useEffect(() => {
    // Check if trial reward is available (after Jan 22, 2026)
    const now = new Date();
    setIsTrialAvailable(now >= TRIAL_START_DATE);

    // Check if user already submitted feedback
    const checkExistingFeedback = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_feedback')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setHasExistingFeedback(true);
      }
    };
    checkExistingFeedback();
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

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        rating: rating,
        review: review.trim() || null,
        claimed_trial: claimTrial && isTrialAvailable,
      } as any);

      if (error) throw error;

      // If user opted for trial and it's available, activate 14-day premium
      if (claimTrial && isTrialAvailable) {
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

        // Get a subscription plan (assuming there's a premium plan)
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id')
          .limit(1);

        if (plans && plans.length > 0) {
          // Check if user already has a subscription
          const { data: existingSub } = await supabase
            .from('user_subscriptions')
            .select('id, expires_at')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingSub) {
            // Extend existing subscription by 14 days
            const subData = existingSub as { id: string; expires_at: string };
            const currentExpiry = new Date(subData.expires_at);
            const newExpiry = currentExpiry > new Date() 
              ? new Date(currentExpiry.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
              : expiresAt;

            await (supabase
              .from('user_subscriptions') as any)
              .update({ 
                expires_at: newExpiry.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', subData.id);
          } else {
            // Create new subscription
            const planData = plans[0] as { id: string };
            await supabase.from('user_subscriptions').insert({
              user_id: user.id,
              plan_id: planData.id,
              status: 'active',
              starts_at: startsAt.toISOString(),
              expires_at: expiresAt.toISOString(),
              auto_renew: false,
              payment_method: 'feedback_reward',
            } as any);
          }
        }
      }

      setSubmitted(true);
      toast({
        title: 'Thank You!',
        description: claimTrial && isTrialAvailable 
          ? 'Your feedback has been submitted and 14-day premium access activated!' 
          : 'Your feedback has been submitted successfully.',
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

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Feedback Submitted | ExamTrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full text-center">
              <CardContent className="pt-12 pb-8">
                <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-6">
                  Your feedback helps us improve ExamTrakr for everyone.
                </p>
                {claimTrial && isTrialAvailable && (
                  <div className="bg-primary/10 rounded-lg p-4 mb-6">
                    <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-primary">
                      🎉 14-Day Premium Access Activated!
                    </p>
                  </div>
                )}
                <Button asChild variant="hero">
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

  if (hasExistingFeedback) {
    return (
      <>
        <Helmet>
          <title>Feedback | ExamTrakr</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center py-12 px-4">
            <Card className="max-w-md w-full text-center">
              <CardContent className="pt-12 pb-8">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Already Submitted</h2>
                <p className="text-muted-foreground mb-6">
                  You've already submitted your feedback. Thank you for your support!
                </p>
                <Button asChild variant="hero">
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
        <title>Feedback | ExamTrakr - Share Your Review</title>
        <meta
          name="description"
          content="Share your feedback and rate ExamTrakr to help us improve exam preparation for everyone."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Rate ExamTrakr</h1>
              <p className="text-muted-foreground">
                Your opinion matters! Help us improve.
              </p>
            </div>

            {/* Feedback Card */}
            <Card>
              <CardContent className="pt-8 pb-6 space-y-6">
                {/* Star Rating */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Tap to rate</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-10 w-10 sm:h-12 sm:w-12 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {rating === 5 && 'Excellent!'}
                      {rating === 4 && 'Great!'}
                      {rating === 3 && 'Good'}
                      {rating === 2 && 'Fair'}
                      {rating === 1 && 'Poor'}
                    </p>
                  )}
                </div>

                {/* Review Text */}
                <div>
                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your review (optional)..."
                    rows={4}
                    maxLength={1000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {review.length}/1000
                  </p>
                </div>

                {/* 14-Day Trial Checkbox */}
                {isTrialAvailable && (
                  <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Checkbox
                      id="claim-trial"
                      checked={claimTrial}
                      onCheckedChange={(checked) => setClaimTrial(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor="claim-trial" 
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Gift className="h-4 w-4 text-primary" />
                        Claim 14-Day Premium Access
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Get free premium access for 14 days as a thank you for your feedback!
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="w-full"
                  size="lg"
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
