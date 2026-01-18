'use client';

import { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

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

  const handleImageClick = (globalIndex: number) => {
    setSelectedImageIndex(globalIndex);
  };

  const handleCloseLightbox = () => {
    setSelectedImageIndex(null);
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : safeImages.length - 1;
      });
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => {
        if (prev === null) return null;
        return prev < safeImages.length - 1 ? prev + 1 : 0;
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => {
          if (prev === null) return null;
          return prev > 0 ? prev - 1 : safeImages.length - 1;
        });
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => {
          if (prev === null) return null;
          return prev < safeImages.length - 1 ? prev + 1 : 0;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImageIndex, safeImages.length]);

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
            {pages.map((pageImages, pageIdx) => {
              // Calculate number of rows needed for this page
              const rowsNeeded = Math.ceil(pageImages.length / 4);
              
              return (
              <div
                key={`page-${pageIdx}`}
                className="w-full shrink-0 grid grid-cols-4 sm:gap-6 gap-[6px] auto-rows-auto"
                style={{ gridTemplateRows: `repeat(${rowsNeeded}, auto)` }}
              >
                {pageImages.map((image, index) => {
                  const globalIndex = pageIdx * visibleCount + index;
                  const altText = projectTitle
                    ? generateProjectImageAlt(projectTitle, globalIndex, safeImages.length)
                    : `Gallery image ${globalIndex + 1}`;
                  
                  return (
                    <button
                      key={`${image}-${pageIdx}-${index}`}
                      onClick={() => handleImageClick(globalIndex)}
                      className="relative max-w-[210px] aspect-square overflow-hidden w-full cursor-pointer hover:opacity-90 transition-opacity"
                      aria-label={`View ${altText}`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={altText}
                        className="w-full h-full"
                        objectFit="cover"
                        priority="lazy"
                        progressive={true}
                      />
                    </button>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close Button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X size={24} />
          </button>

          {/* Navigation Buttons */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous image"
              >
                <ArrowLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next image"
              >
                <ArrowRight size={24} />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <OptimizedImage
              src={safeImages[selectedImageIndex]}
              alt={projectTitle
                ? generateProjectImageAlt(projectTitle, selectedImageIndex, safeImages.length)
                : `Gallery image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full"
              objectFit="contain"
              priority="eager"
              progressive={true}
            />
          </div>

          {/* Image Counter */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
              {selectedImageIndex + 1} / {safeImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}



