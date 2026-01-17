'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Width for aspect ratio (optional) */
  width?: number;
  /** Height for aspect ratio (optional) */
  height?: number;
  /** Use lazy loading (default: true) */
  lazy?: boolean;
  /** Use progressive loading with blur placeholder (default: true) 
   * Note: blur placeholder will only show if blurDataURL is provided to avoid hydration mismatch */
  progressive?: boolean;
  /** Blur placeholder data URL (required for progressive loading blur effect) */
  blurDataURL?: string;
  /** Loading priority: 'eager' for above-fold images, 'lazy' for others */
  priority?: 'eager' | 'lazy';
  /** Error fallback image */
  fallback?: string;
  /** onLoad callback */
  onLoad?: () => void;
  /** onError callback */
  onError?: () => void;
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage Component
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Progressive loading with blur placeholder (requires blurDataURL prop)
 * - Error handling with fallback
 * - Responsive and performant
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  lazy = true,
  progressive = true,
  blurDataURL,
  priority = 'lazy',
  fallback,
  onLoad,
  onError,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [blurPlaceholder] = useState<string>(blurDataURL || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority === 'eager' || !lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setImgRef = useCallback((node: HTMLImageElement | null) => {
    if (node) {
      imgRef.current = node;
      if (node.complete && node.naturalWidth > 0) {
        setIsLoaded(true);
        onLoad?.();
      }
    }
  }, [onLoad]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!lazy || priority === 'eager' || shouldLoad) return;

    const currentImgRef = imgRef.current;
    if (!currentImgRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (observerRef.current && currentImgRef) {
              observerRef.current.unobserve(currentImgRef);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(currentImgRef);
    observerRef.current = observer;

    return () => {
      if (observerRef.current && currentImgRef) {
        observerRef.current.unobserve(currentImgRef);
      }
    };
  }, [lazy, priority, shouldLoad]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const [fallbackSrc, setFallbackSrc] = useState<string>('');

  const handleError = useCallback(() => {
    setHasError(true);
    if (fallback) {
      setFallbackSrc(fallback);
      setIsLoaded(true);
    }
    onError?.();
  }, [fallback, onError]);

  // Determine what to show
  const displaySrc = fallbackSrc || (shouldLoad ? src : (blurPlaceholder || src));
  const showBlur = progressive && !isLoaded && blurPlaceholder && shouldLoad && !fallbackSrc;

  return (
    <div
      className={`relative overflow-hidden w-full h-full ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Blur placeholder */}
      {showBlur && blurPlaceholder && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Main image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={displaySrc}
        ref={setImgRef}
        src={displaySrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority === 'eager' ? 'eager' : 'lazy'}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded && shouldLoad ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit,
        }}
      />

      {/* Loading indicator (optional) */}
      {!isLoaded && shouldLoad && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
