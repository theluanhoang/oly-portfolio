import { notFound } from 'next/navigation';
import ProjectGallery from '@/components/projects/ProjectGallery';
import ProjectInfo from '@/components/projects/ProjectInfo';
import ProjectContent from '@/components/projects/ProjectContent';
import { getProjectBySlug, getAllProjectSlugs } from '@/data/projects';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const allSlugs = await getAllProjectSlugs();
  
  return allSlugs.map((slug) => ({
    slug,
  }));
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

