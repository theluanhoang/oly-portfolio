import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import AboutClient from './AboutClient';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === 'vi' 
    ? 'Giới Thiệu | OLY Studio'
    : 'About Us | OLY Studio';
  
  const description = locale === 'vi'
    ? 'Tìm hiểu về OLY Studio - Đội ngũ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực kiến trúc, xây dựng, nội thất và đồ gỗ.'
    : 'Learn about OLY Studio - A professional team with years of experience in architecture, construction, interior design, and furniture.';
  
  return generateLocalizedMetadata(
    {
      title,
      description,
      keywords: ['about', 'team', 'company', 'architecture', 'construction', 'interior', 'OLY Studio'],
      url: '/about',
    },
    locale,
    '/about'
  );
}

export default function AboutPage() {
  return <AboutClient />;
}
