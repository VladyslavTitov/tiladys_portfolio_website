import { Shell } from './Shell';
import content from '@/content/legal.json';
import { t } from '@/lib/i18n';
import { business } from '@/lib/business';
export type LegalKind = 'impressum' | 'privacy' | 'terms';
export function legalCopy(locale: string) { return content[locale as keyof typeof content] ?? content.en; }
export function LegalPage({ locale, title, kind }: { locale: string; title: string; kind: LegalKind }) {
  const c = legalCopy(locale);
  return <Shell locale={locale}>
    <section className="page-hero"><h1>{title}</h1><p>{c.review}</p></section>
    <div className="section legal-content">
      <aside className="legal-review"><strong>{c.review}</strong><p>{c.notice}</p></aside>
      {kind === 'impressum' ? <section><p>{c.operator}</p></section> : null}
      {kind === 'privacy' ? <>{c.privacySections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}
        {process.env.CONTACT_UPLOADS_ENABLED === 'true' ? <section><h2>{c.attachmentsTitle}</h2><p>{c.attachments}</p></section> : null}</> : null}
      {kind === 'terms' ? <section><h2>{c.processTitle}</h2><p>{c.process}</p></section> : null}
      <section><h2>{c.contact}</h2><address>{business.name}<br />{t(locale).footer.location}<br /><a href={`mailto:${business.email}`}>{business.email}</a><br /><a href={`tel:${business.telephone}`}>{business.phone}</a></address></section>
      <section className="legal-review"><h2>{c.missing}</h2><p>{kind === 'impressum' ? c.impressumMissing : kind === 'privacy' ? c.privacyMissing : c.termsMissing}</p></section>
    </div>
  </Shell>;
}
