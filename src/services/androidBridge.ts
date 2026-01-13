// Android WebView JavaScript Bridge for Google Play Billing
// This service handles communication between the web app and Android native code

declare global {
  interface Window {
    AndroidBilling?: {
      purchaseSubscription: (productId: string, userId: string) => void;
      queryPurchases: () => void;
      isAvailable: () => boolean;
    };
    onPurchaseSuccess?: (purchaseToken: string, productId: string) => void;
    onPurchaseFailure?: (errorCode: string, errorMessage: string) => void;
    onPurchaseCancelled?: () => void;
    onPurchasesQueried?: (purchases: string) => void;
  }
}

export interface PurchaseResult {
  success: boolean;
  purchaseToken?: string;
  productId?: string;
  errorCode?: string;
  errorMessage?: string;
  cancelled?: boolean;
}

// Check if running inside Android WebView with billing support
export const isAndroidWebView = (): boolean => {
  return typeof window.AndroidBilling !== 'undefined';
};

// Check if Android billing is available
export const isAndroidBillingAvailable = (): boolean => {
  try {
    return window.AndroidBilling?.isAvailable() ?? false;
  } catch {
    return false;
  }
};

// Initiate a purchase through Android native billing
export const purchaseSubscription = (
  productId: string,
  userId: string
): Promise<PurchaseResult> => {
  return new Promise((resolve) => {
    if (!isAndroidWebView()) {
      resolve({
        success: false,
        errorCode: 'NOT_ANDROID',
        errorMessage: 'Not running in Android WebView',
      });
      return;
    }

    // Set up callbacks for Android to call back
    window.onPurchaseSuccess = (purchaseToken: string, returnedProductId: string) => {
      resolve({
        success: true,
        purchaseToken,
        productId: returnedProductId,
      });
      cleanupCallbacks();
    };

    window.onPurchaseFailure = (errorCode: string, errorMessage: string) => {
      resolve({
        success: false,
        errorCode,
        errorMessage,
      });
      cleanupCallbacks();
    };

    window.onPurchaseCancelled = () => {
      resolve({
        success: false,
        cancelled: true,
        errorMessage: 'Purchase cancelled by user',
      });
      cleanupCallbacks();
    };

    // Trigger the native purchase flow
    try {
      window.AndroidBilling?.purchaseSubscription(productId, userId);
    } catch (error) {
      resolve({
        success: false,
        errorCode: 'BRIDGE_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Bridge error',
      });
      cleanupCallbacks();
    }
  });
};

// Query existing purchases
export const queryPurchases = (): Promise<string[]> => {
  return new Promise((resolve) => {
    if (!isAndroidWebView()) {
      resolve([]);
      return;
    }

    window.onPurchasesQueried = (purchasesJson: string) => {
      try {
        const purchases = JSON.parse(purchasesJson);
        resolve(purchases);
      } catch {
        resolve([]);
      }
      delete window.onPurchasesQueried;
    };

    try {
      window.AndroidBilling?.queryPurchases();
    } catch {
      resolve([]);
    }
  });
};

// Cleanup callbacks after purchase completes
const cleanupCallbacks = () => {
  delete window.onPurchaseSuccess;
  delete window.onPurchaseFailure;
  delete window.onPurchaseCancelled;
};

// Product IDs mapping for Google Play
export const GOOGLE_PLAY_PRODUCTS = {
  monthly: 'examtrakr_monthly',
  quarterly: 'examtrakr_quarterly',
  yearly: 'examtrakr_yearly',
} as const;

export const getProductIdByDuration = (durationMonths: number): string => {
  switch (durationMonths) {
    case 1:
      return GOOGLE_PLAY_PRODUCTS.monthly;
    case 3:
      return GOOGLE_PLAY_PRODUCTS.quarterly;
    case 12:
      return GOOGLE_PLAY_PRODUCTS.yearly;
    default:
      return GOOGLE_PLAY_PRODUCTS.monthly;
  }
};
