import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { AddExamModal } from '@/components/AddExamModal';
import { RequestExamModal } from '@/components/RequestExamModal';

import { BookOpen, Clock, Users, TrendingUp, Search, Plus, Filter, Loader2, MessageSquarePlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ExamsLoadingSkeleton } from '@/components/exam-detail/ExamsLoadingSkeleton';

interface Topic {
  id: string;
  name: string;
  marks?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface ExamCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
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
}

const Exams = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('examsCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const EXAMS_PER_PAGE = 9;

  const userIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (currentUserId === userIdRef.current && exams.length > 0) return;
    userIdRef.current = currentUserId;
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      
      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('exam_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch exams with category join
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          exam_categories(id, name, color)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (examsError) throw examsError;

      if (!examsData) {
        setExams([]);
        return;
      }

      // Fetch all exam-subject mappings via junction table
      const { data: examSubjectsData, error: examSubjectsError } = await (supabase as any)
        .from('exam_subjects')
        .select('exam_id, subject_id, marks, display_order, subjects(id, name)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (examSubjectsError) throw examSubjectsError;

      // Fetch all exam-topic mappings via junction table
      const { data: examTopicsData, error: examTopicsError } = await (supabase as any)
        .from('exam_topics')
        .select('exam_id, subject_id, topic_id, marks, display_order, topics(id, name, difficulty)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (examTopicsError) throw examTopicsError;

      // Fetch user enrollments if logged in
      let enrollmentsMap = new Map<string, boolean>();
      if (user) {
        const { data: enrollmentsData } = await supabase
          .from('user_exam_enrollments')
          .select('exam_id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (enrollmentsData) {
          enrollmentsData.forEach((enrollment: any) => {
            enrollmentsMap.set(enrollment.exam_id, true);
          });
        }
      }

      // Fetch user progress if logged in
      let progressMap = new Map<string, { completed: number; percentage: number }>();
      if (user) {
        const { data: progressData } = await supabase
          .from('user_exam_progress')
          .select('exam_id, completed_topics, progress_percentage')
          .eq('user_id', user.id);

        if (progressData) {
          progressData.forEach((progress: any) => {
            progressMap.set(progress.exam_id, {
              completed: progress.completed_topics,
              percentage: progress.progress_percentage
            });
          });
        }
      }

      // Transform the data to match the Exam interface
      const transformedExams: Exam[] = (examsData || []).map((exam: any) => {
        // Get subjects for this exam from junction data
        const examSubjectEntries = (examSubjectsData || []).filter((es: any) => es.exam_id === exam.id);
        
        const subjects: Subject[] = examSubjectEntries.map((es: any) => {
          // Get topics for this subject in this exam from junction data
          const subjectTopicEntries = (examTopicsData || []).filter(
            (et: any) => et.exam_id === exam.id && et.subject_id === (es.subjects?.id || es.subject_id)
          );
          
          const topics: Topic[] = subjectTopicEntries.map((et: any) => ({
            id: et.topics?.id || et.topic_id,
            name: et.topics?.name || '',
            marks: (et.marks ?? et.topics?.marks) || undefined,
            difficulty: (et.topics?.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard'
          }));

          return {
            id: es.subjects?.id || es.subject_id,
            name: es.subjects?.name || '',
            topics
          };
        });

        const totalTopics = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
        const isEnrolled = enrollmentsMap.has(exam.id);
        const progress = progressMap.get(exam.id);
        
        // Get category data from the join
        const categoryData = exam.exam_categories || {};
        const categoryName = categoryData.name || 'General';
        const categoryColor = categoryData.color || undefined;

        return {
          id: exam.id,
          name: exam.name,
          full_name: exam.full_name || undefined,
          description: exam.description || undefined,
          type: categoryName,
          categoryName,
          categoryColor,
          subjects,
          enrolledStudents: exam.enrollment_count > 0 ? `${exam.enrollment_count.toLocaleString()}+` : '0',
          isEnrolled,
          progress: progress?.percentage,
          completedTopics: progress?.completed,
          totalTopics
        };
      });

      setExams(transformedExams);
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      toast({
        title: 'Error loading exams',
        description: error.message || 'Failed to load exams from database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollExam = async (examId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to enroll in an exam.',
        variant: 'destructive'
      });
      window.location.href = '/login';
      return;
    }

    try {
      setEnrolling(examId);

      // Check user's subscription status
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const hasActiveSubscription = !!subscriptionData;

      // Check current enrollment count for free users ONLY
      if (!hasActiveSubscription) {
        const { count, error: enrollmentCountError } = await supabase
          .from('user_exam_enrollments')
          .select('exam_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (enrollmentCountError) throw enrollmentCountError;

        if (count && count >= 1) {
          setEnrolling(null);
          navigate('/pricing');
          return;
        }
      }

      // Proceed with enrollment
      const { error } = await supabase
        .from('user_exam_enrollments')
        .insert({
          user_id: user.id,
          exam_id: examId,
          is_active: true
        } as any);

      if (error) throw error;

      // Update local state
      setExams(prev => prev.map(exam => 
        exam.id === examId ? { ...exam, isEnrolled: true } : exam
      ));

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
      setEnrolling(null);
    }
  };

  const filteredExams = useMemo(() => {
    let filtered = exams;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(exam => {
        const searchLower = searchQuery.toLowerCase();
        return (
          (exam.name || '').toLowerCase().includes(searchLower) ||
          (exam.full_name || '').toLowerCase().includes(searchLower) ||
          (exam.categoryName || '').toLowerCase().includes(searchLower) ||
          (exam.description || '').toLowerCase().includes(searchLower) ||
          (exam.subjects || []).some(subject =>
            (subject.name || '').toLowerCase().includes(searchLower)
          )
        );
      });
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(exam => {
        const category = categories.find(c => c.id === selectedFilter);
        return category ? exam.categoryName === category.name : true;
      });
    }

    return filtered;
  }, [exams, searchQuery, selectedFilter, categories]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExams.length / EXAMS_PER_PAGE);
  const startIndex = (currentPage - 1) * EXAMS_PER_PAGE;
  const endIndex = startIndex + EXAMS_PER_PAGE;
  const paginatedExams = filteredExams.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Save current page to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('examsCurrentPage', currentPage.toString());
  }, [currentPage]);

  const handleAddExam = (newExam: Omit<Exam, 'id'>) => {
    const examWithId = {
      ...newExam,
      id: newExam.name.toLowerCase().replace(/\s+/g, '-'),
    };
    setExams(prev => [...prev, examWithId]);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-success text-success-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'Hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Helmet>
        <title>Exams - ExamTracker | Comprehensive Exam Preparation Tracker</title>
        <meta 
          name="description" 
          content="Browse and track preparation for IBPS PO, NEET, JEE, SSC, UPSC, CAT, GATE and other competitive exams on ExamTracker." 
        />
        <link rel="canonical" href="/exams" />
        <meta property="og:title" content="Exams - ExamTracker" />
        <meta property="og:description" content="Track your competitive exam preparation" />
        <meta 
          name="description" 
          content="Explore and prepare for competitive exams including IBPS PO, NEET, JEE Main with comprehensive study materials and progress tracking." 
        />
        <link rel="canonical" href="/exams" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        {loading ? (
          <ExamsLoadingSkeleton />
        ) : (
          <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">All Exams</h1>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search exams (SAT, IELTS, IBPS, NEET...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              {/* Toolbar */}
              <div className="flex flex-row gap-3 justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setIsRequestModalOpen(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Request New Exam</span>
                    <span className="sm:hidden">Request</span>
                  </Button>
              </div>
            </div>


            {/* Results Info */}
            {filteredExams.length > 0 && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredExams.length)}</span> of <span className="font-semibold text-foreground">{filteredExams.length}</span> exams
                </p>
                <p className="text-sm text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{currentPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
                </p>
              </div>
            )}

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
                  <CardHeader className="pb-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      {/* Category Badge - Left Aligned */}
                      <div className="flex">
                        <Badge 
                          className="w-fit"
                          style={{
                            backgroundColor: exam.categoryColor ? `${exam.categoryColor}20` : undefined,
                            color: exam.categoryColor || undefined,
                            borderColor: exam.categoryColor || undefined
                          }}
                        >
                          {exam.categoryName}
                        </Badge>
                      </div>
                      
                      {/* Exam Name */}
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {exam.name}
                      </CardTitle>
                      
                      {/* Full Name */}
                      {exam.full_name && exam.full_name !== exam.name && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {exam.full_name}
                        </p>
                      )}
                      
                      {/* Subjects - Max 5 */}
                      {exam.subjects && exam.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {exam.subjects.slice(0, 5).map((subject) => (
                            <Badge 
                              key={subject.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {subject.name}
                            </Badge>
                          ))}
                          {exam.subjects.length > 5 && (
                            <Badge 
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary/20"
                              onClick={() => navigate(`/exam/${exam.id}`)}
                            >
                              ...more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Desktop/Tablet Layout */}
                    <div className="hidden md:block">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        {/* Left: Exam Name */}
                        <CardTitle className="text-xl group-hover:text-primary transition-colors flex-1">
                          {exam.name}
                        </CardTitle>
                        
                        {/* Right: Category Badge */}
                        <Badge 
                          className="flex-shrink-0"
                          style={{
                            backgroundColor: exam.categoryColor ? `${exam.categoryColor}20` : undefined,
                            color: exam.categoryColor || undefined,
                            borderColor: exam.categoryColor || undefined
                          }}
                        >
                          {exam.type || 'General'}
                        </Badge>
                      </div>
                      
                      {/* Second Row: Full Name */}
                      {exam.full_name && exam.full_name !== exam.name && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {exam.full_name}
                        </p>
                      )}
                      
                      {/* Subjects - Max 5 */}
                      {exam.subjects && exam.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {exam.subjects.slice(0, 5).map((subject) => (
                            <Badge 
                              key={subject.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {subject.name}
                            </Badge>
                          ))}
                          {exam.subjects.length > 5 && (
                            <Badge 
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary/20"
                              onClick={() => navigate(`/exam/${exam.id}`)}
                            >
                              ...more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-0">
                    {/* Progress (if enrolled) */}
                    {exam.isEnrolled && exam.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{exam.progress}%</span>
                        </div>
                        <Progress value={exam.progress} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          {exam.completedTopics} of {exam.totalTopics} topics completed
                        </div>
                      </div>
                    )}

                    {/* Stats - Similar to Landing Page */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{exam.enrolledStudents}</span>
                        <span className="hidden sm:inline ml-1">Enrolled Students</span>
                        <span className="sm:hidden ml-1">Students</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{exam.totalTopics}</span>
                        <span className="ml-1">Topics</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {exam.isEnrolled ? (
                        <Button asChild variant="hero" className="flex-1">
                          <Link to={`/exam/${exam.id}`}>Continue</Link>
                        </Button>
                      ) : (
                        <Button 
                          variant="hero" 
                          className="flex-1"
                          onClick={() => handleEnrollExam(exam.id)}
                          disabled={enrolling === exam.id}
                        >
                          {enrolling === exam.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            'Enroll'
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination className="mt-8 mb-8 pb-4 md:pb-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(p => p - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          setCurrentPage(p => p + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            {/* No Results */}
            {filteredExams.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No exams found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* CTA for More Exams */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Can't find your exam?
                </h3>
                <p className="text-muted-foreground mb-6">
                  We're constantly adding new exams. Let us know what you're looking for!
                </p>
                <Button variant="hero" size="lg" onClick={() => setIsRequestModalOpen(true)}>
                  Request New Exam
                </Button>
              </CardContent>
            </Card>
            </div>
          </main>
        )}
          
        <Footer />
      </div>

      <AddExamModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExam}
      />
      
      <RequestExamModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </>
  );
};

export default Exams;