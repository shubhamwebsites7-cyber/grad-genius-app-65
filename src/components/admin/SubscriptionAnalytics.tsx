import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, TrendingUp, DollarSign, Calendar, CreditCard, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueByMonth {
  month: string;
  revenue: number;
  count: number;
}

interface PaymentMethodStats {
  method: string;
  count: number;
  amount: number;
}

interface PlanStats {
  plan: string;
  count: number;
  revenue: number;
}

export const SubscriptionAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    avgSubscriptionValue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<PaymentMethodStats[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats[]>([]);
  const [subscriptionStatusData, setSubscriptionStatusData] = useState<{name: string; value: number}[]>([]);

  useEffect(() => {
    fetchSubscriptionStats();
  }, []);

  const fetchSubscriptionStats = async () => {
    try {
      setLoading(true);

      // Fetch all subscriptions
      const { data: allSubs } = await supabase
        .from('user_subscriptions')
        .select('id, status, expires_at, plan_id, created_at') as { data: { id: string; status: string; expires_at: string; plan_id: string; created_at: string }[] | null };

      // Fetch subscription plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, name') as { data: { id: string; name: string }[] | null };

      const planMap = new Map((plans || []).map(p => [p.id, p.name]));

      // Calculate subscription stats
      const now = new Date();
      const subs = allSubs || [];
      const activeSubs = subs.filter(s => s.status === 'active' && new Date(s.expires_at) >= now);
      const expiredSubs = subs.filter(s => s.status === 'expired' || new Date(s.expires_at) < now);

      // Fetch all payments
      const { data: allPayments } = await supabase
        .from('payments')
        .select('id, amount, currency, payment_status, payment_method, created_at, plan_id');

      const payments = allPayments || [];
      const completedPayments = payments.filter(p => p.payment_status === 'completed');
      const pendingPayments = payments.filter(p => p.payment_status === 'pending');
      const failedPayments = payments.filter(p => p.payment_status === 'failed');

      // Calculate total revenue
      const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate this month's revenue
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthPayments = completedPayments.filter(p => new Date(p.created_at) >= startOfMonth);
      const monthlyRevenue = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Calculate last month's revenue
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthPayments = completedPayments.filter(p => {
        const date = new Date(p.created_at);
        return date >= startOfLastMonth && date <= endOfLastMonth;
      });
      const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Average subscription value
      const avgSubscriptionValue = completedPayments.length > 0 
        ? totalRevenue / completedPayments.length 
        : 0;

      setStats({
        totalSubscriptions: subs.length,
        activeSubscriptions: activeSubs.length,
        expiredSubscriptions: expiredSubs.length,
        totalRevenue,
        monthlyRevenue,
        lastMonthRevenue,
        avgSubscriptionValue,
        completedPayments: completedPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
      });

      // Revenue by month (last 6 months)
      const monthlyData: RevenueByMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
        
        const monthPayments = completedPayments.filter(p => {
          const date = new Date(p.created_at);
          return date >= monthStart && date <= monthEnd;
        });
        
        monthlyData.push({
          month: monthName,
          revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          count: monthPayments.length,
        });
      }
      setRevenueByMonth(monthlyData);

      // Payment method stats
      const methodMap: { [key: string]: { count: number; amount: number } } = {};
      completedPayments.forEach(p => {
        const method = p.payment_method || 'Unknown';
        if (!methodMap[method]) {
          methodMap[method] = { count: 0, amount: 0 };
        }
        methodMap[method].count++;
        methodMap[method].amount += Number(p.amount);
      });
      const methodStats = Object.entries(methodMap).map(([method, data]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        count: data.count,
        amount: data.amount,
      }));
      setPaymentMethodStats(methodStats);

      // Plan stats
      const planStatsMap: { [key: string]: { count: number; revenue: number } } = {};
      completedPayments.forEach(p => {
        const planName = planMap.get(p.plan_id) || 'Unknown';
        if (!planStatsMap[planName]) {
          planStatsMap[planName] = { count: 0, revenue: 0 };
        }
        planStatsMap[planName].count++;
        planStatsMap[planName].revenue += Number(p.amount);
      });
      const planStatsData = Object.entries(planStatsMap).map(([plan, data]) => ({
        plan,
        count: data.count,
        revenue: data.revenue,
      }));
      setPlanStats(planStatsData);

      // Subscription status distribution
      setSubscriptionStatusData([
        { name: 'Active', value: activeSubs.length },
        { name: 'Expired', value: expiredSubs.length },
      ]);

    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const revenueGrowth = stats.lastMonthRevenue > 0 
    ? ((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)
    : stats.monthlyRevenue > 0 ? '100' : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiredSubscriptions} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg ₹{stats.avgSubscriptionValue.toFixed(0)}/subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {Number(revenueGrowth) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={Number(revenueGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}>
                {revenueGrowth}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.lastMonthRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Previous month earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedPayments}</div>
            <p className="text-xs text-muted-foreground">Transaction failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedPayments + stats.pendingPayments + stats.failedPayments > 0
                ? ((stats.completedPayments / (stats.completedPayments + stats.pendingPayments + stats.failedPayments)) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Payment success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Count Trend</CardTitle>
            <CardDescription>Number of payments per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Payments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Active vs Expired</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {subscriptionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transactions by method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethodStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                  nameKey="method"
                >
                  {paymentMethodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Revenue per subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={planStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" />
                <YAxis type="category" dataKey="plan" stroke="hsl(var(--foreground))" width={80} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
