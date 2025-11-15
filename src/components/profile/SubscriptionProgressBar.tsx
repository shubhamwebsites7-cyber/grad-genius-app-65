import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Clock, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProgressData {
  total_days: number;
  elapsed_days: number;
  remaining_days: number;
  progress_percentage: number;
  is_in_trial: boolean;
  trial_days_total: number;
  trial_days_elapsed: number;
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
    is_in_trial,
    trial_days_total,
    trial_days_elapsed,
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
          {is_in_trial && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              🎁 Free Trial Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trial Progress (if in trial) */}
        {is_in_trial && (
          <div className="space-y-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Free Trial Period
              </span>
              <span className="text-sm font-semibold text-blue-600">
                Day {trial_days_elapsed} of {trial_days_total}
              </span>
            </div>
            <Progress 
              value={(trial_days_elapsed / trial_days_total) * 100} 
              className="h-2.5 bg-blue-500/10"
            />
            <p className="text-xs text-muted-foreground">
              🎉 {trial_days_total - trial_days_elapsed} days of free access remaining
            </p>
          </div>
        )}

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
                  {is_in_trial 
                    ? `${trial_days_total} days trial + ${accumulated_total_days - trial_days_total} days purchased`
                    : 'All purchases combined'
                  }
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

        {/* Visual Timeline */}
        {is_in_trial && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Timeline</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${(trial_days_elapsed / trial_days_total) * 100}%` }}
                  />
                </div>
                <span className="absolute -top-5 left-0 text-xs font-medium text-blue-600">
                  Trial
                </span>
              </div>
              <div className="relative flex-[3]">
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                    style={{ width: `${progress_percentage}%` }}
                  />
                </div>
                <span className="absolute -top-5 left-0 text-xs font-medium text-primary">
                  Subscription
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{trial_days_total} days trial</span>
              <span>{total_days} days access</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
