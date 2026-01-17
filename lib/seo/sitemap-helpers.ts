import { LOCALES, DEFAULT_LOCALE, getBaseUrl } from './constants';

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  locale?: string;
}

/**
 * Generate hreflang URLs for a given path
 * Returns all locale variants of the same page
 */
export function generateHreflangUrls(path: string, baseUrl?: string): Array<{ locale: string; url: string }> {
  const base = baseUrl || getBaseUrl();
  const hreflangUrls: Array<{ locale: string; url: string }> = [];

  for (const locale of LOCALES) {
    let url: string;
    if (locale === DEFAULT_LOCALE) {
      // Default locale: no prefix
      url = `${base}${path}`;
    } else {
      // Other locales: add locale prefix
      url = `${base}/${locale}${path}`;
    }
    hreflangUrls.push({ locale, url });
  }

  return hreflangUrls;
}

/**
 * Group sitemap entries by their base path (without locale)
 * This helps identify which URLs are alternate versions of the same page
 */
export function groupUrlsByPath(entries: SitemapUrl[]): Map<string, SitemapUrl[]> {
  const grouped = new Map<string, SitemapUrl[]>();

  for (const entry of entries) {
    // Extract base path (remove locale prefix and base URL)
    const baseUrl = getBaseUrl();
    let path = entry.url.replace(baseUrl, '');
    
    // Remove locale prefix if present
    for (const locale of LOCALES) {
      if (locale !== DEFAULT_LOCALE && path.startsWith(`/${locale}/`)) {
        path = path.replace(`/${locale}`, '');
        break;
      } else if (locale !== DEFAULT_LOCALE && path === `/${locale}`) {
        path = '/';
        break;
      }
    }
    
    // Normalize path
    if (!path || path === '') {
      path = '/';
    }

    if (!grouped.has(path)) {
      grouped.set(path, []);
    }
    grouped.get(path)!.push(entry);
  }

  return grouped;
}

/**
 * Get the default locale URL for a given path
 */
export function getDefaultLocaleUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  return `${base}${path}`;
}

/**
 * Get alternate locale URL for a given path and locale
 */
export function getAlternateLocaleUrl(path: string, locale: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  if (locale === DEFAULT_LOCALE) {
    return `${base}${path}`;
  }
  return `${base}/${locale}${path}`;
}
