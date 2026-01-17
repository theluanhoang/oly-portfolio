import type { Metadata } from 'next';
import { SEO_CONSTANTS, DEFAULT_LOCALE } from './constants';
import type { SEOConfig, ImageMetadata } from './types';
import { buildImageUrl } from './image-helpers';

/**
 * Truncate description to optimal length for SEO (150-160 characters)
 */
function truncateDescription(description: string, maxLength: number = 160): string {
  if (!description || description.trim().length === 0) return '';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength).trim().replace(/\.$/, '') + '...';
}

/**
 * Build full URL from path
 */
function buildUrl(path: string, locale?: string): string {
  const baseUrl = SEO_CONSTANTS.SITE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const localePath = locale && locale !== DEFAULT_LOCALE ? `/${locale}` : '';
  return `${baseUrl}${localePath}${cleanPath}`;
}

/**
 * Normalize image config to ImageMetadata format
 */
function normalizeImageConfig(
  image?: string | ImageMetadata | ImageMetadata[]
): ImageMetadata | null {
  if (!image) {
    return {
      url: `${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`,
      width: 1200,
      height: 630,
    };
  }

  // If it's a string, convert to ImageMetadata
  if (typeof image === 'string') {
    return {
      url: buildImageUrl(image),
      width: 1200,
      height: 630,
    };
  }

  // If it's an array, use the first image
  if (Array.isArray(image)) {
    if (image.length === 0) {
      return {
        url: `${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`,
        width: 1200,
        height: 630,
      };
    }
    const firstImage = image[0];
    return {
      url: buildImageUrl(firstImage.url),
      width: firstImage.width || 1200,
      height: firstImage.height || 630,
      alt: firstImage.alt,
    };
  }

  // It's already ImageMetadata
  return {
    url: buildImageUrl(image.url),
    width: image.width || 1200,
    height: image.height || 630,
    alt: image.alt,
  };
}

/**
 * Get image URL (absolute or relative) - legacy function for backward compatibility
 */
function getImageUrl(image?: string | ImageMetadata | ImageMetadata[]): string {
  const normalized = normalizeImageConfig(image);
  return normalized?.url || `${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`;
}

/**
 * Generate canonical URL
 */
function getCanonicalUrl(url?: string, locale?: string): string {
  if (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return buildUrl(url, locale);
  }
  return SEO_CONSTANTS.SITE_URL;
}

/**
 * Generate hreflang alternates
 */
function getAlternates(
  alternateLocales?: Array<{ locale: string; url: string }>,
  currentLocale?: string,
  currentUrl?: string
): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  let xDefault: string | undefined;

  // Add alternate locales
  if (alternateLocales && alternateLocales.length > 0) {
    for (const alt of alternateLocales) {
      languages[alt.locale] = alt.url;
    }
  }

  // Set x-default if current locale is default locale
  if (currentLocale === DEFAULT_LOCALE && currentUrl) {
    xDefault = currentUrl;
  } else if (alternateLocales && alternateLocales.length > 0) {
    // Find default locale in alternates
    const defaultAlt = alternateLocales.find((alt) => alt.locale === DEFAULT_LOCALE);
    if (defaultAlt) {
      xDefault = defaultAlt.url;
    }
  }

  if (Object.keys(languages).length === 0 && !xDefault) {
    return undefined;
  }

  return {
    canonical: undefined, // Will be set separately
    ...(Object.keys(languages).length > 0 && { languages }),
    ...(xDefault && { 'x-default': xDefault }),
  };
}

/**
 * Generate robots meta
 */
function getRobots(noindex?: boolean, nofollow?: boolean): Metadata['robots'] {
  if (!noindex && !nofollow) {
    return undefined;
  }

  const directives: string[] = [];
  if (noindex) directives.push('noindex');
  if (nofollow) directives.push('nofollow');
  if (!noindex && !nofollow) directives.push('index', 'follow');

  return {
    index: !noindex,
    follow: !nofollow,
    googleBot: {
      index: !noindex,
      follow: !nofollow,
    },
  };
}

