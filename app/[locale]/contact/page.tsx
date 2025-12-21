'use client';

import { useTranslations } from 'next-intl';
import { ContactHero, ContactForm, ContactMapSection } from '@/components/contact';

export default function ContactPage() {
  const t = useTranslations('ContactPage');

  return (
    <div className="min-h-screen bg-white">
      <ContactHero />
      <div className="sm:mt-[62px] mt-[23px]">
        <div className="">
          <h1 className="text-3xl sm:text-4xl font-normal md:mb-[124px] mb-8 tracking-wide">
            {t('title')}
          </h1>

          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-[107px] mb-12">
            <div className="w-full lg:flex-1">
              <ContactForm />
            </div>

            <ContactMapSection />
          </div>
        </div>
      </div>
    </div>
  );
}

