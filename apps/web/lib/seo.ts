import type { Metadata } from 'next';
import { locales, type Locale } from '@tiladys/shared';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com').replace(/\/$/, '');

export function localePath(locale: string, pathname = '') {
  const suffix = pathname ? `/${pathname.replace(/^\//, '')}` : '';
  return `/${locale}${suffix}`;
}

export function localizedAlternates(locale: string, pathname = '') {
  const languages = Object.fromEntries(
    locales.map((item) => [item, `${siteUrl}${localePath(item, pathname)}`]),
  ) as Record<Locale, string> & { 'x-default'?: string };
  languages['x-default'] = `${siteUrl}${localePath('en', pathname)}`;
  return { canonical: `${siteUrl}${localePath(locale, pathname)}`, languages };
}

export function localizedMetadata({
  locale,
  pathname,
  title,
  description,
  image,
}: {
  locale: string;
  pathname?: string;
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const url = `${siteUrl}${localePath(locale, pathname)}`;
  const ogLocales: Record<string, string> = { en: 'en_US', de: 'de_DE', uk: 'uk_UA', ru: 'ru_RU', sk: 'sk_SK', fr: 'fr_FR' };
  const images = image ? [{ url: new URL(image, siteUrl).href, alt: title }] : undefined;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, pathname),
    openGraph: { title, description, url, locale: ogLocales[locale] ?? locale, type: 'website', siteName: 'TiLADYS', images },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images },
  };
}
