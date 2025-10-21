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
  user_name: string | null;
  user_email: string | null;
  helpfulness: string;
  ease_of_use: string;
  design_speed: string;
  recommendation: string;
  pricing_preference: string;
  improvement_suggestion: string | null;
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

    const helpfulMap: { [key: string]: number } = {
      'very_helpful': 5,
      'somewhat_helpful': 4,
      'neutral': 3,
      'not_helpful': 1
    };

    const easeMap: { [key: string]: number } = {
      'very_easy': 5,
      'easy': 4,
      'average': 3,
      'difficult': 1
    };

    const designMap: { [key: string]: number } = {
      'yes_great': 5,
      'okay': 3,
      'needs_improvement': 1
    };

    const sum = data.reduce((acc, item) => ({
      helpful: acc.helpful + (helpfulMap[item.helpfulness] || 3),
      easyToUse: acc.easyToUse + (easeMap[item.ease_of_use] || 3),
      designSpeed: acc.designSpeed + (designMap[item.design_speed] || 3),
      recommend: acc.recommend + (item.recommendation === 'definitely' ? 1 : item.recommendation === 'maybe' ? 0.5 : 0),
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
      '0': { label: '₹0 (Free)', variant: 'default' },
      '79': { label: '₹79', variant: 'secondary' },
      '89': { label: '₹89', variant: 'secondary' },
      '99+': { label: '₹99+', variant: 'outline' },
    };
    const badge = badges[preference] || { label: preference, variant: 'outline' as const };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getHelpfulnessLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'very_helpful': 'Very Helpful',
      'somewhat_helpful': 'Somewhat Helpful',
      'neutral': 'Neutral',
      'not_helpful': 'Not Helpful'
    };
    return labels[value] || value;
  };

  const getEaseLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'very_easy': 'Very Easy',
      'easy': 'Easy',
      'average': 'Average',
      'difficult': 'Difficult'
    };
    return labels[value] || value;
  };

  const getDesignSpeedLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'yes_great': 'Yes, Great!',
      'okay': 'Okay',
      'needs_improvement': 'Needs Improvement'
    };
    return labels[value] || value;
  };

  const getRecommendationLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'definitely': 'Definitely',
      'maybe': 'Maybe',
      'no': 'No'
    };
    return labels[value] || value;
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
                    {(item.user_name || item.user_email) && (
                      <div className="mb-2">
                        <p className="font-semibold">{item.user_name || 'Anonymous'}</p>
                        {item.user_email && (
                          <p className="text-sm text-muted-foreground">{item.user_email}</p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Helpfulness</p>
                        <Badge variant="outline">{getHelpfulnessLabel(item.helpfulness)}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ease of Use</p>
                        <Badge variant="outline">{getEaseLabel(item.ease_of_use)}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Design & Speed</p>
                        <Badge variant="outline">{getDesignSpeedLabel(item.design_speed)}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Would Recommend</p>
                        <Badge variant={item.recommendation === 'definitely' ? 'default' : item.recommendation === 'maybe' ? 'secondary' : 'destructive'}>
                          {getRecommendationLabel(item.recommendation)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pricing Preference:</span>
                  {getPricingBadge(item.pricing_preference)}
                </div>

                {item.improvement_suggestion && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Improvements:</h4>
                    <p className="text-muted-foreground">{item.improvement_suggestion}</p>
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
