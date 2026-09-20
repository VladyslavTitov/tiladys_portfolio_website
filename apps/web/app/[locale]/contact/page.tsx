import Link from 'next/link';
import {
  Bolt,
  Globe2,
  Mail,
  MapPin,
  MessageCircleMore,
  Phone,
} from 'lucide-react';
import { socialAccounts } from '@/lib/business';
import { socialIcons } from '@/components/SocialLinks';
import { Shell } from '@/components/Shell';
import { ContactForm } from '@/components/ContactForm';
import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { t } from '@/lib/i18n';
import { p } from '@/lib/page-copy';
import { localizedMetadata } from '@/lib/seo';
import { contactServiceId, serviceCopy, serviceDefinitions } from '@/lib/services';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).contact;
  return localizedMetadata({ locale, pathname: 'contact', title: c.heroTitle, description: c.heroText });
}

export default async function ContactPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ service?: string | string[] }> }) {
  const { locale } = await params;
  const requested = (await searchParams).service;
  const requestedService = (Array.isArray(requested) ? requested[0] : requested)?.slice(0, 120) ?? '';
  const c = p(locale).contact;
  const serviceOptions = serviceDefinitions.map((service) => ({ value: service.id, label: serviceCopy(service.id, locale).title }));
  const requestedServiceId = contactServiceId(requestedService);
  const initialService = requestedServiceId ?? '';
  const contacts = [
    ...socialAccounts.map(({ key, handle, href, tone }) => ({ key, value: handle, href, tone, Icon: socialIcons[key] })),
    { key: 'email', value: 'contact@tiladys.com', href: 'mailto:contact@tiladys.com', Icon: Mail, tone: 'blue' },
    { key: 'phone', value: '+49 163 7235608', href: 'tel:+491637235608', Icon: Phone, tone: 'blue' },
    { key: 'location', value: t(locale).footer.location, href: 'https://maps.app.goo.gl/ofUTFfRH1XZ8TV4Z6', Icon: MapPin, tone: 'blue' },
  ] as const;

  return (
    <Shell locale={locale}>
      <PageHero title={c.heroTitle} accent={c.heroAccent} text={c.heroText} />
      <section className="section contact-page-grid">
        <div className="contact-channel-list">
          {contacts.map(({ key, value, href, Icon, tone }) => {
            const labels = c.cards[key];
            return (
              <article className="contact-channel" key={key}>
                <span className={`contact-channel__icon contact-channel__icon--${tone}`}><Icon aria-hidden="true" /></span>
                <div className="contact-channel__copy"><h2>{labels}</h2><p>{value}</p></div>
                <Link className={`contact-channel__action contact-channel__action--${tone}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                  <Icon aria-hidden="true" size={17} />{c.cards[`${key}Action` as keyof typeof c.cards]}
                </Link>
              </article>
            );
          })}
        </div>
        <ContactForm uploadsEnabled={process.env.CONTACT_UPLOADS_ENABLED === 'true'} locale={locale} copy={c} serviceOptions={serviceOptions} initialService={initialService} />
      </section>
      <section className="section contact-benefits-section">
        <div className="contact-benefits">
          <h2>{c.bestTitle}</h2>
          <div className="contact-benefits__grid">
            {c.benefits.map((benefit, index) => {
              const Icon = index === 0 ? Bolt : index === 1 ? MessageCircleMore : Globe2;
              return <article key={benefit.title}><span><Icon aria-hidden="true" /></span><div><h3>{benefit.title}</h3><p>{benefit.text}</p></div></article>;
            })}
          </div>
        </div>
      </section>
      <ContactCta locale={locale} title={c.ctaTitle} text={c.ctaText} />
    </Shell>
  );
}
