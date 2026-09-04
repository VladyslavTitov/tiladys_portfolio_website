import type { MetadataRoute } from 'next';
import { locales } from '@tiladys/shared';
import { serviceIds } from '@/lib/services';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com').replace(/\/$/, '');
  const routes = ['', 'services', ...serviceIds.map((id) => `services/${id}`), 'portfolio', 'about', 'contact', 'terms', 'privacy', 'impressum'];
  return locales.flatMap((locale) => routes.map((route) => ({
    url: `${base}/${locale}${route ? `/${route}` : ''}`,
    changeFrequency: route === 'portfolio' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1 : route === 'services' ? 0.9 : route.startsWith('services/') ? 0.8 : 0.7,
  })));
}
