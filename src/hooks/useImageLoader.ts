import { useState, useEffect, useRef, useCallback } from 'react';

interface UseImageLoaderOptions {
  lazy?: boolean;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface UseImageLoaderReturn {
  src: string | undefined;
  isLoaded: boolean;
  isInView: boolean;
  hasError: boolean;
  imageRef: React.RefObject<HTMLImageElement | null>;
}

/**
 * Hook for lazy loading images with intersection observer
 */
export function useImageLoader(
  imageSrc: string,
  placeholderSrc?: string,
  options: UseImageLoaderOptions = {}
): UseImageLoaderReturn {
  const {
    lazy = true,
    threshold = 0.1,
    rootMargin = '50px',
    onLoad,
    onError
  } = options;

  const [src, setSrc] = useState<string | undefined>(lazy ? placeholderSrc : imageSrc);
  const [isLoaded, setIsLoaded] = useState(!lazy);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!lazy || !imageRef.current) {
      setSrc(imageSrc);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setSrc(imageSrc);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(imageRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageSrc, lazy, threshold, rootMargin]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  }, [onError]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [handleLoad, handleError]);

  return {
    src,
    isLoaded,
    isInView,
    hasError,
    imageRef
  };
}

/**
 * Hook for image preloading
 */
export function useImagePreload(imageUrls: string[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setIsComplete(true);
      return;
    }

    let loaded = 0;
    let failed = 0;
    const total = imageUrls.length;

    const checkComplete = () => {
      if (loaded + failed === total) {
        setIsComplete(true);
      }
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        checkComplete();
      };
      img.onerror = () => {
        failed++;
        setFailedCount(failed);
        checkComplete();
      };
      img.src = url;
    });
  }, [imageUrls]);

  return {
    loadedCount,
    failedCount,
    isComplete,
    progress: imageUrls.length > 0 ? (loadedCount / imageUrls.length) * 100 : 100
  };
}

/**
 * Hook for responsive images
 */
export function useResponsiveImage(
  baseSrc: string,
  sizes: { sm?: string; md?: string; lg?: string; xl?: string }
) {
  const [currentSrc, setCurrentSrc] = useState(baseSrc);

  useEffect(() => {
    const updateSrc = () => {
      const width = window.innerWidth;
      
      if (width >= 1280 && sizes.xl) {
        setCurrentSrc(sizes.xl);
      } else if (width >= 1024 && sizes.lg) {
        setCurrentSrc(sizes.lg);
      } else if (width >= 768 && sizes.md) {
        setCurrentSrc(sizes.md);
      } else if (width >= 640 && sizes.sm) {
        setCurrentSrc(sizes.sm);
      } else {
        setCurrentSrc(baseSrc);
      }
    };

    updateSrc();
    window.addEventListener('resize', updateSrc);
    
    return () => window.removeEventListener('resize', updateSrc);
  }, [baseSrc, sizes]);

  return currentSrc;
}

export default useImageLoader;