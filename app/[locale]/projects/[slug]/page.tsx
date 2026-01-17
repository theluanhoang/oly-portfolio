import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import ProjectInfo from '@/components/projects/ProjectInfo';
import ProjectContent from '@/components/projects/ProjectContent';
import ProjectGalleryGrid from '@/components/projects/ProjectGalleryGrid';
import HeroImage from '@/components/projects/HeroImage';
import { DefaultLoading } from '@/lib/performance/dynamic-imports';

const MoreProjects = dynamicImport(
  () => import('@/components/projects/MoreProjects'),
  {
    loading: DefaultLoading,
    ssr: true,
  }
);
import { getProjectBySlug, getAllProjectSlugs, getProjects } from '@/data/projects';
import { routing } from '@/i18n/routing';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import JsonLd from '@/components/seo/JsonLd';
import { 
  generateArticleSchema, 
  generateCreativeWorkSchema, 
  generateBreadcrumbSchema,
  generateImageObjectSchema
} from '@/lib/seo/structured-data';
import { generateProjectImageAlt } from '@/lib/seo/image-helpers';
import { SEO_CONSTANTS } from '@/lib/seo/constants';
import HeroImagePreload from '@/components/performance/HeroImagePreload';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
  const { slug, locale } = await params;
  const project = await getProjectBySlug(slug, locale);

  if (!project) {
    return generateLocalizedMetadata(
      {
        title: 'Project Not Found',
        description: 'The requested project could not be found.',
      },
      locale,
      `/projects/${slug}`
    );
  }

  const title = `${project.title} | OLY Studio`;
  // Generate description from content or fallback - ensure it's never empty
  let description: string;
  if (project.content && project.content.trim().length > 0) {
    const cleanContent = project.content.replace(/<[^>]*>/g, '').trim();
    if (cleanContent.length > 0) {
      description = cleanContent.substring(0, 160);
    } else {
      // Fallback if content is empty after cleaning
      description = `Explore ${project.title} - ${project.category || 'Architecture Project'} by OLY Studio${project.location ? ` in ${project.location}` : ''}${project.year ? ` (${project.year})` : ''}.`;
    }
  } else {
    // Fallback description
    description = `Explore ${project.title} - ${project.category || 'Architecture Project'} by OLY Studio${project.location ? ` in ${project.location}` : ''}${project.year ? ` (${project.year})` : ''}.`;
  }
  
  // Ensure description is never empty
  if (!description || description.trim().length === 0) {
    description = `Explore ${project.title} by OLY Studio.`;
  }

  const alternateLocales = routing.locales
    .filter((loc) => loc !== locale)
    .map((loc) => ({
      locale: loc,
      url: `/projects/${slug}`,
    }));

  const metadata = generateLocalizedMetadata(
    {
      title,
      description,
      image: project.heroImage || undefined,
      type: 'article',
      url: `/projects/${slug}`,
      alternateLocales,
      keywords: [
        project.title,
        project.category || '',
        project.type || '',
        project.location || '',
        'architecture',
        'construction',
        'interior design',
        'OLY Studio',
      ].filter(Boolean),
      publishedTime: project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
      modifiedTime: project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined,
      section: project.category || undefined,
      tags: [project.category, project.type].filter(Boolean) as string[],
    },
    locale,
    `/projects/${slug}`
  );

  return metadata;
}

