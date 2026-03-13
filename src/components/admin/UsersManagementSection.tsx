import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Mail,
  Phone,
  Globe,
  Calendar,
  Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserWithSubscription {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  country_code: string | null;
  timezone: string | null;
  is_email_verified: boolean;
  auth_provider: string | null;
  created_at: string;
  last_login_at: string | null;
  is_active: boolean;
  phone_number: string | null;
  subscription?: {
    id: string;
    status: string;
    starts_at: string;
    expires_at: string;
    plan_name?: string;
    purchase_platform: string | null;
    auto_renew: boolean;
  } | null;
  enrollment_count?: number;
  enrolled_exams?: string[];
}

const ITEMS_PER_PAGE = 20;

export const UsersManagementSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, subscriptionFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build the query
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          country_code,
          timezone,
          is_email_verified,
          auth_provider,
          created_at,
          last_login_at,
          is_active,
          phone_number
        `, { count: 'exact' });

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`);
      }

      // Order and paginate
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data: usersData, error: usersError, count } = await query;

      if (usersError) throw usersError;

      setTotalCount(count || 0);

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Fetch subscriptions for these users
      const userIds = (usersData as any[]).map((u: any) => u.id as string);
      const { data: subscriptionsData } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          status,
          starts_at,
          expires_at,
          purchase_platform,
          auto_renew,
          subscription_plans (
            name
          )
        `)
        .in('user_id', userIds);

      // Fetch enrollment counts
      const enrollmentPromises = userIds.map(async (userId: string) => {
        const { count } = await supabase
          .from('user_exam_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_active', true);
        return { userId, count: count || 0 };
      });

      const enrollmentCounts = await Promise.all(enrollmentPromises);
      const enrollmentMap: Record<string, number> = Object.fromEntries(
        enrollmentCounts.map(e => [e.userId, e.count])
      );

      // Map subscriptions to users
      const subscriptionMap = new Map<string, any>();
      (subscriptionsData as any[] | null)?.forEach((sub: any) => {
        subscriptionMap.set(sub.user_id, {
          id: sub.id,
          status: sub.status,
          starts_at: sub.starts_at,
          expires_at: sub.expires_at,
          plan_name: sub.subscription_plans?.name || 'Unknown',
          purchase_platform: sub.purchase_platform,
          auto_renew: sub.auto_renew
        });
      });

      let usersWithSubs: UserWithSubscription[] = (usersData as any[]).map((user: any) => ({
        ...user,
        subscription: subscriptionMap.get(user.id) || null,
        enrollment_count: enrollmentMap[user.id] || 0
      }));

      // Filter by subscription status client-side
      if (subscriptionFilter === 'subscribed') {
        usersWithSubs = usersWithSubs.filter(u => u.subscription?.status === 'active');
      } else if (subscriptionFilter === 'not-subscribed') {
        usersWithSubs = usersWithSubs.filter(u => !u.subscription || u.subscription.status !== 'active');
      } else if (subscriptionFilter === 'expired') {
        usersWithSubs = usersWithSubs.filter(u => u.subscription?.status === 'expired');
      }

      setUsers(usersWithSubs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getSubscriptionBadge = (subscription: UserWithSubscription['subscription']) => {
    if (!subscription) {
      return <Badge variant="secondary">No Subscription</Badge>;
    }

    const statusColors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600 border-green-500/20',
      expired: 'bg-red-500/10 text-red-600 border-red-500/20',
      cancelled: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      pending: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    };

    return (
      <Badge variant="outline" className={statusColors[subscription.status] || ''}>
        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const getAuthProviderBadge = (provider: string | null) => {
    const providerLabels: Record<string, { label: string; className: string }> = {
      email: { label: 'Email', className: 'bg-blue-500/10 text-blue-600' },
      google: { label: 'Google', className: 'bg-red-500/10 text-red-600' },
      phone: { label: 'Phone', className: 'bg-green-500/10 text-green-600' }
    };
    
    const info = providerLabels[provider || 'email'] || providerLabels.email;
    return <Badge variant="outline" className={info.className}>{info.label}</Badge>;
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Users Management</h2>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users Management
          </h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions • {totalCount.toLocaleString()} total users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Account Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={subscriptionFilter} onValueChange={(v) => { setSubscriptionFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="subscribed">Active Subscription</SelectItem>
                <SelectItem value="not-subscribed">No Subscription</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Auth Provider</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Plan Details</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No users found matching your criteria.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-primary">
                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-1">
                              {user.full_name}
                              {user.subscription?.status === 'active' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-32">{user.email}</span>
                            {user.is_email_verified && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">Verified</Badge>
                            )}
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone_number}</span>
                            </div>
                          )}
                          {user.country_code && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{user.country_code}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAuthProviderBadge(user.auth_provider)}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(user.subscription)}
                      </TableCell>
                      <TableCell>
                        {user.subscription ? (
                          <div className="space-y-1 text-sm">
                            <p className="font-medium flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {user.subscription.plan_name}
                            </p>
                            <p className="text-muted-foreground">
                              Expires: {formatDate(user.subscription.expires_at)}
                            </p>
                            {user.subscription.purchase_platform && (
                              <Badge variant="outline" className="text-xs">
                                {user.subscription.purchase_platform}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.enrollment_count || 0} exams</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                        {user.last_login_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last login: {formatDate(user.last_login_at)}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
