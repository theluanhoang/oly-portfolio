'use client';

import { useEffect, useState } from 'react';
import ProjectSection from '@/components/projects/ProjectSection';
import ScrollIndicator from '@/components/projects/ScrollIndicator';
import { LoadingSpinner } from '@/components/ui';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { useHeaderHeight } from '@/hooks/useHeaderHeight';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Common');

  useEffect(() => {
    async function loadProjects() {
      try {
        // Fetch projects sorted by displayOrder (ascending) to maintain the order set in admin
        const response = await fetch('/api/projects?sortField=displayOrder&sortDirection=asc');
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json() as {
          items: Array<{
            heroImage: string;
            title: string;
            slug: string;
            category: string;
            displayOrder: number;
          }>;
          total: number;
          page: number;
          pageSize: number;
        };
        
        const projects = data.items || [];
        
        // Group projects theo displayOrder (giống logic trong ProjectsOrderView)
        // displayOrder = sectionIndex * 4 + positionInSection
        const PROJECTS_PER_SECTION = 4;
        const groupedSections: ProjectImage[][] = [];
        
        if (projects.length === 0) {
          setSections([]);
          return;
        }
        
        // Tìm section index lớn nhất
        const maxDisplayOrder = Math.max(...projects.map(p => p.displayOrder || 0), 0);
        const maxSectionIndex = Math.floor(maxDisplayOrder / PROJECTS_PER_SECTION);
        
        // Tạo sections từ 0 đến maxSectionIndex
        for (let sectionIdx = 0; sectionIdx <= maxSectionIndex; sectionIdx++) {
          const section: ProjectImage[] = Array(PROJECTS_PER_SECTION).fill(null).map(() => ({
            src: null,
            alt: t('comingSoon'),
            slug: null,
            isPlaceholder: true,
          }));
          
          const sectionStartDisplayOrder = sectionIdx * PROJECTS_PER_SECTION;
          const sectionEndDisplayOrder = sectionStartDisplayOrder + PROJECTS_PER_SECTION;
          
          // Lấy tất cả projects trong section này dựa trên displayOrder
          projects
            .filter(p => {
              const displayOrder = p.displayOrder || 0;
              return displayOrder >= sectionStartDisplayOrder && displayOrder < sectionEndDisplayOrder;
            })
            .forEach(project => {
              const positionInSection = (project.displayOrder || 0) % PROJECTS_PER_SECTION;
              if (positionInSection >= 0 && positionInSection < PROJECTS_PER_SECTION) {
                section[positionInSection] = {
                  src: project.heroImage,
                  alt: project.title,
                  slug: project.slug,
                  title: project.title,
                  category: project.category,
                  isPlaceholder: false,
                };
              }
            });
          
          groupedSections.push(section);
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
  }, [t]);



  if (loading) {
    return <LoadingSpinner text={t('loading')} />;
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
              style={{
                width: 'max-content',
                minWidth: '100%',
                justifyContent: 'flex-start'
              }}
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

