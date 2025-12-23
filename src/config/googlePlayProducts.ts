/**
 * Google Play Product ID Mapping
 * Maps internal plan IDs to Google Play Console product IDs
 * 
 * IMPORTANT: For PREPAID subscriptions, Google Play requires format: "productId:basePlanId"
 * Your Play Console setup:
 * - examtrakr_1month with base plan "monthly"
 * - examtrakr_3month with base plan "quarterly"
 * - examtrakr_6month with base plan "6months"
 * - examtrakr_12month with base plan "12monthspro"
 */

export interface ProductMapping {
  planId: string;
  playStoreProductId: string;
  basePlanId: string;
  duration: number;
  name: string;
}

// Product IDs (subscription product IDs from Play Console)
export const GOOGLE_PLAY_PRODUCT_IDS = {
  ONE_MONTH: 'examtrakr_1month',
  THREE_MONTHS: 'examtrakr_3month',
  SIX_MONTHS: 'examtrakr_6month',
  TWELVE_MONTHS: 'examtrakr_12month',
} as const;

// Base Plan IDs (from your Play Console base plans)
export const GOOGLE_PLAY_BASE_PLAN_IDS = {
  ONE_MONTH: 'monthly',
  THREE_MONTHS: 'quarterly',
  SIX_MONTHS: '6months',
  TWELVE_MONTHS: '12monthspro',
} as const;

/**
 * Get Google Play product ID from plan duration
 * Returns just the product ID (for verification with Google API)
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
 * Get Google Play base plan ID from plan duration
 */
export const getGooglePlayBasePlanId = (durationMonths: number): string => {
  switch (durationMonths) {
    case 1:
      return GOOGLE_PLAY_BASE_PLAN_IDS.ONE_MONTH;
    case 3:
      return GOOGLE_PLAY_BASE_PLAN_IDS.THREE_MONTHS;
    case 6:
      return GOOGLE_PLAY_BASE_PLAN_IDS.SIX_MONTHS;
    case 12:
      return GOOGLE_PLAY_BASE_PLAN_IDS.TWELVE_MONTHS;
    default:
      throw new Error(`No Google Play base plan ID mapped for ${durationMonths} months`);
  }
};

/**
 * Get full SKU for purchase (productId:basePlanId format for prepaid subscriptions)
 * This is the format required by Digital Goods API for prepaid subscriptions
 */
export const getGooglePlaySKU = (durationMonths: number): string => {
  const productId = getGooglePlayProductId(durationMonths);
  const basePlanId = getGooglePlayBasePlanId(durationMonths);
  return `${productId}:${basePlanId}`;
};

/**
 * Get all Google Play product IDs
 */
export const getAllGooglePlayProductIds = (): string[] => {
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS);
};

/**
 * Validate if a product ID is valid (accepts both productId and productId:basePlanId format)
 */
export const isValidGooglePlayProductId = (productId: string): boolean => {
  // Extract just the product ID if in format productId:basePlanId
  const justProductId = productId.split(':')[0];
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS).includes(justProductId as any);
};

/**
 * Extract product ID from SKU (removes base plan suffix if present)
 */
export const extractProductId = (sku: string): string => {
  return sku.split(':')[0];
};