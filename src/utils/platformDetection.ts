/**
 * Platform Detection Utilities for Payment Routing
 * Determines which payment gateway to use based on platform and country
 */

import { isStandalone, isAndroid, isPlayStoreApp } from './pwaUtils';

export type Platform = 'web' | 'pwa-installed' | 'playstore-app';
export type PaymentGateway = 'cashfree' | 'google-play' | 'unavailable';

/**
 * Get current platform type
 */
export const getPlatform = (): Platform => {
  // Check if running in TWA (Trusted Web Activity) from Play Store
  const isTWA = document.referrer.includes('android-app://');
  const hasDigitalGoodsAPI = 'getDigitalGoodsService' in window;
  
  // If we have Digital Goods API or it's a TWA, it's a Play Store app
  if (isTWA || hasDigitalGoodsAPI || isPlayStoreApp()) {
    console.log('Detected as Play Store app', { isTWA, hasDigitalGoodsAPI, isPlayStoreApp: isPlayStoreApp() });
    return 'playstore-app';
  }
  
  if (isStandalone() && isAndroid()) {
    console.log('Detected as PWA installed');
    return 'pwa-installed';
  }
  
  console.log('Detected as web browser');
  return 'web';
};

/**
 * Determine which payment gateway to use
 * @param countryCode - User's country code (e.g., 'IN', 'US')
 * @param platform - Current platform (optional, auto-detected if not provided)
 * 
 * TEMPORARILY MODIFIED: Google Play Billing disabled for Play Store production release
 */
export const getPaymentGateway = (
  countryCode: string,
  platform?: Platform
): PaymentGateway => {
  const currentPlatform = platform || getPlatform();
  
  // TEMPORARY: Play Store app should NOT allow payments
  // Show "unavailable" so UI can display appropriate message
  if (currentPlatform === 'playstore-app') {
    return 'unavailable';
  }
  
  // Web or PWA with Indian users - use Cashfree
  if (countryCode === 'IN') {
    return 'cashfree';
  }
  
  // Non-Indian users on web/PWA should download app
  return 'unavailable';
};

/**
 * Check if user should be shown app download prompt
 */
export const shouldShowAppDownload = (countryCode: string): boolean => {
  const platform = getPlatform();
  const gateway = getPaymentGateway(countryCode, platform);
  
  // Show download prompt for non-Indian users on web/PWA
  return gateway === 'unavailable';
};

/**
 * Check if Google Play Billing should be used
 * TEMPORARILY DISABLED: Always returns false for Play Store production release
 * Google Play Billing will be re-enabled later
 */
export const shouldUseGooglePlay = (countryCode?: string): boolean => {
  // TEMPORARY: Disable Google Play Billing completely
  // All users should use Cashfree or see "unavailable" message
  return false;
  
  // Original logic (commented out for later re-enable):
  // const platform = getPlatform();
  // if (!countryCode) {
  //   return platform === 'playstore-app';
  // }
  // return getPaymentGateway(countryCode, platform) === 'google-play';
};

/**
 * Check if Cashfree should be used
 */
export const shouldUseCashfree = (countryCode: string): boolean => {
  return getPaymentGateway(countryCode) === 'cashfree';
};

/**
 * Get user-friendly platform name
 */
export const getPlatformName = (): string => {
  const platform = getPlatform();
  
  switch (platform) {
    case 'playstore-app':
      return 'Google Play Store App';
    case 'pwa-installed':
      return 'Installed Web App';
    case 'web':
      return 'Web Browser';
    default:
      return 'Unknown Platform';
  }
};

/**
 * Check if running in TWA (Play Store app)
 * Used to determine if payments should be hidden
 */
export const isTWAApp = (): boolean => {
  return getPlatform() === 'playstore-app';
};

/**
 * Mark app as installed from Play Store
 */
export const markAsPlayStoreApp = (): void => {
  localStorage.setItem('app_source', 'playstore');
  localStorage.setItem('pwa-installed', 'true');
};

/**
 * Check if Digital Goods API is available (for PWA Google Play Billing)
 */
export const isDigitalGoodsAPIAvailable = async (): Promise<boolean> => {
  console.log('Checking Digital Goods API availability...');
  console.log('Window has getDigitalGoodsService:', 'getDigitalGoodsService' in window);
  console.log('User agent:', navigator.userAgent);
  console.log('Is standalone:', window.matchMedia('(display-mode: standalone)').matches);
  console.log('Document referrer:', document.referrer);
  
  if (!('getDigitalGoodsService' in window)) {
    console.log('Digital Goods API not found in window object');
    return false;
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    console.log('Digital Goods service obtained:', !!service);
    return !!service;
  } catch (error) {
    console.error('Error getting Digital Goods service:', error);
    return false;
  }
};