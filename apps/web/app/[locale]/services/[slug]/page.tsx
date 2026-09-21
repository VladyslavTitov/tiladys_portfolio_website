import { pcServiceArea, serviceAreaCopy } from '@/lib/service-area';
import { organizationStructuredData, jsonLd } from '@/lib/business';
import { notFound, permanentRedirect } from 'next/navigation';
import { ServiceDetail } from '@/components/services/ServiceDetail';
import { Shell } from '@/components/Shell';
import { getPublicPrices } from '@/lib/public-prices';
import { localizedMetadata, siteUrl } from '@/lib/seo';
import { isLegacyServiceId, isServiceId, legacyServiceRedirects, serviceById, serviceCopy, serviceIds, ui } from '@/lib/services';

export function generateStaticParams() { return serviceIds.map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isServiceId(slug)) return { robots: { index: false, follow: true } };
  const copy = serviceCopy(slug, locale);
  return localizedMetadata({ locale, pathname: `services/${slug}`, title: slug === 'pc-laptop' ? serviceAreaCopy(locale).title : copy.metaTitle, description: slug === 'pc-laptop' ? serviceAreaCopy(locale).description : copy.metaDescription, image: serviceById[slug].image });
}

export default async function ServicePage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, slug } = await params;
  if (isLegacyServiceId(slug)) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value !== undefined) query.set(key, value);
    }
    const replacement = legacyServiceRedirects[slug];
    permanentRedirect(`/${locale}/services${replacement ? `/${replacement}` : ''}${query.size ? `?${query}` : ''}`);
  }
  if (!isServiceId(slug)) notFound();
  const sections = await getPublicPrices();
  const service = serviceById[slug];
  const copy = serviceCopy(slug, locale);
  const common = ui(locale);
  const url = `${siteUrl}/${locale}/services/${slug}`;
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'Service', name: copy.title, description: copy.short, url, provider: organizationStructuredData, ...(slug === 'pc-laptop' ? { areaServed: pcServiceArea } : {}), hasOfferCatalog: { '@type': 'OfferCatalog', name: copy.title, itemListElement: copy.groups?.map((group) => ({ '@type': 'OfferCatalog', name: group.title, itemListElement: group.items.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })) })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: common.breadcrumb, item: `${siteUrl}/${locale}/services` },
      { '@type': 'ListItem', position: 2, name: copy.title, item: url },
    ] },
  ];
  return <Shell locale={locale}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} /><ServiceDetail locale={locale} service={service} sections={sections} />{slug === 'pc-laptop' ? <section className="section" aria-labelledby="pc-service-area"><h2 id="pc-service-area">{serviceAreaCopy(locale).title}</h2><p>{serviceAreaCopy(locale).text}</p></section> : null}</Shell>;
}
