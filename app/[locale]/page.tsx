import type { Metadata } from 'next';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import HomeClient from './HomeClient';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === 'vi' 
    ? 'OLY Studio - Kiến Trúc, Xây Dựng, Nội Thất, Đồ Gỗ'
    : 'OLY Studio - Architecture, Construction, Interior, Furniture';
  
  const description = locale === 'vi'
    ? 'OLY Studio chuyên thiết kế kiến trúc, xây dựng, nội thất và đồ gỗ. Khám phá các dự án độc đáo của chúng tôi.'
    : 'OLY Studio specializes in architecture, construction, interior design, and furniture. Discover our unique projects.';

  return generateLocalizedMetadata(
    {
      title,
      description,
    },
    locale,
    '/'
  );
}

export default function Home() {
  return (
    <main>
      <HomeClient />
    </main>
  );
}
