import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PaymentProcessorProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  phoneNumber?: string;
  onSuccess?: () => void;
  onFailure?: () => void;
  onCancel?: () => void;
}

export const PaymentProcessor = ({
  planId,
  planName,
  amount,
  currency,
  phoneNumber,
  onSuccess,
  onFailure,
  onCancel
}: PaymentProcessorProps) => {
  const { user } = useAuth();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);

  const { status, redirectUrl, error, isPolling } = usePaymentStatus(orderId, showPaymentStatus);

  // Handle payment status changes
  useEffect(() => {
    if (status === 'completed' && redirectUrl) {
      toast.success('Payment completed successfully!');
      setTimeout(() => {
        window.location.href = redirectUrl;
        onSuccess?.();
      }, 2000);
    } else if (status === 'failed' && redirectUrl) {
      toast.error('Payment failed. Please try again.');
      setTimeout(() => {
        window.location.href = redirectUrl;
        onFailure?.();
      }, 2000);
    }
  }, [status, redirectUrl, onSuccess, onFailure]);

  const createPaymentOrder = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      console.log('🚀 Creating Cashfree order for plan:', planName);
      
      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          plan_id: planId,
          phone_number: phoneNumber
        }
      });

      if (error) {
        console.error('Order creation error:', error);
        throw new Error(error.message || 'Failed to create payment order');
      }

      if (!data.success || !data.order_token) {
        throw new Error('Invalid response from payment gateway');
      }

      console.log('✅ Order created successfully:', data.order_id);
      
      setOrderId(data.order_id);
      
      // Create Cashfree payment URL
      const cashfreePaymentUrl = `https://payments.cashfree.com/pay/${data.order_token}`;
      setPaymentUrl(cashfreePaymentUrl);
      
      toast.success('Payment order created! Redirecting to payment page...');
      
      // Redirect to Cashfree payment page
      setTimeout(() => {
        window.open(cashfreePaymentUrl, '_blank');
        setShowPaymentStatus(true); // Start polling for payment status
      }, 1000);

    } catch (error) {
      console.error('Payment order creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleReturnFromPayment = () => {
    if (orderId) {
      setShowPaymentStatus(true);
      toast.info('Checking payment status...');
    }
  };

  if (showPaymentStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'checking' || status === 'pending' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying Payment
              </>
            ) : status === 'completed' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Payment Successful
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Payment Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'checking' && 'Please wait while we verify your payment...'}
            {status === 'pending' && 'Payment is being processed...'}
            {status === 'completed' && 'Your subscription has been activated!'}
            {status === 'failed' && (error || 'Payment could not be completed')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Order ID</p>
            <p className="text-xs text-muted-foreground font-mono">{orderId}</p>
          </div>
          
          {isPolling && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking payment status...
            </div>
          )}
          
          {status === 'completed' && (
            <p className="text-sm text-green-600">
              Redirecting to your profile...
            </p>
          )}
          
          {status === 'failed' && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                Redirecting to profile page...
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPaymentStatus(false)}
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Secure payment powered by Cashfree
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <span className="text-sm font-medium">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="text-sm font-medium">
              {currency === 'INR' ? '₹' : '$'}{amount}
            </span>
          </div>
          {phoneNumber && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Phone:</span>
              <span className="text-sm font-medium">{phoneNumber}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={createPaymentOrder}
            disabled={isCreatingOrder}
            className="w-full"
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {currency === 'INR' ? '₹' : '$'}{amount}
              </>
            )}
          </Button>
          
          {paymentUrl && (
            <Button 
              variant="outline" 
              onClick={handleReturnFromPayment}
              className="w-full"
            >
              I've completed the payment
            </Button>
          )}
          
          {onCancel && (
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
        
        <div className="text-xs text-center text-muted-foreground">
          <p>🔒 Secure payment processing</p>
          <p>Powered by Cashfree Payments</p>
        </div>
      </CardContent>
    </Card>
  );
};
