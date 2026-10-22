import { businessStructuredData } from '@/lib/business';
import { ServicesOverview } from '@/components/services/ServicesOverview';
import { Shell } from '@/components/Shell';
import { getPublicPrices } from '@/lib/public-prices';
import { localizedMetadata, siteUrl } from '@/lib/seo';
import { ui } from '@/lib/services';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = ui(locale);
  return localizedMetadata({ locale, pathname: 'services', title: copy.heroTitle, description: copy.heroText });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sections = await getPublicPrices();
  const copy = ui(locale);
  const structuredData = {
    '@context': 'https://schema.org', ...businessStructuredData,
    url: `${siteUrl}/${locale}/services`, areaServed: ['Mülheim an der Ruhr', 'Nordrhein-Westfalen'],
    description: copy.heroText,
  };
  return <Shell locale={locale}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><ServicesOverview locale={locale} sections={sections} /></Shell>;
}
