import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Check if running in TWA (Trusted Web Activity) mode
 * Uses multiple detection methods - doesn't rely on viewport width
 * TWA shares Chrome's desktop mode setting, so we can't use screen size alone
 */
const isTWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Method 1: Check referrer for android-app:// (most reliable for fresh launch)
  const hasAndroidReferrer = document.referrer.includes('android-app://');
  
  // Method 2: Check localStorage marker (persists across sessions)
  const isMarkedAsPlayStore = localStorage.getItem('app_source') === 'playstore';
  
  // Method 3: Check CSS class set by index.html script
  const hasTWAClass = document.documentElement.classList.contains('twa-mode');
  
  // Method 4: Check standalone display mode on Android
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isStandaloneAndroid = isStandalone && isAndroid;
  
  // Method 5: Check for minimal-ui (some TWAs use this)
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isMinimalUIAndroid = isMinimalUI && isAndroid;
  
  // If any TWA indicator is true, mark for future sessions
  const isTWA = hasAndroidReferrer || isMarkedAsPlayStore || hasTWAClass || isStandaloneAndroid || isMinimalUIAndroid;
  
  if (isTWA && !isMarkedAsPlayStore) {
    // Persist TWA detection for future app opens
    try {
      localStorage.setItem('app_source', 'playstore');
      document.documentElement.classList.add('twa-mode');
    } catch (e) {
      // localStorage might not be available
    }
  }
  
  return isTWA;
};

/**
 * Force mobile layout class on body for TWA mode
 * This ensures CSS also respects mobile layout
 */
const applyTWAMobileLayout = (isTWA: boolean): void => {
  if (typeof document === 'undefined') return;
  
  if (isTWA) {
    document.documentElement.classList.add('force-mobile-layout');
    document.body.classList.add('force-mobile-layout');
  }
};

export function useIsMobile() {
  // Initialize with TWA check for SSR safety
  const [isTWA, setIsTWA] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isTWAMode();
  });
  
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // In TWA, always start as mobile
    if (isTWAMode()) return true;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const twaMode = isTWAMode();
    setIsTWA(twaMode);
    
    // Apply TWA mobile layout class
    applyTWAMobileLayout(twaMode);
    
    // If in TWA mode, force mobile and skip responsive detection
    if (twaMode) {
      setIsMobile(true);
      console.log('[useIsMobile] TWA mode detected - forcing mobile UI');
      return;
    }
    
    // Standard responsive detection for web browser
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    checkMobile();
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  // TWA always returns true regardless of actual screen size
  return isTWA || isMobile;
}

/**
 * Hook to detect if running in TWA mode
 */
export function useIsTWA() {
  const [isTWA, setIsTWA] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isTWAMode();
  });
  
  React.useEffect(() => {
    const twaMode = isTWAMode();
    setIsTWA(twaMode);
    applyTWAMobileLayout(twaMode);
  }, []);
  
  return isTWA;
}

/**
 * Utility to check TWA mode synchronously (for non-hook contexts)
 */
export const checkIsTWA = (): boolean => isTWAMode();
