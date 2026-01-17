import type { Metadata } from 'next';
import { generateLocalizedMetadata } from '@/lib/seo/metadata';
import ContactClient from './ContactClient';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === 'vi' 
    ? 'Liên Hệ | OLY Studio'
    : 'Contact Us | OLY Studio';
  
  const description = locale === 'vi'
    ? 'Liên hệ với OLY Studio để được tư vấn về các dịch vụ kiến trúc, xây dựng, nội thất và đồ gỗ. Chúng tôi luôn sẵn sàng hỗ trợ bạn.'
    : 'Contact OLY Studio for consultation on architecture, construction, interior design, and furniture services. We are always ready to assist you.';
  
  return generateLocalizedMetadata(
    {
      title,
      description,
      keywords: ['contact', 'consultation', 'architecture', 'construction', 'interior', 'OLY Studio'],
      url: '/contact',
    },
    locale,
    '/contact'
  );
}

export default function ContactPage() {
  return <ContactClient />;
}
