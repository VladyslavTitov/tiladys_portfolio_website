import './globals.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { locales } from '@tiladys/shared';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com'),
  title: { default: 'TiLADYS — IT Services & Webdesign', template: '%s | TiLADYS' },
  description: 'Practical IT support, websites, PC services and digital solutions in NRW, Germany.',
  openGraph: { type: 'website', siteName: 'TiLADYS' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requested = (await headers()).get('x-tiladys-locale') ?? 'en';
  const lang = locales.includes(requested as (typeof locales)[number]) ? requested : 'en';
  return <html lang={lang}><body>{children}</body></html>;
}
