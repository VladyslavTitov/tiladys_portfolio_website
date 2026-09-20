import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Laptop, Globe2, Network } from 'lucide-react';
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
  const icons = [Laptop, Globe2, Network];
  return <Shell locale={locale}>
    <section className="about-introduction section">
      <div><span className="eyebrow">TiLADYS · Mülheim an der Ruhr</span><h1>{data.hero.title}</h1><p>{data.hero.subtitle}</p>
        <Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link></div>
      <Image src="/hero/tiladys-hero.webp?v=20260920" width={1942} height={809} sizes="(max-width: 900px) 100vw, 50vw" alt="" priority />
    </section>
    <section className="section about-support"><h2>{data.supportTitle}</h2><div className="about-support-grid">
      {data.support.map((text, index) => { const Icon = icons[index]; return <article key={text}><Icon aria-hidden="true" /><p>{text}</p></article>; })}
    </div><Link className="about-services-link" href={`/${locale}/services`}>{data.services}<ArrowRight aria-hidden="true" size={18} /></Link></section>
    <section className="section about-expect"><h2>{data.expectTitle}</h2><ol>{data.steps.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></section>
    <section className="section about-contact"><h2>{data.ctaTitle}</h2><p>{data.ctaText}</p><Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link></section>
  </Shell>;
}
