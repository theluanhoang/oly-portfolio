'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ComingSoonModal } from '@/components/ui';

interface MenuProps {
  className?: string;
}

function Menu({ className }: MenuProps) {
  const t = useTranslations('Navigation');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [productsCount, setProductsCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchProductsCount() {
      try {
        const res = await fetch('/api/products?pageSize=1');
        if (res.ok) {
          const data = await res.json();
          setProductsCount(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching products count:', error);
        setProductsCount(0);
      }
    }

    fetchProductsCount();
  }, []);

  const handleProductsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (productsCount !== null && productsCount > 0) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setShowComingSoon(true);
  };

  return (
    <>
      <nav className={`${className}`}>
        <Link
          href="/projects"
          className="inline-flex h-full items-center text-[12px] font-normal text-black"
        >
          {t('projects')}
        </Link>
        <Link
          href="/products"
          onClick={handleProductsClick}
          className="inline-flex h-full items-center text-[12px] font-normal text-black cursor-pointer"
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
      <ComingSoonModal isOpen={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </>
  );
}

export default Menu;
