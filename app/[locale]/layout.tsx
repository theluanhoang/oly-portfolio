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
const DEFAULT_DESCRIPTION = 'OLY Studio portfolio showcasing architectural projects and design works';

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
    
    return {
      title: siteTitle || DEFAULT_TITLE,
      description: siteDescription || DEFAULT_DESCRIPTION,
    };
  } catch {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
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

  return (
    <html lang={locale}>
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
