"use client";

import { useTranslations } from 'next-intl';
import { ProductCard } from './ProductCard';

interface Product {
  id?: string;
  slug: string;
  category: string;
  thumbnail: string | null;
  year?: string | null;
}

interface MoreProductsProps {
  products: Product[];
  currentSlug: string;
}

export default function MoreProducts({
  products,
  currentSlug,
}: MoreProductsProps) {
  const t = useTranslations('Products');
  const filteredProducts = products
    .filter((product) => product.slug !== currentSlug)
    .slice(0, 6);

  if (filteredProducts.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-8 w-full mx-auto lg:mx-0">
      <h2 className="hidden lg:block text-black text-[32px] font-bold leading-normal tracking-[4.48px] uppercase mb-[30px]">
        {t('moreProducts')}
      </h2>
      <div className="grid w-full justify-items-stretch grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col lg:items-stretch gap-0">
        {filteredProducts.map((product) => {
          if (!product.thumbnail) return null;
          
          return (
            <ProductCard
              key={product.slug}
              product={{
                id: product.id || product.slug,
                slug: product.slug,
                category: product.category,
                year: product.year || '',
                thumbnail: product.thumbnail,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

