'use client';

import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function AboutHero() {
  const t = useTranslations('AboutPage');

  return (
    <div className="w-full overflow-hidden aspect-1416/528 sm:mt-[37px] mt-7">
      <OptimizedImage
        src="/assets/hero-about.png"
        alt={t('heroAlt')}
        className="w-full h-full"
        objectFit="cover"
        priority="eager"
        progressive={true}
      />
    </div>
  );
}

