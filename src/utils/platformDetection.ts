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
 */
export const getPaymentGateway = (
  countryCode: string,
  platform?: Platform
): PaymentGateway => {
  const currentPlatform = platform || getPlatform();
  
  // Play Store app always uses Google Play Billing
  if (currentPlatform === 'playstore-app') {
    return 'google-play';
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
 */
export const shouldUseGooglePlay = (countryCode?: string): boolean => {
  const platform = getPlatform();
  
  if (!countryCode) {
    return platform === 'playstore-app';
  }
  
  return getPaymentGateway(countryCode, platform) === 'google-play';
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