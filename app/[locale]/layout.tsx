import localFont from "next/font/local";
import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import SessionProvider from "@/components/providers/SessionProvider";
import MapPreconnect from "@/components/layout/MapPreconnect";
import { initAdmin } from "@/lib/initAdmin";
import { generateLocalizedMetadata } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/structured-data";

const montserrat = localFont({
  src: "../../fonts/Montserrat/Montserrat-Regular.ttf",
  variable: "--font-montserrat",
  display: "swap",
});

const gayathri = localFont({
  src: "../../fonts/Gayathri/Gayathri-Regular.ttf",
  variable: "--font-gayathri",
  display: "swap",
});

const mulish = localFont({
  src: "../../fonts/Mulish/Mulish-Regular.ttf",
  variable: "--font-mulish",
  display: "swap",
});

const DEFAULT_TITLE = 'OLY Studio - Portfolio';
const DEFAULT_DESCRIPTION_EN = 'OLY Studio portfolio showcasing architectural projects and design works';
const DEFAULT_DESCRIPTION_VI = 'OLY Studio - Portfolio giới thiệu các dự án kiến trúc và thiết kế';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  try {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    
    let siteTitle: string | undefined;
    let siteDescription: string | undefined;
    
    if (messages.Common && typeof messages.Common === 'object' && !Array.isArray(messages.Common)) {
      const common = messages.Common as Record<string, unknown>;
      if ('siteTitle' in common && typeof common.siteTitle === 'string') {
        siteTitle = common.siteTitle;
      }
      if ('siteDescription' in common && typeof common.siteDescription === 'string') {
        siteDescription = common.siteDescription;
      }
    }
    
    const title = siteTitle || DEFAULT_TITLE;
    const description = siteDescription || (locale === 'vi' ? DEFAULT_DESCRIPTION_VI : DEFAULT_DESCRIPTION_EN);
    
    return generateLocalizedMetadata(
      {
        title,
        description,
      },
      locale,
      '/'
    );
  } catch {
    const description = DEFAULT_DESCRIPTION_EN;
    return generateLocalizedMetadata(
      {
      title: DEFAULT_TITLE,
        description,
      },
      'en',
      '/'
    );
  }
}

export const dynamic = 'force-dynamic';

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  await initAdmin();
  const messages = await getMessages();

  // Generate structured data for Organization and WebSite
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema(locale);

  return (
    <html lang={locale}>
      <head>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        {/* Font preload for better performance */}
        <link
          rel="preload"
          href="/fonts/Montserrat/Montserrat-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${montserrat.variable} antialiased`}>
        <MapPreconnect />
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
