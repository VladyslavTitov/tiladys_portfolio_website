import { Shell } from './Shell';
import { p } from '@/lib/page-copy';

export function LegalPlaceholder({ locale, title }: { locale: string; title: string }) {
  const c = p(locale).legal;
  return (
    <Shell locale={locale}>
      <section className="page-hero"><h1>{title}</h1><p>{c.subtitle}</p></section>
      <section className="section legal-page"><h2>{c.review}</h2><p>{c.p1}</p><p>{c.p2}</p></section>
    </Shell>
  );
}
