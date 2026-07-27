import Link from 'next/link';
import {
  Bolt,
  Globe2,
  Instagram,
  Mail,
  MapPin,
  MessageCircleMore,
  Phone,
  Send,
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import { ContactForm } from '@/components/ContactForm';
import { ContactCta } from '@/components/ContactCta';
import { PageHero } from '@/components/PageHero';
import { p } from '@/lib/page-copy';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).contact;
  return { title: c.heroTitle, description: c.heroText };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = p(locale).contact;
  const locationLabel: Record<string, string> = { en: 'NRW, Germany', de: 'NRW, Deutschland', uk: 'NRW, Німеччина', ru: 'NRW, Германия', sk: 'NRW, Nemecko', fr: 'NRW, Allemagne' };
  const contacts = [
    { key: 'email', value: 'mail@tiladys.com', href: 'mailto:mail@tiladys.com', Icon: Mail, tone: 'blue' },
    { key: 'phone', value: '+49 163 7235608', href: 'tel:+491637235608', Icon: Phone, tone: 'blue' },
    { key: 'whatsapp', value: '+49 163 7235608', href: 'https://wa.me/491637235608', Icon: MessageCircleMore, tone: 'green' },
    { key: 'telegram', value: 't.me/tiladys_support', href: 'https://t.me/tiladys_support', Icon: Send, tone: 'sky' },
    { key: 'instagram', value: '@tiladys.de', href: 'https://www.instagram.com/tiladys.de', Icon: Instagram, tone: 'pink' },
    { key: 'location', value: locationLabel[locale] ?? locationLabel.en, href: 'https://www.google.com/maps/search/?api=1&query=NRW%2C%20Deutschland', Icon: MapPin, tone: 'blue' },
  ] as const;

  return (
    <Shell locale={locale}>
      <PageHero title={c.heroTitle} accent={c.heroAccent} text={c.heroText} image="/portfolio/placeholders/project-4.png"/>
      <section className="section contact-page-grid">
        <div className="contact-channel-list">
          {contacts.map(({ key, value, href, Icon, tone }) => {
            const labels = c.cards[key];
            return (
              <article className="contact-channel" key={key}>
                <span className={`contact-channel__icon contact-channel__icon--${tone}`}><Icon aria-hidden="true" /></span>
                <div className="contact-channel__copy"><h2>{labels}</h2><p>{value}</p></div>
                <Link className={`contact-channel__action contact-channel__action--${tone}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
                  <Icon aria-hidden="true" size={17} />{c.cards[`${key}Action` as keyof typeof c.cards]}
                </Link>
              </article>
            );
          })}
        </div>
        <ContactForm locale={locale} />
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
