import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { locales } from '@tiladys/shared';
import { localizedAlternates } from '@/lib/seo';
import { serviceIds } from '@/lib/services';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com').replace(/\/$/, '');
  const routes = ['', 'services', ...serviceIds.map((id) => `services/${id}`), 'portfolio', 'about', 'contact'];
  try {
    // Public API applies the PUBLISHED filter. Never query drafts for sitemap generation.
    const projects = await api<Array<{ slug: string }>>('/api/public/projects', { cache: 'no-store' });
    for (const project of projects) if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) routes.push(`portfolio/${project.slug}`);
  } catch { /* Static routes remain available when the control API is unavailable. */ }
  return locales.flatMap((locale) => routes.map((route) => ({
    url: `${base}/${locale}${route ? `/${route}` : ''}`,
    alternates: { languages: localizedAlternates(locale, route).languages },
    changeFrequency: route === 'portfolio' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1 : route === 'services' ? 0.9 : route.startsWith('services/') ? 0.8 : 0.7,
  })));
}
