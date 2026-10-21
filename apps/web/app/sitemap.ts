import {publishedProductSitemap,productLocales} from '@/lib/public-products';
import type { MetadataRoute } from 'next';
import { publishedProjectSitemap } from '@/lib/public-projects-db';
import { locales } from '@tiladys/shared';
import { localizedAlternates } from '@/lib/seo';
import { serviceIds } from '@/lib/services';

// Publication and withdrawal must be reflected without rebuilding the site.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiladys.com').replace(/\/$/, '');
  const routes = ['', 'services', ...serviceIds.map((id) => `services/${id}`), 'portfolio', 'products/framer', 'products/3d-models', 'about', 'contact', 'impressum', 'privacy', 'terms'];
  let projects:Awaited<ReturnType<typeof publishedProjectSitemap>>=[];
  try { projects=await publishedProjectSitemap(); } catch { /* Preserve static routes during a dependency outage. */ }
  const projectEntries=projects.flatMap(p=>locales.filter(l=>Boolean((p.title as Record<string,string>)[l]?.trim()&&(p.summary as Record<string,string>)[l]?.trim())).map(locale=>({url:`${base}/${locale}/portfolio/${p.slug}`,lastModified:p.updatedAt,alternates:{languages:Object.fromEntries(locales.filter(l=>Boolean((p.title as Record<string,string>)[l]?.trim()&&(p.summary as Record<string,string>)[l]?.trim())).map(l=>[l,`${base}/${l}/portfolio/${p.slug}`]))}})));
  let products:Awaited<ReturnType<typeof publishedProductSitemap>>=[];try{products=await publishedProductSitemap();}catch{}
  const productEntries=products.flatMap(p=>productLocales(p).map(locale=>({url:`${base}/${locale}/products/${p.slug}`,lastModified:p.updatedAt,alternates:{languages:Object.fromEntries(productLocales(p).map(l=>[l,`${base}/${l}/products/${p.slug}`]))}})));
  return [...projectEntries,...productEntries,...locales.flatMap((locale) => routes.map((route) => ({
    url: `${base}/${locale}${route ? `/${route}` : ''}`,
    alternates: { languages: localizedAlternates(locale, route).languages },
    changeFrequency: route === 'portfolio' ? 'weekly' as const : 'monthly' as const,
    priority: route === '' ? 1 : route === 'services' ? 0.9 : route.startsWith('services/') ? 0.8 : 0.7,
  })))];
}
