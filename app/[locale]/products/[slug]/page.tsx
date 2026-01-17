import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ProductInfo from '@/components/products/ProductInfo';
import ProductContent from '@/components/products/ProductContent';
import MoreProducts from '@/components/products/MoreProducts';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getProductBySlug, getAllProductSlugs, getProducts } from '@/data/products';
import { Link, routing } from '@/i18n/routing';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import JsonLd from '@/components/seo/JsonLd';
import { 
  generateProductSchema, 
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateImageObjectSchema
} from '@/lib/seo/structured-data';
import { generateProductImageAlt } from '@/lib/seo/image-helpers';
import { SEO_CONSTANTS } from '@/lib/seo/constants';
import HeroImagePreload from '@/components/performance/HeroImagePreload';

interface ProductDetailPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    return generateLocalizedMetadata(
      {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      },
      locale,
      `/products/${slug}`
    );
  }

  const productData = product as {
    slug: string;
    title?: string;
    category: string;
    material: string;
    year: string;
    thumbnail: string;
    content: string;
    descriptions?: string[];
  };

  const displayName = productData.title || productData.slug.replace(/-/g, ' ').toUpperCase();
  const title = `${displayName} | OLY Studio`;
  const description = productData.content
    ? productData.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : `${displayName} - ${productData.category || 'Product'}${productData.material ? ` made from ${productData.material}` : ''}${productData.year ? ` (${productData.year})` : ''} by OLY Studio.`;

  const alternateLocales = routing.locales
    .filter((loc) => loc !== locale)
    .map((loc) => ({
      locale: loc,
      url: `/products/${slug}`,
    }));

  return generateLocalizedMetadata(
    {
      title,
      description,
      image: productData.thumbnail || undefined,
      type: 'product',
      url: `/products/${slug}`,
      alternateLocales,
      keywords: [
        displayName,
        productData.category || '',
        productData.material || '',
        'furniture',
        'interior',
        'design',
        'OLY Studio',
      ].filter(Boolean),
    },
    locale,
    `/products/${slug}`
  );
}

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
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts(locale);
  const hasMoreProducts = allProducts.length > 1;
  const productData = product as {
    slug: string;
    title?: string;
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

  const getDisplayName = (product: { slug: string; title?: string }) => {
    if (product.title) return product.title;
    if (!product.slug) return 'Product';
    return product.slug.replace(/-/g, ' ').toUpperCase();
  };

  // Generate structured data
  const productUrl = `${SEO_CONSTANTS.SITE_URL}/${locale}/products/${slug}`;
  const displayName = getDisplayName(productData);
  const productDescription = productData.content
    ? productData.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : `${displayName} - ${productData.category || 'Product'}${productData.material ? ` made from ${productData.material}` : ''}${productData.year ? ` (${productData.year})` : ''} by OLY Studio.`;
  const cleanDescription = productData.content 
    ? productData.content.replace(/<[^>]*>/g, '').trim().substring(0, 160)
    : productDescription;

  // Product schema
  const productSchema = generateProductSchema({
    name: displayName,
    description: cleanDescription,
    image: productData.thumbnail ? [productData.thumbnail] : undefined,
    category: productData.category || undefined,
    brand: SEO_CONSTANTS.SITE_NAME,
    sku: productData.slug,
  });

  // Article schema (for product detail pages)
  const articleSchema = generateArticleSchema({
    headline: displayName,
    description: cleanDescription,
    image: productData.thumbnail ? [productData.thumbnail] : undefined,
    publisher: {
      name: SEO_CONSTANTS.SITE_NAME,
      logo: '/assets/logo.svg',
    },
  });

  // Breadcrumb schema
  const breadcrumbItems = [
    { name: locale === 'vi' ? 'Trang chủ' : 'Home', url: `${SEO_CONSTANTS.SITE_URL}/${locale}` },
    { name: locale === 'vi' ? 'Sản phẩm' : 'Products', url: `${SEO_CONSTANTS.SITE_URL}/${locale}/products` },
    { name: displayName, url: productUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  // ImageObject schema for product thumbnail
  const imageSchemas = productData.thumbnail
    ? [
        generateImageObjectSchema({
          url: productData.thumbnail,
          caption: generateProductImageAlt(displayName, 0, 1, 'thumbnail'),
          name: `${displayName} - Product Image`,
          description: `${displayName} - ${productData.category || 'Product'}${productData.material ? ` made from ${productData.material}` : ''} by OLY Studio`,
        }),
      ]
    : [];

  const allSchemas = [productSchema, articleSchema, breadcrumbSchema, ...imageSchemas];

  return (
    <>
      <JsonLd data={allSchemas} />
      {/* Preload product thumbnail for LCP optimization */}
      {productData.thumbnail && <HeroImagePreload imageUrl={productData.thumbnail} />}
      <main className="min-h-screen bg-background text-foreground lg:pt-[78px] pt-[48px]">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-[27px] sm:mb-6 text-sm tracking-wide flex items-center">
          <Link href="/products" className="text-black text-[10px] sm:text-[12px] font-bold tracking-[1.68px]">
            {t('title')}
          </Link>
          <span className="mx-2" aria-hidden="true">&gt;</span>
          <span className="text-black text-[10px] sm:text-[12px] font-bold tracking-[1.68px] underline decoration-solid">{displayName}</span>
        </nav>
        
        <div>
          <div className="flex flex-col lg:flex-col">
            {productData.thumbnail && (
              <section className="bg-background lg:order-2 order-1 lg:mt-[60px] mt-0" aria-label="Product image">
                <div className="relative w-full aspect-1416/528 overflow-hidden">
                  <OptimizedImage
                    src={productData.thumbnail}
                    alt={generateProductImageAlt(productData.title || displayName, 0, 1, 'thumbnail')}
                    className="w-full h-full"
                    objectFit="cover"
                    priority="eager"
                    width={1416}
                    height={528}
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
            {hasMoreProducts ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-[112px]">
                {/* Main Content */}
                <article className="lg:col-span-2">
                  <ProductContent content={productData.content} />
                </article>

                {/* Sidebar - Related Products */}
                <aside className="lg:col-span-1" aria-label="Related products">
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
                </aside>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Main Content - Full Width */}
                <article>
                  <ProductContent content={productData.content} />
                </article>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

