import { ServicesOverview } from '@/components/services/ServicesOverview';
import { Shell } from '@/components/Shell';
import { getPublicPrices } from '@/lib/public-prices';
import { localizedMetadata } from '@/lib/seo';
import { ui } from '@/lib/services';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = ui(locale);
  return localizedMetadata({ locale, pathname: 'services', title: locale === 'de' ? 'Webdesign, PC-Service & 3D-Druck in Mülheim an der Ruhr' : copy.heroTitle, description: locale === 'de' ? 'TiLADYS bietet Webdesign, PC- und Laptop-Service sowie 3D-Druck in Mülheim an der Ruhr und online.' : copy.heroText });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sections = await getPublicPrices();
  return <Shell locale={locale}><ServicesOverview locale={locale} sections={sections} /></Shell>;
}
