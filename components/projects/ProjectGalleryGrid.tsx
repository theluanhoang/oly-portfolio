'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { generateProjectImageAlt } from '@/lib/seo/image-helpers';

interface ProjectGalleryGridProps {
  images: string[];
  maxImages?: number;
  projectTitle?: string;
}

export default function ProjectGalleryGrid({ images, maxImages = 8, projectTitle }: ProjectGalleryGridProps) {
  const t = useTranslations('Projects');
  const [pageIndex, setPageIndex] = useState(0);

  const safeImages = useMemo(() => images || [], [images]);
  const hasImages = safeImages.length > 0;
  const visibleCount = hasImages ? Math.min(maxImages, safeImages.length) : 0;
  const pages = useMemo(() => {
    if (!hasImages || visibleCount === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < safeImages.length; i += visibleCount) {
      chunks.push(safeImages.slice(i, i + visibleCount));
    }
    return chunks;
  }, [hasImages, safeImages, visibleCount]);

  const totalPages = pages.length;
  const isCarousel = totalPages > 1;
  const maxPageIndex = Math.max(totalPages - 1, 0);
  const clampedPageIndex = Math.min(pageIndex, maxPageIndex);

  const handlePrev = () => {
    setPageIndex((prev) => {
      const safePrev = Math.min(prev, maxPageIndex);
      return Math.max(safePrev - 1, 0);
    });
  };

  const handleNext = () => {
    setPageIndex((prev) => {
      const safePrev = Math.min(prev, maxPageIndex);
      return Math.min(safePrev + 1, maxPageIndex);
    });
  };

  if (!hasImages) {
    return null;
  }

  return (
    <>
      <h2 className="text-black text-[32px] font-bold leading-normal tracking-[4.48px] uppercase mb-[30px]">
        {t('gallery')}
      </h2>
      <div className="relative">
        {isCarousel && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              disabled={clampedPageIndex === 0}
              className="absolute left-2 md:left-[-18px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white border border-[#e0e0e0] shadow-sm text-[#333] flex items-center justify-center hover:shadow-md hover:border-[#cfcfcf] transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous gallery images"
              aria-disabled={clampedPageIndex === 0}
            >
              <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={clampedPageIndex >= totalPages - 1}
              className="absolute right-2 md:right-[-18px] top-1/2 -translate-y-1/2 z-20 h-10 w-10 md:h-11 md:w-11 rounded-full bg-white border border-[#e0e0e0] shadow-sm text-[#333] flex items-center justify-center hover:shadow-md hover:border-[#cfcfcf] transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next gallery images"
              aria-disabled={clampedPageIndex >= totalPages - 1}
            >
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </>
        )}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${clampedPageIndex * 100}%)` }}
          >
            {pages.map((pageImages, pageIdx) => (
              <div
                key={`page-${pageIdx}`}
                className="w-full shrink-0 grid grid-cols-4 sm:gap-6 gap-[6px]"
              >
                {pageImages.map((image, index) => {
                  const globalIndex = pageIdx * visibleCount + index;
                  const altText = projectTitle
                    ? generateProjectImageAlt(projectTitle, globalIndex, safeImages.length)
                    : `Gallery image ${globalIndex + 1}`;
                  
                  return (
                    <div
                      key={`${image}-${pageIdx}-${index}`}
                      className="relative max-w-[210px] aspect-square overflow-hidden"
                    >
                      <OptimizedImage
                        src={image}
                        alt={altText}
                        className="w-full h-full"
                        objectFit="cover"
                        priority="lazy"
                        progressive={true}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}



