import {contactFieldCopy} from '@/lib/contact-field-copy';
import { organizationStructuredData, jsonLd } from '@/lib/business';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FounderPortrait } from '@/components/FounderPortrait';
import { Shell } from '@/components/Shell';
import content from '@/content/about.json';
import { localizedMetadata } from '@/lib/seo';
import { serviceCopy } from '@/lib/services';

const copy = (locale: string) => content[locale as keyof typeof content] ?? content.en;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = copy(locale);
  return localizedMetadata({ locale, pathname: 'about', title: `${data.hero.title} — ${data.founderName}`, description: data.founderText, image: '/about/vladyslav-titov.jpeg' });
}
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = copy(locale);
  return <Shell locale={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationStructuredData) }} />
    <section className="about-introduction section">
      <div><span className="eyebrow">TiLADYS · Mülheim an der Ruhr</span><h1>{data.hero.title}</h1><p>{data.hero.subtitle}</p>
        <Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link></div>
      <Image src="/illustrations/g06-about-workbench-1600.webp" width={1600} height={900} sizes="(max-width: 640px) calc(100vw - 84px), (max-width: 900px) 520px, 440px" alt="" priority />
    </section>
    <section className="section founder-profile" aria-labelledby="founder-title">
      <FounderPortrait name={data.founderName} label={data.portraitLabel} />
      <div><span className="eyebrow">{data.founderTitle}</span><h2 id="founder-title">{data.founderName}</h2><p>{data.founderText}</p></div>
    </section>
    <section className="section founder-details">
      <div><h2>{data.languagesTitle}</h2><dl className="founder-languages">{data.languages.map(({ name, level }) => <div key={name}><dt>{name}</dt><dd>{level}</dd></div>)}</dl></div>
      <div><h2>{data.educationTitle}</h2><ol className="founder-education">{data.education.map(({ school, course, period }) => <li key={school}><h3>{school}</h3><p>{course}</p><small>{period}</small></li>)}</ol></div>
    </section>
    <section className="section about-contact"><h2>{data.ctaTitle}</h2><p>{data.ctaText}</p><div className="actions"><Link className="primary" href={`/${locale}/contact`}>{data.contact}<ArrowRight aria-hidden="true" /></Link><Link className="secondary" href={`/${locale}/services`}>{data.services}<ArrowRight aria-hidden="true" /></Link></div><div className="about-support-options"><h3>{serviceCopy('pc-laptop',locale).title}</h3><div className="actions">{(['local','remote'] as const).map(mode=><Link key={mode} className="secondary" href={`/${locale}/contact?service=pc-laptop&mode=${mode}`}>{contactFieldCopy(locale).modes[mode]}</Link>)}</div></div></section>
  </Shell>;
}
