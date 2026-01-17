import { NextResponse } from 'next/server';
import { getBaseUrl, LOCALES, DEFAULT_LOCALE } from '@/lib/seo/constants';
import { getProjects } from '@/data/projects';
import { getProducts } from '@/data/products';
import { generateHreflangUrls } from '@/lib/seo/sitemap-helpers';

/**
 * Generate sitemap.xml with hreflang support
 * This route handler generates XML manually to include hreflang tags
 */
export async function GET() {
  const baseUrl = getBaseUrl();
  const sitemapEntries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: string;
    priority: number;
    path: string;
  }> = [];

  // Static pages
  const staticPages = [
    { path: '', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/projects', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/products', changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Add static pages for all locales
  for (const locale of LOCALES) {
    for (const page of staticPages) {
      const url = locale === DEFAULT_LOCALE 
        ? `${baseUrl}${page.path || '/'}`
        : `${baseUrl}/${locale}${page.path || '/'}`;
      
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        path: page.path || '/',
      });
    }
  }

  // Add all projects for all locales
  try {
    const projectsByLocale: Record<string, Awaited<ReturnType<typeof getProjects>>> = {};
    for (const locale of LOCALES) {
      projectsByLocale[locale] = await getProjects(locale);
    }
    
    const allProjectSlugs = new Set<string>();
    Object.values(projectsByLocale).forEach((projects) => {
      projects.forEach((project) => {
        allProjectSlugs.add(project.slug);
      });
    });
    
    for (const slug of allProjectSlugs) {
      for (const locale of LOCALES) {
        const project = projectsByLocale[locale].find((p) => p.slug === slug);
        
        const url = locale === DEFAULT_LOCALE
          ? `${baseUrl}/projects/${slug}`
          : `${baseUrl}/${locale}/projects/${slug}`;
        
        sitemapEntries.push({
          url,
          lastModified: project?.updatedAt ? new Date(project.updatedAt) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
          path: `/projects/${slug}`,
        });
      }
    }
  } catch (error) {
    console.error('Error generating project sitemap entries:', error);
  }

  // Add all products for all locales
  try {
    const allProducts = await getProducts();
    
    for (const product of allProducts) {
      const productData = product as { slug?: string; updatedAt?: Date | string };
      if (!productData.slug) continue;
      
      for (const locale of LOCALES) {
        const url = locale === DEFAULT_LOCALE
          ? `${baseUrl}/products/${productData.slug}`
          : `${baseUrl}/${locale}/products/${productData.slug}`;
        
        sitemapEntries.push({
          url,
          lastModified: productData.updatedAt
            ? new Date(productData.updatedAt)
            : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
          path: `/products/${productData.slug}`,
        });
      }
    }
  } catch (error) {
    console.error('Error generating product sitemap entries:', error);
  }

  // Group entries by path to generate hreflang
  const entriesByPath = new Map<string, typeof sitemapEntries>();
  for (const entry of sitemapEntries) {
    if (!entriesByPath.has(entry.path)) {
      entriesByPath.set(entry.path, []);
    }
    entriesByPath.get(entry.path)!.push(entry);
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // Process each unique path
  for (const [path, entries] of entriesByPath.entries()) {
    // Get all locale variants for this path
    const hreflangUrls = generateHreflangUrls(path, baseUrl);
    
    // Generate one entry per locale variant
    for (const entry of entries) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;
      
      // Add lastmod
      if (entry.lastModified) {
        xml += `    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n`;
      }
      
      // Add changefreq
      if (entry.changeFrequency) {
        xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      }
      
      // Add priority
      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority}</priority>\n`;
      }
      
      // Add hreflang tags for all locale variants (including self-reference)
      for (const hreflang of hreflangUrls) {
        xml += `    <xhtml:link rel="alternate" hreflang="${hreflang.locale}" href="${escapeXml(hreflang.url)}" />\n`;
      }
      
      // Add x-default hreflang (pointing to default locale)
      const defaultUrl = hreflangUrls.find(h => h.locale === DEFAULT_LOCALE)?.url || hreflangUrls[0]?.url;
      if (defaultUrl) {
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(defaultUrl)}" />\n`;
      }
      
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
