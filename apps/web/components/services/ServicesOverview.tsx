import Link from 'next/link';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';
import type { PriceSection } from '@/components/PriceExplorer';
import { serviceCopy, serviceDefinitions, ui } from '@/lib/services';
import { ServicePrice } from './ServicePrice';
import { ServiceVisual } from './ServiceVisual';

export function ServicesOverview({ locale, sections }: { locale: string; sections: PriceSection[] }) {
  const common = ui(locale);
  return (
    <>
      <section className="services-overview-hero">
        <div className="services-overview-hero__inner">
          <div className="services-overview-hero__copy">
            <span className="eyebrow">TiLADYS · Mülheim an der Ruhr</span>
            <h1>{common.heroTitle}</h1>
            <p>{common.heroText}</p>
            <div className="actions">
              <Link className="primary" href="#service-categories">{common.explore}<ArrowRight aria-hidden="true" /></Link>
              <Link className="secondary secondary--light" href={`/${locale}/contact`}>{common.contact}</Link>
            </div>
          </div>
          <ServiceVisual service={serviceDefinitions[0]} image="/hero/tiladys-hero.webp?v=20260920" title={common.heroTitle} priority />
        </div>
      </section>

      <section id="service-categories" className="section services-overview" aria-labelledby="services-heading">
        <div className="section-title">
          <small>{common.breadcrumb}</small>
          <h2 id="services-heading">{common.explore}</h2>
        </div>
        <div className="services-card-grid">
          {serviceDefinitions.map((service) => {
            const copy = serviceCopy(service.id, locale);
            return (
              <article className="services-card" key={service.id}>
                <ServiceVisual service={service} title={copy.title} compact />
                <div className="services-card__body">
                  <h2>{copy.title}</h2>
                  <p>{copy.short}</p>
                  <ServicePrice service={service} sections={sections} locale={locale} primaryOnly />
                  <ul>{copy.examples.slice(0, 4).map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
                  <Link href={`/${locale}/services/${service.id}`}>{common.explore}<ArrowRight aria-hidden="true" /></Link>
                </div>
              </article>
            );
          })}
        </div>
        <p className="service-price-disclaimer services-overview__disclaimer">{common.disclaimer}</p>
      </section>

      <section className="services-not-sure">
        <span><HelpCircle aria-hidden="true" /></span>
        <div><h2>{common.notSureTitle}</h2><p>{common.notSureText}</p></div>
        <Link className="primary" href={`/${locale}/contact`}>{common.describe}<ArrowRight aria-hidden="true" /></Link>
      </section>
    </>
  );
}
