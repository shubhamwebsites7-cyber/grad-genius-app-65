import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as googlePlayBilling from '@/services/googlePlayBilling';
import { getGooglePlayProductId, isValidGooglePlayProductId } from '@/config/googlePlayProducts';
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
  const [diagnostics, setDiagnostics] = useState<googlePlayBilling.BillingDiagnostics | null>(null);
  
  // Prevent duplicate clicks
  const purchaseInProgress = useRef(false);

  // STRICT Check if Google Play Billing is available
  useEffect(() => {
    const checkBillingAvailability = async () => {
      console.log('=== Google Play Billing Check (STRICT) ===');
      
      // Get full diagnostics
      const diag = await googlePlayBilling.getBillingDiagnostics();
      console.log('📊 Billing diagnostics:', diag);
      setDiagnostics(diag);
      
      // STRICT: Check actual billing availability
      const available = await googlePlayBilling.isGooglePlayBillingAvailable();
      console.log('🔍 Billing available (strict check):', available);
      
      const platform = getPlatform();
      console.log('📱 Current platform:', platform);
      console.log('🎯 Should use Google Play:', shouldUseGooglePlay());
      
      setBillingAvailable(available);
      
      if (!available) {
        console.error('❌ Google Play Billing NOT available. Diagnostics:', {
          isTWA: diag.isTWA,
          isStandalone: diag.isStandalone,
          hasDigitalGoods: diag.hasDigitalGoods,
          hasPaymentRequest: diag.hasPaymentRequest,
          canUseBilling: diag.canUseBilling,
          errors: diag.errors
        });
      }
    };
    
    checkBillingAvailability();
  }, []);

  const handlePurchase = useCallback(async () => {
    // Prevent duplicate clicks
    if (purchaseInProgress.current) {
      console.log('⚠️ Purchase already in progress, ignoring click');
      return;
    }
    
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    purchaseInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      // VALIDATE: Get and validate Google Play product ID
      const productId = getGooglePlayProductId(durationMonths);
      
      if (!isValidGooglePlayProductId(productId)) {
        throw new Error(`Invalid product ID: ${productId}`);
      }
      
      console.log('🛒 Initiating Google Play purchase:', { 
        planId, 
        productId, 
        durationMonths,
        userId: user.id 
      });

      // Initiate purchase (includes mandatory acknowledge)
      toast.info('Opening Google Play payment...');
      console.log('📱 Calling purchasePlan with product:', productId);
      const purchaseDetails = await googlePlayBilling.purchasePlan(productId);
      console.log('🎉 purchasePlan returned successfully:', purchaseDetails);
      
      console.log('✅ Purchase completed, token:', purchaseDetails.purchaseToken.substring(0, 20) + '...');
      toast.success('Purchase successful! Verifying with server...');
      
      setLoading(false);
      setVerifying(true);

      // Verify purchase with backend
      console.log('🔍 Sending to backend for verification...');
      const { data, error: verifyError } = await supabase.functions.invoke(
        'verify-google-play-purchase',
        {
          body: {
            purchaseToken: purchaseDetails.purchaseToken,
            productId: productId,
            packageName: 'com.examtrakr.www.twa',
            planId: planId
          }
        }
      );

      if (verifyError) {
        console.error('❌ Supabase function error:', verifyError);
        throw new Error(verifyError.message || 'Failed to verify purchase with server');
      }
      
      if (!data?.success) {
        console.error('❌ Backend verification failed:', data);
        throw new Error(data?.error || 'Failed to verify purchase');
      }

      console.log('✅ Purchase verified by backend:', data);
      
      setPurchaseComplete(true);
      toast.success('Subscription activated successfully!');
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        window.location.href = '/profile?payment_status=success';
        onSuccess?.();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      console.error('❌ Error message:', err.message);
      
      let errorTitle = 'Purchase Failed';
      let errorMessage = 'Failed to complete purchase. Please try again.';
      let isCancelled = false;
      
      // Parse error type from our custom error format
      const message = err.message || '';
      
      if (message.startsWith('CANCELLED:')) {
        isCancelled = true;
        errorTitle = 'Purchase Cancelled';
        errorMessage = 'You cancelled the purchase. You can try again anytime.';
        onCancel?.();
      } else if (message.startsWith('SETUP_ERROR:')) {
        errorTitle = 'Setup Required';
        errorMessage = message.replace('SETUP_ERROR:', '').trim();
        console.error('=== SETUP ERROR DETAILS ===');
        console.error('1. twa-manifest.json must have: "playBilling": { "enabled": true }');
        console.error('2. App must be installed from Google Play Store');
        console.error('3. assetlinks.json must be properly configured');
        console.error('4. Product IDs must match exactly in Play Console');
        console.error('5. Subscription must be active in Play Console');
        console.error('Diagnostics:', diagnostics);
        onFailure?.();
      } else if (message.startsWith('VERIFICATION_ERROR:')) {
        errorTitle = 'Verification Failed';
        errorMessage = message.replace('VERIFICATION_ERROR:', '').trim();
        onFailure?.();
      } else if (message.startsWith('PURCHASE_ERROR:')) {
        errorTitle = 'Purchase Error';
        errorMessage = message.replace('PURCHASE_ERROR:', '').trim();
        onFailure?.();
      } else if (message.includes('not available') || message.includes('not supported')) {
        errorTitle = 'Billing Not Available';
        errorMessage = 'Google Play Billing is not available. Please install the app from Play Store.';
        onFailure?.();
      } else {
        errorMessage = message || 'An unexpected error occurred. Please try again.';
        onFailure?.();
      }

      setError(`${errorTitle}: ${errorMessage}`);
      
      if (isCancelled) {
        toast.info(errorMessage);
      } else {
        toast.error(errorTitle, { description: errorMessage });
      }
    } finally {
      setLoading(false);
      setVerifying(false);
      purchaseInProgress.current = false;
    }
  }, [user, planId, durationMonths, planName, onSuccess, onFailure, onCancel, diagnostics]);

  // Billing not available UI
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
              Google Play Billing is not available. Please install the app from Google Play Store to make purchases.
            </AlertDescription>
          </Alert>
          
          {/* Debug info for development */}
          {diagnostics && (
            <div className="text-xs bg-muted p-2 rounded space-y-1">
              <p><strong>Debug Info:</strong></p>
              <p>TWA: {diagnostics.isTWA ? '✅' : '❌'}</p>
              <p>Standalone: {diagnostics.isStandalone ? '✅' : '❌'}</p>
              <p>Digital Goods API: {diagnostics.hasDigitalGoods ? '✅' : '❌'}</p>
              <p>PaymentRequest: {diagnostics.hasPaymentRequest ? '✅' : '❌'}</p>
              <p>Can Use Billing: {diagnostics.canUseBilling ? '✅' : '❌'}</p>
              {diagnostics.errors.length > 0 && (
                <p className="text-destructive">Errors: {diagnostics.errors.join(', ')}</p>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open('https://play.google.com/store/apps/details?id=com.examtrakr.www.twa', '_blank')}
          >
            Open Play Store
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Purchase complete UI
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

  // Main purchase UI
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
