import type { StructuredData } from '@/lib/seo/structured-data';

interface JsonLdProps {
  data: StructuredData | StructuredData[];
}

/**
 * Component to render JSON-LD structured data
 */
export default function JsonLd({ data }: JsonLdProps) {
  const jsonData = Array.isArray(data) ? data : [data];
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonData) }}
    />
  );
}
