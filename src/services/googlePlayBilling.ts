/**
 * Google Play Billing Service
 * Handles in-app purchases via Play Billing for TWA
 */

export interface GooglePlayProduct {
  itemId: string;
  title: string;
  description: string;
  price: {
    currency: string;
    value: string;
  };
}

export interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
  purchaseTime: number;
  purchaseState: 'purchased' | 'pending';
}

// Extend Navigator interface for playBilling
declare global {
  interface Navigator {
    playBilling?: {
      init: () => Promise<void>;
      launchPaymentFlow: (details: { sku: string; type: string }) => Promise<any>;
      getPurchaseHistory: () => Promise<any[]>;
    };
  }
}

/**
 * Check if running inside TWA (Trusted Web Activity)
 */
export const isTWA = (): boolean => {
  const userAgent = navigator.userAgent || '';
  const isTwaDetected = userAgent.includes('twa') || 
                        userAgent.includes('TWA') ||
                        document.referrer.includes('android-app://');
  
  // Also check for standalone display mode (PWA installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  
  console.log('🔍 TWA Detection:', { userAgent, isTwaDetected, isStandalone });
  return isTwaDetected || isStandalone;
};

/**
 * Check if Google Play Billing is available (supports both APIs)
 */
export const isGooglePlayBillingAvailable = async (): Promise<boolean> => {
  console.log('🔍 Checking Google Play Billing availability...');
  
  // Method 1: Check navigator.playBilling (TWA Play Billing)
  if (navigator.playBilling) {
    console.log('✅ navigator.playBilling is available');
    try {
      await navigator.playBilling.init();
      console.log('✅ playBilling.init() succeeded');
      return true;
    } catch (error) {
      console.log('⚠️ playBilling.init() failed:', error);
    }
  }
  
  // Method 2: Check Digital Goods API
  if ('getDigitalGoodsService' in window) {
    console.log('🔍 Checking Digital Goods API...');
    try {
      const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
      if (service) {
        console.log('✅ Digital Goods API is available');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Digital Goods API check failed:', error);
    }
  }
  
  // Method 3: Check if TWA and assume billing might work
  if (isTWA()) {
    console.log('🔍 Running in TWA mode, billing might be available');
    return true;
  }
  
  console.log('❌ Google Play Billing not available');
  return false;
};

/**
 * Get the Digital Goods Service (fallback method)
 */
const getDigitalGoodsService = async () => {
  if (!('getDigitalGoodsService' in window)) {
    throw new Error('Digital Goods API not available.');
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    if (!service) {
      throw new Error('Could not get Digital Goods service');
    }
    return service;
  } catch (error) {
    throw new Error('Google Play Billing not available.');
  }
};

/**
 * Get available products/subscriptions
 */
export const getProducts = async (productIds: string[]): Promise<GooglePlayProduct[]> => {
  try {
    const service = await getDigitalGoodsService();
    const details = await service.getDetails(productIds);
    
    return details.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      description: item.description,
      price: {
        currency: item.price.currency,
        value: item.price.value
      }
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Purchase a subscription using Play Billing
 */
export const purchasePlan = async (productId: string): Promise<PurchaseDetails> => {
  console.log('🔍 Starting purchase flow for product:', productId);
  console.log('🔍 Is TWA:', isTWA());
  
  // For subscriptions, productId format is "productId:basePlanId"
  // getDetails() needs just the productId, PaymentRequest needs full format
  const baseProductId = productId.includes(':') ? productId.split(':')[0] : productId;
  console.log('🔍 Base product ID for lookup:', baseProductId);
  console.log('🔍 Full product ID for purchase:', productId);
  
  // Method 1: Use navigator.playBilling (preferred for TWA)
  if (navigator.playBilling) {
    console.log('📱 Using navigator.playBilling API');
    try {
      await navigator.playBilling.init();
      console.log('✅ playBilling initialized');
      
      const details = {
        sku: productId,
        type: 'subs' // subscription type
      };
      
      console.log('💳 Launching payment flow with details:', details);
      const result = await navigator.playBilling.launchPaymentFlow(details);
      console.log('✅ Payment flow result:', result);
      
      return {
        itemId: productId,
        purchaseToken: result.purchaseToken || result.token || 'token_' + Date.now(),
        purchaseTime: Date.now(),
        purchaseState: 'purchased'
      };
    } catch (error: any) {
      console.error('❌ playBilling error:', error);
      
      if (error.message?.includes('cancelled') || error.name === 'AbortError') {
        throw new Error('Purchase cancelled by user');
      }
      
      // Fall through to try Digital Goods API
      console.log('⚠️ Falling back to Digital Goods API...');
    }
  }
  
  // Method 2: Use Digital Goods API + PaymentRequest
  console.log('📱 Using Digital Goods API + PaymentRequest');
  try {
    const service = await getDigitalGoodsService();
    console.log('✅ Digital Goods service obtained');
    
    // Verify the product exists using BASE product ID (without basePlanId)
    console.log('🔍 Checking if product exists in Play Console with ID:', baseProductId);
    try {
      const productDetails = await service.getDetails([baseProductId]);
      console.log('📦 Product details:', productDetails);
      
      if (!productDetails || productDetails.length === 0) {
        console.warn(`⚠️ Product ${baseProductId} not found in getDetails, but continuing with purchase...`);
      } else {
        console.log('✅ Product exists, proceeding with purchase...');
      }
    } catch (detailsError) {
      console.warn('⚠️ Error getting product details (continuing anyway):', detailsError);
      // Continue anyway - product might still work with PaymentRequest
    }
    
    // Create payment request with FULL productId:basePlanId format
    console.log('💳 Creating payment request with sku:', productId);
    const paymentRequest = new (window as any).PaymentRequest([{
      supportedMethods: 'https://play.google.com/billing',
      data: {
        sku: productId,
        type: 'subscription'
      }
    }]);
    
    console.log('✅ Payment request created, showing UI...');
    
    // Show payment UI
    const paymentResponse = await paymentRequest.show();
    console.log('✅ Payment UI shown, user interacted');
    
    // Complete the payment
    await paymentResponse.complete('success');
    console.log('✅ Payment completed');
    
    // Get purchase details
    const { purchaseToken } = paymentResponse.details;
    console.log('✅ Purchase token received:', purchaseToken?.substring(0, 20) + '...');
    
    return {
      itemId: productId,
      purchaseToken: purchaseToken,
      purchaseTime: Date.now(),
      purchaseState: 'purchased'
    };
  } catch (error: any) {
    console.error('❌ Purchase error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
      throw new Error('Purchase cancelled by user');
    }
    
    throw new Error(`Purchase failed: ${error.message || 'Unknown error'}. Please try again.`);
  }
};

/**
 * Get existing purchases
 */
export const getPurchases = async (): Promise<PurchaseDetails[]> => {
  // Try navigator.playBilling first
  if (navigator.playBilling) {
    try {
      await navigator.playBilling.init();
      const purchases = await navigator.playBilling.getPurchaseHistory();
      return purchases.map((purchase: any) => ({
        itemId: purchase.sku || purchase.itemId,
        purchaseToken: purchase.purchaseToken || purchase.token,
        purchaseTime: purchase.purchaseTime || Date.now(),
        purchaseState: 'purchased'
      }));
    } catch (error) {
      console.log('playBilling.getPurchaseHistory failed, trying Digital Goods API');
    }
  }
  
  // Fallback to Digital Goods API
  try {
    const service = await getDigitalGoodsService();
    const purchases = await service.listPurchases();
    
    return purchases.map((purchase: any) => ({
      itemId: purchase.itemId,
      purchaseToken: purchase.purchaseToken,
      purchaseTime: purchase.purchaseTime,
      purchaseState: purchase.purchaseState === 0 ? 'purchased' : 'pending'
    }));
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
};

/**
 * Acknowledge a purchase (required for subscriptions)
 */
export const acknowledgePurchase = async (purchaseToken: string): Promise<void> => {
  try {
    const service = await getDigitalGoodsService();
    await service.acknowledge(purchaseToken);
  } catch (error) {
    console.error('Error acknowledging purchase:', error);
    throw error;
  }
};

/**
 * Consume a purchase (for one-time purchases, not subscriptions)
 */
export const consumePurchase = async (purchaseToken: string): Promise<void> => {
  try {
    const service = await getDigitalGoodsService();
    await service.consume(purchaseToken);
  } catch (error) {
    console.error('Error consuming purchase:', error);
    throw error;
  }
};
