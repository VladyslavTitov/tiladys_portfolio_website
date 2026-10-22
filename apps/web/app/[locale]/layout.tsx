import '../globals.css';
import '../rebuild.css';
import '../refinement.css';
import type { Metadata, Viewport } from 'next';
import { locales, type Locale } from '@tiladys/shared';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com'),
  title: { default: 'TiLADYS — Websites, 3D Printing & PC Support', template: '%s | TiLADYS' },
  description: 'Websites, 3D printing, PC support and digital solutions in Mülheim an der Ruhr, NRW, Germany.',
  openGraph: { type: 'website', siteName: 'TiLADYS' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  // The URL supplies the language, so informational pages need no request headers.
  return <html lang={locale as Locale}><body>{children}</body></html>;
}
