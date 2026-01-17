import { SEO_CONSTANTS } from './constants';

/**
 * Base type for JSON-LD structured data
 */
export type StructuredData = {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
};

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONSTANTS.SITE_NAME,
    url: SEO_CONSTANTS.SITE_URL,
    logo: `${SEO_CONSTANTS.SITE_URL}/assets/logo.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@olystudio.vn',
      telephone: '+84-900-000-000',
      contactType: 'Customer Service',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '193/9P Điện Biên Phủ, Phường 15',
      addressLocality: 'Bình Thạnh',
      addressRegion: 'TP HCM',
      addressCountry: 'VN',
    },
  };
}

/**
 * Generate WebSite schema with searchAction
 */
export function generateWebSiteSchema(locale: string = 'vi'): StructuredData {
  const baseUrl = SEO_CONSTANTS.SITE_URL;
  const searchUrl = locale === 'vi' 
    ? `${baseUrl}/search?q={search_term_string}`
    : `${baseUrl}/en/search?q={search_term_string}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO_CONSTANTS.SITE_NAME,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article schema for project/product detail pages
 */
export function generateArticleSchema(config: {
  headline: string;
  description: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}): StructuredData {
  const images = Array.isArray(config.image) 
    ? config.image 
    : config.image 
      ? [config.image] 
      : [`${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`];

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.headline,
    description: config.description,
    image: images.map((img) => 
      img.startsWith('http') ? img : `${SEO_CONSTANTS.SITE_URL}${img}`
    ),
    publisher: {
      '@type': 'Organization',
      name: config.publisher?.name || SEO_CONSTANTS.SITE_NAME,
      logo: config.publisher?.logo 
        ? (config.publisher.logo.startsWith('http') 
            ? config.publisher.logo 
            : `${SEO_CONSTANTS.SITE_URL}${config.publisher.logo}`)
        : `${SEO_CONSTANTS.SITE_URL}/assets/logo.svg`,
    },
  };

  if (config.datePublished) {
    schema.datePublished = config.datePublished;
  }

  if (config.dateModified) {
    schema.dateModified = config.dateModified;
  }

  if (config.author) {
    schema.author = {
      '@type': 'Person',
      name: config.author,
    };
  }

  return schema;
}

/**
 * Generate ImageObject schema for gallery images
 */
export function generateImageObjectSchema(config: {
  url: string;
  caption?: string;
  name?: string;
  description?: string;
}): StructuredData {
  const imageUrl = config.url.startsWith('http') 
    ? config.url 
    : `${SEO_CONSTANTS.SITE_URL}${config.url}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: imageUrl,
    url: imageUrl,
    ...(config.caption && { caption: config.caption }),
    ...(config.name && { name: config.name }),
    ...(config.description && { description: config.description }),
  };
}

/**
 * Generate CollectionPage schema for listing pages
 */
export function generateCollectionPageSchema(config: {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  mainEntity?: {
    '@type': string;
    name: string;
    url: string;
  }[];
}): StructuredData {
  const pageUrl = config.url.startsWith('http') 
    ? config.url 
    : `${SEO_CONSTANTS.SITE_URL}${config.url}`;

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.name,
    description: config.description,
    url: pageUrl,
  };

  if (config.numberOfItems !== undefined) {
    schema.numberOfItems = config.numberOfItems;
  }

  if (config.mainEntity && config.mainEntity.length > 0) {
    schema.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: config.mainEntity.length,
      itemListElement: config.mainEntity.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': item['@type'],
          name: item.name,
          url: item.url.startsWith('http') 
            ? item.url 
            : `${SEO_CONSTANTS.SITE_URL}${item.url}`,
        },
      })),
    };
  }

  return schema;
}

/**
 * Generate CreativeWork schema for projects
 */
export function generateCreativeWorkSchema(config: {
  name: string;
  description: string;
  image?: string | string[];
  creator?: string;
  dateCreated?: string;
  dateModified?: string;
  keywords?: string[];
  genre?: string;
  inLanguage?: string;
}): StructuredData {
  const images = Array.isArray(config.image) 
    ? config.image 
    : config.image 
      ? [config.image] 
      : [`${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`];

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: config.name,
    description: config.description,
    image: images.map((img) => 
      img.startsWith('http') ? img : `${SEO_CONSTANTS.SITE_URL}${img}`
    ),
    inLanguage: config.inLanguage || 'vi',
  };

  if (config.creator) {
    schema.creator = {
      '@type': 'Person',
      name: config.creator,
    };
  }

  if (config.dateCreated) {
    schema.dateCreated = config.dateCreated;
  }

  if (config.dateModified) {
    schema.dateModified = config.dateModified;
  }

  if (config.keywords && config.keywords.length > 0) {
    schema.keywords = config.keywords.join(', ');
  }

  if (config.genre) {
    schema.genre = config.genre;
  }

  return schema;
}

/**
 * Generate Product schema (if applicable)
 */
export function generateProductSchema(config: {
  name: string;
  description: string;
  image?: string | string[];
  category?: string;
  brand?: string;
  sku?: string;
}): StructuredData {
  const images = Array.isArray(config.image) 
    ? config.image 
    : config.image 
      ? [config.image] 
      : [`${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.DEFAULT_OG_IMAGE}`];

  const schema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.description,
    image: images.map((img) => 
      img.startsWith('http') ? img : `${SEO_CONSTANTS.SITE_URL}${img}`
    ),
  };

  if (config.category) {
    schema.category = config.category;
  }

  if (config.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: config.brand,
    };
  }

  if (config.sku) {
    schema.sku = config.sku;
  }

  return schema;
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLdScript(data: StructuredData | StructuredData[]): string {
  const jsonData = Array.isArray(data) ? data : [data];
  return `<script type="application/ld+json">${JSON.stringify(jsonData, null, 2)}</script>`;
}
