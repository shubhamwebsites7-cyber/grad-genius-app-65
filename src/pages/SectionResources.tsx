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
  Plus, 
  Search,
  Filter,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { FREE_RESOURCE_LIMIT } from '@/components/resources/LockedResourceOverlay';
import { ResourceCard, ResourceCardData } from '@/components/resources/ResourceCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

  const [resources, setResources] = useState<ResourceCardData[]>([]);
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
      let topicsMap: { [key: string]: string } = {};

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

        let examInfo = { id: '', name: '' };
        if (routeExamId) {
          const { data: examData } = await supabase
            .from('exams')
            .select('id, name')
            .eq('id', routeExamId)
            .maybeSingle();
          if (examData) examInfo = examData;
        }
        if (!examInfo.id) {
          const { data: examSubjectData } = await (supabase as any)
            .from('exam_subjects')
            .select('exam_id, exams(id, name)')
            .eq('subject_id', subject.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          examInfo = examSubjectData?.exams || { id: '', name: '' };
        }
        
        setSection({
          id: subject.id,
          name: subject.name,
          examId: examInfo.id,
          examName: examInfo.name,
          subjectId: subject.id,
          subjectName: subject.name,
          difficulty: 'Medium',
        });

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
          setAvailableTopics([
            { id: sectionId, name: `All ${subject.name} (Subject)`, isSubject: true },
            ...topicsData.map((t: any) => ({ id: t.id, name: t.name, isSubject: false }))
          ]);
        }
      } else {
        const topic = topicData as any;
        topicIds = [topic.id];
        topicsMap[topic.id] = topic.name;
        
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
        
        let topicExamInfo = { id: '', name: '' };
        if (routeExamId) {
          const { data: examData } = await supabase
            .from('exams')
            .select('id, name')
            .eq('id', routeExamId)
            .maybeSingle();
          if (examData) topicExamInfo = examData;
        }
        if (!topicExamInfo.id) {
          const { data: examTopicData } = await (supabase as any)
            .from('exam_topics')
            .select('exam_id, exams(id, name)')
            .eq('topic_id', topic.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          topicExamInfo = examTopicData?.exams || { id: '', name: '' };
        }

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

      // Fetch resources
      let resourcesData: any[] = [];
      const searchIds = isSubject ? [...topicIds, sectionId] : topicIds;
      
      if (searchIds.length > 0) {
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
        setResources([]);
        setLoading(false);
        return;
      }

      const resourceIds = (resourcesData || []).map((r: any) => r.id);
      let userHelpfulSet = new Set<string>();
      let bookmarksSet = new Set<string>();
      let helpfulMap: { [key: string]: number } = {};

      if (resourceIds.length > 0) {
        // Count helpful votes
        const { data: ratingsData } = await supabase
          .from('resource_ratings')
          .select('resource_id')
          .in('resource_id', resourceIds);

        if (ratingsData) {
          ratingsData.forEach((r: any) => {
            helpfulMap[r.resource_id] = (helpfulMap[r.resource_id] || 0) + 1;
          });
        }

        if (user) {
          const { data: userRatings } = await supabase
            .from('resource_ratings')
            .select('resource_id')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds);

          if (userRatings) {
            userRatings.forEach((r: any) => userHelpfulSet.add(r.resource_id));
          }

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

      const sectionRef = section;
      const mappedResources: ResourceCardData[] = (resourcesData || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.resource_type as 'video' | 'pdf' | 'website',
        url: r.url,
        helpfulCount: helpfulMap[r.id] || 0,
        userHelpful: userHelpfulSet.has(r.id),
        dateAdded: new Date(r.created_at),
        isBookmarked: bookmarksSet.has(r.id),
        topicName: r.topic_id === sectionId ? 'General' : (topicsMap[r.topic_id] || 'General'),
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

    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return b.dateAdded.getTime() - a.dateAdded.getTime();
        case 'most-helpful':
          return b.helpfulCount - a.helpfulCount;
        case 'least-helpful':
          return a.helpfulCount - b.helpfulCount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [resources, searchQuery, sortBy]);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url || !user || !section) return;

    const selectedId = newResource.topicId || section.id;
    const isSubjectSelected = availableTopics.find(t => t.id === selectedId && t.isSubject);
    
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

      const { error } = await supabase
        .from('topic_resources')
        .insert({
          topic_id: selectedId,
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

  const handleToggleHelpful = async (resourceId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to mark resources as helpful.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;

      if (resource.userHelpful) {
        const { error } = await supabase
          .from('resource_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId);
        if (error) throw error;

        setResources(prev => prev.map(r =>
          r.id === resourceId
            ? { ...r, userHelpful: false, helpfulCount: r.helpfulCount - 1 }
            : r
        ));
      } else {
        const { error } = await supabase
          .from('resource_ratings')
          .upsert({
            resource_id: resourceId,
            user_id: user.id,
            rating: 5,
            updated_at: new Date().toISOString()
          } as any, {
            onConflict: 'resource_id,user_id'
          });
        if (error) throw error;

        setResources(prev => prev.map(r =>
          r.id === resourceId
            ? { ...r, userHelpful: true, helpfulCount: r.helpfulCount + 1 }
            : r
        ));
      }
    } catch (error: any) {
      console.error('Error toggling helpful:', error);
      toast({
        title: 'Error',
        description: 'Failed to update. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleBookmark = async (resourceId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to bookmark resources.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;

      if (resource.isBookmarked) {
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

      setResources(prev => prev.map(r =>
        r.id === resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r
      ));

      toast({
        title: 'Success',
        description: resource.isBookmarked ? 'Bookmark removed' : 'Resource bookmarked'
      });
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
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
          content={`Explore curated resources for ${section.name} in ${section.examName}. Find videos, PDFs, and websites to enhance your preparation.`} 
        />
        <link rel="canonical" href={`/resources/${section.examId}/${section.id}`} />
        <meta name="robots" content="noindex, nofollow" />
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
                      {section.examName || 'General'}
                    </Badge>
                    <Badge className="bg-secondary/10 text-secondary">
                      {section.subjectName || 'General'}
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        <SelectItem value="most-helpful">Most Helpful</SelectItem>
                        <SelectItem value="least-helpful">Least Helpful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                const isLocked = !subscription.isPremium && index >= FREE_RESOURCE_LIMIT;
                
                return (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isLocked={isLocked}
                    userId={user?.id}
                    onBookmark={handleBookmark}
                    onToggleHelpful={handleToggleHelpful}
                  />
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
