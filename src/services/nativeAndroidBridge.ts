/**
 * Native Android Bridge Service
 * Handles communication between WebView and Native Android app
 * Package: com.examtrakr.android
 */

export interface NativeAndroidBridge {
  // Check if Google Play Billing is available
  isBillingAvailable: () => boolean;
  // Purchase a subscription
  purchaseSubscription: (productId: string) => void;
  // Get user's current purchases
  getPurchases: () => string; // JSON string of purchases
  // Get product details
  getProductDetails: (productIds: string) => string; // JSON string of products
  // Acknowledge a purchase
  acknowledgePurchase: (purchaseToken: string) => void;
  // Get app version
  getAppVersion: () => string;
  // Check if running in native app
  isNativeApp: () => boolean;
  // Show toast message
  showToast: (message: string) => void;
}

export interface NativePurchaseResult {
  success: boolean;
  purchaseToken?: string;
  productId?: string;
  orderId?: string;
  purchaseTime?: number;
  error?: string;
  cancelled?: boolean;
}

export interface NativeProductDetails {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceCurrencyCode: string;
  priceAmountMicros: number;
}

// Extend Window interface to include Android bridge
declare global {
  interface Window {
    AndroidBridge?: NativeAndroidBridge;
    // Callback functions that Android will call
    onPurchaseComplete?: (result: string) => void;
    onPurchaseError?: (error: string) => void;
    onPurchaseCancelled?: () => void;
    onProductDetailsReceived?: (details: string) => void;
    onPurchasesReceived?: (purchases: string) => void;
    // Legacy callback names for compatibility
    onBillingError?: (error: string) => void;
  }
}

/**
 * Check if running inside native Android WebView app
 */
export const isNativeAndroidApp = (): boolean => {
  // First check localStorage for cached detection
  const cachedSource = localStorage.getItem('app_source');
  if (cachedSource === 'native-android') {
    return true;
  }

  // Check for Android bridge
  if (window.AndroidBridge) {
    try {
      const isNative = window.AndroidBridge.isNativeApp();
      if (isNative) {
        // Cache the detection
        localStorage.setItem('app_source', 'native-android');
        localStorage.setItem('native-app-installed', 'true');
      }
      return isNative;
    } catch (e) {
      console.log('AndroidBridge.isNativeApp() failed:', e);
      // If method fails but bridge exists, assume native
      localStorage.setItem('app_source', 'native-android');
      return true;
    }
  }
  
  // Check user agent for our custom app identifier
  const userAgent = navigator.userAgent.toLowerCase();
  const isExamTrakrApp = userAgent.includes('examtrakr-android') || 
                          userAgent.includes('com.examtrakr.android');
  
  // Check if running in Android WebView
  const isWebView = userAgent.includes('wv') || 
                    userAgent.includes('webview');
  
  console.log('🔍 Native Android Detection:', { 
    hasAndroidBridge: !!window.AndroidBridge,
    isExamTrakrApp,
    isWebView,
    userAgent,
    cachedSource
  });
  
  // If we detect ExamTrakr app user agent, cache it
  if (isExamTrakrApp) {
    localStorage.setItem('app_source', 'native-android');
    return true;
  }
  
  return !!window.AndroidBridge;
};

/**
 * Check if native Google Play Billing is available
 */
export const isNativeBillingAvailable = (): boolean => {
  if (!window.AndroidBridge) {
    return false;
  }
  
  try {
    return window.AndroidBridge.isBillingAvailable();
  } catch (e) {
    console.error('Error checking native billing availability:', e);
    return false;
  }
};

/**
 * Purchase subscription via native Android billing
 */
