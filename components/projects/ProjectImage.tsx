'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import OptimizedImage from '@/components/ui/OptimizedImage';

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23e0e0e0" width="800" height="600"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E';

interface ProjectImageProps {
  src?: string | null;
  alt?: string;
  gridPosition?: string;
  slug?: string | null;
  title?: string;
  category?: string;
  isPlaceholder?: boolean;
}

export default function ProjectImage({ src, alt, gridPosition, slug, title, category, isPlaceholder = false }: ProjectImageProps) {
  const [imageSrc, setImageSrc] = useState(src || placeholderImage);
  const [hasError, setHasError] = useState(false);
  const t = useTranslations('Common');
  const href = slug ? `/projects/${slug}` : '#';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(placeholderImage);
    }
  };

  if (isPlaceholder) {
    return (
      <div className={`project relative overflow-hidden bg-gray-100 flex items-center justify-center ${gridPosition}`}>
        <div className="text-center px-4">
          <p className="text-gray-400 text-sm font-normal uppercase tracking-wider">{t('comingSoon')}</p>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={`project relative overflow-hidden cursor-pointer hover:z-10 block group ${gridPosition}`}
    >
      <OptimizedImage
        src={imageSrc}
        alt={alt || 'Project image'}
        className="w-full h-full grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:scale-[1.02]"
        objectFit="cover"
        priority="lazy"
        progressive={true}
        fallback={placeholderImage}
        onError={handleError}
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center px-4">
        {title && (
          <h3 className="text-white text-[12px] font-normal uppercase tracking-wider text-center mb-2">
            {title}
          </h3>
        )}
        {category && (
          <p className="text-white/80 text-[12px] font-normal tracking-wider text-center">
            {category}
          </p>
        )}
      </div>
    </Link>
  );
}

