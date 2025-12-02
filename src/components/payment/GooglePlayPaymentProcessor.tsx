import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as googlePlayBilling from '@/services/googlePlayBilling';
import { getGooglePlayProductId } from '@/config/googlePlayProducts';
import { getPlatform, shouldUseGooglePlay } from '@/utils/platformDetection';

interface GooglePlayPaymentProcessorProps {
  planId: string;
  planName: string;
  durationMonths: number;
  onSuccess?: () => void;
  onFailure?: () => void;
  onCancel?: () => void;
}

export const GooglePlayPaymentProcessor = ({
  planId,
  planName,
  durationMonths,
  onSuccess,
  onFailure,
  onCancel
}: GooglePlayPaymentProcessorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingAvailable, setBillingAvailable] = useState<boolean | null>(null);

  // Check if Google Play Billing is available
  useEffect(() => {
    const checkBillingAvailability = async () => {
      console.log('=== Google Play Billing Check ===');
      console.log('Checking billing availability...');
      
      const available = await googlePlayBilling.isGooglePlayBillingAvailable();
      console.log('Billing available result:', available);
      
      // Additional debugging info
      const platform = getPlatform();
      console.log('Current platform:', platform);
      console.log('Should use Google Play:', shouldUseGooglePlay());
      
      setBillingAvailable(available);
      
      if (!available) {
        console.error('Google Play Billing not available. Possible reasons:');
        console.error('1. App not installed from Play Store');
        console.error('2. Digital Goods API not enabled in TWA');
        console.error('3. Asset links not configured properly');
        console.error('4. App not signed with release certificate');
        console.error('5. TWA not configured with Digital Goods API support');
      }
    };
    
    checkBillingAvailability();
  }, []);

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Google Play product ID
      const productId = getGooglePlayProductId(durationMonths);
      console.log('🛒 Initiating Google Play purchase:', { 
        planId, 
        productId, 
        durationMonths,
        userId: user.id 
      });

      // Initiate purchase
      toast.info('Opening Google Play payment...');
      console.log('📱 Calling purchasePlan with product:', productId);
      const purchaseDetails = await googlePlayBilling.purchasePlan(productId);
      console.log('🎉 purchasePlan returned successfully:', purchaseDetails);
      
      console.log('✅ Purchase completed:', purchaseDetails);
      toast.success('Purchase successful! Verifying...');
      
      setLoading(false);
      setVerifying(true);

      // Verify purchase with backend
      const { data, error: verifyError } = await supabase.functions.invoke(
        'verify-google-play-purchase',
        {
          body: {
            purchaseToken: purchaseDetails.purchaseToken,
            productId: productId,
            packageName: 'com.examtrakr.app',
            planId: planId
          }
        }
      );

      if (verifyError || !data?.success) {
        throw new Error(data?.error || 'Failed to verify purchase');
      }

      console.log('✅ Purchase verified:', data);
      
      setPurchaseComplete(true);
      toast.success('Subscription activated successfully!');
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        window.location.href = '/profile?payment_status=success';
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      
      let errorMessage = 'Failed to complete purchase. Please try again.';
      
      if (err.message.includes('cancelled')) {
        errorMessage = 'Purchase was cancelled.';
        onCancel?.();
      } else if (err.message.includes('not available')) {
        errorMessage = 'Google Play Billing is not available. Please install the app from Play Store.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      onFailure?.();
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (billingAvailable === false) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Google Play Not Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Google Play Billing is not available on this device. Please install the app from Google Play Store to make purchases.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.examtrakr.app', '_blank')}
          >
            Open Play Store
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (purchaseComplete) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-500/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Purchase Successful!
          </CardTitle>
          <CardDescription>
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <Badge className="bg-green-100 text-green-800 border-green-300">
              {planName}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Redirecting to your profile...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Google Play Purchase
        </CardTitle>
        <CardDescription>
          Secure payment via Google Play Billing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plan Details */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <span className="text-sm font-medium">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">{durationMonths} {durationMonths === 1 ? 'month' : 'months'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Platform:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              Google Play
            </Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handlePurchase}
            disabled={loading || verifying || billingAvailable === null}
            className="w-full"
            size="lg"
          >
            {loading || verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {verifying ? 'Verifying Purchase...' : 'Processing...'}
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Pay with Google Play
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="w-full"
              disabled={loading || verifying}
            >
              Cancel
            </Button>
          )}
        </div>
        
        {/* Info */}
        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>🔒 Secure payment via Google Play</p>
          <p>Managed through your Google Play account</p>
        </div>
      </CardContent>
    </Card>
  );
};