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
            const IconComponent = getResourceIcon(resource.type);
            const isLocked = (!subscription.isPremium || subscription.status === 'trial') && index >= 3;
            
            return (
              <Card 
                key={resource.id} 
                className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group relative ${
                  resource.isBookmarked ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                } ${isLocked ? 'blur-sm' : ''}`}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-base font-semibold text-foreground">Upgrade to Unlock</p>
                      <p className="text-xs text-muted-foreground">Get full access to all resources</p>
                    </div>
                  </div>
                )}
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
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBookmark(resource.id)}
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
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(resource.id, star)}
                          className="cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= (resource.userRating || resource.rating) 
                                ? 'fill-warning text-warning' 
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({resource.rating.toFixed(1)})
                      </span>
                    </div>
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
                </CardContent>
              </Card>
            );
          })}

          {/* Show locked resources for trial users */}
          {subscription.status === 'trial' && filteredAndSortedResources.length > 3 && 
            filteredAndSortedResources.slice(3).map((resource, index) => {
              const IconComponent = getResourceIcon(resource.type);
              
              return (
                <Link to="/pricing" key={`locked-${resource.id}`}>
                  <Card 
                    className="relative hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer opacity-60 hover:opacity-80"
                  >
                    {/* Blur overlay */}
                    <div className="absolute inset-0 backdrop-blur-sm bg-background/50 rounded-lg z-10 flex items-center justify-center">
                      <div className="text-center p-4">
                        <Lock className="h-8 w-8 text-warning mx-auto mb-2" />
                        <p className="text-sm font-semibold text-foreground">Upgrade to Unlock</p>
                      </div>
                    </div>
                    
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
                          <CardTitle className="text-lg line-clamp-2 flex-1">
                            {resource.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {resource.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {resource.description}
                        </CardDescription>
                      )}
                      <div className="h-20" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          }
        </div>

        {/* Resource Limit Info for Trial Users Only */}
        {subscription.status === 'trial' && resources.length > 3 && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Free trial users can access 3 resources per topic. Upgrade to unlock all resources!
              <Link to="/pricing" className="ml-2 underline font-medium">
                View Plans
              </Link>
            </AlertDescription>
          </Alert>
        )}

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
