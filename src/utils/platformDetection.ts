/**
 * Platform Detection Utilities for Payment Routing
 * 
 * CURRENT STATE: Google Play Billing DISABLED
 * All payments go through Cashfree (India) or show unavailable message
 */

import { isStandalone, isAndroid, isPlayStoreApp } from './pwaUtils';

export type Platform = 'web' | 'pwa-installed' | 'playstore-app';
export type PaymentGateway = 'cashfree' | 'unavailable';

/**
 * Get current platform type
 */
export const getPlatform = (): Platform => {
  // Check if running in TWA (Trusted Web Activity) from Play Store
  const isTWA = document.referrer.includes('android-app://') ||
                localStorage.getItem('app_source') === 'playstore' ||
                document.documentElement.classList.contains('twa-mode');
  
  if (isTWA || isPlayStoreApp()) {
    console.log('Detected as Play Store app', { isTWA, isPlayStoreApp: isPlayStoreApp() });
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
 * CURRENT: Google Play Billing disabled - Only Cashfree for India
 */
export const getPaymentGateway = (
  countryCode: string,
  platform?: Platform
): PaymentGateway => {
  // Indian users can use Cashfree on any platform
  if (countryCode === 'IN') {
    return 'cashfree';
  }
  
  // Non-Indian users: show unavailable
  return 'unavailable';
};

/**
 * Check if user should be shown app download prompt
 * DISABLED: No longer showing download prompts
 */
export const shouldShowAppDownload = (countryCode: string): boolean => {
  // Disable download prompts - we want users to use web payments
  return false;
};

/**
 * Check if Google Play Billing should be used
 * DISABLED: Always returns false
 */
export const shouldUseGooglePlay = (countryCode?: string): boolean => {
  // Google Play Billing is disabled
  return false;
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
