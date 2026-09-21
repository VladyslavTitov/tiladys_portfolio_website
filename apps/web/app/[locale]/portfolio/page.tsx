import { Suspense } from 'react';
import { loadPortfolio, portfolioStateCopy } from '@/lib/portfolio-state';
import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { PortfolioExplorer, type PublicProject } from '@/components/PortfolioExplorer';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import { p } from '@/lib/page-copy';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  return localizedMetadata({ locale, pathname: 'portfolio', title: c.title, description: c.intro });
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  const stateCopy = portfolioStateCopy(locale);

  return (
    <Shell locale={locale}>
      <PageHero kicker={c.kicker} title={c.title} accentLead={c.accentLead} accent={c.accent} text={c.intro} className="portfolio-hero" />
      <Suspense fallback={<section className="section" role="status" aria-busy="true"><p>{stateCopy.loading}</p></section>}>
        <PortfolioResults locale={locale} />
      </Suspense>
      <ContactCta locale={locale} title={c.ctaTitle} text={c.ctaText} />
    </Shell>
  );
}

async function PortfolioResults({ locale }: { locale: string }) {
  const result = await loadPortfolio(() => api<PublicProject[]>('/api/public/projects', {
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
  }));
  if (result.state === 'ready') return <PortfolioExplorer locale={locale} projects={result.projects} />;
  // Never include upstream response bodies, connection strings or personal data in logs/UI.
  console.error('[PUBLIC_PORTFOLIO_UNAVAILABLE]');
  const copy = portfolioStateCopy(locale);
  return <section className="section portfolio-error" role="alert">
    <h2>{copy.title}</h2><p>{copy.text}</p>
    <a className="primary" href={`/${locale}/portfolio`}>{copy.retry}</a>
  </section>;
}
