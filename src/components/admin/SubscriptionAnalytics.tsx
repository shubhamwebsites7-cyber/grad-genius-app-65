import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, TrendingUp, DollarSign } from 'lucide-react';

export const SubscriptionAnalytics = () => {
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchSubscriptionStats();
  }, []);

  const fetchSubscriptionStats = async () => {
    try {
      // Total active subscriptions
      const { count: activeCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      // Total subscriptions ever
      const { count: totalCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true });

      // Total revenue
      const { data: completedPayments } = await supabase
        .from('payments')
        .select('amount, currency')
        .eq('payment_status', 'completed');

      const totalRevenue = completedPayments?.reduce((sum, payment: any) => sum + Number(payment.amount), 0) || 0;

      // Monthly revenue (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = monthlyPayments?.reduce((sum, payment: any) => sum + Number(payment.amount), 0) || 0;

      setStats({
        totalSubscriptions: totalCount || 0,
        activeSubscriptions: activeCount || 0,
        totalRevenue,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <Crown className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            Premium users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            All time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            All time earnings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
