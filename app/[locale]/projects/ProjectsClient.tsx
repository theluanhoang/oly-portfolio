'use client';

import { useEffect, useState } from 'react';
import ProjectSection from '@/components/projects/ProjectSection';
import ScrollIndicator from '@/components/projects/ScrollIndicator';
import { ProjectSectionSkeleton } from '@/components/ui';
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
  location?: string;
  isPlaceholder?: boolean;
}

export default function ProjectsClient() {
  const { galleryRef, spacerRef, scrollIndicatorRef } = useHorizontalScroll();
  const [sections, setSections] = useState<ProjectImage[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const headerHeight = useHeaderHeight();
  const { isMobile } = useResponsive();
  const t = useTranslations('Common');
  const tProjects = useTranslations('Projects');

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight || 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const topGap = viewportHeight > 0 && viewportHeight < 700 ? 15 : 55;

  useEffect(() => {
    async function loadProjects() {
      try {
        const currentLocale = window.location.pathname.split('/')[1] || 'vi';
        // Fetch projects sorted by displayOrder (ascending) to maintain the order set in admin
        const response = await fetch(`/api/projects?sortField=displayOrder&sortDirection=asc&locale=${currentLocale}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json() as {
          items: Array<{
            heroImage: string;
            title: string;
            slug: string;
            category: string;
            location: string;
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
                  location: project.location,
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
    const skeletonSections = Array.from({ length: 3 }); // Show 3 skeleton sections
    
    if (isMobile) {
      return (
        <main className="min-h-screen bg-background text-foreground">
          <div className="max-w-[1512px] mx-auto px-4 pt-8 pb-8" style={{ paddingTop: `${headerHeight + 55}px` }}>
            <section className="flex flex-col items-center md:gap-[10px] gap-[5px]">
              {skeletonSections.map((_, index) => (
                <ProjectSectionSkeleton key={index} sectionIndex={index} />
              ))}
            </section>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <div 
          className="fixed w-full overflow-hidden z-0"
          style={{ 
            top: `calc(${topGap}px + ${headerHeight}px)`,
            height: `calc(100vh - ${headerHeight}px - ${topGap}px - var(--footer-height, 190px))`,
            left: 0,
            right: 0
          }}
        >
          <div className="max-w-[1512px] mx-auto h-full px-4 sm:px-[42px] relative">
            <div className="relative h-full overflow-hidden">
              <section
                className="absolute top-0 left-0 h-full flex gap-[10px]"
                style={{
                  width: 'max-content',
                  minWidth: '100%',
                  justifyContent: 'flex-start'
                }}
              >
                {skeletonSections.map((_, index) => (
                  <ProjectSectionSkeleton key={index} sectionIndex={index} />
                ))}
              </section>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (sections.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div 
          className="max-w-[1512px] mx-auto px-4 flex items-center justify-center"
          style={{ 
            paddingTop: `${headerHeight + 55}px`,
            minHeight: `calc(100vh - ${headerHeight}px)`
          }}
        >
          <section className="text-center py-16 px-4">
            <div className="mb-6">
              <svg 
                className="mx-auto h-24 w-24 text-foreground/30" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              {tProjects('emptyState.title')}
            </h2>
            <p className="text-base md:text-lg text-foreground/70 max-w-md mx-auto">
              {tProjects('emptyState.message')}
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (isMobile) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1512px] mx-auto px-4 pt-8 pb-8" style={{ paddingTop: `${headerHeight + 55}px` }}>
          <section className="flex flex-col items-center md:gap-[10px] gap-[5px]">
            {sections.map((sectionImages, sectionIndex) => (
              <ProjectSection
                key={sectionIndex}
                images={sectionImages}
                sectionIndex={sectionIndex}
              />
            ))}
          </section>
        </div>
      </main>
    );
  }

    return (
      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <div 
          className="fixed w-full overflow-hidden z-0"
          style={{ 
            top: `calc(${topGap}px + ${headerHeight}px)`,
            height: `calc(100vh - ${headerHeight}px - ${topGap}px - var(--footer-height, 190px))`,
            left: 0,
            right: 0
          }}
        >
          <div className="max-w-[1512px] mx-auto h-full px-4 sm:px-[42px] relative">
            <div className="relative h-full overflow-hidden">
              <section
                ref={galleryRef}
                className="absolute top-0 left-0 h-full flex gap-[10px] transition-transform duration-100 ease-out will-change-transform"
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
              </section>
            </div>
          </div>
        </div>

      <div ref={spacerRef}></div>

      <ScrollIndicator ref={scrollIndicatorRef} />
    </main>
  );
}
