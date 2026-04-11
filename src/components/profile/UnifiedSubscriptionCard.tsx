import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard, Crown, Calendar, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressData {
  total_days: number;
  elapsed_days: number;
  remaining_days: number;
  progress_percentage: number;
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
        const planName = plan?.name || 'Free Plan';
        
        // Premium check: status must be active AND not expired
        const expiresAt = subRecord.expires_at ? new Date(subRecord.expires_at) : null;
        const isValid = subRecord.status === 'active' && expiresAt && expiresAt > new Date();
        const isPremium = isValid && plan?.name !== 'Free Plan' && plan?.name != null;
        
        setSubscriptionRecord(subRecord);
        setPlatform(subRecord.purchase_platform || 'cashfree');
        setAutoRenew(subRecord.auto_renew ?? true);

        setSubscriptionData({
          plan: planName,
          status: isPremium ? 'active' : (expiresAt && expiresAt < new Date() ? 'expired' : subRecord.status || 'Active'),
          nextBilling: subRecord.expires_at 
            ? new Date(subRecord.expires_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : '-',
          price: plan?.name || '₹0',
          isPremium: !!isPremium
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

  // Compute remaining days dynamically from expires_at
  const dynamicRemainingDays = subscriptionRecord?.expires_at
    ? Math.max(0, Math.floor((new Date(subscriptionRecord.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  const { 
    total_days = 0, 
    elapsed_days = 0, 
    progress_percentage = 0,
    accumulated_total_days = 0
  } = progressData || {};

  // remaining_days is always dynamically computed
  const remaining_days = dynamicRemainingDays;

  // Use accumulated_total_days if available, otherwise fall back to total_days
  const displayTotalDays = accumulated_total_days > 0 ? accumulated_total_days : total_days;
  const displayProgressPercentage = displayTotalDays > 0 
    ? Math.min(100, Math.round((elapsed_days / displayTotalDays) * 100))
    : progress_percentage;
  
  const showProgress = progressData && displayTotalDays > 0;

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
          {subscriptionData.isPremium && (
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
            {/* Total Access - Primary display showing accumulated days */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Total Access</p>
                  <p className="text-xl font-bold text-primary">
                    {displayTotalDays} days
                  </p>
                </div>
              </div>
            </div>

            {/* Current Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Current Progress
                </span>
                <span className="text-sm font-semibold">
                  Day {elapsed_days} of {displayTotalDays}
                </span>
              </div>
              <Progress value={displayProgressPercentage} className="h-2.5" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{displayProgressPercentage}% completed</span>
                <span className="font-medium text-primary">{remaining_days} days left</span>
              </div>
            </div>
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

        </div>
      </CardContent>
    </Card>
  );
};
