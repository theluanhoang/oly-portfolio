import { notFound } from 'next/navigation';
import ProjectGallery from '@/components/projects/ProjectGallery';
import ProjectInfo from '@/components/projects/ProjectInfo';
import ProjectContent from '@/components/projects/ProjectContent';
import { getProjectBySlug, getAllProjectSlugs } from '@/data/projects';
import { routing } from '@/i18n/routing';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
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
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const galleryImages = project.gallery && project.gallery.length > 0 
    ? project.gallery 
    : project.heroImage 
      ? [project.heroImage] 
      : [];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Gallery Section */}
      <ProjectGallery images={galleryImages} />
      
      {/* Project Info Section */}
      <ProjectInfo project={project} />
      
      {/* Project Content Section */}
      <ProjectContent content={project.content} />
    </div>
  );
}

