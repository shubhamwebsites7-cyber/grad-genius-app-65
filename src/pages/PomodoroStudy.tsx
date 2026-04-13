import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Timer, Lock, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Exam { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Topic { id: string; name: string; }

const PRESETS = [
  { label: '25 / 5', work: 25, break: 5 },
  { label: '45 / 10', work: 45, break: 10 },
];

const FREE_SESSION_LIMIT = 3;

const PomodoroStudy = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState('');

  const [preset, setPreset] = useState(0);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  // Refs for stable access in timer callback
  const sessionCountRef = useRef(0);
  const isPremiumRef = useRef(false);
  const modeRef = useRef<'work' | 'break'>('work');
  const presetRef = useRef(0);
  const selectedExamRef = useRef('');
  const selectedSubjectRef = useRef('');
  const selectedTopicRef = useRef('');

  // Keep refs in sync
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);
  useEffect(() => { isPremiumRef.current = isPremium; }, [isPremium]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { selectedExamRef.current = selectedExam; }, [selectedExam]);
  useEffect(() => { selectedSubjectRef.current = selectedSubject; }, [selectedSubject]);
  useEffect(() => { selectedTopicRef.current = selectedTopic; }, [selectedTopic]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalSeconds = mode === 'work' ? PRESETS[preset].work * 60 : PRESETS[preset].break * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const limitReached = !isPremium && sessionCount >= FREE_SESSION_LIMIT;

  // Fetch enrolled exams + premium status + session count
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [enrollRes, subRes, sessionRes] = await Promise.all([
        supabase.from('user_exam_enrollments').select('exam_id, exams(id, name)').eq('user_id', user.id).eq('is_active', true),
        (supabase as any).from('subscription_payments').select('status').eq('user_id', user.id).eq('status', 'active').limit(1),
        (supabase as any).from('pomodoro_sessions').select('id').eq('user_id', user.id).eq('session_type', 'work'),
      ]);

      if (enrollRes.data) {
        const e = enrollRes.data.filter((en: any) => en.exams).map((en: any) => ({ id: en.exams.id, name: en.exams.name }));
        setExams(e);
        if (e.length > 0) setSelectedExam(e[0].id);
      }
      const premium = (subRes.data?.length || 0) > 0;
      setIsPremium(premium);
      const count = sessionRes.data?.length || 0;
      setSessionCount(count);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Fetch subjects when exam changes
  useEffect(() => {
    if (!selectedExam) { setSubjects([]); return; }
    const fetchSubjects = async () => {
      const { data } = await (supabase as any)
        .from('exam_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('exam_id', selectedExam)
        .eq('is_active', true);
      const s = (data || []).filter((d: any) => d.subjects).map((d: any) => ({ id: d.subjects.id, name: d.subjects.name }));
      setSubjects(s);
      setSelectedSubject('');
      setSelectedTopic('');
      setSelectedTopicName('');
    };
    fetchSubjects();
  }, [selectedExam]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubject || !selectedExam) { setTopics([]); return; }
    const fetchTopics = async () => {
      const { data } = await (supabase as any)
        .from('exam_topics')
        .select('topic_id, topics(id, name)')
        .eq('exam_id', selectedExam)
        .eq('subject_id', selectedSubject)
        .eq('is_active', true);
      const t = (data || []).filter((d: any) => d.topics).map((d: any) => ({ id: d.topics.id, name: d.topics.name }));
      setTopics(t);
      setSelectedTopic('');
      setSelectedTopicName('');
    };
    fetchTopics();
  }, [selectedSubject, selectedExam]);

  // Session complete handler using refs for fresh values
  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    const currentMode = modeRef.current;
    const currentPreset = presetRef.current;
    const duration = currentMode === 'work' ? PRESETS[currentPreset].work : PRESETS[currentPreset].break;

    // Save session to DB
    if (user) {
      await (supabase as any).from('pomodoro_sessions').insert({
        user_id: user.id,
        exam_id: selectedExamRef.current,
        subject_id: selectedSubjectRef.current,
        topic_id: selectedTopicRef.current,
        duration_minutes: duration,
        session_type: currentMode,
      });
    }

    if (currentMode === 'work') {
      const newCount = sessionCountRef.current + 1;
      setSessionCount(newCount);

      // Check if limit reached after this session
      if (!isPremiumRef.current && newCount >= FREE_SESSION_LIMIT) {
        setShowPaywall(true);
      }

      // Switch to break
      setMode('break');
      setTimeLeft(PRESETS[currentPreset].break * 60);
      toast({ title: "Work session complete!", description: "Time for a break." });
    } else {
      // Switch to work
      setMode('work');
      setTimeLeft(PRESETS[currentPreset].work * 60);
      toast({ title: "Break over!", description: "Ready for another session?" });
    }
  }, [user, toast]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleSessionComplete]);

  const handleStart = () => {
    if (!selectedTopic) {
      toast({ title: "Select a topic", description: "Please select exam, subject, and topic before starting.", variant: "destructive" });
      return;
    }
    if (limitReached) {
      setShowPaywall(true);
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(PRESETS[preset].work * 60);
  };

  const handlePresetChange = (idx: number) => {
    if (isRunning) return;
    setPreset(idx);
    setMode('work');
    setTimeLeft(PRESETS[idx].work * 60);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Circular timer dimensions
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Timer className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pomodoro Study - ExamTracker</title>
        <meta name="description" content="Focus on your study sessions with Pomodoro timer" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Premium Paywall Dialog */}
      <AlertDialog open={showPaywall} onOpenChange={setShowPaywall}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Upgrade to Premium</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              You've used all {FREE_SESSION_LIMIT} free Pomodoro sessions. Upgrade to Premium for <span className="font-semibold text-foreground">unlimited study sessions</span> and unlock your full potential!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
              onClick={() => {
                setShowPaywall(false);
                navigate('/pricing');
              }}
            >
              <Crown className="h-4 w-4" />
              Upgrade Now
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowPaywall(false)}
            >
              Maybe Later
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-10">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Pomodoro Study</h1>
              <p className="text-sm text-muted-foreground mt-1">Stay focused, one session at a time</p>
              {isPremium && (
                <Badge className="mt-2 bg-primary/10 text-primary">
                  <Crown className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>

            {/* Dropdowns */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select value={selectedExam} onValueChange={v => setSelectedExam(v)}>
                  <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedSubject} onValueChange={v => setSelectedSubject(v)} disabled={!selectedExam}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={selectedTopic} onValueChange={v => { setSelectedTopic(v); setSelectedTopicName(topics.find(t => t.id === v)?.name || ''); }} disabled={!selectedSubject}>
                  <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Preset Selector */}
            <div className="flex justify-center gap-3">
              {PRESETS.map((p, i) => (
                <Button
                  key={i}
                  variant={preset === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetChange(i)}
                  disabled={isRunning}
                >
                  {p.work}m / {p.break}m
                </Button>
              ))}
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center space-y-4">
              <Badge variant={mode === 'work' ? 'default' : 'secondary'} className="text-sm">
                {mode === 'work' ? '🔥 Work' : '☕ Break'}
              </Badge>

              {selectedTopicName && (
                <p className="text-sm text-muted-foreground font-medium">{selectedTopicName}</p>
              )}

              <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none"
                  />
                  <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={mode === 'work' ? 'hsl(var(--primary))' : 'hsl(var(--success))'}
                    strokeWidth={strokeWidth} fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-mono font-bold text-foreground">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                {!isRunning ? (
                  <Button
                    size="lg"
                    variant="hero"
                    onClick={handleStart}
                    disabled={!selectedTopic}
                    className="gap-2"
                  >
                    <Play className="h-5 w-5" /> Start
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={handlePause} className="gap-2">
                    <Pause className="h-5 w-5" /> Pause
                  </Button>
                )}
                <Button size="lg" variant="ghost" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-5 w-5" /> Reset
                </Button>
              </div>

              {/* Session counter for free users */}
              {!isPremium && (
                <p className={`text-xs ${limitReached ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  Sessions used: {sessionCount}/{FREE_SESSION_LIMIT}
                  {limitReached && ' — Limit reached'}
                </p>
              )}
            </div>

            {/* Inline paywall card for free users who reached limit */}
            {limitReached && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 text-center space-y-3">
                  <Lock className="h-8 w-8 mx-auto text-primary" />
                  <h3 className="font-semibold text-foreground">Free Limit Reached</h3>
                  <p className="text-sm text-muted-foreground">
                    You've used all {FREE_SESSION_LIMIT} free sessions. Upgrade to Premium for unlimited study sessions.
                  </p>
                  <Button variant="hero" asChild>
                    <Link to="/pricing">Upgrade to Premium</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PomodoroStudy;
