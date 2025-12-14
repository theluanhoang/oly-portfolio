'use client';

import { useTranslations } from 'next-intl';

export default function AboutHero() {
  const t = useTranslations('AboutPage');

  return (
    <div className="w-full overflow-hidden aspect-1416/528 sm:mt-[37px] mt-7">
      <img
        src="/assets/hero-about.png"
        alt={t('heroAlt')}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}

