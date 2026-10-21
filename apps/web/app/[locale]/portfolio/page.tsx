import {ProductPathways} from '@/components/ThreeServices';
import { Suspense } from 'react';
import { portfolioStateCopy } from '@/lib/portfolio-state';
import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { PortfolioExplorer } from '@/components/PortfolioExplorer';
import { Shell } from '@/components/Shell';
import { getPublishedPortfolio } from '@/lib/public-projects-db';
import { p } from '@/lib/page-copy';
import { localizedMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  return localizedMetadata({ locale, pathname: 'portfolio', title: c.title, description: c.intro });
}

export default async function PortfolioPage({ params, searchParams }: { params: Promise<{ locale: string }>;searchParams:Promise<{category?:string;filter?:string;q?:string;page?:string}> }) {
  const { locale } = await params;
  const c = p(locale).portfolio;
  const stateCopy = portfolioStateCopy(locale);

  return (
    <Shell locale={locale}>
      <PageHero kicker={c.kicker} title={c.title} accentLead={c.accentLead} accent={c.accent} text={c.intro} className="portfolio-hero" />
      <Suspense fallback={<section className="section" role="status" aria-busy="true"><p>{stateCopy.loading}</p></section>}>
        <PortfolioResults locale={locale} query={await searchParams} />
      </Suspense>
      <ProductPathways locale={locale}/>
      <ContactCta locale={locale} title={c.ctaTitle} text={c.ctaText} />
    </Shell>
  );
}

async function PortfolioResults({ locale, query }: { locale: string;query:{category?:string;filter?:string;q?:string;page?:string} }) {
  let result:Awaited<ReturnType<typeof getPublishedPortfolio>>|undefined;
  try { result=await getPublishedPortfolio(locale,query); }
  catch { console.error('[PUBLIC_PORTFOLIO_UNAVAILABLE]'); }
  if(result)return <PortfolioExplorer key={locale} locale={locale} {...result}/>;
  const copy = portfolioStateCopy(locale);
  return <section className="section portfolio-error" role="alert"><h2>{copy.title}</h2><p>{copy.text}</p><a className="primary" href={`/${locale}/portfolio`}>{copy.retry}</a></section>;
}
