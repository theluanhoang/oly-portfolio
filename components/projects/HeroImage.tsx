import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface HeroImageProps {
  src: string;
  alt: string;
}

export default function HeroImage({ src, alt }: HeroImageProps) {
  return (
    <div className="w-full overflow-hidden">
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-auto"
        objectFit="cover"
        priority="eager"
        progressive={true}
      />
    </div>
  );
}

