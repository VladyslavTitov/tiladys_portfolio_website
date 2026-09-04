import type { Metadata } from 'next';
import { locales, type Locale } from '@tiladys/shared';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com').replace(/\/$/, '');

export function localePath(locale: string, pathname = '') {
  const suffix = pathname ? `/${pathname.replace(/^\//, '')}` : '';
  return `/${locale}${suffix}`;
}

export function localizedAlternates(locale: string, pathname = ''): Metadata['alternates'] {
  const languages = Object.fromEntries(
    locales.map((item) => [item, localePath(item, pathname)]),
  ) as Record<Locale, string> & { 'x-default'?: string };
  languages['x-default'] = localePath('en', pathname);
  return { canonical: localePath(locale, pathname), languages };
}

export function localizedMetadata({
  locale,
  pathname,
  title,
  description,
}: {
  locale: string;
  pathname?: string;
  title: string;
  description: string;
}): Metadata {
  const url = `${siteUrl}${localePath(locale, pathname)}`;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, pathname),
    openGraph: { title, description, url, locale, type: 'website', siteName: 'TiLADYS' },
  };
}
