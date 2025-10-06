import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: { label: string; value: string }[];
  type: 'radio' | 'text';
}

const questions: Question[] = [
  {
    id: 1,
    question: 'How helpful is ExamTrakr for your exam preparation?',
    type: 'radio',
    options: [
      { label: 'Very helpful', value: 'very_helpful' },
      { label: 'Somewhat helpful', value: 'somewhat_helpful' },
      { label: 'Neutral', value: 'neutral' },
      { label: 'Not helpful', value: 'not_helpful' },
    ],
  },
  {
    id: 2,
    question: 'How easy is it to use the website?',
    type: 'radio',
    options: [
      { label: 'Very easy', value: 'very_easy' },
      { label: 'Easy', value: 'easy' },
      { label: 'Average', value: 'average' },
      { label: 'Difficult', value: 'difficult' },
    ],
  },
  {
    id: 3,
    question: 'Do you like the design and speed of the website?',
    type: 'radio',
    options: [
      { label: "Yes, it's great", value: 'yes_great' },
      { label: "It's okay", value: 'okay' },
      { label: 'Needs improvement', value: 'needs_improvement' },
    ],
  },
  {
    id: 4,
    question: 'Would you recommend ExamTrakr to your friends?',
    type: 'radio',
    options: [
      { label: 'Definitely', value: 'definitely' },
      { label: 'Maybe', value: 'maybe' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 5,
    question: 'If unlimited exams were available, how much would you be willing to pay per month?',
    type: 'radio',
    options: [
      { label: '₹0 – I prefer free access', value: '0' },
      { label: '₹79/month', value: '79' },
      { label: '₹89/month', value: '89' },
      { label: '₹99/month+', value: '99+' },
    ],
  },
  {
    id: 6,
    question: 'What one thing should we improve or add to make ExamTrakr better for you?',
    type: 'text',
    options: [],
  },
];

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQ.id]: value });

    // Auto-advance for radio questions
    if (currentQ.type === 'radio') {
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit feedback.',
        variant: 'destructive',
      });
      return;
    }

    // Check if all questions are answered
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast({
        title: 'Incomplete Feedback',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from('user_feedback').insert({
        user_id: user.id,
        helpfulness: answers[1],
        ease_of_use: answers[2],
        design_speed: answers[3],
        recommendation: answers[4],
        pricing_preference: answers[5],
        improvement_suggestion: answers[6],
      } as any);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Thank You!',
        description: 'Your feedback has been submitted successfully.',
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
        <title>Feedback | ExamTrakr - Help Us Improve</title>
        <meta
          name="description"
          content="Share your feedback to help us improve ExamTrakr and make exam preparation better for everyone."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">🧩 User Feedback</h1>
              <p className="text-muted-foreground">
                Your opinion matters! Help us improve ExamTrakr.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQ.type === 'radio' ? (
                  <RadioGroup
                    value={answers[currentQ.id]}
                    onValueChange={handleAnswer}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleAnswer(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label
                          htmlFor={option.value}
                          className="flex-1 cursor-pointer text-base"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder="Share your thoughts..."
                    rows={5}
                    maxLength={500}
                    className="resize-none"
                  />
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="flex-1"
                  >
                    Previous
                  </Button>

                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!answers[currentQ.id] || submitting}
                      className="flex-1"
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
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={currentQ.type === 'text' && !answers[currentQ.id]}
                      className="flex-1"
                    >
                      Next
                    </Button>
                  )}
                </div>
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
