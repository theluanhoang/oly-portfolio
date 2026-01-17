'use client';

/**
 * Component to add preload link for hero images
 * This injects a preload link into the head to improve LCP
 */

import { useEffect } from 'react';
import { SEO_CONSTANTS } from '@/lib/seo/constants';

interface HeroImagePreloadProps {
  imageUrl: string;
}

export default function HeroImagePreload({ imageUrl }: HeroImagePreloadProps) {
  useEffect(() => {
    if (!imageUrl || typeof window === 'undefined') return;

    // Build full URL if needed
    const fullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
      ? imageUrl
      : imageUrl.startsWith('/')
      ? `${SEO_CONSTANTS.SITE_URL}${imageUrl}`
      : `${SEO_CONSTANTS.SITE_URL}/${imageUrl}`;

    // Check if preload link already exists
    const existingLink = document.querySelector(`link[rel="preload"][as="image"][href="${fullUrl}"]`);
    if (existingLink) return;

    // Create and inject preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = fullUrl;
    link.setAttribute('fetchPriority', 'high');
    document.head.appendChild(link);

    // Cleanup on unmount
    return () => {
      const linkToRemove = document.querySelector(`link[rel="preload"][as="image"][href="${fullUrl}"]`);
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [imageUrl]);

  // This component doesn't render anything visible
  return null;
}
