import type { MetadataRoute } from 'next';
import { isProductionDeployment, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    ...(isProductionDeployment() ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
}
