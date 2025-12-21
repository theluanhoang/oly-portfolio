'use client';

import { useTranslations } from 'next-intl';

export default function ContactInfo() {
  const t = useTranslations('ContactPage');

  return (
    <div className="flex flex-row gap-6 sm:gap-[77px]">
      <p
        className="text-black text-[18px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none"
        style={{ textUnderlinePosition: "from-font" }}
      >
        {t('contactInfo.email')}
      </p>
      <p
        className="text-black text-[18px] font-bold leading-normal tracking-[2.52px] underline decoration-skip-ink-none"
        style={{ textUnderlinePosition: "from-font" }}
      >
        {t('contactInfo.hotline')}
      </p>
    </div>
  );
}

