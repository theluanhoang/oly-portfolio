'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui';
import { ProductCard } from '@/components/products/ProductCard';
import { useTranslations } from 'next-intl';

interface Product {
  id: string;
  slug: string;
  category: string;
  material: string;
  year: string;
  thumbnail: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Products');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = (await res.json()) as { items?: Product[] };
        setProducts(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return <LoadingSpinner text={t('loading')} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black">
        <p className="text-sm">
          {t('loadError')}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-[1512px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <h1 className="text-[28px] sm:text-[34px] lg:text-[40px] font-semibold leading-none tracking-[0.22em] uppercase mb-10">
          {t('title')}
        </h1>

        <div className="grid gap-0 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                slug: product.slug,
                category: product.category,
                year: product.year,
                thumbnail: product.thumbnail,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
