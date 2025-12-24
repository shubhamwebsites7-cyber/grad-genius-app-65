// PWA utilities for standalone app detection and install prompt

/**
 * Check if app is running in standalone mode (installed PWA or APK)
 */
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isStandaloneMode = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone || // iOS
    document.referrer.includes('android-app://'); // Android TWA
  
  return isStandaloneMode;
};

/**
 * Check if running as Play Store TWA (Trusted Web Activity)
 * Uses multiple detection methods - TWA shares Chrome's desktop mode
 */
export const isPlayStoreApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check referrer (most reliable for fresh launch)
  const hasAndroidReferrer = document.referrer.includes('android-app://');
  
  // Check localStorage marker (persists across sessions)
  const isMarkedAsPlayStore = localStorage.getItem('app_source') === 'playstore';
  
  // Check CSS class set by index.html script
  const hasTWAClass = document.documentElement.classList.contains('twa-mode');
  
  // Check standalone on Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isStandaloneAndroid = isStandalone() && isAndroid;
  
  const isTWA = hasAndroidReferrer || isMarkedAsPlayStore || hasTWAClass || isStandaloneAndroid;
  
  // Persist for future sessions
  if (isTWA && !isMarkedAsPlayStore) {
    try {
      localStorage.setItem('app_source', 'playstore');
      document.documentElement.classList.add('twa-mode');
    } catch (e) {}
  }
  
  return isTWA;
};

/**
 * Check if app is running as installed PWA
 */
export const isInstalled = (): boolean => {
  return isStandalone() || localStorage.getItem('pwa-installed') === 'true';
};

/**
 * Mark app as installed
 */
export const markAsInstalled = (): void => {
  localStorage.setItem('pwa-installed', 'true');
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if iOS device
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Check if Android device
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Get install prompt event
 */
let deferredPrompt: any = null;

export const setInstallPrompt = (event: any): void => {
  deferredPrompt = event;
};

export const getInstallPrompt = (): any => {
  return deferredPrompt;
};

export const clearInstallPrompt = (): void => {
  deferredPrompt = null;
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    markAsInstalled();
    clearInstallPrompt();
    return true;
  }
  
  clearInstallPrompt();
  return false;
};

/**
 * Add standalone mode styles
 */
export const addStandaloneModeStyles = (): void => {
  if (isStandalone()) {
    document.documentElement.classList.add('standalone-mode');
    
    // Add safe area padding for iOS
    if (isIOS()) {
      document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
    }
  }
};

/**
 * Handle app install
 */
export const handleAppInstalled = (): void => {
  console.log('[PWA] App was installed');
  markAsInstalled();
  clearInstallPrompt();
};

/**
 * Register beforeinstallprompt event
 */
export const registerInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setInstallPrompt(e);
    console.log('[PWA] Install prompt available');
  });

  window.addEventListener('appinstalled', handleAppInstalled);
};
