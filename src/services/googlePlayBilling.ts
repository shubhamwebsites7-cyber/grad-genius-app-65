/**
 * Google Play Billing Service
 * Handles in-app purchases via Digital Goods API for PWA
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

/**
 * Check if Digital Goods API is available
 */
export const isGooglePlayBillingAvailable = async (): Promise<boolean> => {
  if (!('getDigitalGoodsService' in window)) {
    console.log('Digital Goods API not available');
    return false;
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    return !!service;
  } catch (error) {
    console.error('Error checking Digital Goods API:', error);
    return false;
  }
};

/**
 * Get the Digital Goods Service
 */
const getService = async () => {
  if (!('getDigitalGoodsService' in window)) {
    throw new Error('Digital Goods API not available. Please use the Play Store app.');
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    if (!service) {
      throw new Error('Could not get Digital Goods service');
    }
    return service;
  } catch (error) {
    throw new Error('Google Play Billing not available. Please install from Play Store.');
  }
};

/**
 * Get available products/subscriptions
 */
export const getProducts = async (productIds: string[]): Promise<GooglePlayProduct[]> => {
  try {
    const service = await getService();
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
 * Purchase a subscription
 */
export const purchasePlan = async (productId: string): Promise<PurchaseDetails> => {
  try {
    console.log('🔍 Starting purchase flow for product:', productId);
    const service = await getService();
    console.log('✅ Digital Goods service obtained');
    
    // First, verify the product exists
    console.log('🔍 Checking if product exists in Play Console...');
    try {
      const productDetails = await service.getDetails([productId]);
      console.log('📦 Product details:', productDetails);
      
      if (!productDetails || productDetails.length === 0) {
        throw new Error(`Product ${productId} not found in Google Play Console. Please check your product configuration.`);
      }
      
      console.log('✅ Product exists, proceeding with purchase...');
    } catch (detailsError) {
      console.error('❌ Error getting product details:', detailsError);
      throw new Error(`Product ${productId} not configured in Google Play Console. Please contact support.`);
    }
    
    // Create payment request
    console.log('💳 Creating payment request...');
    const paymentRequest = new (window as any).PaymentRequest([{
      supportedMethods: 'https://play.google.com/billing',
      data: {
        sku: productId,
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
    
    if (error.name === 'AbortError') {
      throw new Error('Purchase cancelled by user');
    }
    
    if (error.message && error.message.includes('not found')) {
      throw error; // Re-throw product not found errors
    }
    
    if (error.message && error.message.includes('not configured')) {
      throw error; // Re-throw configuration errors
    }
    
    console.error('Error during purchase:', error);
    throw new Error(`Purchase failed: ${error.message || 'Unknown error'}. Please try again.`);
  }
};

/**
 * Get existing purchases
 */
export const getPurchases = async (): Promise<PurchaseDetails[]> => {
  try {
    const service = await getService();
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
    const service = await getService();
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
    const service = await getService();
    await service.consume(purchaseToken);
  } catch (error) {
    console.error('Error consuming purchase:', error);
    throw error;
  }
};