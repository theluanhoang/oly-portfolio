'use client';

import { Link } from '@/i18n/routing';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { generateProductImageAlt } from '@/lib/seo/image-helpers';

interface ProductCardProps {
  id: string;
  slug: string;
  category: string;
  year: string;
  thumbnail: string;
}

function getDisplayName(slug: string) {
  if (!slug) return 'Product';
  return slug.replace(/-/g, ' ').toUpperCase();
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  return (
    <Link href={`/products/${product.slug}`} className="block w-full h-full">
      <article className="h-full max-w-[232px] border-0 lg:border-[0.5px] lg:border-product-border bg-white py-[13px] px-[12px] lg:px-[26px] lg:py-6 transition-transform duration-300 hover:scale-[1.02] cursor-pointer flex flex-col">
        <div className="aspect-square overflow-hidden">
          <OptimizedImage
            src={product.thumbnail}
            alt={generateProductImageAlt(getDisplayName(product.slug), 0, 1, 'thumbnail')}
            className="w-full h-full"
            objectFit="cover"
            priority="lazy"
            progressive={true}
          />
        </div>
        <div className="mt-3 grow">
          <h2 className="text-black text-[12px] font-bold tracking-[1.68px] uppercase">
            {getDisplayName(product.slug)}
          </h2>
          <p className="text-black text-[12px] font-bold tracking-[1.68px] mt-[8px]">
            {product.category} · {product.year}
          </p>
        </div>
      </article>
    </Link>
  );
}


