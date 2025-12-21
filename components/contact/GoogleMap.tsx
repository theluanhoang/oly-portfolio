'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

interface GoogleMapProps {
  className?: string;
}

export default function GoogleMap({ className = '' }: GoogleMapProps) {
  const locale = useLocale();
  const t = useTranslations('ContactPage');
  const address = encodeURIComponent(t('contactInfo.address'));
  const mapEmbedUrl = `https://www.google.com/maps?q=${address}&output=embed&hl=${locale}&z=15`;

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full"
      />
    </div>
  );
}

