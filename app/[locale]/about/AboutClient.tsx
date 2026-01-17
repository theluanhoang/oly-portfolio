'use client';

import { useTranslations } from 'next-intl';
import {
  AboutHero,
  AboutSection,
  FieldOperationTabs,
  OlyCreator,
} from '@/components/about';

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-white">
      <AboutHero />
      <div className="sm:mt-[44px] mt-[5px]">
        <div className="flex flex-col gap-0 min-[1123px]:gap-16">
          <AboutSection />
          <FieldOperationTabs />
          <OlyCreator />
        </div>
      </div>
    </div>
  );
}
