import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { PriceExplorer, type PriceSection } from '@/components/PriceExplorer';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import { p } from '@/lib/page-copy';
import fallback from '../../../../../packages/db/prisma/price-data.json';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).prices;
  return { title: c.heroTitle, description: c.heroText };
}

export default async function PricesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).prices;
  let sections: PriceSection[] = fallback as PriceSection[];
  try {
    sections = await api<PriceSection[]>('/api/public/prices', { cache: 'no-store' });
  } catch {}

  return (
    <Shell locale={locale}>
      <PageHero title={c.heroTitle} accent={c.heroAccent} text={c.heroText} image="/portfolio/placeholders/project-4.png" className="prices-hero" />
      <PriceExplorer locale={locale} sections={sections} />
      <ContactCta locale={locale} title={c.ctaTitle} text={c.ctaText} />
    </Shell>
  );
}
