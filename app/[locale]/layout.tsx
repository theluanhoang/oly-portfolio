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


export const metadata: Metadata = {
  title: "OLY Studio - Portfolio",
  description: "OLY Studio portfolio showcasing architectural projects and design works",
};

export const dynamic = 'force-dynamic';
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${montserrat.variable} antialiased`}
      >
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

