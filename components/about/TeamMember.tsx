'use client';

import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface TeamMemberProps {
  imageSrc: string;
  nameKey: string;
  roleKey: string;
}

export default function TeamMember({ imageSrc, nameKey, roleKey }: TeamMemberProps) {
  const t = useTranslations('AboutPage');
  const roleTranslationKey = `${roleKey}Role`;

  return (
    <div className="flex flex-col gap-[29px]">
      <div>
        <OptimizedImage
          src={imageSrc}
          alt={t(nameKey)}
          className="aspect-296/322 w-full"
          width={296}
          height={322}
          objectFit="cover"
          priority="lazy"
          progressive={true}
        />
      </div>
      <article>
        <p className="text-black text-[14px] font-bold tracking-[1.96px] uppercase leading-normal">
          {t(nameKey)}
        </p>
        <p className="text-black text-[12px] font-bold tracking-[1.68px] leading-normal">
          {t(roleTranslationKey)}
        </p>
      </article>
    </div>
  );
}

