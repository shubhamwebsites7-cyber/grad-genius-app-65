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
    const service = await getService();
    
    // Create payment request
    const paymentRequest = new (window as any).PaymentRequest([{
      supportedMethods: 'https://play.google.com/billing',
      data: {
        sku: productId,
      }
    }]);
    
    // Show payment UI
    const paymentResponse = await paymentRequest.show();
    
    // Complete the payment
    await paymentResponse.complete('success');
    
    // Get purchase details
    const { purchaseToken } = paymentResponse.details;
    
    return {
      itemId: productId,
      purchaseToken: purchaseToken,
      purchaseTime: Date.now(),
      purchaseState: 'purchased'
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Purchase cancelled by user');
    }
    console.error('Error during purchase:', error);
    throw new Error('Failed to complete purchase. Please try again.');
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