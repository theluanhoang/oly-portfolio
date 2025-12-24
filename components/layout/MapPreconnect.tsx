'use client';

import { useEffect } from 'react';

export default function MapPreconnect() {
  useEffect(() => {
    const links = [
      { rel: 'dns-prefetch', href: 'https://www.google.com' },
      { rel: 'preconnect', href: 'https://www.google.com', crossOrigin: 'anonymous' },
      { rel: 'dns-prefetch', href: 'https://maps.googleapis.com' },
      { rel: 'preconnect', href: 'https://maps.googleapis.com', crossOrigin: 'anonymous' },
    ];

    links.forEach(({ rel, href, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (crossOrigin) {
        link.setAttribute('crossorigin', crossOrigin);
      }
      document.head.appendChild(link);
    });

    return () => {
      links.forEach(({ rel, href }) => {
        const existingLink = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
        if (existingLink) {
          document.head.removeChild(existingLink);
        }
      });
    };
  }, []);

  return null;
}


