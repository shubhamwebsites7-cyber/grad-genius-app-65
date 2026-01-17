import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, Calendar, BookOpen, Loader2, Globe, Smartphone, Mail, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyData {
  month: string;
  users: number;
  subscriptions: number;
}

interface CountryData {
  country: string;
  count: number;
}

interface AuthProviderData {
  provider: string;
  count: number;
}

interface DailySignup {
  date: string;
  count: number;
}

export const AnalyticsSection = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalExams: 0,
    totalEnrollments: 0,
    verifiedUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
  });
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyData[]>([]);
  const [countryDistribution, setCountryDistribution] = useState<CountryData[]>([]);
  const [authProviderStats, setAuthProviderStats] = useState<AuthProviderData[]>([]);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [subscriptionDistribution, setSubscriptionDistribution] = useState<{name: string; value: number}[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, created_at, country_code, auth_provider, is_email_verified, is_active');

      if (usersError) throw usersError;

      // Fetch active subscriptions
      const { count: activeSubCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      // Fetch total exams
      const { count: totalExams } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true });

      // Fetch total enrollments
      const { count: totalEnrollments } = await supabase
        .from('user_exam_enrollments')
        .select('*', { count: 'exact', head: true });

      const users = usersData || [];
      const totalUsers = users.length;
      const verifiedUsers = users.filter(u => u.is_email_verified).length;
      const activeUsers = users.filter(u => u.is_active).length;

      // Calculate new users this month and last month
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const newUsersThisMonth = users.filter(u => new Date(u.created_at) >= startOfThisMonth).length;
      const newUsersLastMonth = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= startOfLastMonth && createdAt < startOfThisMonth;
      }).length;

      setStats({
        totalUsers,
        activeSubscriptions: activeSubCount || 0,
        totalExams: totalExams || 0,
        totalEnrollments: totalEnrollments || 0,
        verifiedUsers,
        activeUsers,
        newUsersThisMonth,
        newUsersLastMonth,
      });

      // Calculate monthly growth (last 6 months)
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const usersUpToMonth = users.filter(u => new Date(u.created_at) <= monthEnd).length;
        
        monthlyData.push({
          month: monthName,
          users: usersUpToMonth,
          subscriptions: Math.floor(usersUpToMonth * 0.1), // Placeholder ratio
        });
      }
      setMonthlyGrowth(monthlyData);

      // Calculate country distribution
      const countryMap: { [key: string]: number } = {};
      users.forEach(u => {
        const country = u.country_code || 'Unknown';
        countryMap[country] = (countryMap[country] || 0) + 1;
      });
      const sortedCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));
      setCountryDistribution(sortedCountries);

      // Calculate auth provider distribution
      const providerMap: { [key: string]: number } = {};
      users.forEach(u => {
        const provider = u.auth_provider || 'email';
        providerMap[provider] = (providerMap[provider] || 0) + 1;
      });
      const providerData = Object.entries(providerMap)
        .map(([provider, count]) => ({ provider: provider.charAt(0).toUpperCase() + provider.slice(1), count }));
      setAuthProviderStats(providerData);

      // Calculate daily signups (last 14 days)
      const dailyData: DailySignup[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = users.filter(u => {
          const createdAt = new Date(u.created_at);
          return createdAt >= date && createdAt < nextDate;
        }).length;
        
        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        });
      }
      setDailySignups(dailyData);

      // Subscription distribution
      setSubscriptionDistribution([
        { name: 'Free', value: totalUsers - (activeSubCount || 0) },
        { name: 'Premium', value: activeSubCount || 0 },
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      monthlyGrowth,
      countryDistribution,
      authProviderStats,
      dailySignups,
      subscriptionDistribution,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Analytics report has been downloaded successfully.",
    });
  };

  const growthPercentage = stats.newUsersLastMonth > 0 
    ? ((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth * 100).toFixed(1)
    : stats.newUsersThisMonth > 0 ? '100' : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time platform insights and growth metrics</p>
        </div>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsersThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Number(growthPercentage) >= 0 ? '+' : ''}{growthPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month ({stats.newUsersLastMonth} users)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">Available exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? (stats.totalEnrollments / stats.totalUsers).toFixed(1) : 0} per user avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Country</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countryDistribution[0]?.country || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {countryDistribution[0]?.count || 0} users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>Monthly cumulative user count (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyGrowth}>
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
                <Legend />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Signups</CardTitle>
            <CardDescription>New user registrations (last 14 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Free vs Premium users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {subscriptionDistribution.map((entry, index) => (
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
            <CardTitle>Auth Providers</CardTitle>
            <CardDescription>Sign up method distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={authProviderStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ provider, percent }) => `${provider}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                  nameKey="provider"
                >
                  {authProviderStats.map((entry, index) => (
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
            <CardTitle>Users by Country</CardTitle>
            <CardDescription>Top 5 countries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={countryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--foreground))" />
                <YAxis type="category" dataKey="country" stroke="hsl(var(--foreground))" width={60} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
