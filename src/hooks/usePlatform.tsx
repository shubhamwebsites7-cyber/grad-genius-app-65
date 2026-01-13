import { useState, useEffect, useCallback } from 'react';
import { 
  isNativeAndroidApp, 
  isNativeBillingAvailable,
  purchaseViaNative,
  NativePurchaseResult 
} from '@/services/nativeAndroidBridge';
import { getPlatform, Platform, getPaymentGateway, PaymentGateway } from '@/utils/platformDetection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformState {
  platform: Platform;
  isNativeAndroid: boolean;
  isBillingAvailable: boolean;
  paymentGateway: PaymentGateway;
  isReady: boolean;
}

interface UsePlatformReturn extends PlatformState {
  purchaseSubscription: (planId: string, googleProductId: string) => Promise<boolean>;
  refreshPlatform: () => void;
}

/**
 * Global platform detection hook
 * Provides consistent platform state across the application
 */
export const usePlatform = (countryCode?: string): UsePlatformReturn => {
  const [state, setState] = useState<PlatformState>({
    platform: 'web',
    isNativeAndroid: false,
    isBillingAvailable: false,
    paymentGateway: 'unavailable',
    isReady: false,
  });

  const detectPlatform = useCallback(() => {
    const platform = getPlatform();
    const isNativeAndroid = isNativeAndroidApp();
    const isBillingAvailable = isNativeBillingAvailable();
    const paymentGateway = getPaymentGateway(countryCode || 'IN', platform);

    console.log('🔍 Platform Detection:', {
      platform,
      isNativeAndroid,
      isBillingAvailable,
      paymentGateway,
      hasAndroidBridge: !!window.AndroidBridge,
      countryCode,
    });

    setState({
      platform,
      isNativeAndroid,
      isBillingAvailable,
      paymentGateway,
      isReady: true,
    });
  }, [countryCode]);

  useEffect(() => {
    detectPlatform();

    // Re-detect when AndroidBridge becomes available (lazy loading)
    const checkInterval = setInterval(() => {
      if (window.AndroidBridge && !state.isNativeAndroid) {
        console.log('📱 AndroidBridge detected, re-running platform detection');
        detectPlatform();
        clearInterval(checkInterval);
      }
    }, 500);

    // Clear after 5 seconds to avoid indefinite checking
    setTimeout(() => clearInterval(checkInterval), 5000);

    return () => clearInterval(checkInterval);
  }, [detectPlatform]);

  /**
   * Purchase subscription via native Android billing
   * @param planId - Internal plan ID (for backend)
   * @param googleProductId - Google Play product ID (e.g., 'examtrakr_1month')
   */
  const purchaseSubscription = useCallback(async (
    planId: string, 
    googleProductId: string
  ): Promise<boolean> => {
    if (!state.isNativeAndroid || !state.isBillingAvailable) {
      console.error('Native billing not available');
      toast.error('Google Play Billing is not available');
      return false;
    }

    try {
      console.log('📱 Initiating native purchase:', { planId, googleProductId });
      toast.info('Opening Google Play...');

      const result = await purchaseViaNative(googleProductId);

      if (result.cancelled) {
        console.log('Purchase cancelled by user');
        toast.info('Purchase cancelled');
        return false;
      }

      if (!result.success || !result.purchaseToken) {
        console.error('Purchase failed:', result.error);
        toast.error(result.error || 'Purchase failed');
        return false;
      }

      // Verify purchase with backend
      console.log('✅ Purchase successful, verifying with backend...');
      toast.info('Verifying purchase...');

      const { data, error } = await supabase.functions.invoke('verify-google-play-purchase', {
        body: {
          purchaseToken: result.purchaseToken,
          productId: result.productId || googleProductId,
          packageName: 'com.examtrakr.android',
        }
      });

      if (error) {
        console.error('Backend verification failed:', error);
        toast.error('Failed to verify purchase. Please contact support.');
        return false;
      }

      if (!data?.success) {
        console.error('Verification failed:', data?.error);
        toast.error(data?.error || 'Purchase verification failed');
        return false;
      }

      console.log('🎉 Purchase verified successfully:', data);
      toast.success('Subscription activated successfully!');
      
      return true;

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
      return false;
    }
  }, [state.isNativeAndroid, state.isBillingAvailable]);

  const refreshPlatform = useCallback(() => {
    detectPlatform();
  }, [detectPlatform]);

  return {
    ...state,
    purchaseSubscription,
    refreshPlatform,
  };
};

export default usePlatform;
