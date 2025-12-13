'use client';

import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

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
    <section className="relative bg-background py-20 px-8 md:px-12 lg:px-24">
      {/* Background texture effect */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-12">
          <LanguageSwitcher />
        </div>

        {/* Project Title */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal text-foreground tracking-[3px] uppercase text-center mb-16 md:mb-20">
          {title}
        </h1>

        {/* Project Specifications */}
        <div className="max-w-xl mx-auto">
          <ul className="space-y-5 text-foreground text-base md:text-lg">
            <li className="flex items-start">
              <span className="mr-4 text-foreground text-lg">•</span>
              <div className="flex-1">
                <span className="font-normal">{t('categoryLabel')}</span>
                <span className="mx-2">:</span>
                <span className="font-medium">{category}</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 text-foreground text-lg">•</span>
              <div className="flex-1">
                <span className="font-normal">{t('locationLabel')}</span>
                <span className="mx-2">:</span>
                <span className="font-medium">{location}</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 text-foreground text-lg">•</span>
              <div className="flex-1">
                <span className="font-normal">{t('areaLabel')}</span>
                <span className="mx-2">:</span>
                <span className="font-medium">{area}</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-4 text-foreground text-lg">•</span>
              <div className="flex-1">
                <span className="font-normal">{t('yearLabel')}</span>
                <span className="mx-2">:</span>
                <span className="font-medium">{year}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

