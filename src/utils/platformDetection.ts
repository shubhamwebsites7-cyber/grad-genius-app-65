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
  if (isPlayStoreApp()) {
    return 'playstore-app';
  }
  
  if (isStandalone() && isAndroid()) {
    return 'pwa-installed';
  }
  
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
  if (!('getDigitalGoodsService' in window)) {
    return false;
  }
  
  try {
    const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
    return !!service;
  } catch {
    return false;
  }
};