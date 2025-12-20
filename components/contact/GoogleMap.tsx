'use client';

interface GoogleMapProps {
  className?: string;
}

export default function GoogleMap({ className = '' }: GoogleMapProps) {
  const address = encodeURIComponent('193/9P Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM');
  const mapEmbedUrl = `https://www.google.com/maps?q=${address}&output=embed&hl=vi&z=15`;

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

