import type { Metadata } from 'next';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import ProductsClient from './ProductsClient';
import JsonLd from '@/components/seo/JsonLd';
import { generateCollectionPageSchema, generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import { getProducts } from '@/data/products';
import { SEO_CONSTANTS } from '@/lib/seo/constants';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === 'vi' 
    ? 'Sản Phẩm | OLY Studio'
    : 'Products | OLY Studio';
  
  const description = locale === 'vi'
    ? 'Khám phá bộ sưu tập sản phẩm nội thất và đồ gỗ cao cấp của OLY Studio. Thiết kế tinh tế, chất lượng vượt trội.'
    : 'Discover OLY Studio\'s collection of premium interior and furniture products. Exquisite design, superior quality.';
  
  return generateLocalizedMetadata(
    {
      title,
      description,
      keywords: ['products', 'furniture', 'interior', 'design', 'OLY Studio'],
      url: '/products',
    },
    locale,
    '/products'
  );
      }

export default async function ProductsPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const products = await getProducts();
  
  const pageUrl = `${SEO_CONSTANTS.SITE_URL}/${locale}/products`;
  const pageName = locale === 'vi' ? 'Sản Phẩm' : 'Products';
  const pageDescription = locale === 'vi'
    ? 'Khám phá bộ sưu tập sản phẩm nội thất và đồ gỗ cao cấp của OLY Studio.'
    : 'Discover OLY Studio\'s collection of premium interior and furniture products.';

  // CollectionPage schema
  const productsList = products as Array<{ slug: string; category: string }>;
  const collectionPageSchema = generateCollectionPageSchema({
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    numberOfItems: productsList.length,
    mainEntity: productsList.slice(0, 20).map((product) => ({
      '@type': 'Product',
      name: product.slug.replace(/-/g, ' ').toUpperCase(),
      url: `${SEO_CONSTANTS.SITE_URL}/${locale}/products/${product.slug}`,
    })),
  });

  // Breadcrumb schema
  const breadcrumbItems = [
    { name: locale === 'vi' ? 'Trang chủ' : 'Home', url: `${SEO_CONSTANTS.SITE_URL}/${locale}` },
    { name: pageName, url: pageUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <JsonLd data={[collectionPageSchema, breadcrumbSchema]} />
      <ProductsClient />
    </>
  );
}
