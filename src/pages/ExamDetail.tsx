import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  FolderOpen,
  Lock,
  ExpandIcon,
  ShrinkIcon,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExamDetailLoadingSkeleton } from '@/components/exam-detail/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';

interface Topic {
  id: string;
  name: string;
  marks?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isCompleted: boolean;
  isAccessible?: boolean;
  userDifficultyRating?: 'Easy' | 'Medium' | 'Hard';
  voteCount?: number;
  voteDifficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
  allTopics?: Topic[]; // Keep all topics for accurate progress calculation
  marks?: number;
}

interface Exam {
  id: string;
  name: string;
  full_name?: string;
  description?: string;
  type: string;
  categoryName: string;
  categoryColor?: string;
  subjects: Subject[];
  enrolledStudents: string;
  isEnrolled: boolean;
  progress?: number;
  completedTopics?: number;
  totalTopics: number;
  total_marks?: number;
  exam_date?: string;
  is_tentative?: boolean;
}

const ExamDetail = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('default');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [calculatedDifficulties, setCalculatedDifficulties] = useState<{ [key: string]: string }>({});
  const [exam, setExam] = useState<Exam | null>(null);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [topicVoteCounts, setTopicVoteCounts] = useState<{ [key: string]: number }>({});
  const [userTopicRatings, setUserTopicRatings] = useState<{ [key: string]: string }>({});

  // Use React Query for caching exam data
  const { data: examData, isLoading: loading, refetch: refetchExamData } = useQuery({
    queryKey: ['exam-detail', examId, user?.id, subscription.isPremium],
    queryFn: async () => {
      // Fetch exam details with category
      const { data: examDataResult, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          exam_categories(id, name, color)
        `)
        .eq('id', examId)
        .eq('is_active', true)
        .single();

      if (examError) throw examError;
      if (!examDataResult) throw new Error('Exam not found');

      // Check enrollment status
      let isEnrolled = false;
      if (user) {
        const { data: enrollmentData } = await supabase
          .from('user_exam_enrollments')
          .select('is_active')
          .eq('user_id', user.id)
          .eq('exam_id', examId)
          .eq('is_active', true)
          .maybeSingle();

        isEnrolled = !!enrollmentData;
      }

      // Fetch subjects for this exam via junction table
      const { data: examSubjectsData, error: examSubjectsError } = await (supabase as any)
        .from('exam_subjects')
        .select('subject_id, marks, display_order, subjects(*)')
        .eq('exam_id', examId)
        .eq('is_active', true)
        .order('display_order');

      if (examSubjectsError) throw examSubjectsError;

      // Transform junction data to flat subjects array
      const subjectsData = (examSubjectsData || [])
        .filter((es: any) => es.subjects?.is_active !== false)
        .map((es: any) => ({
          ...es.subjects,
          total_marks: es.marks ?? es.subjects?.total_marks,
          display_order: es.display_order ?? es.subjects?.display_order,
        }));

      // Fetch topics for this exam via junction table
      const { data: examTopicsData, error: examTopicsError } = await (supabase as any)
        .from('exam_topics')
        .select('topic_id, subject_id, marks, display_order, topics(*)')
        .eq('exam_id', examId)
        .eq('is_active', true)
        .order('display_order');

      if (examTopicsError) throw examTopicsError;

      // Transform junction data to flat topics array
      const topicsData = (examTopicsData || [])
        .filter((et: any) => et.topics?.is_active !== false)
        .map((et: any) => ({
          ...et.topics,
          marks: et.marks ?? et.topics?.marks,
          display_order: et.display_order ?? et.topics?.display_order,
          subject_id: et.subject_id,
        }));

      // Check user's subscription status - premium users get all topics
      const hasActiveSubscription = subscription.isPremium;

      // Fetch user progress
      let completedIds = new Set<string>();
      if (user) {
        const { data: progressData } = await supabase
          .from('user_exam_progress')
          .select('completed_topics_ids')
          .eq('user_id', user.id)
          .eq('exam_id', examId)
          .maybeSingle();

        const typedProgressData = progressData as any;
        if (typedProgressData && typedProgressData.completed_topics_ids) {
          completedIds = new Set(typedProgressData.completed_topics_ids);
        }
      }

      // Fetch vote counts and user ratings in parallel for all topics
      const topicIds = topicsData?.map((t: any) => t.id) || [];
      const diffMap: { [key: string]: string } = {};
      const voteCountMap: { [key: string]: number } = {};
      const userRatingsMap: { [key: string]: string } = {};
      
      if (topicIds.length > 0) {
        // Batch fetch all ratings at once
        const ratingsPromises = [
          supabase
            .from('topic_difficulty_ratings')
            .select('topic_id, difficulty_rating')
            .in('topic_id', topicIds)
        ];
        
        // Add user ratings query if logged in
        if (user) {
          ratingsPromises.push(
            supabase
              .from('topic_difficulty_ratings')
              .select('topic_id, difficulty_rating')
              .eq('user_id', user.id)
              .in('topic_id', topicIds)
          );
        }
        
        const [allRatingsResult, userRatingsResult] = await Promise.all(ratingsPromises);
        
        // Count votes per topic
        if (allRatingsResult.data) {
          allRatingsResult.data.forEach((rating: any) => {
            voteCountMap[rating.topic_id] = (voteCountMap[rating.topic_id] || 0) + 1;
          });
        }
        
        // Store user ratings
        if (user && userRatingsResult?.data) {
          userRatingsResult.data.forEach((rating: any) => {
            userRatingsMap[rating.topic_id] = rating.difficulty_rating;
          });
        }
        
        // Calculate difficulty for topics with 5+ votes
        for (const topicId of topicIds) {
          const voteCount = voteCountMap[topicId] || 0;
          if (voteCount >= 5) {
            const { data: calcDiff } = await (supabase as any)
              .rpc('get_topic_calculated_difficulty', { p_topic_id: topicId });
            if (calcDiff) {
              diffMap[topicId] = calcDiff;
            }
          }
        }
      }

      // Build exam structure
      const subjects: Subject[] = (subjectsData || []).map((subject: any) => {
        const subjectTopics = (topicsData || [])
          .filter((t: any) => t.subject_id === subject.id)
          .map((topic: any, index: number) => {
            const voteCount = voteCountMap[topic.id] || 0;
            const baseDifficulty = topic.difficulty || 'Medium';
            const voteDifficulty = diffMap[topic.id];
            
            // Use vote-based difficulty if 5+ votes, otherwise use database difficulty
            const displayDifficulty = (voteCount >= 5 && voteDifficulty) 
              ? voteDifficulty 
              : baseDifficulty;
            
            // Premium users: all topics accessible. Free users: only first 3 topics
            const isAccessible = hasActiveSubscription || index < 3;
            
            return {
              id: topic.id,
              name: topic.name,
              marks: topic.marks || undefined,
              difficulty: displayDifficulty as 'Easy' | 'Medium' | 'Hard',
              isCompleted: completedIds.has(topic.id),
              isAccessible,
              userDifficultyRating: userRatingsMap[topic.id] as 'Easy' | 'Medium' | 'Hard' | undefined,
              voteCount,
              voteDifficulty: voteDifficulty as 'Easy' | 'Medium' | 'Hard' | undefined
            };
          });

        return {
          id: subject.id,
          name: subject.name,
          marks: subject.total_marks || undefined,
          topics: subjectTopics
        };
      });

      const allTopics = subjects.flatMap(s => s.topics);
      const completedCount = allTopics.filter(t => t.isCompleted).length;
      const progressPercentage = allTopics.length > 0 ? Math.round((completedCount / allTopics.length) * 100) : 0;

      const typedExamData = examDataResult as any;
      const categoryData = typedExamData.exam_categories || {};
      const categoryName = categoryData.name || 'General';
      const categoryColor = categoryData.color || undefined;
      
      return {
        exam: {
          id: typedExamData.id,
          name: typedExamData.name,
          full_name: typedExamData.full_name || undefined,
          description: typedExamData.description || undefined,
          type: typedExamData.exam_type || 'General',
          categoryName,
          categoryColor,
          subjects,
          enrolledStudents: `${typedExamData.enrollment_count || 0}+`,
          isEnrolled,
          progress: progressPercentage,
          completedTopics: completedCount,
          totalTopics: allTopics.length,
          total_marks: typedExamData.total_marks || undefined,
          exam_date: typedExamData.exam_date || undefined,
          is_tentative: typedExamData.is_tentative ?? undefined,
        } as Exam,
        completedIds,
        diffMap,
        voteCountMap,
        userRatingsMap
      };
    },
    enabled: !!examId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Update local state when query data changes
  useEffect(() => {
    if (examData) {
      setExam(examData.exam);
      setCompletedTopicIds(examData.completedIds);
      setCalculatedDifficulties(examData.diffMap);
      setTopicVoteCounts(examData.voteCountMap);
      setUserTopicRatings(examData.userRatingsMap);
    }
  }, [examData]);

  const handleTopicToggle = async (topicId: string) => {
    if (!user || !exam) {
      toast({
        title: 'Login Required',
        description: 'Please login to track your progress.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (!exam.isEnrolled) {
      toast({
        title: 'Enrollment Required',
        description: 'Please enroll in this exam to track your progress.',
        variant: 'destructive'
      });
      // Scroll to enrollment section with a slight delay to ensure DOM is ready
      setTimeout(() => {
        const enrollmentSection = document.getElementById('enrollment-section');
        if (enrollmentSection) {
          enrollmentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    const isCurrentlyCompleted = completedTopicIds.has(topicId);
    const newCompletedIds = new Set(completedTopicIds);

    if (isCurrentlyCompleted) {
      newCompletedIds.delete(topicId);
    } else {
      newCompletedIds.add(topicId);
    }

    setCompletedTopicIds(newCompletedIds);

    // Update UI optimistically
    setExam(prev => {
      if (!prev) return prev;
      const updatedSubjects = prev.subjects.map(subject => ({
        ...subject,
        topics: subject.topics.map(topic =>
          topic.id === topicId ? { ...topic, isCompleted: !isCurrentlyCompleted } : topic
        )
      }));
      
      const allTopics = updatedSubjects.flatMap(s => s.topics);
      const completedCount = allTopics.filter(t => t.isCompleted).length;
      const progressPercentage = Math.round((completedCount / allTopics.length) * 100);

      return {
        ...prev,
        subjects: updatedSubjects,
        completedTopics: completedCount,
        progress: progressPercentage
      };
    });

    // Update database
    try {
      const allTopics = exam.subjects.flatMap(s => s.topics);
      const totalTopics = allTopics.length;
      const completedCount = newCompletedIds.size;
      const progressPercentage = Math.round((completedCount / totalTopics) * 100);

      const { error } = await supabase
        .from('user_exam_progress')
        .upsert({
          user_id: user.id,
          exam_id: exam.id,
          completed_topics: completedCount,
          total_topics: totalTopics,
          progress_percentage: progressPercentage,
          completed_topics_ids: Array.from(newCompletedIds),
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_id,exam_id'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert optimistic update
      setCompletedTopicIds(isCurrentlyCompleted ? 
        new Set([...newCompletedIds, topicId]) : 
        new Set([...newCompletedIds].filter(id => id !== topicId))
      );
      toast({
        title: 'Error',
        description: 'Failed to update progress.',
        variant: 'destructive'
      });
    }
  };

  const handleDifficultyVote = async (topicId: string, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote on difficulty.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Save user's vote
      const { error } = await supabase
        .from('topic_difficulty_ratings')
        .upsert({
          topic_id: topicId,
          user_id: user.id,
          difficulty_rating: difficulty,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_id,topic_id'
        });

      if (error) throw error;

      // Update vote count
      const { data: voteCountData } = await supabase
        .from('topic_difficulty_ratings')
        .select('id')
        .eq('topic_id', topicId);

      const newVoteCount = voteCountData?.length || 0;

      // Get updated calculated difficulty
      const { data: calcDiff } = await (supabase as any)
        .rpc('get_topic_calculated_difficulty', { p_topic_id: topicId });

      // Update local state
      setTopicVoteCounts(prev => ({ ...prev, [topicId]: newVoteCount }));
      setUserTopicRatings(prev => ({ ...prev, [topicId]: difficulty }));
      if (calcDiff) {
        setCalculatedDifficulties(prev => ({ ...prev, [topicId]: calcDiff }));
      }

      // Update exam state to reflect new difficulty if vote count >= 10
      setExam(prev => {
        if (!prev) return prev;
        const updatedSubjects = prev.subjects.map(subject => ({
          ...subject,
          topics: subject.topics.map(topic => {
            if (topic.id === topicId) {
              const voteCount = newVoteCount;
              const voteDifficulty = calcDiff;
              const displayDifficulty = (voteCount >= 5 && voteDifficulty) 
                ? voteDifficulty 
                : topic.difficulty;
              
              return {
                ...topic,
                difficulty: displayDifficulty as 'Easy' | 'Medium' | 'Hard',
                userDifficultyRating: difficulty,
                voteCount,
                voteDifficulty: voteDifficulty as 'Easy' | 'Medium' | 'Hard' | undefined
              };
            }
            return topic;
          })
        }));
        
        return {
          ...prev,
          subjects: updatedSubjects
        };
      });

      toast({
        title: 'Vote Saved',
        description: 'Your difficulty rating has been recorded.',
      });
    } catch (error: any) {
      console.error('Error voting on difficulty:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your vote. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleEnrollExam = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to enroll in the exam.',
        variant: 'destructive'
      });
      window.location.href = '/login';
      return;
    }

    if (!exam) return;

    try {
      setEnrolling(true);

      // Check if user has active subscription
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const hasActiveSubscription = !!subscriptionData;

      // If no active subscription, check how many exams user has enrolled
      if (!hasActiveSubscription) {
        const { data: enrollmentsData } = await supabase
          .from('user_exam_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        // Free users can only enroll in 1 exam
        if (enrollmentsData && enrollmentsData.length >= 1) {
          setEnrolling(false);
          navigate('/pricing');
          return;
        }
      }

      // Proceed with enrollment
      const { error } = await supabase
        .from('user_exam_enrollments')
        .insert({
          user_id: user.id,
          exam_id: exam.id,
          is_active: true
        } as any);

      if (error) throw error;

      setExam(prev => prev ? { ...prev, isEnrolled: true } : null);

      toast({
        title: 'Enrolled Successfully',
        description: 'You have been enrolled in the exam.',
      });
    } catch (error: any) {
      console.error('Error enrolling in exam:', error);
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll in exam. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLockedTopicClick = () => {
    navigate('/pricing');
  };


  // Store both filtered and unfiltered subjects for accurate progress
  const { sortedSubjects, unfilteredSubjects } = useMemo(() => {
    if (!exam) return { sortedSubjects: [], unfilteredSubjects: [] };
    
    const filtered = exam.subjects.map(subject => ({
      ...subject,
      allTopics: subject.topics, // Keep reference to all topics
      topics: subject.topics
        .filter(topic => {
          if (statusFilter === 'completed') return topic.isCompleted;
          if (statusFilter === 'pending') return !topic.isCompleted;
          return true;
        })
        .filter(topic => {
          if (difficultyFilter === 'all') return true;
          return topic.difficulty.toLowerCase() === difficultyFilter;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'marks-high':
              return (b.marks || 0) - (a.marks || 0);
            case 'marks-low':
              return (a.marks || 0) - (b.marks || 0);
            case 'difficulty-easy':
              const diffOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
              return diffOrder[a.difficulty] - diffOrder[b.difficulty];
            case 'difficulty-hard':
              const diffOrderReverse = { 'Easy': 3, 'Medium': 2, 'Hard': 1 };
              return diffOrderReverse[a.difficulty] - diffOrderReverse[b.difficulty];
            default:
              return 0;
          }
        })
    }));
    
    // Sort subjects based on marks when marks sorting is selected
    const sortedFiltered = [...filtered];
    if (sortBy === 'marks-high') {
      sortedFiltered.sort((a, b) => (b.marks || 0) - (a.marks || 0));
    } else if (sortBy === 'marks-low') {
      sortedFiltered.sort((a, b) => (a.marks || 0) - (b.marks || 0));
    }
    
    return { 
      sortedSubjects: sortedFiltered,
      unfilteredSubjects: exam.subjects 
    };
  }, [exam, sortBy, difficultyFilter, statusFilter]);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading... | ExamTracker</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <ExamDetailLoadingSkeleton />
          <Footer />
        </div>
      </>
    );
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      // Update allExpanded based on whether all sections are expanded
      if (exam) {
        setAllExpanded(newSet.size === exam.subjects.length);
      }
      return newSet;
    });
  };

  const toggleAllSections = () => {
    if (allExpanded) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(exam?.subjects.map(s => s.id) || []));
    }
    setAllExpanded(!allExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-success text-success-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'Hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyBorderColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'border-success';
      case 'Medium': return 'border-warning';
      case 'Hard': return 'border-destructive';
      default: return 'border-muted';
    }
  };

  const getSubjectProgress = (subjectId: string) => {
    // Always calculate based on ALL topics, not filtered ones
    const unfilteredSubject = unfilteredSubjects.find(s => s.id === subjectId);
    if (!unfilteredSubject) return 0;
    const completedTopics = unfilteredSubject.topics.filter(t => t.isCompleted).length;
    return Math.round((completedTopics / unfilteredSubject.topics.length) * 100);
  };

  const getSubjectTopicCounts = (subjectId: string) => {
    // Always return counts based on ALL topics, not filtered ones
    const unfilteredSubject = unfilteredSubjects.find(s => s.id === subjectId);
    if (!unfilteredSubject) return { completed: 0, total: 0 };
    const completed = unfilteredSubject.topics.filter(t => t.isCompleted).length;
    return { completed, total: unfilteredSubject.topics.length };
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 61) return 'bg-success';
    if (progress >= 31) return 'bg-warning';
    return 'bg-destructive';
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 61) return 'success';
    if (progress >= 31) return 'warning';
    return 'destructive';
  };

  if (!exam) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Exam not found</h1>
            <Button asChild>
              <Link to="/exams">Back to Exams</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{exam.name} - Exam Details | ExamTracker</title>
        <meta 
          name="description" 
          content={`Track your ${exam.name} preparation progress with detailed section and topic-wise analytics on ExamTracker.`} 
        />
        <link rel="canonical" href={`/exam/${examId}`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={`${exam.name} - ExamTracker`} />
        <meta property="og:description" content={`Track your ${exam.name} preparation progress`} />
        <meta 
          name="description" 
          content={`Detailed view of ${exam.name} exam with subjects, topics, and progress tracking. Start your preparation journey today.`} 
        />
        <link rel="canonical" href={`/exam/${exam.id}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              className="mb-6 flex items-center gap-2"
              onClick={() => navigate('/exams')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>

            {/* Top Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex-1 min-w-0 mb-2">
                    <h1 className="text-3xl font-bold text-foreground break-words">{exam.name}</h1>
                      {exam.full_name && exam.full_name !== exam.name && (
                        <p className="text-base text-muted-foreground mt-1">
                          {exam.full_name}
                        </p>
                      )}
                    </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: exam.categoryColor ? `${exam.categoryColor}20` : undefined,
                        color: exam.categoryColor || undefined,
                        borderColor: exam.categoryColor || undefined
                      }}
                    >
                      {exam.categoryName}
                    </Badge>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
                      {exam.description}
                    </p>
                  )}
                </div>
                
                {/* Desktop Stats */}
                <div className="hidden sm:flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-success">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{exam.enrolledStudents} students</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary pointer-events-none">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {exam.subjects.length} Subjects
                  </Badge>
                  <Badge className="bg-secondary/10 text-secondary pointer-events-none">
                    <Target className="h-3 w-3 mr-1" />
                    {exam.totalTopics} Topics
                  </Badge>
                  {exam.total_marks && (
                    <Badge variant="outline" className="text-sm px-3 py-1 pointer-events-none">
                      Total: {exam.total_marks} marks
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Section - Show for all users */}
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                        {exam.isEnrolled ? (
                          <span className="text-2xl font-bold text-primary">{exam.progress}%</span>
                        ) : (
                          <span className="text-lg font-medium text-muted-foreground">Not enrolled</span>
                        )}
                      </div>
                      {exam.isEnrolled ? (
                        <>
                          <Progress 
                            value={exam.progress} 
                            variant={getProgressVariant(exam.progress || 0)}
                            className="h-3" 
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            {exam.completedTopics} of {exam.totalTopics} topics completed
                          </p>
                        </>
                      ) : (
                        <>
                          <Progress value={0} className="h-3" />
                          <p className="text-sm text-muted-foreground mt-2">
                            0 of {exam.totalTopics} topics completed
                          </p>
                        </>
                      )}
                        
                        {/* Mobile Stats - shown in progress container */}
                        <div className="flex sm:hidden flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-1 text-success text-sm">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{exam.enrolledStudents} students</span>
                          </div>
                          <Badge className="bg-primary/10 text-primary text-xs pointer-events-none">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {exam.subjects.length} Subjects
                          </Badge>
                          <Badge className="bg-secondary/10 text-secondary text-xs pointer-events-none">
                            <Target className="h-3 w-3 mr-1" />
                            {exam.totalTopics} Topics
                          </Badge>
                          {exam.total_marks && (
                            <Badge variant="outline" className="text-xs px-2 py-1 pointer-events-none">
                              Total: {exam.total_marks} marks
                            </Badge>
                          )}
                        </div>
                      </div>
                     </div>
                  </CardContent>
                </Card>
            </div>

            {/* Filters Section */}
            <Card className="mb-8">
              <CardContent className="p-4 sm:p-6">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="text-sm font-semibold text-foreground mb-3">Filters & Sorting</div>
                  <div className="space-y-3">
                    {/* Status Filter */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Status</label>
                      <div className="flex gap-2 flex-1">
                        <Badge 
                          variant={statusFilter === 'all' ? 'default' : 'outline'} 
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                          onClick={() => setStatusFilter('all')}
                        >
                          All
                        </Badge>
                        <Badge 
                          variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                          onClick={() => setStatusFilter('completed')}
                        >
                          Completed
                        </Badge>
                        <Badge 
                          variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                          className="text-xs px-2 py-1 cursor-pointer hover:bg-accent"
                          onClick={() => setStatusFilter('pending')}
                        >
                          Pending
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Difficulty Filter */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Difficulty</label>
                      <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort By */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-muted-foreground min-w-[60px]">Sort by</label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                          <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                          <SelectItem value="difficulty-easy">Easy First</SelectItem>
                          <SelectItem value="difficulty-hard">Hard First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-foreground mb-4">Filters & Sorting</div>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6 flex-1">
                      {/* Status Filter */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-muted-foreground min-w-[50px]">Status</label>
                        <div className="flex gap-2">
                          <Badge 
                            variant={statusFilter === 'all' ? 'default' : 'outline'} 
                            className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                            onClick={() => setStatusFilter('all')}
                          >
                            All
                          </Badge>
                          <Badge 
                            variant={statusFilter === 'completed' ? 'default' : 'outline'} 
                            className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                            onClick={() => setStatusFilter('completed')}
                          >
                            Completed
                          </Badge>
                          <Badge 
                            variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                            className="text-sm px-3 py-1 cursor-pointer hover:bg-accent"
                            onClick={() => setStatusFilter('pending')}
                          >
                            Pending
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Difficulty Filter */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-muted-foreground min-w-[70px]">Difficulty</label>
                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Sort By */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-muted-foreground min-w-[50px]">Sort by</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="marks-high">Marks (High to Low)</SelectItem>
                            <SelectItem value="marks-low">Marks (Low to High)</SelectItem>
                            <SelectItem value="difficulty-easy">Easy First</SelectItem>
                            <SelectItem value="difficulty-hard">Hard First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subjects and Topics Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Subjects and Topics</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/exams/${exam.id}/resources`)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Resources
              </Button>
            </div>

            {/* Subjects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {sortedSubjects.map(subject => {
                const isExpanded = expandedSections.has(subject.id);
                const subjectProgress = getSubjectProgress(subject.id);
                const { completed: completedTopics, total: totalTopics } = getSubjectTopicCounts(subject.id);
                
                  return (
                  <Card key={subject.id} className="overflow-hidden">
                    <Collapsible open={isExpanded} onOpenChange={() => toggleSection(subject.id)}>
                      <CardHeader className="cursor-pointer transition-colors p-3 sm:p-6">
                        {/* Mobile Layout */}
                         <div className="flex sm:hidden flex-col gap-3 w-full">
                              {/* First row: Subject name (full width on left) + Arrow button (right side in same row) */}
                              <div className="flex items-center justify-between w-full" onClick={() => toggleSection(subject.id)}>
                                <CardTitle className="text-lg flex-1">{subject.name}</CardTitle>
                                {isExpanded ? (
                                  <div className="flex items-center justify-center h-8 w-8 flex-shrink-0">
                                    <ChevronUp className="h-5 w-5 text-black dark:text-white" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-8 w-8 flex-shrink-0">
                                    <ChevronDown className="h-5 w-5 text-black dark:text-white" />
                                  </div>
                                )}
                              </div>
                             
                             {/* Second row: Resources button + Marks (same row) */}
                             <div className="flex items-center gap-3">
                               {/* Resources Button for Section - Mobile */}
                               <Button 
                                 asChild 
                                 size="sm" 
                                 variant="secondary" 
                                 className="h-7 px-2 text-xs"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <Link to={`/resources/${examId}/${subject.id}`}>
                                   <FolderOpen className="h-3 w-3 mr-1" />
                                   Resources
                                 </Link>
                               </Button>
                               
                               {subject.marks && (
                                 <Badge variant="outline" className="text-xs px-2 py-1">
                                   {subject.marks} marks
                                 </Badge>
                               )}
                             </div>
                             
                             {/* Third row: Progress bar */}
                             <div className="w-full">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs text-muted-foreground">Progress</span>
                                 <span className="text-xs font-medium">{completedTopics}/{totalTopics}</span>
                               </div>
                                <Progress 
                                  value={subjectProgress} 
                                  variant={getProgressVariant(subjectProgress)}
                                  className="w-full h-2" 
                                />
                               <div className="flex justify-between items-center mt-1">
                                 <span className="text-xs text-muted-foreground">{subjectProgress}% completed</span>
                               </div>
                             </div>
                          </div>
                          
                            {/* Desktop Layout */}
                             <div className="hidden sm:flex flex-col gap-3 w-full">
                               {/* First row: Section name on left, dropdown arrow with circular bg on right (top-aligned) */}
                               <div className="flex items-start justify-between w-full" onClick={() => toggleSection(subject.id)}>
                                  <CardTitle className="text-xl">{subject.name}</CardTitle>
                                  
                                  {isExpanded ? (
                                    <div className="flex items-center justify-center h-8 w-8">
                                      <ChevronUp className="h-5 w-5 text-black dark:text-white" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-8 w-8">
                                      <ChevronDown className="h-5 w-5 text-black dark:text-white" />
                                    </div>
                                  )}
                                </div>
                              
                              {/* Second row: Resources button + Marks badge */}
                              <div className="flex items-center gap-3">
                                {/* Resources Button for Section */}
                                <Button 
                                  asChild 
                                  size="sm" 
                                  variant="secondary" 
                                  className="h-8 px-3 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link to={`/resources/${examId}/${subject.id}`}>
                                    <FolderOpen className="h-3 w-3 mr-1" />
                                    Resources
                                  </Link>
                                </Button>
                                
                                {subject.marks && (
                                  <Badge variant="outline" className="text-sm">
                                    {subject.marks} marks
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Progress bar for desktop view */}
                              <div className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">Progress</span>
                                  <span className="text-sm font-medium">{completedTopics}/{totalTopics}</span>
                                </div>
                                <Progress 
                                  value={subjectProgress} 
                                  variant={getProgressVariant(subjectProgress)}
                                  className="w-full h-3" 
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-sm text-muted-foreground">{subjectProgress}% completed</span>
                                </div>
                              </div>
                             </div>
                         </CardHeader>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 px-2 sm:px-6">
                           <div className="space-y-2 sm:space-y-3">
                            {subject.topics.map((topic, index) => {
                              const isAccessible = topic.isAccessible || index < 3;
                              
                              return (
                                  <div
                                   key={topic.id}
                                   className={`p-2 sm:p-4 rounded-lg border sm:border-2 transition-all ${
                                     topic.isAccessible
                                       ? topic.isCompleted
                                         ? 'border-border bg-muted/40'
                                         : 'border-border bg-card'
                                       : 'border-muted bg-muted/20 opacity-70'
                                   }`}
                                 >
                                   {/* Mobile Layout */}
                                   <div className="block sm:hidden">
                                      <div className={topic.isAccessible ? '' : 'opacity-50'}>
                                        {/* First row: Number + Topic name + Checkbox */}
                                         <div className="flex items-start gap-3 mb-3">
                                           <span className="text-sm font-medium text-muted-foreground mt-0.5">
                                             {index + 1}.
                                           </span>
                                          <h4 className={`font-medium flex-1 ${topic.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                             {topic.name}
                                           </h4>
                                           <Checkbox
                                             checked={topic.isCompleted}
                                             onCheckedChange={() => topic.isAccessible && exam.isEnrolled && handleTopicToggle(topic.id)}
                                             disabled={!topic.isAccessible || !exam.isEnrolled}
                                             className="h-5 w-5 mt-0.5"
                                           />
                                        </div>
                                       
                                       {/* Second row: Marks + Difficulty + Vote dropdown */}
                                       <div className="flex items-center gap-3 mb-2">
                                         {topic.marks && (
                                           <span className="text-sm text-muted-foreground">
                                             {topic.marks} marks
                                           </span>
                                         )}
                                         <Badge 
                                           className={`text-xs ${getDifficultyColor(topic.difficulty)}`}
                                         >
                                           {topic.difficulty}
                                         </Badge>
                                         {topic.isAccessible && (
                                           <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                               <Button 
                                                 variant="ghost" 
                                                 size="sm" 
                                                 className="h-6 px-2 text-xs flex items-center gap-1"
                                                 onClick={(e) => e.stopPropagation()}
                                               >
                                                 <span className={topic.userDifficultyRating ? 'text-primary font-medium' : ''}>Difficulty</span>
                                                 <ChevronDown className="h-3 w-3" />
                                               </Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent align="end" className="w-40">
                                               <DropdownMenuItem 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleDifficultyVote(topic.id, 'Easy');
                                                 }}
                                                 className={topic.userDifficultyRating === 'Easy' ? 'bg-success/10' : ''}
                                               >
                                                 <div className="flex items-center gap-2 w-full">
                                                   <Badge className="text-xs bg-success">Easy</Badge>
                                                   {topic.userDifficultyRating === 'Easy' && <span className="ml-auto text-xs">✓</span>}
                                                 </div>
                                               </DropdownMenuItem>
                                               <DropdownMenuItem 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleDifficultyVote(topic.id, 'Medium');
                                                 }}
                                                 className={topic.userDifficultyRating === 'Medium' ? 'bg-warning/10' : ''}
                                               >
                                                 <div className="flex items-center gap-2 w-full">
                                                   <Badge className="text-xs bg-warning">Medium</Badge>
                                                   {topic.userDifficultyRating === 'Medium' && <span className="ml-auto text-xs">✓</span>}
                                                 </div>
                                               </DropdownMenuItem>
                                               <DropdownMenuItem 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleDifficultyVote(topic.id, 'Hard');
                                                 }}
                                                 className={topic.userDifficultyRating === 'Hard' ? 'bg-destructive/10' : ''}
                                               >
                                                 <div className="flex items-center gap-2 w-full">
                                                   <Badge className="text-xs bg-destructive">Hard</Badge>
                                                   {topic.userDifficultyRating === 'Hard' && <span className="ml-auto text-xs">✓</span>}
                                                 </div>
                                               </DropdownMenuItem>
                                             </DropdownMenuContent>
                                           </DropdownMenu>
                                         )}
                                       </div>
                                     </div>
                                     
                                     {/* Locked Topic Overlay */}
                                     {!topic.isAccessible && (
                                       <div 
                                         className="mt-2 cursor-pointer hover:bg-muted/50 transition-colors p-2 rounded"
                                         onClick={handleLockedTopicClick}
                                       >
                                         <div className="text-xs text-warning font-medium bg-warning/10 p-2 rounded border border-warning/20 flex items-center gap-2">
                                           <Lock className="h-3 w-3" />
                                           Click to upgrade and unlock all topics
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                  
                                    {/* Desktop Layout */}
                                    <div className="hidden sm:block">
                                       <div className="flex items-start gap-3">
                                          {/* Number on the left */}
                                          <span className={`text-sm font-medium text-muted-foreground mt-0.5 ${!topic.isAccessible ? 'opacity-50' : ''}`}>
                                            {index + 1}.
                                          </span>
                                          
                                          {/* Topic content */}
                                          <div className={`flex-1 ${!topic.isAccessible ? 'opacity-50' : ''}`}>
                                            <h4 className={`font-medium flex items-center gap-2 ${topic.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                              {topic.name}
                                             {topic.marks && (
                                               <span className="text-sm text-muted-foreground">
                                                 ({topic.marks} marks)
                                               </span>
                                             )}
                                           </h4>
                                           <div className="flex items-center gap-2 mt-1">
                                             <Badge 
                                               className={`text-xs ${getDifficultyColor(topic.difficulty)}`}
                                             >
                                               {topic.difficulty}
                                             </Badge>
                                             {topic.isAccessible && (
                                               <DropdownMenu>
                                                 <DropdownMenuTrigger asChild>
                                                   <Button 
                                                     variant="ghost" 
                                                     size="sm" 
                                                     className="h-6 px-2 text-xs flex items-center gap-1"
                                                     onClick={(e) => e.stopPropagation()}
                                                   >
                                                     <span className={topic.userDifficultyRating ? 'text-primary font-medium' : ''}>Difficulty</span>
                                                     <ChevronDown className="h-3 w-3" />
                                                   </Button>
                                                 </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="start" className="w-40">
                                                   <DropdownMenuItem 
                                                     onClick={(e) => {
                                                       e.stopPropagation();
                                                       handleDifficultyVote(topic.id, 'Easy');
                                                     }}
                                                     className={topic.userDifficultyRating === 'Easy' ? 'bg-success/10' : ''}
                                                   >
                                                     <div className="flex items-center gap-2 w-full">
                                                       <Badge className="text-xs bg-success">Easy</Badge>
                                                       {topic.userDifficultyRating === 'Easy' && <span className="ml-auto text-xs">✓</span>}
                                                     </div>
                                                   </DropdownMenuItem>
                                                   <DropdownMenuItem 
                                                     onClick={(e) => {
                                                       e.stopPropagation();
                                                       handleDifficultyVote(topic.id, 'Medium');
                                                     }}
                                                     className={topic.userDifficultyRating === 'Medium' ? 'bg-warning/10' : ''}
                                                   >
                                                     <div className="flex items-center gap-2 w-full">
                                                       <Badge className="text-xs bg-warning">Medium</Badge>
                                                       {topic.userDifficultyRating === 'Medium' && <span className="ml-auto text-xs">✓</span>}
                                                     </div>
                                                   </DropdownMenuItem>
                                                   <DropdownMenuItem 
                                                     onClick={(e) => {
                                                       e.stopPropagation();
                                                       handleDifficultyVote(topic.id, 'Hard');
                                                     }}
                                                     className={topic.userDifficultyRating === 'Hard' ? 'bg-destructive/10' : ''}
                                                   >
                                                     <div className="flex items-center gap-2 w-full">
                                                       <Badge className="text-xs bg-destructive">Hard</Badge>
                                                       {topic.userDifficultyRating === 'Hard' && <span className="ml-auto text-xs">✓</span>}
                                                     </div>
                                                   </DropdownMenuItem>
                                                 </DropdownMenuContent>
                                               </DropdownMenu>
                                             )}
                                            </div>
                                          </div>

                                          {/* Checkbox on the right, top-aligned */}
                                          <Checkbox
                                            checked={topic.isCompleted}
                                            onCheckedChange={() => topic.isAccessible && exam.isEnrolled && handleTopicToggle(topic.id)}
                                            disabled={!topic.isAccessible || !exam.isEnrolled}
                                            className={`h-5 w-5 mt-0.5 ${!topic.isAccessible ? 'opacity-50' : ''}`}
                                          />
                                         
                                         {/* Locked Topic Upgrade CTA */}
                                         {!topic.isAccessible && (
                                          <div 
                                            className="cursor-pointer hover:bg-muted/50 transition-colors p-2 rounded"
                                            onClick={handleLockedTopicClick}
                                          >
                                            <div className="text-xs text-warning font-medium bg-warning/10 p-2 rounded border border-warning/20 flex items-center gap-2">
                                              <Lock className="h-3 w-3" />
                                              Click to upgrade and unlock all topics
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                 </div>
                               );
                             })}
                           </div>
                         </CardContent>
                       </CollapsibleContent>
                     </Collapsible>
                   </Card>
                 );
               })}
             </div>

             {/* CTA Section */}
            {!exam.isEnrolled && (
              <Card id="enrollment-section" className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Ready to start your {exam.name} preparation?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Join {exam.enrolledStudents} students already preparing for this exam
                  </p>
                  <Button 
                    variant="hero" 
                    size="lg"
                    onClick={handleEnrollExam}
                    disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      'Enroll Now'
                    )}
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

export default ExamDetail;