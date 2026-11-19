import type { Metadata } from 'next';
import { locales } from '@tiladys/shared';

export const siteUrl = 'https://tiladys.com';

// Fail closed when Vercel's deployment environment is unavailable.
export function isProductionDeployment() {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
}

export function localePath(locale: string, pathname = '') {
  const suffix = pathname ? `/${pathname.replace(/^\//, '')}` : '';
  return `/${locale}${suffix}`;
}

export function localizedAlternates(locale: string, pathname = '', availableLocales: readonly string[] = locales) {
  const languages = Object.fromEntries(
    availableLocales.map((item) => [item, `${siteUrl}${localePath(item, pathname)}`]),
  ) as Record<string, string>;
  if (availableLocales.includes('en')) languages['x-default'] = `${siteUrl}${localePath('en', pathname)}`;
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
  const images = [{ url: new URL(image ?? '/illustrations/g01-three-services-1600.webp', siteUrl).href, alt: image ? title : 'TiLADYS' }];
  return {
    title,
    description,
    alternates: localizedAlternates(locale, pathname),
    openGraph: { title, description, url, locale: ogLocales[locale] ?? locale, type: 'website', siteName: 'TiLADYS', images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}
