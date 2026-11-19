import type { MetadataRoute } from 'next';
import { locales } from '@tiladys/shared';
import { siteUrl } from '@/lib/seo';

const routes = ['', 'portfolio', 'prices', 'about', 'contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) => {
    const suffix = route ? `/${route}` : '';
    const languages = Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}${suffix}`]));
    return locales.map((locale) => ({
      url: `${siteUrl}/${locale}${suffix}`,
      alternates: { languages },
      changeFrequency: route === 'portfolio' ? 'weekly' : 'monthly',
      priority: route === '' ? 1 : 0.8,
    }));
  });
}
