import React from 'react';

interface HeroImageProps {
  src: string;
  alt: string;
}

export default function HeroImage({ src, alt }: HeroImageProps) {
  return (
    <div className="w-full overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover"
        loading="eager"
      />
    </div>
  );
}

