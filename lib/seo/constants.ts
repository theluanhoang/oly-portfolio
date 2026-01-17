export const SEO_CONSTANTS = {
  SITE_NAME: 'OLY Studio',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://olystudio.com',
  DEFAULT_OG_IMAGE: process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/assets/og-default.png',
  THEME_COLOR: '#000000',
} as const;

export const LOCALES = ['en', 'vi'] as const;
export const DEFAULT_LOCALE = 'vi' as const;

export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }

  return SEO_CONSTANTS.SITE_URL;
}
