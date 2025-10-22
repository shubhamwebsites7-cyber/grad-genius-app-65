import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, ExternalLink, Video, FileText, BookOpen, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Resource {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  admin_approved: boolean;
  is_active: boolean;
  contributed_by_user_id: string | null;
  created_at: string;
  avg_rating?: number;
  scope_name?: string;
  scope_type?: 'topic' | 'subject';
  exam_name?: string;
  subject_name?: string;
  users?: {
    full_name: string;
  };
}

export const EnhancedResourcesSection = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, [filter, typeFilter]);

  const fetchResources = async () => {
    try {
      let query = supabase
        .from('topic_resources')
        .select(`
          *,
          resource_ratings(rating),
          users(full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('admin_approved', false);
      } else if (filter === 'approved') {
        query = query.eq('admin_approved', true);
      }

      if (typeFilter !== 'all') {
        query = query.eq('resource_type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch topic and section information for each resource
      const enrichedResources = await Promise.all(
        (data || []).map(async (resource: any) => {
          // Calculate average rating
          const ratings = resource.resource_ratings || [];
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 0;

          // Try to fetch as topic first
          const { data: topicData } = await supabase
            .from('topics')
            .select('name, exam_sections(name, exams(name))')
            .eq('id', resource.topic_id)
            .maybeSingle();

          if (topicData) {
            // It's a topic-level resource
            const topicInfo = topicData as any;
            return {
              ...resource,
              avg_rating: avgRating,
              scope_name: topicInfo.name,
              scope_type: 'topic' as const,
              subject_name: topicInfo.exam_sections?.name || '',
              exam_name: topicInfo.exam_sections?.exams?.name || '',
            };
          }

          // Try to fetch as section (subject)
          const { data: sectionData } = await supabase
            .from('exam_sections')
            .select('name, exams(name)')
            .eq('id', resource.topic_id)
            .maybeSingle();

          if (sectionData) {
            // It's a subject-level resource
            const sectionInfo = sectionData as any;
            return {
              ...resource,
              avg_rating: avgRating,
              scope_name: sectionInfo.name,
              scope_type: 'subject' as const,
              subject_name: sectionInfo.name,
              exam_name: sectionInfo.exams?.name || '',
            };
          }

          // Fallback if neither found
          return {
            ...resource,
            avg_rating: avgRating,
            scope_name: 'Unknown',
            scope_type: 'topic' as const,
          };
        })
      );

      setResources(enrichedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('topic_resources')
        .update as any)({ admin_approved: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource approved successfully",
      });

      fetchResources();
    } catch (error) {
      console.error('Error approving resource:', error);
      toast({
        title: "Error",
        description: "Failed to approve resource",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('topic_resources')
        .update as any)({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource rejected successfully",
      });

      fetchResources();
    } catch (error) {
      console.error('Error rejecting resource:', error);
      toast({
        title: "Error",
        description: "Failed to reject resource",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'article':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (adminApproved: boolean) => {
    return adminApproved ? (
      <Badge variant="default" className="bg-green-600">Approved</Badge>
    ) : (
      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600">Pending</Badge>
    );
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        <Star className={`h-4 w-4 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <p className="text-muted-foreground">Manage and review learning resources</p>
      </div>

      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {resources.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No resources found</p>
            </CardContent>
          </Card>
        ) : (
          resources.map((resource) => {
            const isValidUrl = validateUrl(resource.url);
            return (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(resource.resource_type)}
                        {resource.title}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary">{resource.resource_type}</Badge>
                        {getStatusBadge(resource.admin_approved)}
                        {resource.scope_type === 'subject' && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-600">
                            Subject-Level
                          </Badge>
                        )}
                        {!isValidUrl && (
                          <Badge variant="destructive">Invalid URL</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {resource.exam_name && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Exam:</span> {resource.exam_name}
                          </p>
                        )}
                        {resource.subject_name && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Subject:</span> {resource.subject_name}
                          </p>
                        )}
                        {resource.scope_type === 'topic' && resource.scope_name && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Topic:</span> {resource.scope_name}
                          </p>
                        )}
                        {resource.users && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Submitted by:</span> {resource.users.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {renderRating(resource.avg_rating || 0)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.description && (
                    <p className="text-muted-foreground">{resource.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      value={resource.url}
                      readOnly
                      className={!isValidUrl ? 'border-destructive' : ''}
                    />
                    {isValidUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {!resource.admin_approved && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(resource.id)}
                        disabled={!isValidUrl}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(resource.id)}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Added on {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
