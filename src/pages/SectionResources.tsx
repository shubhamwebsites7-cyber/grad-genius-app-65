import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Plus, 
  Search,
  Filter,
  Star,
  Youtube,
  FileText,
  ExternalLink,
  BookOpen,
  Clock,
  Users,
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LockedResourceOverlay, FREE_RESOURCE_LIMIT } from '@/components/resources/LockedResourceOverlay';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'pdf' | 'website';
  url: string;
  rating: number;
  totalRatings: number;
  userRating?: number;
  dateAdded: Date;
  isBookmarked?: boolean;
  topicId?: string;
  topicName?: string;
  isPending?: boolean;
  contributorName?: string;
  contributorId?: string;
}

interface TopicData {
  id: string;
  name: string;
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calculatedDifficulty?: 'Easy' | 'Medium' | 'Hard';
  userDifficultyRating?: 'Easy' | 'Medium' | 'Hard';
  marks?: number;
}

const SectionResources = () => {
  const { sectionId, examId: routeExamId } = useParams<{ sectionId: string; examId?: string }>();
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    url: '',
    topicId: ''
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [section, setSection] = useState<TopicData | null>(null);
  const [availableTopics, setAvailableTopics] = useState<{ id: string; name: string; isSubject?: boolean }[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (sectionId) {
      fetchSectionAndResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  const fetchSectionAndResources = async () => {
    try {
      setLoading(true);
      setError(null);

      let isSubject = false;
      let topicIds: string[] = [];
      let topicsMap: { [key: string]: string } = {}; // Map of topic_id -> topic_name

      // First, try to fetch as a topic
      let { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          difficulty,
          marks,
          subject_id,
          subjects (
            id,
            name
          )
        `)
        .eq('id', sectionId)
        .eq('is_active', true)
        .maybeSingle();

      // If not found as topic, try as subject
      if (!topicData) {
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select(`
            id,
            name
          `)
          .eq('id', sectionId)
          .eq('is_active', true)
          .maybeSingle();

        if (subjectError) throw subjectError;
        if (!subjectData) throw new Error('Section not found');

        const subject = subjectData as any;
        isSubject = true;

        // Get exam info via junction table
        const { data: examSubjectData } = await (supabase as any)
          .from('exam_subjects')
          .select('exam_id, exams(id, name)')
          .eq('subject_id', subject.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        const examInfo = examSubjectData?.exams || { id: '', name: '' };
        
        setSection({
          id: subject.id,
          name: subject.name,
          examId: examInfo.id,
          examName: examInfo.name,
          subjectId: subject.id,
          subjectName: subject.name,
          difficulty: 'Medium',
        });

        // Fetch all topics for this subject
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('id, name')
          .eq('subject_id', sectionId)
          .eq('is_active', true);

        if (topicsError) throw topicsError;
        
        if (topicsData && topicsData.length > 0) {
          topicIds = topicsData.map((t: any) => t.id);
          topicsData.forEach((t: any) => {
            topicsMap[t.id] = t.name;
          });
          // Add subject as first option, then all topics
          setAvailableTopics([
            { id: sectionId, name: `All ${subject.name} (Subject)`, isSubject: true },
            ...topicsData.map((t: any) => ({ id: t.id, name: t.name, isSubject: false }))
          ]);
        }
      } else {
        const topic = topicData as any;
        topicIds = [topic.id];
        topicsMap[topic.id] = topic.name;
        
        // Fetch calculated difficulty and user rating
        let calculatedDifficulty: string | null = null;
        let userDifficultyRating: string | null = null;

        const { data: calcDiffData } = await (supabase as any)
          .rpc('get_topic_calculated_difficulty', { p_topic_id: topic.id });
        calculatedDifficulty = calcDiffData;

        if (user) {
          const { data: userRatingData } = await supabase
            .from('topic_difficulty_ratings')
            .select('difficulty_rating')
            .eq('topic_id', topic.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userRatingData) {
            userDifficultyRating = (userRatingData as any).difficulty_rating;
          }
        }
        
        // Get exam info via junction table
        const { data: examTopicData } = await (supabase as any)
          .from('exam_topics')
          .select('exam_id, exams(id, name)')
          .eq('topic_id', topic.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        const topicExamInfo = examTopicData?.exams || { id: '', name: '' };

        setSection({
          id: topic.id,
          name: topic.name,
          examId: topicExamInfo.id,
          examName: topicExamInfo.name,
          subjectId: topic.subjects.id,
          subjectName: topic.subjects.name,
          difficulty: topic.difficulty,
          calculatedDifficulty: (calculatedDifficulty || topic.difficulty) as 'Easy' | 'Medium' | 'Hard',
          userDifficultyRating: userDifficultyRating as 'Easy' | 'Medium' | 'Hard' | undefined,
          marks: topic.marks
        });
      }

      // Fetch resources for the topic(s)
      let resourcesData: any[] = [];
      
      // Build the list of IDs to search for resources
      // Include both topic IDs and section ID (for subject-level resources)
      const searchIds = isSubject ? [...topicIds, sectionId] : topicIds;
      
      if (searchIds.length > 0) {
        // Fetch approved resources with contributor info
        const { data: approvedData, error: approvedError } = await supabase
          .from('topic_resources')
          .select(`
            *,
            contributor:users!topic_resources_contributed_by_user_id_fkey(
              id,
              full_name
            )
          `)
          .eq('is_active', true)
          .eq('admin_approved', true)
          .in('topic_id', searchIds);

        if (approvedError) throw approvedError;
        resourcesData = approvedData || [];

        // If user is logged in, also fetch their pending contributions
        if (user) {
          const { data: pendingData, error: pendingError } = await supabase
            .from('topic_resources')
            .select(`
              *,
              contributor:users!topic_resources_contributed_by_user_id_fkey(
                id,
                full_name
              )
            `)
            .eq('is_active', true)
            .eq('admin_approved', false)
            .eq('contributed_by_user_id', user.id)
            .in('topic_id', searchIds);

          if (pendingError) throw pendingError;
          if (pendingData) {
            resourcesData = [...resourcesData, ...pendingData];
          }
        }
      } else {
        // If no topics found for subject, set empty resources
        setResources([]);
        setLoading(false);
        return;
      }

      // Fetch ratings for all resources
      const resourceIds = (resourcesData || []).map((r: any) => r.id);
      
      let ratingsMap: { [key: string]: { avg: number; count: number } } = {};
      let userRatingsMap: { [key: string]: number } = {};
      let bookmarksSet = new Set<string>();

      if (resourceIds.length > 0) {
        // Fetch average ratings
        const { data: ratingsData } = await supabase
          .from('resource_ratings')
          .select('resource_id, rating');

        if (ratingsData) {
          ratingsData.forEach((r: any) => {
            if (!ratingsMap[r.resource_id]) {
              ratingsMap[r.resource_id] = { avg: 0, count: 0 };
            }
            ratingsMap[r.resource_id].avg += r.rating;
            ratingsMap[r.resource_id].count += 1;
          });

          Object.keys(ratingsMap).forEach(id => {
            ratingsMap[id].avg = ratingsMap[id].avg / ratingsMap[id].count;
          });
        }

        // Fetch user's ratings if logged in
        if (user) {
          const { data: userRatings } = await supabase
            .from('resource_ratings')
            .select('resource_id, rating')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds);

          if (userRatings) {
            userRatings.forEach((r: any) => {
              userRatingsMap[r.resource_id] = r.rating;
            });
          }

          // Fetch user's bookmarks
          const { data: bookmarks } = await supabase
            .from('user_resource_bookmarks')
            .select('resource_id')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds);

          if (bookmarks) {
            bookmarks.forEach((b: any) => bookmarksSet.add(b.resource_id));
          }
        }
      }

      // Map resources
      const mappedResources: Resource[] = (resourcesData || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.resource_type as 'video' | 'pdf' | 'website',
        url: r.url,
        rating: ratingsMap[r.id]?.avg || 0,
        totalRatings: ratingsMap[r.id]?.count || 0,
        userRating: userRatingsMap[r.id],
        dateAdded: new Date(r.created_at),
        isBookmarked: bookmarksSet.has(r.id),
        topicId: r.topic_id,
        // If topic_id matches sectionId (subject), show subject name, otherwise show topic name
        topicName: r.topic_id === sectionId ? `${section?.name} (Subject)` : (topicsMap[r.topic_id] || 'Unknown Topic'),
        isPending: !r.admin_approved,
        contributorName: r.contributor?.full_name || 'Anonymous',
        contributorId: r.contributed_by_user_id
      }));

      setResources(mappedResources);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching section data:', err);
      setError(err.message || 'Failed to load section data');
      setLoading(false);
    }
  };

  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter(resource =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort resources
    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return b.dateAdded.getTime() - a.dateAdded.getTime();
        case 'popular':
          return b.totalRatings - a.totalRatings;
        case 'highest-rated':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return sorted;
  }, [resources, searchQuery, sortBy, subscription]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return Youtube;
      case 'pdf': return FileText;
      case 'website': return ExternalLink;
      default: return BookOpen;
    }
  };

  const getResourceButtonText = (type: string) => {
    switch (type) {
      case 'video': return 'Watch Video';
      case 'pdf': return 'View PDF';
      case 'website': return 'Visit Website';
      default: return 'View Resource';
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url || !user || !section) return;

    // Determine the topic ID to use
    const selectedId = newResource.topicId || section.id;
    
    // Check if a subject is selected (not a specific topic)
    const isSubjectSelected = availableTopics.find(t => t.id === selectedId && t.isSubject);
    
    // Validate that we have a valid selection
    if (!selectedId) {
      toast({
        title: 'Error',
        description: 'Please select a topic or subject for this resource.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const resourceType = newResource.url.includes('youtube') || newResource.url.includes('youtu.be') ? 'video' :
                          newResource.url.includes('.pdf') ? 'pdf' : 'website';

      // Add resource once - either to specific topic or to subject (section_id)
      const { error } = await supabase
        .from('topic_resources')
        .insert({
          topic_id: selectedId, // Can be either topic_id or section_id (subject)
          title: newResource.title,
          description: newResource.description,
          resource_type: resourceType,
          url: newResource.url,
          is_user_contributed: true,
          contributed_by_user_id: user.id,
          admin_approved: false,
          is_active: true
        } as any);

      if (error) throw error;

      setNewResource({ title: '', description: '', url: '', topicId: '' });
      setShowAddForm(false);
      setShowSuccessDialog(true);
      
      // Refresh the resources list to show the new pending resource
      await fetchSectionAndResources();
    } catch (error: any) {
      console.error('Error adding resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to add resource. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRating = async (resourceId: string, rating: number) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to rate resources.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('resource_ratings')
        .upsert({
          resource_id: resourceId,
          user_id: user.id,
          rating,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'resource_id,user_id'
        });

      if (error) throw error;

      // Update local state
      setResources(prev => prev.map(resource => {
        if (resource.id === resourceId) {
          const oldUserRating = resource.userRating || 0;
          const newTotalRatings = resource.userRating ? resource.totalRatings : resource.totalRatings + 1;
          const oldTotal = resource.rating * resource.totalRatings;
          const newTotal = oldTotal - oldUserRating + rating;
          const newAvg = newTotalRatings > 0 ? newTotal / newTotalRatings : 0;

          return {
            ...resource,
            userRating: rating,
            rating: newAvg,
            totalRatings: newTotalRatings
          };
        }
        return resource;
      }));

      toast({
        title: 'Rating saved',
        description: 'Your rating has been saved.',
      });
    } catch (error: any) {
      console.error('Error rating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rating. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBookmark = async (resourceId: string, isCurrentlyBookmarked: boolean) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to bookmark resources.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isCurrentlyBookmarked) {
        const { error } = await supabase
          .from('user_resource_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_resource_bookmarks')
          .insert({
            user_id: user.id,
            resource_id: resourceId
          } as any);

        if (error) throw error;
      }

      setResources(prev => prev.map(resource =>
        resource.id === resourceId
          ? { ...resource, isBookmarked: !isCurrentlyBookmarked }
          : resource
      ));

      toast({
        title: isCurrentlyBookmarked ? 'Bookmark removed' : 'Bookmark added',
        description: isCurrentlyBookmarked ? 'Resource removed from bookmarks.' : 'Resource added to bookmarks.',
      });
    } catch (error: any) {
      console.error('Error bookmarking resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDifficultyRating = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    if (!user || !section) {
      toast({
        title: 'Login required',
        description: 'Please login to rate topic difficulty.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('topic_difficulty_ratings')
        .upsert({
          topic_id: section.id,
          user_id: user.id,
          difficulty_rating: difficulty,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_id,topic_id'
        });

      if (error) throw error;

      // Fetch updated calculated difficulty
      const { data: calcDiffData } = await (supabase as any)
        .rpc('get_topic_calculated_difficulty', { p_topic_id: section.id });

      setSection(prev => prev ? {
        ...prev,
        userDifficultyRating: difficulty,
        calculatedDifficulty: (calcDiffData || prev.difficulty) as 'Easy' | 'Medium' | 'Hard'
      } : null);

      toast({
        title: 'Rating saved',
        description: 'Your difficulty rating has been saved.',
      });
    } catch (error: any) {
      console.error('Error rating difficulty:', error);
      toast({
        title: 'Error',
        description: 'Failed to save difficulty rating. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const renderStars = (rating: number, userRating?: number, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate?.(star)}
            className={`${onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!onRate}
          >
            <Star
              className={`h-4 w-4 ${
                star <= (userRating || rating) 
                  ? 'fill-warning text-warning' 
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || 'Section not found'}
            </h1>
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
        <title>Resources for {section.name} - {section.examName} | Examtrakr</title>
        <meta 
          name="description" 
          content={`Study resources and materials for ${section.name} section of ${section.examName} exam on Examtrakr.`} 
        />
        <link rel="canonical" href={`/resources/${sectionId}`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta 
          name="description" 
          content={`Explore curated resources for ${section.name} in ${section.examName}. Find videos, PDFs, and websites to enhance your preparation.`} 
        />
        <link rel="canonical" href={`/resources/${section.id}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navigation />
        
        <main className="flex-1 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/exams">Exams</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/exam/${section.examId}`}>{section.examName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{section.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Resources for {section.name}
                  </h1>
                  <p className="text-muted-foreground text-base sm:text-lg mb-4">
                    Explore and share resources for better preparation
                  </p>
                  
                  {/* Topic Info */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-primary/10 text-primary">
                      {section.examName}
                    </Badge>
                    <Badge className="bg-secondary/10 text-secondary">
                      {section.subjectName}
                    </Badge>
                    <Badge className={`${
                      (section.calculatedDifficulty || section.difficulty) === 'Easy' ? 'bg-success/10 text-success' :
                      (section.calculatedDifficulty || section.difficulty) === 'Medium' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {section.calculatedDifficulty || section.difficulty}
                    </Badge>
                    {section.marks && (
                      <Badge variant="outline">
                        {section.marks} marks
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest Updates</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="highest-rated">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Add Resource Button */}
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Resource
                  </Button>
                </div>
              </div>
            </div>

            {/* Add Resource Form */}
            {showAddForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Add New Resource</CardTitle>
                  <CardDescription>
                    Share a helpful resource for a specific topic or the entire subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddResource} className="space-y-4">
                    {availableTopics.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Topic or Subject *
                        </label>
                        <Select
                          value={newResource.topicId}
                          onValueChange={(value) => setNewResource(prev => ({ ...prev, topicId: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic or subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTopics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Resource Title *
                      </label>
                      <Input
                        value={newResource.title}
                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter resource title"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description
                      </label>
                      <Input
                        value={newResource.description}
                        onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description (optional)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Resource URL *
                      </label>
                      <Input
                        value={newResource.url}
                        onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com or YouTube URL"
                        type="url"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" variant="hero">
                        Add Resource
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredAndSortedResources.map((resource, index) => {
                const IconComponent = getResourceIcon(resource.type);
                const isLocked = !subscription.isPremium && index >= FREE_RESOURCE_LIMIT;
                
                return (
                  <Card 
                    key={resource.id} 
                    className={`transition-all duration-200 group relative ${
                      isLocked 
                        ? 'opacity-70 cursor-not-allowed' 
                        : 'hover:shadow-lg hover:scale-[1.02]'
                    } ${resource.isBookmarked ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                  >
                    {isLocked && <LockedResourceOverlay />}
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          resource.type === 'video' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
                          resource.type === 'pdf' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                          'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2 flex-1">
                              {resource.title}
                            </CardTitle>
                            {resource.isPending && (
                              <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                                Pending
                              </Badge>
                            )}
                          </div>
                          {resource.topicName && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {resource.topicName}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBookmark(resource.id, resource.isBookmarked || false)}
                          className={`shrink-0 hover:scale-110 transition-transform ${
                            resource.isBookmarked ? 'text-primary' : ''
                          }`}
                          title={resource.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          {resource.isBookmarked ? (
                            <BookmarkCheck className="h-4 w-4 fill-current" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Description */}
                      {resource.description && (
                        <CardDescription className="text-sm line-clamp-3">
                          {resource.description}
                        </CardDescription>
                      )}

                      {/* Rating */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Rating</span>
                          <span className="text-sm text-muted-foreground">
                            {resource.totalRatings} reviews
                          </span>
                        </div>
                        {renderStars(resource.rating, resource.userRating, (rating) => handleRating(resource.id, rating))}
                        {resource.userRating && (
                          <p className="text-xs text-success">Your rating: {resource.userRating}/5</p>
                        )}
                      </div>

                      {/* Contributor Info */}
                      {resource.contributorName && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          Added by {resource.contributorId === user?.id ? 'You' : resource.contributorName}
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.dateAdded.toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isLocked && (
                        <Button 
                          asChild 
                          variant="hero" 
                          className="w-full"
                        >
                          <a 
                            href={resource.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <IconComponent className="h-4 w-4" />
                            {getResourceButtonText(resource.type)}
                          </a>
                        </Button>
                      )}
                      {isLocked && (
                        <Button 
                          variant="outline" 
                          className="w-full pointer-events-none"
                          disabled
                        >
                          <IconComponent className="h-4 w-4 mr-2" />
                          {getResourceButtonText(resource.type)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredAndSortedResources.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search criteria' 
                    : 'Be the first to add a resource for this topic!'
                  }
                </p>
                <Button 
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery('');
                    } else {
                      setShowAddForm(true);
                    }
                  }}
                  variant="outline"
                >
                  {searchQuery ? 'Clear Search' : 'Add Resource'}
                </Button>
              </div>
            )}
          </div>
        </main>

        <Footer />

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resource Submitted Successfully! 🎉</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Thank you for contributing! Your resource has been submitted for approval.
                </p>
                <p className="font-medium text-foreground">
                  After admin approval, it will be visible to all users.
                </p>
                <p className="text-sm">
                  ⏱️ This process typically takes up to 24 hours.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default SectionResources;
