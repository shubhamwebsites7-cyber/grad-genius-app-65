import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Timer, Lock, Crown, BookOpen, Target, Flame, SkipForward, CheckCircle2, Clock } from 'lucide-react';
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
  { label: 'Classic', work: 25, break: 5, icon: '🍅' },
  { label: 'Deep Focus', work: 45, break: 10, icon: '🧠' },
  { label: 'Sprint', work: 15, break: 3, icon: '⚡' },
  { label: 'Marathon', work: 60, break: 15, icon: '🏃' },
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
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
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

  // Fetch enrolled exams + premium status + session count (use user?.id to prevent refetch on tab switch)
  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [enrollRes, subRes, sessionRes, todayRes] = await Promise.all([
        supabase.from('user_exam_enrollments').select('exam_id, exams(id, name)').eq('user_id', user.id).eq('is_active', true),
        (supabase as any).from('subscription_payments').select('status').eq('user_id', user.id).eq('status', 'active').limit(1),
        (supabase as any).from('pomodoro_sessions').select('id').eq('user_id', user.id).eq('session_type', 'work'),
        (supabase as any).from('pomodoro_sessions').select('id, duration_minutes').eq('user_id', user.id).eq('session_type', 'work').gte('created_at', today.toISOString()),
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
      
      const todayData = todayRes.data || [];
      setTodaySessions(todayData.length);
      setTodayMinutes(todayData.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0));
      
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

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

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    const currentMode = modeRef.current;
    const currentPreset = presetRef.current;
    const duration = currentMode === 'work' ? PRESETS[currentPreset].work : PRESETS[currentPreset].break;

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
      setTodaySessions(prev => prev + 1);
      setTodayMinutes(prev => prev + duration);

      if (!isPremiumRef.current && newCount >= FREE_SESSION_LIMIT) {
        setShowPaywall(true);
      }

      setMode('break');
      setTimeLeft(PRESETS[currentPreset].break * 60);
      toast({ title: "🎉 Work session complete!", description: "Time for a well-deserved break." });
    } else {
      setMode('work');
      setTimeLeft(PRESETS[currentPreset].work * 60);
      toast({ title: "💪 Break over!", description: "Ready for another focused session?" });
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

  const [validationError, setValidationError] = useState('');

  const handleStart = () => {
    if (!selectedExam || !selectedSubject || !selectedTopic) {
      const msg = 'Please select Exam, Subject, and Topic before starting Pomodoro';
      setValidationError(msg);
      toast({ title: "Selection Required", description: msg, variant: "destructive" });
      return;
    }
    setValidationError('');
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

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setMode('break');
      setTimeLeft(PRESETS[preset].break * 60);
    } else {
      setMode('work');
      setTimeLeft(PRESETS[preset].work * 60);
    }
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
  const size = 260;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Timer className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your study space...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pomodoro Study Timer - ExamTracker</title>
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

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />

        <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                    <Timer className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    Pomodoro Study
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Stay focused, one session at a time</p>
                </div>
                {isPremium && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Crown className="h-3 w-3 mr-1" /> Premium
                  </Badge>
                )}
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
                <span>👉</span> {validationError}
              </div>
            )}

            {/* Main Layout: 3-column on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT: Study Setup */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Study Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Exam</label>
                      <Select value={selectedExam} onValueChange={v => { setSelectedExam(v); setValidationError(''); }}>
                        <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                        <SelectContent>
                          {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                      <Select value={selectedSubject} onValueChange={v => { setSelectedSubject(v); setValidationError(''); }} disabled={!selectedExam}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Topic</label>
                      <Select value={selectedTopic} onValueChange={v => { setSelectedTopic(v); setSelectedTopicName(topics.find(t => t.id === v)?.name || ''); setValidationError(''); }} disabled={!selectedSubject}>
                        <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                        <SelectContent>
                          {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Timer Mode</label>
                      <Select
                        value={String(preset)}
                        onValueChange={v => handlePresetChange(Number(v))}
                        disabled={isRunning}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Timer Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESETS.map((p, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {p.icon} {p.label} ({p.work}m / {p.break}m break)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CENTER: Stats */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-foreground">{todaySessions}</p>
                    <p className="text-sm text-muted-foreground">Sessions Today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-bold text-foreground">{todayMinutes}</p>
                    <p className="text-sm text-muted-foreground">Minutes Studied</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 text-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-foreground">{sessionCount}</p>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </CardContent>
                </Card>
                {/* Session limit for free users */}
                {!isPremium && (
                  <Card className="border-primary/20">
                    <CardContent className="p-4 text-center">
                      <p className={`text-xs ${limitReached ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        Free: {sessionCount}/{FREE_SESSION_LIMIT} sessions
                        {limitReached && ' — Limit reached'}
                      </p>
                      <Progress value={(sessionCount / FREE_SESSION_LIMIT) * 100} className="h-1.5 mt-2" />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* RIGHT: Focus Mode / Timer */}
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <div className={`p-1 ${mode === 'work' ? 'bg-gradient-to-r from-primary/20 to-primary/5' : 'bg-gradient-to-r from-green-500/20 to-green-500/5'}`}>
                    <span className="text-xs font-medium px-3 py-0.5 text-foreground">
                      {mode === 'work' ? '🔥 Focus Mode' : '☕ Break Time'}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    {selectedTopicName && (
                      <div className="text-center mb-4">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          <Target className="h-3 w-3 mr-1.5" />
                          {selectedTopicName}
                        </Badge>
                      </div>
                    )}

                    {/* Timer Circle */}
                    <div className="flex justify-center mb-6">
                      <div className="relative" style={{ width: size, height: size }}>
                        <svg width={size} height={size} className="transform -rotate-90">
                          <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none"
                            opacity={0.3}
                          />
                          <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            stroke={mode === 'work' ? 'hsl(var(--primary))' : 'hsl(142, 71%, 45%)'}
                            strokeWidth={strokeWidth} fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-mono font-bold text-foreground tracking-tight">
                            {formatTime(timeLeft)}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
                            {mode === 'work' ? 'Focus' : 'Break'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3">
                      <Button size="icon" variant="outline" onClick={handleReset} className="h-12 w-12 rounded-full">
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                      {!isRunning ? (
                        <Button
                          size="lg" variant="hero" onClick={handleStart}
                          disabled={!selectedExam || !selectedSubject || !selectedTopic}
                          className="h-14 w-14 rounded-full p-0"
                        >
                          <Play className="h-6 w-6 ml-0.5" />
                        </Button>
                      ) : (
                        <Button size="lg" variant="default" onClick={handlePause} className="h-14 w-14 rounded-full p-0">
                          <Pause className="h-6 w-6" />
                        </Button>
                      )}
                      <Button size="icon" variant="outline" onClick={handleSkip} className="h-12 w-12 rounded-full">
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Inline paywall card for free users who reached limit */}
            {limitReached && (
              <Card className="border-primary/30 bg-primary/5 mt-6">
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
