'use client';



import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ProjectImage } from './ProjectImage';
import interfaceCopy from '@/content/interface.json';
import { ArrowRight, Code2, Headphones, Layers3, MonitorCog, Paintbrush, Server, Sparkles } from 'lucide-react';
import { p } from '@/lib/page-copy';

export type PublicProject = {
  id: string;
  slug: string;
  category: string;
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
  return project.images?.[0]?.url || project.coverImage || '/services/tiladys-service-website-creation.png';
}

export function PortfolioExplorer({ locale, projects }: { locale: string; projects: PublicProject[] }) {
  const c = p(locale).portfolio;
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(() => projects.filter((project) => filter === 'all' || groupFor(project.category) === filter), [filter, projects]);
  // Both presentations intentionally use the same published, category-filtered list.
  const candidates = visible;
  const cards = visible;

  return (
    <section className="section portfolio-content">
      <div className="filter-bar portfolio-filter" role="tablist" aria-label={c.filters.all}>
        {(Object.keys(c.filters) as Filter[]).map((key) => {
          const Icon = filterIcons[key];
          return <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'is-active' : ''} onClick={() => setFilter(key)}><Icon aria-hidden="true" size={20} />{c.filters[key]}</button>;
        })}
      </div>

      {!visible.length ? <div className="empty-state"><Sparkles aria-hidden="true" /><p>{c.empty}</p></div> : null}

      {candidates.length ? <FeaturedRotation key={`${filter}:${candidates.map((project) => project.id).join(',')}`} candidates={candidates} locale={locale} /> : null}

      {cards.length ? (
        <div className="portfolio-grid">
          {cards.map((project) => (
            <article className="portfolio-card" key={project.id}>
              <Link href={`/${locale}/portfolio/${project.slug}`} className="portfolio-card__image"><ProjectImage src={imageFor(project)} alt={translated(project.title, locale)} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw" /></Link>
              <div className="portfolio-card__body"><h2>{translated(project.title, locale)}</h2><p>{translated(project.summary, locale)}</p><Link href={`/${locale}/portfolio/${project.slug}`}>{c.viewProject}<ArrowRight aria-hidden="true" size={17} /></Link></div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}
const reducedSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hiddenSnapshot = () => document.hidden;
const serverPaused = () => true;

function FeaturedRotation({ candidates, locale }: { candidates: PublicProject[]; locale: string }) {
  const c = p(locale).portfolio;
  const ui = interfaceCopy[locale as keyof typeof interfaceCopy] ?? interfaceCopy.en;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribeMotion, reducedSnapshot, serverPaused);
  const hidden = useSyncExternalStore(subscribeVisibility, hiddenSnapshot, serverPaused);
  const rotating = candidates.length > 1 && !paused && !hovered && !focused && !hidden && !reduced;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (document.hidden || region.current?.contains(document.activeElement) || region.current?.matches(':hover')) return;
      setIndex((current) => (current + 1) % candidates.length);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [rotating, candidates.length]);
  const featured = candidates[index];
  return <div ref={region} className="featured-rotation" role="region" aria-label={ui.featured}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <article className="featured-project" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
      <div className="featured-project__copy">
        <span>{c.featured}</span><h2>{translated(featured.title, locale)}</h2><p>{translated(featured.summary, locale)}</p>
        <Link className="primary" href={`/${locale}/portfolio/${featured.slug}`}>{c.viewCase}<ArrowRight aria-hidden="true" size={18} /></Link>
      </div>
      <div className="featured-project__image"><ProjectImage src={imageFor(featured)} alt={translated(featured.title, locale)} sizes="(max-width: 900px) 100vw, 55vw" /></div>
    </article>
    {candidates.length > 1 ? <div className="featured-controls">
      <button type="button" onClick={() => setIndex((current) => (current + candidates.length - 1) % candidates.length)}>{ui.previous}</button>
      <span aria-live="polite">{index + 1} / {candidates.length}</span>
      <button type="button" onClick={() => setIndex((current) => (current + 1) % candidates.length)}>{ui.next}</button>
      {!reduced ? <button type="button" aria-pressed={paused} onClick={() => setPaused((current) => !current)}>{paused ? ui.resume : ui.pause}</button> : null}
    </div> : null}
  </div>;
}
