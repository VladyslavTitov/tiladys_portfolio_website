import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, CircleCheck, Info, MessageCircle } from 'lucide-react';
import type { PriceSection } from '@/components/PriceExplorer';
import { serviceById, serviceCopy, ui, type ServiceDefinition } from '@/lib/services';
import { ServicePrice } from './ServicePrice';
import { ServiceVisual } from './ServiceVisual';

export function ServiceDetail({ locale, service, sections }: { locale: string; service: ServiceDefinition; sections: PriceSection[] }) {
  const copy = serviceCopy(service.id, locale);
  const common = ui(locale);
  return (
    <>
      <nav className="service-breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}/services`}>{common.breadcrumb}</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{copy.title}</span>
      </nav>
      <section className="service-detail-hero">
        <div className="service-detail-hero__copy">
          <span className="eyebrow">TiLADYS · {common.breadcrumb}</span>
          <h1>{copy.title}</h1><p>{copy.short}</p>
          <ServicePrice service={service} sections={sections} locale={locale} disclaimer />
          <div className="actions">
            <Link className="primary" href={`/${locale}/contact?service=${service.id}#contact-form`}>{common.request}<ArrowRight aria-hidden="true" /></Link>
            <Link className="secondary secondary--light" href={`/${locale}/contact?service=${service.id}`}>{common.ask}<MessageCircle aria-hidden="true" /></Link>
          </div>
        </div>
        <ServiceVisual service={service} title={copy.title} priority />
      </section>

      <section className="section service-detail-content">
        <div className="service-introduction">{copy.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <div className="service-detail-grid">
          <article className={`service-examples${copy.groups ? ' service-examples--grouped' : ''}`}><h2>{common.examples}</h2>{copy.groups ? <div className="service-example-groups">{copy.groups.map((group) => <section key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></section>)}</div> : <ul>{copy.examples.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>}</article>
          <div className="service-detail-aside">
            <article className="service-outcome"><span><CircleCheck aria-hidden="true" /></span><div><h2>{common.expected}</h2><p>{copy.expected}</p></div></article>
            {copy.limitations ? <article className="service-limits"><span><Info aria-hidden="true" /></span><div><h2>{common.important}</h2><p>{copy.limitations}</p></div></article> : null}
          </div>
        </div>
      </section>

      <section className="service-process-wrap"><div className="section service-process"><h2>{common.processTitle}</h2><ol>{common.process.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></div></section>

      <section className="section related-services"><div className="section-title"><small>{common.breadcrumb}</small><h2>{common.related}</h2></div><div>
        {service.related.map((id) => { const related = serviceById[id]; const relatedCopy = serviceCopy(id, locale); return <Link key={id} href={`/${locale}/services/${id}`}><ServiceVisual service={related} title={relatedCopy.title} compact /><span><strong>{relatedCopy.title}</strong><small>{relatedCopy.short}</small></span><ArrowRight aria-hidden="true" /></Link>; })}
      </div></section>

      <section className="services-detail-cta"><div><h2>{common.finalTitle}</h2><p>{common.finalText}</p></div><Link className="primary" href={`/${locale}/contact?service=${service.id}#contact-form`}>{common.contact}<ArrowRight aria-hidden="true" /></Link></section>
    </>
  );
}