/**
 * Generate Open Graph metadata
 */
function getOpenGraph(config: SEOConfig): Metadata['openGraph'] {
  const normalizedImage = normalizeImageConfig(config.image);
  const imageUrl = normalizedImage?.url || getImageUrl(config.image);
  
  // Use provided dimensions or defaults
  // Note: In production, you might want to store image dimensions in database
  // when images are uploaded, so we can use actual dimensions here
  const imageWidth = normalizedImage?.width || 1200;
  const imageHeight = normalizedImage?.height || 630;
  
  const url = getCanonicalUrl(config.url, config.locale);
  const type = config.type === 'product' ? 'website' : (config.type || 'website');

  // Base OpenGraph metadata
  const baseOG: Metadata['openGraph'] = {
    type: type === 'article' ? 'article' : 'website',
    url,
    title: config.title,
    description: config.description && config.description.trim().length > 0 ? truncateDescription(config.description) : undefined,
    siteName: SEO_CONSTANTS.SITE_NAME,
    images: [
      {
        url: imageUrl,
        width: imageWidth,
        height: imageHeight,
        alt: normalizedImage?.alt || config.title,
      },
    ],
  };

  // Add locale information
  if (baseOG && config.locale) {
    baseOG.locale = config.locale;
  }

  if (baseOG && config.alternateLocales && config.alternateLocales.length > 0) {
    baseOG.alternateLocale = config.alternateLocales.map((alt) => alt.locale);
  }

  // Add article-specific metadata
  if (type === 'article' && baseOG) {
    const articleOG: Metadata['openGraph'] = {
      ...baseOG,
      type: 'article',
    };

    // Use Record to add article-specific properties
    const articleOGExtended = articleOG as Record<string, unknown>;

    if (config.publishedTime) {
      articleOGExtended.publishedTime = config.publishedTime;
    }
    if (config.modifiedTime) {
      articleOGExtended.modifiedTime = config.modifiedTime;
    }
    if (config.author) {
      articleOGExtended.authors = [config.author];
    }
    if (config.section) {
      articleOGExtended.section = config.section;
    }
    if (config.tags && config.tags.length > 0) {
      articleOGExtended.tags = config.tags;
    }

    return articleOGExtended as Metadata['openGraph'];
  }

  return baseOG;
}

/**
 * Generate complete metadata from SEO config
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const canonicalUrl = getCanonicalUrl(config.url, config.locale);
  const alternates = getAlternates(config.alternateLocales, config.locale, canonicalUrl);

  const metadata: Metadata = {
    title: config.title,
    description: config.description && config.description.trim().length > 0 ? truncateDescription(config.description) : undefined,
    keywords: config.keywords && config.keywords.length > 0 ? config.keywords.join(', ') : undefined,
    authors: config.author ? [{ name: config.author }] : undefined,
    robots: getRobots(config.noindex, config.nofollow),
    alternates: alternates
      ? {
          ...alternates,
          canonical: canonicalUrl,
        }
      : {
          canonical: canonicalUrl,
        },
    openGraph: getOpenGraph(config),
    other: {
      'theme-color': SEO_CONSTANTS.THEME_COLOR,
    },
  };

  return metadata;
}

/**
 * Generate metadata for pages with locale support
 */
export function generateLocalizedMetadata(
  config: SEOConfig,
  currentLocale: string,
  path: string
): Metadata {
  const locales = ['en', 'vi'];
  const alternateLocales: Array<{ locale: string; url: string }> = locales
    .filter((loc) => loc !== currentLocale)
    .map((loc) => ({
      locale: loc,
      url: buildUrl(path, loc),
    }));

  return generateMetadata({
    ...config,
    locale: currentLocale,
    alternateLocales,
    url: buildUrl(path, currentLocale),
  });
}
