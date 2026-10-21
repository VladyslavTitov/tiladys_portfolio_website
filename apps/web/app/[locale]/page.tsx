import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { ThreeServices, ProductPathways } from '@/components/ThreeServices';
import { SelectedWork } from '@/components/SelectedWork';
import { ContactCta } from '@/components/ContactCta';
import { FounderPortrait } from '@/components/FounderPortrait';
import { rebuildCopy } from '@/lib/rebuild-copy';
import { localizedMetadata } from '@/lib/seo';
import about from '@/content/about.json';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params; const c = rebuildCopy(locale);
 return localizedMetadata({ locale, title: c.title, description: c.intro });
}
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
 const { locale } = await params; const c = rebuildCopy(locale); const founder = about[locale as keyof typeof about] ?? about.en;
 return <Shell locale={locale}>
  <section className="rebuild-hero"><div><span className="eyebrow">TiLADYS · Mülheim an der Ruhr</span><h1>{c.title}</h1><p>{c.intro}</p><div className="actions"><Link className="primary" href={`/${locale}/contact`}>{c.contact}<ArrowRight aria-hidden="true" /></Link><Link className="secondary secondary--light" href={`/${locale}/services`}>{c.services}</Link></div></div><Image src="/illustrations/g01-three-services-1600.webp" alt="" width={1600} height={900} sizes="(max-width: 768px) calc(100vw - 36px), (max-width: 1248px) 46vw, 557px" priority /></section>
  <ThreeServices locale={locale} />
  <Suspense fallback={<section className="section" aria-busy="true">{c.work}…</section>}><SelectedWork locale={locale} featuredOnly /></Suspense>
  <ProductPathways locale={locale} />
  <section className="section rebuild-process"><h2>{c.process}</h2><ol>{c.steps.map((step, i) => <li key={step}><span>{i + 1}</span><h3>{step}</h3></li>)}</ol></section>
  <section className="section rebuild-founder"><FounderPortrait name={founder.founderName} label={founder.portraitLabel} /><div><span className="eyebrow">{c.founder}</span><h2>{founder.founderName}</h2><p>{founder.founderText}</p><Link className="primary" href={`/${locale}/about`}>{c.about}<ArrowRight aria-hidden="true" /></Link></div></section>
  <ContactCta locale={locale} title={c.start} text={c.intro} />
 </Shell>;
}
