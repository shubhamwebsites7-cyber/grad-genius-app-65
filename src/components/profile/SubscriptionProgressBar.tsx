import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProgressData {
  total_days: number;
  elapsed_days: number;
  remaining_days: number;
  progress_percentage: number;
  accumulated_total_days: number;
}

export const SubscriptionProgressBar = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      // @ts-expect-error - Custom RPC function not in generated types
      const result = await supabase.rpc('get_subscription_progress', { 
        p_user_id: user?.id 
      });
      
      const data = result.data as ProgressData[] | null;
      const error = result.error;

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        setProgressData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (!progressData || progressData.total_days === 0) {
    return null;
  }

  const { 
    total_days, 
    elapsed_days, 
    remaining_days, 
    progress_percentage,
    accumulated_total_days
  } = progressData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Subscription Progress
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Subscription Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Current Period
            </span>
            <span className="text-sm font-semibold">
              Day {elapsed_days} of {total_days}
            </span>
          </div>
          <Progress value={progress_percentage} className="h-3" />
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{progress_percentage}% completed</span>
            <span className="font-medium text-primary">{remaining_days} days left</span>
          </div>
        </div>

        {/* Accumulated Days Display */}
        {accumulated_total_days > 0 && (
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Premium Access</p>
                <p className="text-2xl font-bold text-primary">
                  {accumulated_total_days} {accumulated_total_days === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All purchases combined
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Days Used</p>
            <p className="text-2xl font-bold">{elapsed_days}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Days Remaining</p>
            <p className="text-2xl font-bold text-primary">{remaining_days}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
