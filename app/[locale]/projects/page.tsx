import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import ProjectsClient from './ProjectsClient';
import JsonLd from '@/components/seo/JsonLd';
import { generateCollectionPageSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import { getProjects } from '@/data/projects';
import { SEO_CONSTANTS } from '@/lib/seo/constants';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Projects' });
  
  const title = locale === 'vi' 
    ? 'Dự Án | OLY Studio'
    : 'Projects | OLY Studio';
  
  const description = locale === 'vi'
    ? 'Khám phá các dự án kiến trúc, xây dựng, nội thất và đồ gỗ độc đáo của OLY Studio. Từ thiết kế hiện đại đến các công trình truyền thống.'
    : 'Discover unique architecture, construction, interior design, and furniture projects by OLY Studio. From modern designs to traditional structures.';
  
  return generateLocalizedMetadata(
    {
      title,
      description,
      keywords: ['projects', 'architecture', 'construction', 'interior design', 'furniture', 'OLY Studio'],
      url: '/projects',
    },
    locale,
    '/projects'
  );
}

export default async function ProjectsPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const projects = await getProjects(locale);
  
  const pageUrl = `${SEO_CONSTANTS.SITE_URL}/${locale}/projects`;
  const pageName = locale === 'vi' ? 'Dự Án' : 'Projects';
  const pageDescription = locale === 'vi'
    ? 'Khám phá các dự án kiến trúc, xây dựng, nội thất và đồ gỗ độc đáo của OLY Studio.'
    : 'Discover unique architecture, construction, interior design, and furniture projects by OLY Studio.';

  // CollectionPage schema
  const collectionPageSchema = generateCollectionPageSchema({
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    numberOfItems: projects.length,
    mainEntity: projects.slice(0, 20).map((project) => ({
      '@type': 'CreativeWork',
      name: project.title,
      url: `${SEO_CONSTANTS.SITE_URL}/${locale}/projects/${project.slug}`,
    })),
  });

  // Breadcrumb schema
  const breadcrumbItems = [
    { name: locale === 'vi' ? 'Trang chủ' : 'Home', url: `${SEO_CONSTANTS.SITE_URL}/${locale}` },
    { name: pageName, url: pageUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <JsonLd data={[collectionPageSchema, breadcrumbSchema]} />
      <ProjectsClient />
    </>
  );
}
