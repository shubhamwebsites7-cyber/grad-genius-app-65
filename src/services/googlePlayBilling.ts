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

export interface BillingDiagnostics {
  isTWA: boolean;
  isStandalone: boolean;
  hasPlayBilling: boolean;
  hasDigitalGoods: boolean;
  hasPaymentRequest: boolean;
  userAgent: string;
  referrer: string;
  errors: string[];
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
 * Get comprehensive billing diagnostics
 */
export const getBillingDiagnostics = async (): Promise<BillingDiagnostics> => {
  const errors: string[] = [];
  const userAgent = navigator.userAgent || '';
  const referrer = document.referrer || '';
  
  const isTwaDetected = userAgent.includes('twa') || 
                        userAgent.includes('TWA') ||
                        referrer.includes('android-app://');
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
  
  const hasPlayBilling = !!navigator.playBilling;
  const hasDigitalGoods = 'getDigitalGoodsService' in window;
  const hasPaymentRequest = 'PaymentRequest' in window;
  
  // Test Digital Goods API
  if (hasDigitalGoods) {
    try {
      const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
      if (!service) {
        errors.push('Digital Goods service returned null - TWA may not have billing enabled');
      }
    } catch (e: any) {
      errors.push(`Digital Goods API error: ${e.message}`);
    }
  } else {
    errors.push('Digital Goods API not available in window');
  }
  
  // Test playBilling
  if (hasPlayBilling) {
    try {
      await navigator.playBilling!.init();
    } catch (e: any) {
      errors.push(`playBilling.init() error: ${e.message}`);
    }
  } else {
    errors.push('navigator.playBilling not available');
  }
  
  return {
    isTWA: isTwaDetected,
    isStandalone,
    hasPlayBilling,
    hasDigitalGoods,
    hasPaymentRequest,
    userAgent,
    referrer,
    errors
  };
};

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
    throw new Error('Digital Goods API not available. Make sure the app is installed from Google Play Store and TWA is configured with playBilling enabled.');
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    if (!service) {
      throw new Error('Could not get Digital Goods service. Check that playBilling is enabled in twa-manifest.json');
    }
    return service;
  } catch (error: any) {
    if (error.message?.includes('not supported')) {
      throw new Error('Google Play Billing not supported. Ensure the app is installed from Play Store and Digital Goods API is enabled.');
    }
    throw new Error(`Google Play Billing initialization failed: ${error.message}`);
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
  console.log('=== PURCHASE FLOW START ===');
  console.log('🔍 Product ID:', productId);
  console.log('🔍 Is TWA:', isTWA());
  console.log('🔍 User Agent:', navigator.userAgent);
  console.log('🔍 Referrer:', document.referrer);
  
  // Get diagnostics first
  const diagnostics = await getBillingDiagnostics();
  console.log('🔍 Billing Diagnostics:', diagnostics);
  
  if (diagnostics.errors.length > 0) {
    console.warn('⚠️ Billing diagnostics errors:', diagnostics.errors);
  }
  
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
      
      if (!result || !result.purchaseToken) {
        throw new Error('No purchase token received from Google Play');
      }
      
      return {
        itemId: productId,
        purchaseToken: result.purchaseToken || result.token,
        purchaseTime: Date.now(),
        purchaseState: 'purchased'
      };
    } catch (error: any) {
      console.error('❌ playBilling error:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Check for user cancellation
      if (error.name === 'AbortError' || 
          error.message?.toLowerCase().includes('cancel') ||
          error.message?.toLowerCase().includes('abort') ||
          error.code === 'BILLING_UNAVAILABLE') {
        throw new Error('CANCELLED: Purchase cancelled by user');
      }
      
      // Fall through to try Digital Goods API
      console.log('⚠️ Falling back to Digital Goods API...');
    }
  } else {
    console.log('⚠️ navigator.playBilling not available, trying Digital Goods API');
  }
  
  // Method 2: Use Digital Goods API + PaymentRequest
  console.log('📱 Using Digital Goods API + PaymentRequest');
  
  // Check if PaymentRequest is available
  if (!('PaymentRequest' in window)) {
    throw new Error('SETUP_ERROR: PaymentRequest API not available. The app may not be properly configured as a TWA.');
  }
  
  try {
    const service = await getDigitalGoodsService();
    console.log('✅ Digital Goods service obtained');
    
    // Verify the product exists using BASE product ID (without basePlanId)
    console.log('🔍 Checking if product exists in Play Console with ID:', baseProductId);
    try {
      const productDetails = await service.getDetails([baseProductId]);
      console.log('📦 Product details from Play Console:', JSON.stringify(productDetails, null, 2));
      
      if (!productDetails || productDetails.length === 0) {
        console.warn(`⚠️ Product ${baseProductId} not found in Play Console. Make sure:`);
        console.warn('1. Product ID matches exactly in Play Console');
        console.warn('2. Subscription is active in Play Console');
        console.warn('3. App package name matches');
      } else {
        console.log('✅ Product exists in Play Console, proceeding with purchase...');
      }
    } catch (detailsError: any) {
      console.warn('⚠️ Error getting product details:', detailsError.message);
      // Continue anyway - product might still work with PaymentRequest
    }
    
    // Create payment request with FULL productId:basePlanId format
    console.log('💳 Creating payment request with sku:', productId);
    
    const paymentMethodData = [{
      supportedMethods: 'https://play.google.com/billing',
      data: {
        sku: productId,
        type: 'subscription'
      }
    }];
    
    console.log('💳 Payment method data:', JSON.stringify(paymentMethodData, null, 2));
    
    const paymentRequest = new (window as any).PaymentRequest(paymentMethodData, {
      total: {
        label: 'ExamTrakr Subscription',
        amount: { currency: 'INR', value: '0' } // Google Play handles actual pricing
      }
    });
    
    console.log('✅ Payment request created');
    
    // Check if can make payment
    try {
      const canMakePayment = await paymentRequest.canMakePayment();
      console.log('🔍 canMakePayment result:', canMakePayment);
      
      if (!canMakePayment) {
        throw new Error('SETUP_ERROR: Google Play Billing cannot process this payment. Check: 1) App is installed from Play Store, 2) playBilling is enabled in twa-manifest.json, 3) Product exists in Play Console');
      }
    } catch (canPayError: any) {
      console.error('❌ canMakePayment error:', canPayError);
      throw new Error(`SETUP_ERROR: Payment availability check failed: ${canPayError.message}`);
    }
    
    console.log('💳 Showing payment UI...');
    
    // Show payment UI
    const paymentResponse = await paymentRequest.show();
    console.log('✅ Payment response received:', paymentResponse);
    console.log('✅ Payment details:', paymentResponse.details);
    
    // Complete the payment
    await paymentResponse.complete('success');
    console.log('✅ Payment completed');
    
    // Get purchase details
    const purchaseToken = paymentResponse.details?.purchaseToken;
    
    if (!purchaseToken) {
      console.error('❌ No purchase token in response:', paymentResponse.details);
      throw new Error('VERIFICATION_ERROR: No purchase token received from Google Play');
    }
    
    console.log('✅ Purchase token received:', purchaseToken.substring(0, 20) + '...');
    
    return {
      itemId: productId,
      purchaseToken: purchaseToken,
      purchaseTime: Date.now(),
      purchaseState: 'purchased'
    };
  } catch (error: any) {
    console.error('=== PURCHASE ERROR ===');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error:', error);
    
    // Determine error type
    if (error.name === 'AbortError') {
      throw new Error('CANCELLED: Purchase was cancelled');
    }
    
    if (error.message?.toLowerCase().includes('cancel')) {
      throw new Error('CANCELLED: ' + error.message);
    }
    
    if (error.message?.includes('SETUP_ERROR') || error.message?.includes('VERIFICATION_ERROR')) {
      throw error; // Re-throw our custom errors
    }
    
    if (error.name === 'NotSupportedError') {
      throw new Error('SETUP_ERROR: Google Play Billing not supported. Make sure: 1) App is from Play Store, 2) TWA has playBilling enabled, 3) Digital Goods API is available');
    }
    
    if (error.name === 'InvalidStateError') {
      throw new Error('SETUP_ERROR: Payment request in invalid state. Please try again.');
    }
    
    throw new Error(`PURCHASE_ERROR: ${error.message || 'Unknown error occurred during purchase'}`);
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
