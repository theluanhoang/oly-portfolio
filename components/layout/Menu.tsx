'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

interface MenuProps {
  className?: string;
}

function Menu({ className }: MenuProps) {
  const t = useTranslations('Navigation');

  return (
    <nav className={`${className}`}>
      <Link
        href="/projects"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        {t('projects')}
      </Link>
      <Link
        href="/products"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        {t('product')}
      </Link>
      <Link
        href="/about"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        {t('about')}
      </Link>
      <Link
        href="/contact"
        className="inline-flex h-full items-center text-[12px] font-normal text-black"
      >
        {t('contact')}
      </Link>
    </nav>
  );
}

export default Menu;
