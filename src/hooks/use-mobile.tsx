import * as React from "react";
import { isStandalone, isPlayStoreApp } from "@/utils/pwaUtils";

const MOBILE_BREAKPOINT = 768;

/**
 * Check if running in TWA (Trusted Web Activity) mode
 * In TWA mode, we always force mobile UI regardless of screen size
 */
const isTWAMode = (): boolean => {
  // Check for TWA markers
  const isTWA = document.referrer.includes('android-app://') ||
                localStorage.getItem('app_source') === 'playstore' ||
                document.documentElement.classList.contains('twa-mode');
  
  // Check for standalone display mode
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;
  
  // If standalone on Android, treat as TWA
  const isAndroid = /Android/.test(navigator.userAgent);
  
  return isTWA || (isStandaloneMode && isAndroid) || isPlayStoreApp();
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [isTWA, setIsTWA] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Check TWA mode on mount
    const twaMode = isTWAMode();
    setIsTWA(twaMode);
    
    // If in TWA mode, always return true (mobile UI)
    if (twaMode) {
      setIsMobile(true);
      console.log('[useIsMobile] TWA mode detected - forcing mobile UI');
      return;
    }
    
    // Standard responsive detection for web
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // In TWA mode, always return true regardless of screen size
  if (isTWA) {
    return true;
  }

  return !!isMobile;
}

/**
 * Hook to detect if running in TWA mode
 */
export function useIsTWA() {
  const [isTWA, setIsTWA] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    setIsTWA(isTWAMode());
  }, []);
  
  return isTWA;
}
