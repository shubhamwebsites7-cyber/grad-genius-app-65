import { useEffect } from 'react';
import { lazyLoadImages, preloadCriticalImages } from '@/utils/imageOptimization';

/**
 * Hook to automatically optimize images in a component
 * @param criticalImages - Array of image paths that should be preloaded
 * @param enableLazyLoad - Whether to enable lazy loading for images with the 'lazy' class
 */
export const useImageOptimization = (
  criticalImages: string[] = [],
  enableLazyLoad: boolean = true
) => {
  useEffect(() => {
    // Preload critical images
    if (criticalImages.length > 0) {
      preloadCriticalImages(criticalImages);
    }

    // Set up lazy loading
    if (enableLazyLoad) {
      lazyLoadImages();
    }
  }, [criticalImages, enableLazyLoad]);
};
