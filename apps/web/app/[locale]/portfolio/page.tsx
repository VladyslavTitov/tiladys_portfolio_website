import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { PortfolioExplorer, type PublicProject } from '@/components/PortfolioExplorer';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import { p } from '@/lib/page-copy';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  return { title: c.title, description: c.intro };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  let projects: PublicProject[] = [];
  try {
    projects = await api('/api/public/projects', { cache: 'no-store' });
  } catch {}

  return (
    <Shell locale={locale}>
      <PageHero kicker={c.kicker} title={c.title} accentLead={c.accentLead} accent={c.accent} text={c.intro} image="/portfolio/placeholders/project-4.png" className="portfolio-hero" />
      <PortfolioExplorer locale={locale} projects={projects} />
      <ContactCta locale={locale} title={c.ctaTitle} text={c.ctaText} />
    </Shell>
  );
}