export async function generateStaticParams() {
  const allSlugs = await getAllProjectSlugs();
  const params: Array<{ slug: string; locale: string }> = [];
  
  for (const slug of allSlugs) {
    for (const locale of routing.locales) {
      params.push({ slug, locale });
    }
  }
  
  return params;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug, locale } = await params;
  const project = await getProjectBySlug(slug, locale);

  if (!project) {
    notFound();
  }

  const allProjects = await getProjects(locale);
  const hasMoreProjects = allProjects.length > 1;
  const galleryImages = project.gallery && project.gallery.length > 0 
    ? project.gallery 
    : project.heroImage 
      ? [project.heroImage] 
      : [];

  // Generate structured data
  const projectUrl = `${SEO_CONSTANTS.SITE_URL}/${locale}/projects/${slug}`;
  
  // Generate description for structured data (same logic as in generateMetadata)
  let cleanDescription: string;
  if (project.content && project.content.trim().length > 0) {
    const cleanContent = project.content.replace(/<[^>]*>/g, '').trim();
    if (cleanContent.length > 0) {
      cleanDescription = cleanContent.substring(0, 160);
    } else {
      cleanDescription = `Explore ${project.title} - ${project.category || 'Architecture Project'} by OLY Studio${project.location ? ` in ${project.location}` : ''}${project.year ? ` (${project.year})` : ''}.`;
    }
  } else {
    cleanDescription = `Explore ${project.title} - ${project.category || 'Architecture Project'} by OLY Studio${project.location ? ` in ${project.location}` : ''}${project.year ? ` (${project.year})` : ''}.`;
  }
  
  // Ensure description is never empty
  if (!cleanDescription || cleanDescription.trim().length === 0) {
    cleanDescription = `Explore ${project.title} by OLY Studio.`;
  }

  // Article schema
  const articleSchema = generateArticleSchema({
    headline: project.title,
    description: cleanDescription,
    image: galleryImages.length > 0 ? galleryImages : undefined,
    datePublished: project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
    dateModified: project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined,
    publisher: {
      name: SEO_CONSTANTS.SITE_NAME,
      logo: '/assets/logo.svg',
    },
  });

  // CreativeWork schema
  const creativeWorkSchema = generateCreativeWorkSchema({
    name: project.title,
    description: cleanDescription,
    image: galleryImages.length > 0 ? galleryImages : undefined,
    dateCreated: project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
    dateModified: project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined,
    keywords: [
      project.title,
      project.category || '',
      project.type || '',
      project.location || '',
      'architecture',
      'construction',
      'interior design',
    ].filter(Boolean),
    genre: project.category || undefined,
    inLanguage: locale,
  });

  // Breadcrumb schema
  const breadcrumbItems = [
    { name: locale === 'vi' ? 'Trang chủ' : 'Home', url: `${SEO_CONSTANTS.SITE_URL}/${locale}` },
    { name: locale === 'vi' ? 'Dự án' : 'Projects', url: `${SEO_CONSTANTS.SITE_URL}/${locale}/projects` },
    { name: project.title, url: projectUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  // ImageObject schemas for gallery images
  const imageSchemas = galleryImages.slice(0, 10).map((image, index) => 
    generateImageObjectSchema({
      url: image,
      caption: generateProjectImageAlt(project.title, index, galleryImages.length),
      name: `${project.title} - Image ${index + 1}`,
      description: `${project.title} - Gallery image ${index + 1} of ${galleryImages.length} by OLY Studio`,
    })
  );

  const allSchemas = [articleSchema, creativeWorkSchema, breadcrumbSchema, ...imageSchemas];

  return (
    <>
      <JsonLd data={allSchemas} />
      {/* Preload hero image for LCP optimization */}
      {project.heroImage && <HeroImagePreload imageUrl={project.heroImage} />}
      <main className="min-h-screen bg-background text-foreground lg:pt-[43px] pt-[7px]">
        {/* Hero Image - Cover */}
        {project.heroImage && (
          <section className="breakout-full-width bg-background" aria-label="Project hero image">
            <div className="relative w-full aspect-1399/695 overflow-hidden">
              <HeroImage
                src={project.heroImage}
                alt={generateProjectImageAlt(project.title, 0, galleryImages.length, 'hero')}
              />
            </div>
          </section>
        )}

        {/* Project Info Section - Centered if no more projects, left aligned if has more projects */}
        <div className={`lg:mt-[82px] mt-[25px] ${hasMoreProjects ? '' : 'max-w-4xl mx-auto'}`}>
          <ProjectInfo project={project} />
        </div>
        
        {/* Two Column Layout or Full Width */}
        <section className="relative bg-background md:mt-[45px] mt-[25px]">
          <div className="relative">
            {hasMoreProjects ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[112px]">
                {/* Main Content */}
                <article className="lg:col-span-2">
                  <ProjectContent content={project.content} />
                  
                  <div className="mt-12 lg:mb-[88px] mb-[100px]">
                    <ProjectGalleryGrid 
                      images={galleryImages} 
                      maxImages={8}
                      projectTitle={project.title}
                    />
                  </div>
                </article>

                {/* Sidebar - Related Projects */}
                <aside className="lg:col-span-1" aria-label="Related projects">
                  <MoreProjects 
                    projects={allProjects.map(p => ({
                      slug: p.slug,
                      title: p.title,
                      heroImage: p.heroImage,
                      category: p.category,
                      location: p.location,
                      year: p.year,
                    }))}
                    currentSlug={slug}
                  />
                </aside>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Main Content - Full Width */}
                <article>
                  <ProjectContent content={project.content} />
                  
                  <div className="mt-12 lg:mb-[88px] mb-[100px]">
                    <ProjectGalleryGrid 
                      images={galleryImages} 
                      maxImages={8}
                      projectTitle={project.title}
                    />
                  </div>
                </article>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

