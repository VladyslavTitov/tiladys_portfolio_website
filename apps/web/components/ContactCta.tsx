import Link from 'next/link';
import { ArrowRight, ExternalLink, Headphones } from 'lucide-react';
import { p } from '@/lib/page-copy';

export function ContactCta({ locale, title, text }: { locale: string; title?: string; text?: string }) {
  const c = p(locale);
  return (
    <div className="page-cta-wrap">
      <section className="page-cta">
        <div className="page-cta__icon"><Headphones aria-hidden="true" /></div>
        <div className="page-cta__copy">
          <h2>{title ?? c.prices.ctaTitle}</h2>
          <p>{text ?? c.prices.ctaText}</p>
        </div>
        <div className="page-cta__actions">
          <Link className="primary" href={`/${locale}/contact`}>
            {c.common.contactMe}<ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link className="secondary secondary--dark" href={`/${locale}/contact#contact-form`}>
            {c.common.openForm}<ExternalLink aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
