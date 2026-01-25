import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
}

interface DailyQuizProps {
  onSubmit: (answers: number[], score: number, timeTaken: number) => Promise<void>;
  submitting: boolean;
}

const MIN_TIME_SECONDS = 90;

const DailyQuiz: React.FC<DailyQuizProps> = ({ onSubmit, submitting }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('is_active', true)
          .order('question_number', { ascending: true });

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setError('कोई प्रश्न उपलब्ध नहीं है।');
          return;
        }

        setQuestions(data as QuizQuestion[]);
        setAnswers(new Array(data.length).fill(null));
      } catch (err: any) {
        console.error('Error fetching questions:', err);
        setError('प्रश्न लोड करने में त्रुटि। कृपया पुनः प्रयास करें।');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Timer effect
  useEffect(() => {
    if (loading || error || questions.length === 0) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= MIN_TIME_SECONDS) {
          setCanSubmit(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, questions.length]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (answers[currentQuestion] === null) return;
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index]?.correct_option) {
        score++;
      }
    });
    return score;
  }, [answers, questions]);

  const triggerCelebration = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7']
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7']
      });
    }, 250);
  };

  const handleSubmit = async () => {
    const score = calculateScore();
    const answersAsNumbers = answers.map((a) => a ?? -1);
    
    triggerCelebration();
    
    await onSubmit(answersAsNumbers, score, elapsedTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">प्रश्न लोड हो रहे हैं...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          पुनः प्रयास करें
        </Button>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">कोई प्रश्न उपलब्ध नहीं है।</p>
      </div>
    );
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const remainingTime = Math.max(0, MIN_TIME_SECONDS - elapsedTime);
  
  const question = questions[currentQuestion];
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            प्रश्न {currentQuestion + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={`font-mono ${!canSubmit ? 'text-warning' : 'text-success'}`}>
              {formatTime(elapsedTime)} / {formatTime(MIN_TIME_SECONDS)}
            </span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-3">
          <h3 className="text-base font-semibold mb-3">
            {question.question_number}. {question.question_text}
          </h3>

          <RadioGroup
            value={answers[currentQuestion]?.toString() ?? ''}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="grid grid-cols-2 gap-2"
          >
            {options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors cursor-pointer text-sm ${
                  answers[currentQuestion] === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="h-4 w-4" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm">
                  {String.fromCharCode(65 + index)}) {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={goToPrev}
          disabled={currentQuestion === 0}
          className="flex-1"
        >
          पिछला
        </Button>
        
        {currentQuestion < questions.length - 1 ? (
          <Button 
            onClick={goToNext} 
            disabled={answers[currentQuestion] === null}
            className="flex-1"
          >
            अगला
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || answeredCount < questions.length}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                सबमिट हो रहा है...
              </>
            ) : !canSubmit ? (
              `${formatTime(remainingTime)} बाकी`
            ) : answeredCount < questions.length ? (
              `${questions.length - answeredCount} शेष`
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                सबमिट करें
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DailyQuiz;
