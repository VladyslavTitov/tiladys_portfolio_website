'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  FileText,
  Headphones,
  Laptop,
  MonitorCog,
  PackageCheck,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { p } from '@/lib/page-copy';

export type Localized = Record<string, string>;
export type PriceItem = { id?: string; code: string; name: Localized; price: string; note?: Localized; active?: boolean };
export type PriceSection = { id?: string; number: string; title: Localized; subtitle?: Localized; items: PriceItem[] };
type Filter = 'all' | 'computer' | 'web' | 'support' | 'digital' | 'other';

function sectionGroup(section: PriceSection): Exclude<Filter, 'all'> {
  const prefix = section.items[0]?.code?.charAt(0).toUpperCase();
  if (prefix === 'H') return 'web';
  if (['B', 'C', 'D', 'E', 'F'].includes(prefix)) return 'computer';
  if (['A', 'G'].includes(prefix)) return 'support';
  if (['I', 'J', 'K'].includes(prefix)) return 'digital';
  return 'other';
}

const filterIcons = { all: Sparkles, computer: MonitorCog, web: Code2, support: Headphones, digital: FileText, other: Wrench } as const;
const sectionIcons = [Headphones, Laptop, ShieldCheck, PackageCheck, MonitorCog, Wrench, BriefcaseBusiness, Code2, BadgeCheck, Sparkles, FileText, PhoneCall] as const;

function localized(value: Localized | undefined, locale: string) {
  return value?.[locale] || value?.en || value?.ru || '';
}

function localizedPrice(value: string, locale: string) {
  const replacements: Record<string, Array<[RegExp, string]>> = {
    en: [[/^от /, 'from '], [/\/час/g, '/hour'], [/\/месяц/g, '/month'], [/ за модуль/g, ' per module'], [/ \/ товар/g, ' / item'], [/ \/ предмет/g, ' / item'], [/ \/ фото/g, ' / photo'], [/ в одну сторону/g, ' one way'], [/от суммы/g, 'of the amount'], [/мин\./g, 'min.'], [/\/км/g, '/km'], [/^(\d+),(\d+) \€\/km$/, '$1.$2 €/km']],
    de: [[/^от /, 'ab '], [/\/час/g, '/Std.'], [/\/месяц/g, '/Monat'], [/ за модуль/g, ' pro Modul'], [/ \/ товар/g, ' / Artikel'], [/ \/ предмет/g, ' / Objekt'], [/ \/ фото/g, ' / Foto'], [/ в одну сторону/g, ' einfache Fahrt'], [/от суммы/g, 'des Betrags'], [/мин\./g, 'mind.'], [/\/км/g, '/km']],
    uk: [[/^от /, 'від '], [/\/час/g, '/год'], [/\/месяц/g, '/місяць'], [/ за модуль/g, ' за модуль'], [/ \/ товар/g, ' / товар'], [/ \/ предмет/g, ' / предмет'], [/ \/ фото/g, ' / фото'], [/ в одну сторону/g, ' в один бік'], [/от суммы/g, 'від суми'], [/мин\./g, 'мін.'], [/\/км/g, '/км']],
    ru: [],
    sk: [[/^от /, 'od '], [/\/час/g, '/hod.'], [/\/месяц/g, '/mesiac'], [/ за модуль/g, ' za modul'], [/ \/ товар/g, ' / položka'], [/ \/ предмет/g, ' / predmet'], [/ \/ фото/g, ' / fotografia'], [/ в одну сторону/g, ' jedným smerom'], [/от суммы/g, 'zo sumy'], [/мин\./g, 'min.'], [/\/км/g, '/km']],
    fr: [[/^от /, 'à partir de '], [/\/час/g, '/heure'], [/\/месяц/g, '/mois'], [/ за модуль/g, ' par module'], [/ \/ товар/g, ' / article'], [/ \/ предмет/g, ' / objet'], [/ \/ фото/g, ' / photo'], [/ в одну сторону/g, ' aller simple'], [/от суммы/g, 'du montant'], [/мин\./g, 'min.'], [/\/км/g, '/km']],
  };
  return (replacements[locale] ?? replacements.en).reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

export function PriceExplorer({ locale, sections }: { locale: string; sections: PriceSection[] }) {
  const c = p(locale).prices;
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(() => sections.filter((section) => filter === 'all' || sectionGroup(section) === filter), [filter, sections]);

  return (
    <>
      <section className="price-advantages" aria-label="Service advantages">
        {c.advantages.map((item, index) => {
          const Icon = [BadgeCheck, ShieldCheck, PhoneCall, BriefcaseBusiness, Headphones][index];
          return <div key={item}><Icon aria-hidden="true" /><span>{item}</span></div>;
        })}
      </section>

      <section className="section price-content-section">
        <div className="filter-bar price-filter" role="tablist" aria-label={c.filters.all}>
          {(Object.keys(c.filters) as Filter[]).map((key) => {
            const Icon = filterIcons[key];
            return (
              <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}>
                <Icon aria-hidden="true" size={19} />{c.filters[key]}
              </button>
            );
          })}
        </div>

        <div className="price-groups">
          {visible.length ? visible.map((section) => {
            const Icon = sectionIcons[(Number(section.number) - 1) % sectionIcons.length];
            return (
              <section className="price-group" key={section.id ?? section.number}>
                <header className="price-group__header">
                  <span className="price-group__icon"><Icon aria-hidden="true" /></span>
                  <div><h2>{localized(section.title, locale)}</h2><p>{localized(section.subtitle, locale)}</p></div>
                </header>
                <div className="price-table-wrap">
                  <table className="price-table">
                    <thead><tr><th>{c.columns.code}</th><th>{c.columns.service}</th><th>{c.columns.price}</th><th>{c.columns.note}</th><th><span className="sr-only">{c.columns.action}</span></th></tr></thead>
                    <tbody>
                      {section.items.map((item) => {
                        const serviceName = localized(item.name, locale);
                        const helpHref = `/${locale}/contact?service=${encodeURIComponent(serviceName)}#contact-form`;
                        return (
                          <tr key={item.id ?? item.code}>
                            <td data-label={c.columns.code}>{item.code}</td>
                            <td data-label={c.columns.service}><strong>{serviceName}</strong></td>
                            <td data-label={c.columns.price}>{localizedPrice(item.price, locale)}</td>
                            <td data-label={c.columns.note}>{localized(item.note, locale)}</td>
                            <td data-label={c.columns.action}><Link className="price-help-button" href={helpHref}>{c.getHelp}</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          }) : <p className="empty-state">{c.empty}</p>}
        </div>

        <section className="pricing-explainer">
          <span className="pricing-explainer__icon"><BadgeCheck aria-hidden="true" /></span>
          <div className="pricing-explainer__copy"><h2>{c.pricingTitle}</h2><p>{c.pricingText}</p></div>
          <ul>{c.pricingPoints.map((point) => <li key={point}><PackageCheck aria-hidden="true" size={18} />{point}</li>)}</ul>
        </section>
      </section>
    </>
  );
}
