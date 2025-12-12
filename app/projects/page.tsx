'use client';

import { useEffect, useState } from 'react';
import ProjectSection from '@/components/projects/ProjectSection';
import ScrollIndicator from '@/components/projects/ScrollIndicator';
import { LoadingSpinner } from '@/components/ui';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useResponsive } from '@/hooks/useResponsive';
import { groupArrayIntoChunks } from '@/lib/utils';

interface ProjectImage {
  src: string | null;
  alt: string;
  slug: string | null;
  title?: string;
  category?: string;
  isPlaceholder?: boolean;
}

export default function ProjectsPage() {
  const { galleryRef, spacerRef, scrollIndicatorRef } = useHorizontalScroll();
  const [sections, setSections] = useState<ProjectImage[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const headerHeight = useHeaderHeight();
  const { isMobile } = useResponsive();

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const projects = await response.json() as Array<{
          heroImage: string;
          title: string;
          slug: string;
          category: string;
        }>;
        
        const images: ProjectImage[] = projects.map((project) => ({
          src: project.heroImage,
          alt: project.title,
          slug: project.slug,
          title: project.title,
          category: project.category,
        }));
        
        const groupedSections = groupArrayIntoChunks(images, 4);
        
        if (groupedSections.length > 0) {
          const lastSection = groupedSections[groupedSections.length - 1];
          const remainingSlots = 4 - lastSection.length;
          
          if (remainingSlots > 0) {
            for (let i = 0; i < remainingSlots; i++) {
              lastSection.push({
                src: null,
                alt: 'Coming soon',
                slug: null,
                isPlaceholder: true,
              });
            }
          }
        }
        
        setSections(groupedSections);
      } catch (error) {
        console.error('Error loading projects:', error);
        setSections([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, []);



  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1512px] mx-auto px-4 pt-8 pb-8" style={{ paddingTop: `${headerHeight + 55}px` }}>
          <div className="flex flex-col items-center md:gap-[10px] gap-[5px]">
            {sections.map((sectionImages, sectionIndex) => (
              <ProjectSection
                key={sectionIndex}
                images={sectionImages}
                sectionIndex={sectionIndex}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div 
        className="fixed w-full overflow-hidden z-0"
        style={{ 
          top: `calc(55px + ${headerHeight}px)`,
          height: `calc(100vh - ${headerHeight}px)`,
          left: 0,
          right: 0
        }}
      >
        <div className="max-w-[1512px] mx-auto h-full px-4 sm:px-[42px] relative">
          <div className="relative h-full overflow-x-hidden">
            <div
              ref={galleryRef}
              className="absolute top-0 left-0 flex gap-[10px] transition-transform duration-100 ease-out will-change-transform"
            >
              {sections.map((sectionImages, sectionIndex) => (
                <ProjectSection
                  key={sectionIndex}
                  images={sectionImages}
                  sectionIndex={sectionIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={spacerRef}></div>

      <ScrollIndicator ref={scrollIndicatorRef} />
    </div>
  );
}
