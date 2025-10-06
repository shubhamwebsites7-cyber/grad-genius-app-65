import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, ThumbsDown, DollarSign, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Feedback {
  id: string;
  user_id: string;
  helpful: string;
  easy_to_use: string;
  design_speed: string;
  recommend: string;
  pricing_preference: string;
  improvements: string | null;
  created_at: string;
}

export const FeedbackSection = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgHelpful: 0,
    avgEasyToUse: 0,
    avgDesignSpeed: 0,
    wouldRecommend: 0,
  });

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
        setFeedback(data);
        calculateStats(data);
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

  const calculateStats = (data: Feedback[]) => {
    if (data.length === 0) return;

    const sum = data.reduce((acc, item) => ({
      helpful: acc.helpful + parseInt(item.helpful),
      easyToUse: acc.easyToUse + parseInt(item.easy_to_use),
      designSpeed: acc.designSpeed + parseInt(item.design_speed),
      recommend: acc.recommend + (item.recommend === 'yes' ? 1 : 0),
    }), { helpful: 0, easyToUse: 0, designSpeed: 0, recommend: 0 });

    setStats({
      avgHelpful: sum.helpful / data.length,
      avgEasyToUse: sum.easyToUse / data.length,
      avgDesignSpeed: sum.designSpeed / data.length,
      wouldRecommend: (sum.recommend / data.length) * 100,
    });
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

  const getPricingBadge = (preference: string) => {
    const badges: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      'free_is_good': { label: 'Free is Good', variant: 'default' },
      'would_pay_monthly': { label: 'Would Pay Monthly', variant: 'secondary' },
      'would_pay_lifetime': { label: 'Would Pay Lifetime', variant: 'outline' },
      'too_expensive': { label: 'Too Expensive', variant: 'destructive' },
    };
    const badge = badges[preference] || { label: preference, variant: 'outline' as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
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
        <h2 className="text-2xl font-bold">User Feedback</h2>
        <p className="text-muted-foreground">Review user feedback and satisfaction metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Helpfulness</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStars(stats.avgHelpful)}
            <p className="text-2xl font-bold mt-2">{stats.avgHelpful.toFixed(1)}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ease of Use</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStars(stats.avgEasyToUse)}
            <p className="text-2xl font-bold mt-2">{stats.avgEasyToUse.toFixed(1)}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Design & Speed</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStars(stats.avgDesignSpeed)}
            <p className="text-2xl font-bold mt-2">{stats.avgDesignSpeed.toFixed(1)}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Would Recommend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold">{stats.wouldRecommend.toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex gap-4 items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Helpful</p>
                        {renderStars(parseInt(item.helpful))}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Easy to Use</p>
                        {renderStars(parseInt(item.easy_to_use))}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Design/Speed</p>
                        {renderStars(parseInt(item.design_speed))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {item.recommend === 'yes' ? (
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  {getPricingBadge(item.pricing_preference)}
                </div>

                {item.improvements && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Improvements:</h4>
                    <p className="text-muted-foreground">{item.improvements}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
