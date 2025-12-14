'use client';

import { useTranslations } from 'next-intl';

interface ProjectGalleryGridProps {
  images: string[];
  maxImages?: number;
}

export default function ProjectGalleryGrid({ images, maxImages = 8 }: ProjectGalleryGridProps) {
  const t = useTranslations('Projects');
  
  if (!images || images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxImages);

  return (
    <div className="mt-12 sm:mb-[88px] mb-[100px]">
      <h2 className="text-black text-[32px] font-bold leading-normal tracking-[4.48px] uppercase">
        {t('gallery')}
      </h2>
      <div className="grid grid-cols-4 sm:gap-6 gap-[6px]">
        {displayImages.map((image, index) => (
          <div
            key={index}
            className="relative max-w-[210px] aspect-square overflow-hidden"
          >
            <img
              src={image}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}



