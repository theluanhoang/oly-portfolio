/**
 * LCP (Largest Contentful Paint) Optimization Utilities
 */

import React from 'react';
import { SEO_CONSTANTS } from '@/lib/seo/constants';

/**
 * Get preload URL for hero image to improve LCP
 */
export function getHeroImagePreloadUrl(imageUrl: string): string | null {
  if (!imageUrl) return null;
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Build full URL for relative paths
  const fullUrl = imageUrl.startsWith('/')
    ? `${SEO_CONSTANTS.SITE_URL}${imageUrl}`
    : `${SEO_CONSTANTS.SITE_URL}/${imageUrl}`;

  return fullUrl;
}

/**
 * Generate preconnect links for external resources
 */
export function generatePreconnectLinks(domains: string[]): React.ReactElement[] {
  return domains.map((domain) => (
    <link key={domain} rel="preconnect" href={domain} crossOrigin="anonymous" />
  ));
}

/**
 * Generate DNS prefetch links for external resources
 */
export function generateDnsPrefetchLinks(domains: string[]): React.ReactElement[] {
  return domains.map((domain) => (
    <link key={domain} rel="dns-prefetch" href={domain} />
  ));
}
