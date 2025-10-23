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
  Bookmark,
  BookmarkCheck,
  Loader2,
  AlertCircle,
  GraduationCap,
  Lock
} from 'lucide-react';
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
  isPending?: boolean;
  contributorName?: string;
  contributorId?: string;
}

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

  const [resources, setResources] = useState<Resource[]>([]);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamAndResources();
    }
  }, [examId, user]);

  const fetchExamAndResources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam data
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('id, name')
        .eq('id', examId)
        .eq('is_active', true)
        .maybeSingle();

      if (examError) throw examError;
      if (!examData) throw new Error('Exam not found');

      setExam(examData);

      // Fetch exam-level resources (where topic_id = exam_id)
      let resourcesData: any[] = [];

      // Fetch approved resources
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
        .eq('topic_id', examId);

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
          .eq('topic_id', examId);

        if (pendingError) throw pendingError;
        if (pendingData) {
          resourcesData = [...resourcesData, ...pendingData];
        }
      }

      // Fetch ratings for all resources
      const resourceIds = resourcesData.map((r: any) => r.id);
      
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
      const mappedResources: Resource[] = resourcesData.map((r: any) => ({
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

    return filtered.sort((a, b) => {
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
  }, [resources, searchQuery, sortBy]);

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
    if (!newResource.title || !newResource.url || !user || !exam) return;

    try {
      const resourceType = newResource.url.includes('youtube') || newResource.url.includes('youtu.be') ? 'video' :
                          newResource.url.includes('.pdf') ? 'pdf' : 'website';

      // Add resource with exam_id as topic_id
      const { error } = await supabase
        .from('topic_resources')
        .insert({
          topic_id: examId, // Store exam_id in topic_id field
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
      
      // Refresh the resources list
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
        title: 'Success',
        description: 'Your rating has been saved.'
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
        // Remove bookmark
        const { error } = await supabase
          .from('user_resource_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId);

        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('user_resource_bookmarks')
          .insert({
            user_id: user.id,
            resource_id: resourceId
          } as any);

        if (error) throw error;
      }

      // Update local state
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
        <title>{exam.name} - Exam Resources | ExamTrakr</title>
        <meta name="description" content={`Browse and contribute exam-level resources for ${exam.name}`} />
      </Helmet>

      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">{exam.name}</h1>
            </div>
            <p className="text-muted-foreground">Exam-level resources (PYQs, strategy guides, etc.)</p>
          </div>
          <Link to={`/exam/${exam.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exam
            </Button>
          </Link>
        </div>

        {/* Add Resource Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contribute Exam Resource</CardTitle>
              <CardDescription>
                Share exam-level resources like PYQs, strategy guides, or general exam materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Resource Title *</label>
                  <Input
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="e.g., Complete PYQ Collection 2015-2024"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="Brief description of the resource"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL *</label>
                  <Input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Submit for Review</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Resource Button */}
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="mb-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Exam Resource
          </Button>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="highest-rated">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resources Grid */}
        {filteredAndSortedResources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No exam resources available yet. Be the first to contribute!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedResources.map((resource, index) => {
              const Icon = getResourceIcon(resource.type);
              const isPremium = subscription.isPremium;
              const isLocked = !isPremium && index >= 2;
              
              return (
                <Card key={resource.id} className={`${resource.isPending ? 'border-amber-500' : ''} ${isLocked ? 'relative opacity-60' : ''}`}>
                  {isLocked && (
                    <div className="absolute inset-0 backdrop-blur-sm bg-background/40 z-10 rounded-lg flex items-center justify-center">
                      <div className="text-center p-6">
                        <Lock className="h-12 w-12 mx-auto mb-3 text-primary" />
                        <p className="text-sm font-semibold mb-2">Premium Resource</p>
                        <Button 
                          asChild 
                          size="sm"
                        >
                          <Link to="/pricing">
                            Click to upgrade and unlock all resources
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="h-6 w-6 text-primary" />
                      <div className="flex items-center gap-2">
                        {resource.isPending && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Pending Review
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(resource.id)}
                          disabled={isLocked}
                        >
                          {resource.isBookmarked ? (
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
                    {resource.description && (
                      <CardDescription>{resource.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => !isLocked && handleRating(resource.id, star)}
                              className="focus:outline-none"
                              disabled={isLocked}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  star <= (resource.userRating || resource.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {resource.rating > 0 ? resource.rating.toFixed(1) : 'No ratings'} ({resource.totalRatings})
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.dateAdded.toLocaleDateString()}
                        </div>
                      </div>

                      {/* Contributor */}
                      {resource.contributorName && (
                        <p className="text-xs text-muted-foreground">
                          Contributed by {resource.contributorName}
                        </p>
                      )}

                      {/* Action Button */}
                      <Button
                        className="w-full"
                        onClick={() => !isLocked && window.open(resource.url, '_blank')}
                        disabled={isLocked}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {getResourceButtonText(resource.type)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resource Submitted!</AlertDialogTitle>
            <AlertDialogDescription>
              Your exam resource has been submitted for admin review. It will appear here once approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default ExamResources;
