import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard, Crown, Calendar, TrendingUp, Clock, Award, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface SubscriptionData {
  plan: string;
  status: string;
  nextBilling: string;
  price: string;
  isPremium: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'default';
    case 'expired':
      return 'destructive';
    case 'free':
    case 'free plan':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const UnifiedSubscriptionCard = () => {
  const { user, subscription, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    plan: 'Free Plan',
    status: 'Active',
    nextBilling: '-',
    price: '₹0',
    isPremium: false
  });
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [subscriptionRecord, setSubscriptionRecord] = useState<any>(null);
  const [platform, setPlatform] = useState<string>('cashfree');
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchSubscriptionData();
      fetchProgressData();
    } else {
      setLoading(false);
    }
  }, [user, subscription, authLoading]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSubscriptionData();
          fetchProgressData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          starts_at,
          expires_at,
          auto_renew,
          payment_method,
          external_subscription_id,
          purchase_platform,
          created_at,
          updated_at,
          is_trial,
          trial_starts_at,
          trial_ends_at,
          accumulated_days,
          subscription_plans!plan_id (
            name,
            description,
            id,
            duration_months
          ),
          payments!last_payment_id (
            amount,
            currency,
            payment_status,
            created_at,
            payment_method,
            platform
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const subRecord = data as any;
        const plan = subRecord.subscription_plans;
        const isTrial = subRecord.is_trial === true;
        const planName = isTrial ? '🎁 Free Trial' : (plan?.name || 'Free Plan');
        const isPremium = plan?.name !== 'Free Plan' && plan?.name != null;
        
        setSubscriptionRecord(subRecord);
        setPlatform(subRecord.purchase_platform || 'cashfree');
        setAutoRenew(subRecord.auto_renew ?? true);

        setSubscriptionData({
          plan: planName,
          status: subRecord.status || 'Active',
          nextBilling: subRecord.expires_at 
            ? new Date(subRecord.expires_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : '-',
          price: plan?.name || '₹0',
          isPremium: isPremium || isTrial
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRenewToggle = async (checked: boolean) => {
    try {
      if (!subscriptionRecord?.id) return;

      const { error } = await supabase
        .from('user_subscriptions')
        // @ts-ignore - Supabase type inference issue
        .update({ auto_renew: checked })
        .eq('id', subscriptionRecord.id);

      if (error) throw error;

      setAutoRenew(checked);
      toast({
        title: checked ? "Auto-renewal enabled" : "Auto-renewal disabled",
        description: checked 
          ? "Your subscription will renew automatically"
          : "Your subscription will not renew automatically",
      });
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-renewal setting",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  const { 
    total_days = 0, 
    elapsed_days = 0, 
    remaining_days = 0, 
    progress_percentage = 0,
    is_in_trial = false,
    trial_days_total = 0,
    trial_days_elapsed = 0,
    accumulated_total_days = 0
  } = progressData || {};

  const showProgress = progressData && total_days > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {subscriptionData.isPremium ? (
                <Crown className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {subscriptionData.plan}
              </p>
            </div>
          </div>
          {is_in_trial && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              Free Trial
            </Badge>
          )}
          {!is_in_trial && subscriptionData.isPremium && (
            <Badge variant={getStatusBadgeVariant(subscriptionData.status)}>
              {subscriptionData.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscription Info */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Expires On</span>
            <span className="text-sm font-medium">{subscriptionData.nextBilling}</span>
          </div>
          
          {platform && subscriptionData.isPremium && (
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Platform</span>
              <span className="text-sm font-medium capitalize">{platform}</span>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {showProgress && (
          <div className="space-y-4 pt-2">
            {/* Trial Progress */}
            {is_in_trial && (
              <div className="space-y-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Free Trial
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    Day {trial_days_elapsed} of {trial_days_total}
                  </span>
                </div>
                <Progress 
                  value={(trial_days_elapsed / trial_days_total) * 100} 
                  className="h-2 bg-blue-500/10"
                />
                <p className="text-xs text-muted-foreground">
                  {trial_days_total - trial_days_elapsed} days of free access remaining
                </p>
              </div>
            )}

            {/* Current Period Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Current Period
                </span>
                <span className="text-sm font-semibold">
                  Day {elapsed_days} of {total_days}
                </span>
              </div>
              <Progress value={progress_percentage} className="h-2.5" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{progress_percentage}% completed</span>
                <span className="font-medium text-primary">{remaining_days} days left</span>
              </div>
            </div>

            {/* Total Access */}
            {accumulated_total_days > 0 && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Total Access</p>
                    <p className="text-xl font-bold text-primary">
                      {accumulated_total_days} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!subscriptionData.isPremium && (
            <Link to="/pricing">
              <Button className="w-full" size="lg">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          )}

          {subscriptionData.isPremium && platform === 'cashfree' && (
            <>
              <Link to="/pricing">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Extend Subscription
                </Button>
              </Link>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label htmlFor="auto-renew" className="text-sm cursor-pointer">
                  Auto-renewal
                </Label>
                <Switch
                  id="auto-renew"
                  checked={autoRenew}
                  onCheckedChange={handleAutoRenewToggle}
                />
              </div>
            </>
          )}

          {subscriptionData.isPremium && platform === 'google_play' && (
            <Button variant="outline" className="w-full" asChild>
              <a 
                href="https://play.google.com/store/account/subscriptions" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage on Google Play
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
