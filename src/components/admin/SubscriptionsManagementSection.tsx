import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Calendar, CreditCard, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SubscriptionAnalytics } from './SubscriptionAnalytics';

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  payment_method: string | null;
  external_subscription_id: string | null;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
  subscription_plans?: {
    name: string;
    duration_months: number;
  };
}

interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_status: string;
  external_payment_id: string | null;
  phone_number: string | null;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
  subscription_plans?: {
    name: string;
  };
}

export const SubscriptionsManagementSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('subscriptions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subscriptions with user and plan details
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          users(full_name, email),
          subscription_plans(name, duration_months)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (subsError) throw subsError;

      // Fetch payments with user and plan details
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          users(full_name, email),
          subscription_plans(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (paymentsError) throw paymentsError;

      setSubscriptions(subsData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { variant: any; icon: any } } = {
      'active': { variant: 'default', icon: CheckCircle },
      'expired': { variant: 'destructive', icon: XCircle },
      'cancelled': { variant: 'secondary', icon: XCircle },
      'completed': { variant: 'default', icon: CheckCircle },
      'pending': { variant: 'secondary', icon: AlertCircle },
      'failed': { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status.toLowerCase()] || { variant: 'secondary', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'GBP': '£',
      'EUR': '€',
    };
    return `${symbols[currency] || currency} ${Number(amount).toFixed(2)}`;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sub.users?.full_name?.toLowerCase().includes(searchLower) ||
      sub.users?.email?.toLowerCase().includes(searchLower) ||
      sub.subscription_plans?.name?.toLowerCase().includes(searchLower) ||
      sub.status.toLowerCase().includes(searchLower)
    );
  });

  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.users?.full_name?.toLowerCase().includes(searchLower) ||
      payment.users?.email?.toLowerCase().includes(searchLower) ||
      payment.subscription_plans?.name?.toLowerCase().includes(searchLower) ||
      payment.payment_status.toLowerCase().includes(searchLower) ||
      payment.external_payment_id?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscriptions & Payments</h2>
        <p className="text-muted-foreground">Manage user subscriptions and payment history</p>
      </div>

      {/* Analytics Cards */}
      <SubscriptionAnalytics />

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, plan, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscriptions ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="payments">
            <Calendar className="h-4 w-4 mr-2" />
            Payments ({payments.length})
          </TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
              <CardDescription>All active and expired subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subscriptions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Starts At</TableHead>
                        <TableHead>Expires At</TableHead>
                        <TableHead>Auto Renew</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id} className={isExpired(sub.expires_at) && sub.status === 'active' ? 'bg-destructive/5' : ''}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{sub.users?.full_name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{sub.users?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{sub.subscription_plans?.name || 'Unknown Plan'}</span>
                              <span className="text-xs text-muted-foreground">
                                {sub.subscription_plans?.duration_months} {sub.subscription_plans?.duration_months === 1 ? 'month' : 'months'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(sub.starts_at)}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              {formatDate(sub.expires_at)}
                              {isExpired(sub.expires_at) && sub.status === 'active' && (
                                <Badge variant="destructive" className="text-xs">Expired</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.auto_renew ? 'default' : 'secondary'}>
                              {sub.auto_renew ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{sub.payment_method || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{payment.users?.full_name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{payment.users?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.subscription_plans?.name || 'Unknown Plan'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatAmount(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                          <TableCell className="text-sm">{payment.phone_number || '-'}</TableCell>
                          <TableCell className="text-xs font-mono">
                            {payment.external_payment_id || '-'}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(payment.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