export const purchaseViaNative = (productId: string): Promise<NativePurchaseResult> => {
  return new Promise((resolve, reject) => {
    if (!window.AndroidBridge) {
      reject(new Error('Native Android Bridge not available'));
      return;
    }

    // Set up callbacks for purchase result
    window.onPurchaseComplete = (resultJson: string) => {
      try {
        const result = JSON.parse(resultJson) as NativePurchaseResult;
        resolve(result);
      } catch (e) {
        reject(new Error('Invalid purchase result from native app'));
      }
      cleanup();
    };

    window.onPurchaseError = (error: string) => {
      reject(new Error(error));
      cleanup();
    };

    window.onPurchaseCancelled = () => {
      resolve({ success: false, cancelled: true });
      cleanup();
    };

    const cleanup = () => {
      window.onPurchaseComplete = undefined;
      window.onPurchaseError = undefined;
      window.onPurchaseCancelled = undefined;
    };

    // Set timeout for purchase (3 minutes)
    const timeout = setTimeout(() => {
      reject(new Error('Purchase timeout'));
      cleanup();
    }, 180000);

    try {
      console.log('📱 Initiating native purchase for:', productId);
      window.AndroidBridge.purchaseSubscription(productId);
    } catch (e) {
      clearTimeout(timeout);
      cleanup();
      reject(e);
    }
  });
};

/**
 * Get product details from native Android
 */
export const getNativeProductDetails = (productIds: string[]): Promise<NativeProductDetails[]> => {
  return new Promise((resolve, reject) => {
    if (!window.AndroidBridge) {
      reject(new Error('Native Android Bridge not available'));
      return;
    }

    window.onProductDetailsReceived = (detailsJson: string) => {
      try {
        const details = JSON.parse(detailsJson) as NativeProductDetails[];
        resolve(details);
      } catch (e) {
        reject(new Error('Invalid product details from native app'));
      }
      window.onProductDetailsReceived = undefined;
    };

    // Set timeout
    const timeout = setTimeout(() => {
      reject(new Error('Product details timeout'));
      window.onProductDetailsReceived = undefined;
    }, 30000);

    try {
      window.AndroidBridge.getProductDetails(JSON.stringify(productIds));
    } catch (e) {
      clearTimeout(timeout);
      window.onProductDetailsReceived = undefined;
      reject(e);
    }
  });
};

/**
 * Get existing purchases from native Android
 */
export const getNativePurchases = (): Promise<NativePurchaseResult[]> => {
  return new Promise((resolve, reject) => {
    if (!window.AndroidBridge) {
      reject(new Error('Native Android Bridge not available'));
      return;
    }

    window.onPurchasesReceived = (purchasesJson: string) => {
      try {
        const purchases = JSON.parse(purchasesJson) as NativePurchaseResult[];
        resolve(purchases);
      } catch (e) {
        reject(new Error('Invalid purchases from native app'));
      }
      window.onPurchasesReceived = undefined;
    };

    // Set timeout
    const timeout = setTimeout(() => {
      reject(new Error('Get purchases timeout'));
      window.onPurchasesReceived = undefined;
    }, 30000);

    try {
      const purchasesJson = window.AndroidBridge.getPurchases();
      if (purchasesJson) {
        const purchases = JSON.parse(purchasesJson) as NativePurchaseResult[];
        clearTimeout(timeout);
        window.onPurchasesReceived = undefined;
        resolve(purchases);
      }
    } catch (e) {
      clearTimeout(timeout);
      window.onPurchasesReceived = undefined;
      reject(e);
    }
  });
};

/**
 * Show toast message via native Android
 */
export const showNativeToast = (message: string): void => {
  if (window.AndroidBridge) {
    try {
      window.AndroidBridge.showToast(message);
    } catch (e) {
      console.error('Error showing native toast:', e);
    }
  }
};

/**
 * Get native app version
 */
export const getNativeAppVersion = (): string | null => {
  if (!window.AndroidBridge) {
    return null;
  }
  
  try {
    return window.AndroidBridge.getAppVersion();
  } catch (e) {
    console.error('Error getting native app version:', e);
    return null;
  }
};
