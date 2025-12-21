'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

interface GoogleMapProps {
  className?: string;
}

export default function GoogleMap({ className = '' }: GoogleMapProps) {
  const locale = useLocale();
  const t = useTranslations('ContactPage');
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [shouldLoad]);

  const handlePreload = () => {
    if (!shouldLoad && !preloadTimeoutRef.current) {
      preloadTimeoutRef.current = setTimeout(() => {
        setShouldLoad(true);
      }, 300);
    }
  };

  const handleCancelPreload = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
      preloadTimeoutRef.current = null;
    }
  };

  const address = encodeURIComponent(t('contactInfo.address'));
  const mapEmbedUrl = `https://www.google.com/maps?q=${address}&output=embed&hl=${locale}&z=15`;

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full ${className} relative`}
      onMouseEnter={handlePreload}
      onMouseLeave={handleCancelPreload}
      onFocus={handlePreload}
      onBlur={handleCancelPreload}
    >
      {shouldLoad ? (
        <>
          {isLoading && !hasError && (
            <div 
              className="absolute inset-0 bg-gray-100 animate-pulse flex flex-col items-center justify-center z-10"
              aria-live="polite"
              aria-label={t('map.loading') || 'Loading map'}
            >
              <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-4" />
              <div className="text-gray-500 text-sm">{t('map.loading') || 'Loading map...'}</div>
            </div>
          )}
          {hasError ? (
            <div 
              className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center"
              role="alert"
            >
              <div className="text-gray-500 text-sm mb-2">{t('map.error') || 'Failed to load map'}</div>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  const iframe = document.querySelector('iframe[src*="google.com/maps"]') as HTMLIFrameElement;
                  if (iframe) {
                    iframe.src = iframe.src;
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {t('map.retry') || 'Retry'}
              </button>
            </div>
          ) : null}
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
            onLoad={handleLoad}
            onError={handleError}
            title={t('map.title') || 'Google Maps - Location'}
            aria-label={t('contactInfo.address')}
          />
        </>
      ) : (
        <div 
          className="w-full h-full bg-gray-100 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
          role="button"
          tabIndex={0}
          aria-label={t('map.loadMap') || 'Load map'}
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <div className="text-gray-500 text-sm">{t('map.placeholder') || 'Map will load here...'}</div>
        </div>
      )}
    </div>
  );
}

