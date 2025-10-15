import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  plan_name: string;
  external_payment_id: string;
  phone_number: string;
  subscription_status: string | null;
}

export const PaymentHistoryCard = () => {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }
    
    if (user) {
      fetchPaymentHistory();
    } else {
      // If no user after auth loads, stop loading immediately
      setLoading(false);
    }
  }, [user, authLoading]);

  // Real-time payment updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time changes on payments
    const channel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Payment updated:', payload);
          // Refresh payment history when changes occur
          fetchPaymentHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query payments with plan information
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          currency,
          payment_status,
          payment_method,
          created_at,
          updated_at,
          external_payment_id,
          phone_number,
          subscription_id,
          subscription_plans!plan_id (
            name,
            description
          ),
          user_subscriptions!subscription_id (
            status,
            starts_at,
            expires_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Payment history query error:', error);
        throw error;
      }

      const formattedPayments = data?.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        payment_status: payment.payment_status,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        plan_name: payment.subscription_plans?.name || 'Plan Purchase',
        external_payment_id: payment.external_payment_id,
        phone_number: payment.phone_number,
        subscription_status: payment.user_subscriptions?.status || null
      })) || [];

      setPayments(formattedPayments);
    } catch (err: any) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$'
    };
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { variant: any; label: string } } = {
      'completed': { variant: 'default', label: 'Completed' },
      'pending': { variant: 'secondary', label: 'Pending' },
      'failed': { variant: 'destructive', label: 'Failed' }
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>Your recent subscription purchases</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{payment.plan_name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(payment.created_at)}</span>
                  </div>
                  {payment.external_payment_id && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Order: {payment.external_payment_id}
                    </div>
                  )}
                  {payment.payment_method && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Method: {payment.payment_method}
                    </div>
                  )}
                  {payment.subscription_status && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      Subscription: {payment.subscription_status}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="font-semibold whitespace-nowrap">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(payment.payment_status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
