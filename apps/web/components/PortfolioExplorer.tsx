'use client';

/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Code2, Headphones, Layers3, MonitorCog, Paintbrush, Server, Sparkles } from 'lucide-react';
import { p } from '@/lib/page-copy';

export type PublicProject = {
  id: string;
  slug: string;
  category: string;
  featured: boolean;
  title: Record<string, string>;
  summary: Record<string, string>;
  coverImage?: string | null;
  images?: Array<{ id: string; url: string; alt?: Record<string, string> | null; sortOrder: number }>;
};

type Filter = 'all' | 'web' | 'pc' | 'design' | 'linux' | 'digital';
const filterIcons = { all: Layers3, web: Code2, pc: MonitorCog, design: Paintbrush, linux: Server, digital: Headphones } as const;

function groupFor(category: string): Exclude<Filter, 'all'> {
  if (category === 'web-development') return 'web';
  if (category === 'pc-support') return 'pc';
  if (category === 'design') return 'design';
  if (category === 'linux-servers') return 'linux';
  return 'digital';
}

function translated(value: Record<string, string> | undefined, locale: string) {
  return value?.[locale] || value?.en || value?.ru || '';
}

function imageFor(project: PublicProject) {
  return project.images?.[0]?.url || project.coverImage || '/portfolio/placeholders/project-2.png';
}

export function PortfolioExplorer({ locale, projects }: { locale: string; projects: PublicProject[] }) {
  const c = p(locale).portfolio;
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(() => projects.filter((project) => filter === 'all' || groupFor(project.category) === filter), [filter, projects]);
  const featured = visible.find((project) => project.featured) ?? visible[0];
  const cards = featured ? visible.filter((project) => project.id !== featured.id) : visible;

  return (
    <section className="section portfolio-content">
      <div className="filter-bar portfolio-filter" role="tablist" aria-label={c.filters.all}>
        {(Object.keys(c.filters) as Filter[]).map((key) => {
          const Icon = filterIcons[key];
          return <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}><Icon aria-hidden="true" size={20} />{c.filters[key]}</button>;
        })}
      </div>

      {!visible.length ? <div className="empty-state"><Sparkles aria-hidden="true" /><p>{c.empty}</p></div> : null}

      {featured ? (
        <article className="featured-project">
          <div className="featured-project__copy">
            <span>{c.featured}</span>
            <h2>{translated(featured.title, locale)}</h2>
            <p>{translated(featured.summary, locale)}</p>
            <Link className="primary" href={`/${locale}/portfolio/${featured.slug}`}>{c.viewCase}<ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
          <div className="featured-project__image"><img src={imageFor(featured)} alt={translated(featured.title, locale)} /></div>
        </article>
      ) : null}

      {cards.length ? (
        <div className="portfolio-grid">
          {cards.map((project) => (
            <article className="portfolio-card" key={project.id}>
              <Link href={`/${locale}/portfolio/${project.slug}`} className="portfolio-card__image"><img src={imageFor(project)} alt={translated(project.title, locale)} /></Link>
              <div className="portfolio-card__body"><h2>{translated(project.title, locale)}</h2><p>{translated(project.summary, locale)}</p><Link href={`/${locale}/portfolio/${project.slug}`}>{c.viewProject}<ArrowRight aria-hidden="true" size={17} /></Link></div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
