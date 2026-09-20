import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FounderPortrait } from '@/components/FounderPortrait';
import { Shell } from '@/components/Shell';
import content from '@/content/about.json';
import { localizedMetadata } from '@/lib/seo';

const copy = (locale: string) => content[locale as keyof typeof content] ?? content.en;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = copy(locale);
  return localizedMetadata({ locale, pathname: 'about', title: data.hero.title, description: data.hero.subtitle });
}
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = copy(locale);
  return <Shell locale={locale}>
    <section className="about-introduction section">
      <div><span className="eyebrow">TiLADYS · Mülheim an der Ruhr</span><h1>{data.hero.title}</h1><p>{data.hero.subtitle}</p>
        <Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link></div>
      <Image src="/hero/tiladys-hero-objects-transparent.png" width={1254} height={1254} sizes="(max-width: 900px) 100vw, 50vw" alt="" priority />
    </section>
    <section className="section founder-profile" aria-labelledby="founder-title">
      <FounderPortrait name={data.founderName} label={data.portraitLabel} />
      <div><span className="eyebrow">{data.founderTitle}</span><h2 id="founder-title">{data.founderName}</h2><p>{data.founderText}</p></div>
    </section>
    <section className="section founder-details">
      <div><h2>{data.languagesTitle}</h2><dl className="founder-languages">{data.languages.map(({ name, level }) => <div key={name}><dt>{name}</dt><dd>{level}</dd></div>)}</dl></div>
      <div><h2>{data.educationTitle}</h2><ol className="founder-education">{data.education.map(({ school, course, period }) => <li key={school}><h3>{school}</h3><p>{course}</p><small>{period}</small></li>)}</ol></div>
    </section>
    <section className="section about-contact"><h2>{data.ctaTitle}</h2><p>{data.ctaText}</p><div className="actions"><Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link><Link className="secondary" href={`/${locale}/services`}>{data.services}<ArrowRight aria-hidden="true" /></Link></div></section>
  </Shell>;
}
