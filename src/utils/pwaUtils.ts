// PWA utilities for standalone app detection and install prompt

/**
 * Check if app is running in standalone mode (installed PWA or APK)
 */
export const isStandalone = (): boolean => {
  // Check various standalone indicators
  const isStandaloneMode = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone || // iOS
    document.referrer.includes('android-app://'); // Android TWA
  
  return isStandaloneMode;
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
