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
  BookOpen,
  Loader2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

import { ResourceCard, ResourceCardData } from '@/components/resources/ResourceCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ExamData {
  id: string;
  name: string;
}

const ExamResources = () => {
  const { examId } = useParams<{ examId: string }>();
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
    url: ''
  });

  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamAndResources();
    }
  }, [examId, user?.id]);

  const fetchExamAndResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, name')
        .eq('id', examId)
        .eq('is_active', true)
        .maybeSingle();

      if (examError) throw examError;
      if (!examData) throw new Error('Exam not found');

      setExam(examData);

      let resourcesData: any[] = [];

      const { data: approvedData, error: approvedError } = await supabase
        .from('topic_resources')
        .select(`
          id,
          title,
          description,
          resource_type,
          url,
          is_premium,
          admin_approved,
          created_at,
          contributed_by_user_id,
          topic_id,
          contributor:users!topic_resources_contributed_by_user_id_fkey(
            id,
            full_name
          )
        `)
        .eq('is_active', true)
        .eq('admin_approved', true)
        .eq('topic_id', examId);

      if (approvedError) throw approvedError;
      resourcesData = approvedData || [];

      if (user) {
        const { data: pendingData, error: pendingError } = await supabase
          .from('topic_resources')
          .select(`
            id,
            title,
            description,
            resource_type,
            url,
            is_premium,
            admin_approved,
            created_at,
            contributed_by_user_id,
            topic_id,
            contributor:users!topic_resources_contributed_by_user_id_fkey(
              id,
              full_name
            )
          `)
          .eq('is_active', true)
          .eq('admin_approved', false)
          .eq('contributed_by_user_id', user.id)
          .eq('topic_id', examId);

        if (pendingError) throw pendingError;
        if (pendingData) {
          resourcesData = [...resourcesData, ...pendingData];
        }
      }

      const resourceIds = resourcesData.map((r: any) => r.id);
      let userHelpfulSet = new Set<string>();
      let bookmarksSet = new Set<string>();

      if (resourceIds.length > 0 && user) {
        // Fetch user's helpful votes from resource_votes
        const { data: userVotes } = await supabase
          .from('resource_votes' as any)
          .select('resource_id')
          .eq('user_id', user.id)
          .in('resource_id', resourceIds);

        if (userVotes) {
          (userVotes as any[]).forEach((r: any) => userHelpfulSet.add(r.resource_id));
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

      // Count helpful votes per resource from resource_votes
      let helpfulMap: { [key: string]: number } = {};
      if (resourceIds.length > 0) {
        const { data: votesData } = await supabase
          .from('resource_votes' as any)
          .select('resource_id')
          .in('resource_id', resourceIds);

        if (votesData) {
          (votesData as any[]).forEach((r: any) => {
            helpfulMap[r.resource_id] = (helpfulMap[r.resource_id] || 0) + 1;
          });
        }
      }

      const mappedResources: ResourceCardData[] = resourcesData.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.resource_type as 'video' | 'pdf' | 'website',
        url: r.url,
        helpfulCount: helpfulMap[r.id] || 0,
        userHelpful: userHelpfulSet.has(r.id),
        dateAdded: new Date(r.created_at),
        isBookmarked: bookmarksSet.has(r.id),
        isPending: !r.admin_approved,
        contributorName: r.contributor?.full_name || 'Anonymous',
        contributorId: r.contributed_by_user_id
      }));

      setResources(mappedResources);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching exam resources:', err);
      setError(err.message || 'Failed to load exam resources');
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
    if (!newResource.title || !newResource.url || !user || !exam) return;

    try {
      const resourceType = newResource.url.includes('youtube') || newResource.url.includes('youtu.be') ? 'video' :
                          newResource.url.includes('.pdf') ? 'pdf' : 'website';

      const { error } = await supabase
        .from('topic_resources')
        .insert({
          topic_id: examId,
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

      setNewResource({ title: '', description: '', url: '' });
      setShowAddForm(false);
      setShowSuccessDialog(true);
      await fetchExamAndResources();
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
        // Remove vote
        const { error } = await supabase
          .from('resource_votes' as any)
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
        // Add vote
        const { error } = await (supabase as any)
          .from('resource_votes')
          .insert({
            resource_id: resourceId,
            user_id: user.id
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Exam not found'}</AlertDescription>
          </Alert>
          <Link to="/exams">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{exam.name} - Exam Resources | ExamTracker</title>
        <meta name="description" content={`Browse and contribute exam-level resources for ${exam.name}`} />
      </Helmet>

      <Navigation />

      <main className="flex-1 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
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
                <Link to={`/exam/${exam.id}`}>{exam.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exam Resources</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Resources for {exam.name}
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg mb-4">
                Exam-level resources (PYQs, strategy guides, etc.)
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary pointer-events-none">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {exam.name}
                </Badge>
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
                Share exam-level resources like PYQs, strategy guides, or general exam materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Resource Title *
                  </label>
                  <Input
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
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
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="Brief description (optional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Resource URL *
                  </label>
                  <Input
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
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
            const isLocked = !subscription.isPremium;
            
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
                : 'Be the first to add a resource for this exam!'
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

      <Footer />
    </div>
  );
};

export default ExamResources;
