'use client';

import { useTranslations } from 'next-intl';

interface Project {
  title: string;
  category: string;
  location: string;
  area: string;
  year: string;
}

interface ProjectInfoProps {
  project: Project;
}

export default function ProjectInfo({ project }: ProjectInfoProps) {
  const { title, category, location, area, year } = project;
  const t = useTranslations('ProjectInfo');

  return (
    <section className="relative bg-background">
      {/* Background texture effect */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="relative flex flex-col sm:gap-[72px] gap-[24px]">
        {/* Project Title */}
        <h1 className="text-text-dark font-medium sm:text-[56px] text-[36px] leading-normal uppercase sm:tracking-[7.84px] tracking-[5.04px] font-['Montserrat']">
          {title}
        </h1>

        {/* Project Specifications */}
        <div className="max-w-[330px] grid grid-cols-2 sm:gap-x-[34px] gap-x-[43px] text-foreground font-montserrat text-xs tracking-[1.68px] leading-5">
          <div className="space-y-[5px]">
            <div className="flex items-centerfont-normal">
              <span className="mr-4">•</span>
              <p>{t('categoryLabel')}</p>
            </div>
            <div className="flex items-centerfont-normal">
              <span className="mr-4">•</span>
              <p>{t('locationLabel')}</p>
            </div>
            <div className="flex items-centerfont-normal">
              <span className="mr-4">•</span>
              <p>{t('areaLabel')}</p>
            </div>
            <div className="flex items-centerfont-normal">
              <span className="mr-4">•</span>
              <p>{t('yearLabel')}</p>
            </div>
          </div>
          <div className="space-y-[5px]">
            <p className="font-normal">{category}</p>
            <p className="font-normal">{location}</p>
            <p className="font-normal">{area} m²</p>
            <p className="font-normal">{year}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

