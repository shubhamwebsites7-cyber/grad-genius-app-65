/**
 * Google Play Product ID Mapping
 * Maps internal plan IDs to Google Play Console product IDs
 */

export interface ProductMapping {
  planId: string;
  playStoreProductId: string;
  duration: number;
  name: string;
}

// IMPORTANT: For subscriptions, use format: productId:basePlanId
// These must match your Google Play Console subscription product IDs and base plan IDs
export const GOOGLE_PLAY_PRODUCT_IDS = {
  ONE_MONTH: 'examtrakr_1month:monthly',
  THREE_MONTHS: 'examtrakr_3month:quarterly',
  SIX_MONTHS: 'examtrakr_6month:6months',
  TWELVE_MONTHS: 'examtrakr_12month:12monthspro',
} as const;

/**
 * Get Google Play product ID from plan duration
 */
export const getGooglePlayProductId = (durationMonths: number): string => {
  switch (durationMonths) {
    case 1:
      return GOOGLE_PLAY_PRODUCT_IDS.ONE_MONTH;
    case 3:
      return GOOGLE_PLAY_PRODUCT_IDS.THREE_MONTHS;
    case 6:
      return GOOGLE_PLAY_PRODUCT_IDS.SIX_MONTHS;
    case 12:
      return GOOGLE_PLAY_PRODUCT_IDS.TWELVE_MONTHS;
    default:
      throw new Error(`No Google Play product ID mapped for ${durationMonths} months`);
  }
};

/**
 * Get all Google Play product IDs
 */
export const getAllGooglePlayProductIds = (): string[] => {
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS);
};

/**
 * Validate if a product ID is valid
 */
export const isValidGooglePlayProductId = (productId: string): boolean => {
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS).includes(productId as any);
};