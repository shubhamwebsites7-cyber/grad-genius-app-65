/**
 * Native Android Callbacks Registration
 * Sets up global window callbacks for Android WebView communication
 * 
 * This file should be imported in main.tsx to register callbacks early
 */

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Event types for custom events
export interface PurchaseCompleteEvent extends CustomEvent {
  detail: {
    purchaseToken: string;
    productId: string;
    orderId?: string;
    purchaseTime?: number;
  };
}

export interface PurchaseErrorEvent extends CustomEvent {
  detail: {
    error: string;
    code?: string;
  };
}

/**
 * Register global callbacks for Android native app communication
 * Call this once on app initialization
 */
export const registerNativeAndroidCallbacks = (): void => {
  console.log('📱 Registering Native Android callbacks...');

  // Purchase completed callback
  window.onPurchaseComplete = async (purchaseJson: string) => {
    console.log('✅ onPurchaseComplete called:', purchaseJson);
    
    try {
      const purchase = JSON.parse(purchaseJson);
      console.log('Parsed purchase data:', purchase);

      toast.success('Purchase successful! Verifying...');

      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('nativePurchaseComplete', { 
        detail: purchase 
      }));

      // Verify purchase with backend
      const { data, error } = await supabase.functions.invoke('verify-google-play-purchase', {
        body: {
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
          packageName: 'com.examtrakr.android',
        }
      });

      if (error) {
        console.error('Backend verification error:', error);
        toast.error('Failed to verify purchase. Please contact support.');
        
        window.dispatchEvent(new CustomEvent('nativePurchaseVerificationFailed', { 
          detail: { error: error.message, purchase } 
        }));
        return;
      }

      if (!data?.success) {
        console.error('Verification failed:', data?.error);
        toast.error(data?.error || 'Purchase verification failed');
        
        window.dispatchEvent(new CustomEvent('nativePurchaseVerificationFailed', { 
          detail: { error: data?.error, purchase } 
        }));
        return;
      }

      console.log('🎉 Purchase verified successfully:', data);
      toast.success('Subscription activated! Refreshing...');

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('nativePurchaseVerified', { 
        detail: { ...data, purchase } 
      }));

      // Refresh the page to show updated subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (e) {
      console.error('Error processing purchase:', e);
      toast.error('Failed to process purchase. Please contact support.');
      
      window.dispatchEvent(new CustomEvent('nativePurchaseError', { 
        detail: { error: 'Invalid purchase data' } 
      }));
    }
  };

  // Purchase error callback
  window.onPurchaseError = (error: string) => {
    console.error('❌ onPurchaseError called:', error);
    
    toast.error(`Payment failed: ${error}`);
    
    window.dispatchEvent(new CustomEvent('nativePurchaseError', { 
      detail: { error } 
    }));
  };

  // Purchase cancelled callback
  window.onPurchaseCancelled = () => {
    console.log('🚫 onPurchaseCancelled called');
    
    toast.info('Payment cancelled');
    
    window.dispatchEvent(new CustomEvent('nativePurchaseCancelled'));
  };

  // Product details received callback (for pricing display)
  window.onProductDetailsReceived = (detailsJson: string) => {
    console.log('📦 onProductDetailsReceived called:', detailsJson);
    
    try {
      const details = JSON.parse(detailsJson);
      
      window.dispatchEvent(new CustomEvent('nativeProductDetails', { 
        detail: details 
      }));
    } catch (e) {
      console.error('Error parsing product details:', e);
    }
  };

  // Purchases received callback (for restoring purchases)
  window.onPurchasesReceived = (purchasesJson: string) => {
    console.log('📋 onPurchasesReceived called:', purchasesJson);
    
    try {
      const purchases = JSON.parse(purchasesJson);
      
      window.dispatchEvent(new CustomEvent('nativePurchases', { 
        detail: purchases 
      }));
    } catch (e) {
      console.error('Error parsing purchases:', e);
    }
  };

  console.log('✅ Native Android callbacks registered');
};

/**
 * Check if we're running in native Android app and mark it
 */
export const initializeNativeAndroid = (): void => {
  // Check if AndroidBridge exists
  if (window.AndroidBridge) {
    console.log('📱 AndroidBridge detected');
    
    try {
      if (window.AndroidBridge.isNativeApp()) {
        console.log('✅ Running in Native Android App');
        localStorage.setItem('app_source', 'native-android');
        localStorage.setItem('native-app-installed', 'true');
      }
    } catch (e) {
      console.log('Could not call isNativeApp():', e);
    }
  } else {
    console.log('🌐 No AndroidBridge - running in browser');
  }

  // Register callbacks
  registerNativeAndroidCallbacks();
};

export default registerNativeAndroidCallbacks;
