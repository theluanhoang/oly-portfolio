import { notFound } from 'next/navigation';
import ProjectInfo from '@/components/projects/ProjectInfo';
import ProjectContent from '@/components/projects/ProjectContent';
import ProjectGalleryGrid from '@/components/projects/ProjectGalleryGrid';
import MoreProjects from '@/components/projects/MoreProjects';
import { getProjectBySlug, getAllProjectSlugs, getProjects } from '@/data/projects';
import { routing } from '@/i18n/routing';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamic = 'force-dynamic';

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
  const galleryImages = project.gallery && project.gallery.length > 0 
    ? project.gallery 
    : project.heroImage 
      ? [project.heroImage] 
      : [];

  return (
    <div className="min-h-screen bg-background text-foreground lg:pt-[43px] pt-[7px]">
      {/* Hero Image - Cover */}
      {project.heroImage && (
        <section className="breakout-full-width bg-background">
          <div className="relative w-full aspect-1399/695 overflow-hidden">
            <img
              src={project.heroImage}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </section>
      )}

      {/* Project Info Section - Left aligned */}
      <div className="lg:mt-[82px] mt-[25px]">
        <ProjectInfo project={project} />
      </div>
      
      {/* Two Column Layout */}
      <section className="relative bg-background md:mt-[45px] mt-[25px]">
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[112px]">
            <div className="lg:col-span-2">
              <ProjectContent content={project.content} />
              
              <div className="mt-12 lg:mb-[88px] mb-[100px]">
                <ProjectGalleryGrid images={galleryImages} maxImages={8} />
              </div>
            </div>

            <div className="lg:col-span-1">
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

