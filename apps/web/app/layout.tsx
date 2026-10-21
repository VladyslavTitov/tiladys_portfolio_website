import './globals.css';
import './rebuild.css';
import './refinement.css';
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { locales } from '@tiladys/shared';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requested = (await headers()).get('x-tiladys-locale') ?? 'en';
  const lang = locales.includes(requested as (typeof locales)[number]) ? requested : 'en';
  return <html lang={lang}><body>{children}</body></html>;
}
