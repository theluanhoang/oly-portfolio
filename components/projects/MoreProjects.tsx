"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface RelatedProjectItem {
  slug: string;
  title: string;
  heroImage: string | null;
  category?: string | null;
  location?: string | null;
  year?: string | null;
}

interface MoreProjectsProps {
  projects: RelatedProjectItem[];
  currentSlug: string;
}

export default function MoreProjects({
  projects,
  currentSlug,
}: MoreProjectsProps) {
  const t = useTranslations('Projects');
  const filteredProjects = projects
    .filter((project) => project.slug !== currentSlug)
    .slice(0, 6);

  if (filteredProjects.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-8">
      <h2 className="text-black text-[32px] font-bold leading-normal tracking-[4.48px] uppercase mb-[30px]">
        {t('moreProject')}
      </h2>
      <div className="flex flex-col gap-[41px]">
        {filteredProjects.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group block"
          >
            <div className="flex gap-[27px]">
              {/* Image - Left side */}
              <div className="relative max-w-[141px] shrink-0 aspect-141/153 overflow-hidden w-full h-full">
                {project.heroImage ? (
                  <OptimizedImage
                    src={project.heroImage}
                    alt={project.title}
                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                    objectFit="cover"
                    priority="lazy"
                    progressive={true}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>

              {/* Info - Right side */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-black font-bold text-[14px] leading-normal uppercase tracking-[1.96px] mb-[7x]">
                    {project.title}
                  </h3>
                  {project.category && (
                    <p className="text-black font-bold text-[12px] leading-normal tracking-[1.68px]">
                      {project.category}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-black font-normal text-[10px] leading-[20px] tracking-[1.4px]">
                    Client// Anonymous
                  </p>
                  {project.location && (
                    <p className="text-black font-normal text-[10px] leading-[20px] tracking-[1.4px]">
                      Location// {project.location}
                    </p>
                  )}
                  {project.year && (
                    <p className="text-black font-normal text-[10px] leading-[20px] tracking-[1.4px]">
                      {project.year}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
