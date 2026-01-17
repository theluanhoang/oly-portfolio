import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo/constants';

/**
 * Generate robots.txt
 * Next.js will serve this at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/generated/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
