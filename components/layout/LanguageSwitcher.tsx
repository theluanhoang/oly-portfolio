'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Language');

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'vi' : 'en';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className='text-[12px] font-extrabold leading-normal text-black transition-colors hover:text-[#666] min-[468px]:block hidden'
    >
      {locale === 'en' ? t('vietnamese') : t('english')}
    </button>
  );
}

