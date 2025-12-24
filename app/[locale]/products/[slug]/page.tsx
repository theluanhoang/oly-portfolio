import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProductInfo from '@/components/products/ProductInfo';
import ProductContent from '@/components/products/ProductContent';
import MoreProducts from '@/components/products/MoreProducts';
import { getProductBySlug, getAllProductSlugs, getProducts } from '@/data/products';
import { Link, routing } from '@/i18n/routing';

interface ProductDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const allSlugs = await getAllProductSlugs();
  const params: Array<{ slug: string; locale: string }> = [];
  
  for (const slug of allSlugs) {
    for (const locale of routing.locales) {
      params.push({ slug, locale });
    }
  }
  
  return params;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Products' });
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const productData = product as {
    slug: string;
    category: string;
    material: string;
    year: string;
    thumbnail: string;
    content: string;
    descriptions?: string[];
  };

  const productsList = allProducts as Array<{
    slug: string;
    category: string;
  }>;

  const currentIndex = productsList.findIndex((p) => p.slug === slug);
  const nextProduct = currentIndex < productsList.length - 1 ? productsList[currentIndex + 1] : null;
  const relatedProduct = nextProduct || (currentIndex > 0 ? productsList[currentIndex - 1] : null);

  const getDisplayName = (slug: string) => {
    if (!slug) return 'Product';
    return slug.replace(/-/g, ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:pt-[78px] pt-[48px]">
      {/* Breadcrumb */}
      <div className="mb-[27px] sm:mb-6 text-sm tracking-wide flex items-center">
        <Link href="/products" className="text-black text-[10px] sm:text-[12px] font-bold tracking-[1.68px]">
          {t('title')}
        </Link>
        <span className="mx-2">&gt;</span>
        <p className="text-black text-[10px] sm:text-[12px] font-bold tracking-[1.68px] underline decoration-solid">{getDisplayName(productData.slug)}</p>
      </div>
      
      <div>
        <div className="flex flex-col lg:flex-col">
          {productData.thumbnail && (
            <section className="bg-background lg:order-2 order-1 lg:mt-[60px] mt-0">
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-1399/695 overflow-hidden">
                <img
                  src={productData.thumbnail}
                  alt={productData.slug}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </section>
          )}
          
          <div className="lg:order-1 order-2 lg:mt-0 mt-8 sm:mt-12">
            <ProductInfo 
              product={productData}
              relatedProduct={relatedProduct}
            />
          </div>
        </div>
      </div>
      
      <section className="relative bg-background lg:mt-[169px] md:mt-12 mt-8 pb-[150px]">
        <div className="">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[112px]">
            <div className="lg:col-span-2">
              <ProductContent content={productData.content} />
            </div>

            <div className="lg:col-span-1">
              <MoreProducts 
                products={allProducts.map((p: unknown) => {
                  const prod = p as {
                    id: string;
                    slug: string;
                    category: string;
                    thumbnail: string;
                    year: string;
                  };
                  return {
                    id: prod.id,
                    slug: prod.slug,
                    category: prod.category,
                    thumbnail: prod.thumbnail,
                    year: prod.year,
                  };
                })}
                currentSlug={slug}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

