'use client';

import { useTranslations } from 'next-intl';
import TeamMember from './TeamMember';

export default function OlyCreator() {
  const t = useTranslations('AboutPage');

  return (
    <div className="grid max-[1122px]:grid-cols-1 min-[1123px]:grid-cols-[min(400px,100%)_1fr] min-[1392px]:grid-cols-[min(490px,100%)_1fr] min-[1392px]:gap-x-[152px] min-[1123px]:gap-x-[60px] mb-[254px]">
      <h1 className="text-text-dark max-[324px]:text-4xl min-[325px]:text-[48px] min-[1122px]:text-4xl min-[1392px]:text-[48px] font-thin tracking-[2px] uppercase leading-normal">
        {t('olyCreator')}
      </h1>
      <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-0 flex-1 min-[1122px]:mt-0 mt-[39px]">
        <TeamMember
          imageSrc={t('shaneImage') || "/assets/creator-1.jpg"}
          nameKey="shane"
          roleKey="founder"
        />
        <TeamMember
          imageSrc={t('eduardoImage') || "/assets/creator-2.jpg"}
          nameKey="eduardo"
          roleKey="designer"
        />
      </div>
    </div>
  );
}

