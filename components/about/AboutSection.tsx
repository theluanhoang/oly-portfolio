'use client';

import { Button } from '@/components/ui';
import { useTranslations } from 'next-intl';

const PROFILE_PDF_URL = 'https://cdn.prod.website-files.com/62e93d1913e5a06515d73fbf/64fd2a89bdf844b51d9ef50e_Oly%20Profile%203_opt.pdf';

export default function AboutSection() {
  const t = useTranslations('AboutPage');

  const handleSeeMoreClick = () => {
    window.open(PROFILE_PDF_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid max-[1122px]:grid-cols-1 min-[1123px]:grid-cols-[min(400px,100%)_1fr] min-[1392px]:grid-cols-[min(490px,100%)_1fr] min-[1392px]:gap-x-[152px] min-[1123px]:gap-x-[60px]">
      <div className="md:hidden flex gap-7 justify-end mb-[62px]">
        <Button 
          className="w-[113px] sm:mt-0 mt-[23px] h-6 flex p-0! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[10px] font-normal leading-[20px] tracking-[1.4px] hover:bg-white cursor-pointer">
          {t('profile')}
        </Button>
        <Button 
          onClick={handleSeeMoreClick}
          className="w-[113px] h-6 sm:flex hidden p-0! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[10px] font-normal leading-[20px] tracking-[1.4px] hover:bg-white cursor-pointer">
          {t('seeMore')}
        </Button>
      </div>
      <h1 className="text-text-dark max-[324px]:text-4xl min-[325px]:text-[48px] min-[1122px]:text-4xl min-[1392px]:text-[48px] font-thin tracking-[2px] uppercase leading-normal">
        {t('aboutOly')}
      </h1>
      <div className="flex flex-col md:flex-row md:justify-between md:flex-1 gap-6 md:gap-0">
        <div>
          <p className="md:max-w-[443px] max-w-full text-text-dark text-justify text-[12px] font-normal leading-[20px]">
            {t('aboutDescriptionFull')}
          </p>
          <div className="flex w-full flex-col justify-center items-end md:items-start">
            <div
              className="sm:mt-[11px] mt-[18px] w-[147px] aspect-147/73 bg-[url('/assets/signature.png')] bg-black bg-center bg-cover bg-no-repeat mix-blend-exclusion"
            />
            <p className="text-black text-justify text-[16px] font-normal leading-[46px] sm:mt-7 mt-[19px]">
              {t('founderName')}
            </p>
          </div>
        </div>
        <div className="md:flex hidden flex-col gap-7">
          <Button 
            className="w-[113px] h-6 flex p-0! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[10px] font-normal leading-[20px] tracking-[1.4px] hover:bg-white cursor-pointer">
            {t('profile')}
          </Button>
          <Button 
            onClick={handleSeeMoreClick}
            className="w-[113px] h-6 flex p-0! justify-center items-center gap-[10px] capitalize! bg-white text-black! border-black border-[0.5px] text-center text-[10px] font-normal leading-[20px] tracking-[1.4px] hover:bg-white cursor-pointer">
            {t('seeMore')}
          </Button>
        </div>
      </div>
    </div>
  );
}

