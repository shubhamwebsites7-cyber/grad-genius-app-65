import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusResult {
  status: 'pending' | 'completed' | 'failed' | 'checking';
  redirectUrl?: string;
  error?: string;
}

export const usePaymentStatus = (orderId: string | null, enabled: boolean = false) => {
  const [result, setResult] = useState<PaymentStatusResult>({ status: 'checking' });
  const [isPolling, setIsPolling] = useState(false);

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      console.log('🔍 Checking payment status for order:', orderId);
      
      const { data: payment, error } = await supabase
        .from('payments')
        .select('payment_status, subscription_id')
        .eq('external_payment_id', orderId)
        .single();

      if (error) {
        console.error('Error fetching payment status:', error);
        setResult({ status: 'failed', error: error.message });
        return;
      }

      if (payment) {
        const status = (payment as any).payment_status as 'pending' | 'completed' | 'failed';
        console.log('💳 Payment status:', status);

        if (status === 'completed') {
          setResult({
            status: 'completed',
            redirectUrl: 'https://www.examtrakr.com/profile?payment_status=success'
          });
          setIsPolling(false);
        } else if (status === 'failed') {
          setResult({
            status: 'failed',
            redirectUrl: 'https://www.examtrakr.com/profile?payment_status=failure'
          });
          setIsPolling(false);
        } else {
          setResult({ status: 'pending' });
        }
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      setResult({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        redirectUrl: 'https://www.examtrakr.com/profile?payment_status=failure'
      });
      setIsPolling(false);
    }
  }, [orderId]);

  // Start polling when enabled
  useEffect(() => {
    if (enabled && orderId && !isPolling) {
      setIsPolling(true);
      setResult({ status: 'checking' });
      
      // Initial check
      checkPaymentStatus();
      
      // Poll every 3 seconds for up to 5 minutes
      const pollInterval = setInterval(checkPaymentStatus, 3000);
      
      // Stop polling after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setIsPolling(false);
        if (result.status === 'pending' || result.status === 'checking') {
          setResult({
            status: 'failed',
            redirectUrl: 'https://www.examtrakr.com/profile?payment_status=failure',
            error: 'Payment verification timeout'
          });
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
        setIsPolling(false);
      };
    }
  }, [enabled, orderId, checkPaymentStatus, isPolling, result.status]);

  return {
    ...result,
    isPolling,
    checkPaymentStatus
  };
};
