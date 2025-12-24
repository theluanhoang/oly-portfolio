'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import TabButton from './TabButton';

type TabType = 'design' | 'construction' | 'furniture';

export default function FieldOperationTabs() {
  const t = useTranslations('AboutPage');
  const [activeTab, setActiveTab] = useState<TabType>('design');

  const tabs: { key: TabType; labelKey: string; descriptionKey: string }[] = [
    { key: 'design', labelKey: 'design', descriptionKey: 'designDescription' },
    { key: 'construction', labelKey: 'construction', descriptionKey: 'constructionDescription' },
    { key: 'furniture', labelKey: 'furnitureProduction', descriptionKey: 'furnitureDescription' },
  ];

  return (
    <div className="grid max-[1122px]:grid-cols-1 max-[1122px]:w-fit min-[1123px]:grid-cols-[min(400px,100%)_1fr] min-[1392px]:grid-cols-[min(490px,100%)_1fr] min-[1392px]:gap-x-[152px] min-[1123px]:gap-x-[60px] min-[1122px]:mb-[306px] mb-[72px]">
      <h1 className="text-text-dark max-[324px]:text-4xl min-[325px]:text-[48px] min-[1122px]:text-4xl min-[1392px]:text-[48px] font-thin tracking-[2px] uppercase leading-normal min-[1122px]:mt-0 mt-[62px]">
        {t('fieldOperation')}
      </h1>
      <Link 
        href="/projects"
        className="w-[113px] mb-[83px] h-6 sm:hidden flex p-0! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[10px] font-normal leading-[20px] tracking-[1.4px] no-underline hover:bg-white cursor-pointer"
      >
        {t('viewProjects')}
      </Link>
      <div className="flex flex-col min-[1123px]:flex-1">
        <div className="flex flex-col min-[1123px]:flex-row min-[1123px]:justify-between gap-4 min-[1123px]:gap-8">
          {tabs.map((tab) => (
            <div key={tab.key} className="relative">
              <TabButton isActive={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                {t(tab.labelKey)}
              </TabButton>
              <article
                className={`w-full min-[1123px]:w-[255px] relative min-[1123px]:absolute left-0 min-[1123px]:mt-[49px] mt-0 transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'opacity-100'
                    : 'opacity-100 min-[1123px]:opacity-0 pointer-events-auto min-[1123px]:pointer-events-none'
                }`}
              >
                <p
                  className={`text-black text-justify text-[12px] font-semibold leading-[20px] ${
                    tab.key !== 'furniture' ? 'min-[1122px]:mb-0 mb-[62px]' : ''
                  }`}
                >
                  {t(tab.descriptionKey)}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

