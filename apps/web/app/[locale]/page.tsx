import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ClipboardList,
  ExternalLink,
  Headphones,
  MessageSquareText,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import { ServiceVisual } from '@/components/services/ServiceVisual';
import { t } from '@/lib/i18n';
import { homePageCopy } from '@/lib/home-page-copy';
import { homeServices } from '@/lib/home-services';
import { localizedMetadata } from '@/lib/seo';
import { serviceById } from '@/lib/services';

const processIcons = [MessageSquareText, Search, ClipboardList, Wrench, ShieldCheck];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = t(locale);
  return localizedMetadata({ locale, title: c.hero, description: c.sub });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = t(locale);
  const extra = homePageCopy(locale);
  const homeServiceCopy = homeServices(locale);

  return (
    <Shell locale={locale}>
      <section className="hero">
        <div>
          <span className="eyebrow">{extra.eyebrow}</span>
          <h1>{c.hero}</h1>
          <p>{c.sub}</p>
          <div className="actions">
            <Link className="primary" href={`/${locale}/services`}>
              {extra.viewServices} <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="secondary secondary--light" href={`/${locale}/contact`}>
              {c.header.getHelp}
            </Link>
          </div>
          <div className="trust">
            <span><ShieldCheck aria-hidden="true" />{extra.trust[0]}</span>
            <span>{extra.trust[1]}</span>
            <span>{extra.trust[2]}</span>
          </div>
        </div>
        <Image className="hero-visual" src="/hero/tiladys-hero.webp" width={1536} height={1024} sizes="(max-width: 768px) 100vw, 50vw" alt="" aria-hidden="true" priority />
      </section>

      <section className="services-section section" aria-labelledby="services-heading">
        <div className="section-title">
          <small>{c.home.servicesKicker}</small>
          <h2 id="services-heading">
            {c.home.servicesTitle} <span>{c.home.servicesAccent}</span>
          </h2>
          <p>{c.home.servicesIntro}</p>
        </div>

        <div className="service-cards">
          {homeServiceCopy.services.map((service) => {
            return (
              <article className="service-card" key={service.title}>
                <ServiceVisual service={serviceById[service.id]} title={service.title} compact />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.items.map((item: string) => (
                    <li key={item}><Check aria-hidden="true" size={16} />{item}</li>
                  ))}
                </ul>
                <Link className="service-card__link" href={`/${locale}/services/${service.id}`}>{service.cta}<ArrowRight aria-hidden="true" size={17} /></Link>
              </article>
            );
          })}
        </div>

        <aside className="service-contact-card">
          <div><h3>{homeServiceCopy.contact.title}</h3><p>{homeServiceCopy.contact.text}</p></div>
          <Link className="primary" href={`/${locale}/contact`}>{homeServiceCopy.contact.cta}<ArrowRight aria-hidden="true" size={18} /></Link>
        </aside>

        <Link className="primary services-section__button" href={`/${locale}/services`}>
          {c.home.servicesButton} <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>

      {/* <section className="section alt">
        <div className="section-title">
          <small>{extra.projectsKicker}</small>
          <h2>{c.projects}</h2>
        </div>
        <div className="project-grid">
          {[2, 3, 4, 5].map((number, index) => (
            <article key={number}>
              <Image src={`/portfolio/placeholders/project-${number}.png`} width={550} height={330} alt={extra.projectCategories[index]} />
              <h3>{extra.projectCategories[index]}</h3>
              <p>{extra.projectPlaceholder}</p>
            </article>
          ))}
        </div>
        <Link className="secondary center" href={`/${locale}/portfolio`}>{extra.seeAllPortfolio}</Link>
      </section> */}

      <section className="process-section section" aria-labelledby="process-heading">
        <div className="section-title process-section__title">
          <small>{c.home.processKicker}</small>
          <h2 id="process-heading">{c.home.processTitle}</h2>
        </div>

        <ol className="process-steps">
          {c.home.processSteps.map((step, index) => {
            const Icon = processIcons[index];
            return (
              <li key={step.title} className="process-step">
                <div className="process-step__number">{index + 1}</div>
                <div className="process-step__icon"><Icon aria-hidden="true" /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="home-cta-wrap">
        <div className="home-cta">
          <div className="home-cta__icon"><Headphones aria-hidden="true" /></div>
          <div className="home-cta__copy">
            <h2>{c.home.ctaTitle}</h2>
            <p>{c.home.ctaText}</p>
          </div>
          <div className="home-cta__actions">
            <Link className="primary" href={`/${locale}/contact`}>
              {c.home.ctaPrimary} <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="secondary secondary--light" href={`/${locale}/contact#contact-form`}>
              {c.home.ctaSecondary} <ExternalLink aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
