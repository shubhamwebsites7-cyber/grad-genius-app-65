import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Crown, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

export const SubscriptionCard = () => {
  const { user, subscription, loading: authLoading } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    plan: 'Free Plan',
    status: 'Active',
    nextBilling: '-',
    price: '₹0',
    isPremium: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }
    
    if (user) {
      fetchSubscriptionData();
    } else {
      // If no user after auth loads, stop loading immediately
      setLoading(false);
    }
  }, [user, subscription, authLoading]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Direct query to user_subscriptions now that schema is fixed
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
          created_at,
          updated_at,
          subscription_plans!plan_id (
            name,
            description,
            id,
            duration_months
          ),
          plan_pricing (
            price,
            currency,
            country_code,
            original_price,
            discount_percentage
          ),
          payments!last_payment_id (
            amount,
            currency,
            payment_status,
            created_at,
            payment_method
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Subscription query error:', error);
        throw error;
      }

      if (data) {
        const subscriptionRecord = data as any;
        const plan = subscriptionRecord.subscription_plans;
        const pricing = subscriptionRecord.plan_pricing;
        const lastPayment = subscriptionRecord.payments;
        
        // Check if subscription is still valid
        const expiresAt = new Date(subscriptionRecord.expires_at);
        const isValid = expiresAt > new Date();

        if (isValid && pricing) {
          // Use last payment amount if available, otherwise use pricing
          const currency = (lastPayment?.currency || pricing.currency || 'INR');
          const currencySymbol = currency === 'INR' ? '₹' : '$';
          const amount = Number(lastPayment?.amount || pricing.price || 0);

          setSubscriptionData({
            plan: plan.name || 'Premium Plan',
            status: 'Active',
            nextBilling: expiresAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            price: `${currencySymbol}${amount.toFixed(2)}`,
            isPremium: true
          });
        } else {
          // Expired subscription
          setSubscriptionData({
            plan: 'Free Plan',
            status: 'Expired',
            nextBilling: '-',
            price: '₹0',
            isPremium: false
          });
        }
      } else {
        // No active subscription found
        setSubscriptionData({
          plan: 'Free Plan',
          status: 'Active',
          nextBilling: '-',
          price: '₹0',
          isPremium: false
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fallback to free plan on error
      setSubscriptionData({
        plan: 'Free Plan',
        status: 'Active',
        nextBilling: '-',
        price: '₹0',
        isPremium: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={subscriptionData.isPremium ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {subscriptionData.isPremium ? (
            <Crown className="h-5 w-5 text-primary" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Plan</span>
            <span className="font-medium flex items-center gap-2">
              {subscriptionData.plan}
              {subscriptionData.isPremium && <Crown className="h-4 w-4 text-primary" />}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={getStatusBadgeVariant(subscriptionData.status)}>
              {subscriptionData.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {subscriptionData.isPremium ? 'Expires On' : 'Next Billing'}
            </span>
            <span className="text-sm font-medium">{subscriptionData.nextBilling}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount Paid</span>
            <span className="font-medium text-lg">{subscriptionData.price}</span>
          </div>
        </div>

        {subscriptionData.isPremium && (
          <div className="pt-3 border-t">
            <div className="bg-primary/10 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-primary">Premium Benefits Active</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Unlimited exam enrollments</li>
                <li>✓ All topics unlocked</li>
                <li>✓ Full resource access</li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button asChild className="w-full" variant={subscriptionData.isPremium ? "outline" : "default"}>
            <Link to="/pricing" className="flex items-center justify-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>{subscriptionData.isPremium ? 'Extend Plan' : 'Upgrade Plan'}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
