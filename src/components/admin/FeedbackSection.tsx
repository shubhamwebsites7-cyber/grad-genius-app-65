import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Feedback {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  rating: number;
  review: string | null;
  created_at: string;
}

export const FeedbackSection = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setFeedback(data as unknown as Feedback[]);
        if (data.length > 0) {
          const avg = (data as any[]).reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / data.length;
          setAvgRating(avg);
        }
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const dist = [0, 0, 0, 0, 0];
    feedback.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++;
    });
    return dist;
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

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Feedback</h2>
        <p className="text-muted-foreground">Review user ratings and reviews ({feedback.length} total)</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStars(Math.round(avgRating))}
            <p className="text-2xl font-bold mt-2">{avgRating.toFixed(1)}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{feedback.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4">{star}★</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: feedback.length ? `${(distribution[star - 1] / feedback.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-right text-muted-foreground">{distribution[star - 1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No feedback yet</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold">{item.user_name || 'Anonymous'}</p>
                      {item.user_email && (
                        <p className="text-sm text-muted-foreground">{item.user_email}</p>
                      )}
                    </div>
                    {renderStars(item.rating)}
                  </div>
                  <Badge variant="outline">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                {item.review && (
                  <p className="mt-3 text-muted-foreground">{item.review}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
