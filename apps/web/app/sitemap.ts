import type { MetadataRoute } from 'next';
import { locales } from '@tiladys/shared';
import { publishedProductSitemap, productLocales } from '@/lib/public-products';
import { publishedProjectSitemap } from '@/lib/public-projects-db';
import { isProductionDeployment, localizedAlternates, siteUrl } from '@/lib/seo';
import { serviceIds } from '@/lib/services';

// Publication and withdrawal must be reflected without rebuilding the site.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isProductionDeployment()) return [];
  const routes = ['', 'services', ...serviceIds.map((id) => `services/${id}`), 'portfolio', 'products/framer', 'products/3d-models', 'about', 'contact'];
  let projects: Awaited<ReturnType<typeof publishedProjectSitemap>> = [];
  try { projects = await publishedProjectSitemap(); } catch { /* Keep static routes available during a database outage. */ }
  const projectEntries = projects.flatMap((project) => {
    const available = locales.filter((locale) => Boolean((project.title as Record<string, string>)[locale]?.trim() && (project.summary as Record<string, string>)[locale]?.trim()));
    const path = `portfolio/${project.slug}`;
    return available.map((locale) => ({ url: `${siteUrl}/${locale}/${path}`, lastModified: project.updatedAt, alternates: { languages: localizedAlternates(locale, path, available).languages } }));
  });
  let products: Awaited<ReturnType<typeof publishedProductSitemap>> = [];
  try { products = await publishedProductSitemap(); } catch { /* Keep static routes available during a database outage. */ }
  const productEntries = products.flatMap((product) => {
    const available = productLocales(product);
    const path = `products/${product.slug}`;
    return available.map((locale) => ({ url: `${siteUrl}/${locale}/${path}`, lastModified: product.updatedAt, alternates: { languages: localizedAlternates(locale, path, available).languages } }));
  });
  return [...projectEntries, ...productEntries, ...locales.flatMap((locale) => routes.map((route) => ({
    url: `${siteUrl}/${locale}${route ? `/${route}` : ''}`,
    alternates: { languages: localizedAlternates(locale, route).languages },
    changeFrequency: route === 'portfolio' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1 : route === 'services' ? 0.9 : route.startsWith('services/') ? 0.8 : 0.7,
  })))];
}
