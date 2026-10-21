'use client';

import {useEffect, useRef, useState, useTransition} from 'react';
import Link from 'next/link';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {ArrowRight, Box, Code2, Layers3, Search, Server, Wrench, X} from 'lucide-react';
import {portfolioImageSizes} from '@/lib/image-sizes';
import {portfolioBrowseCopy, portfolioFilters, publicPortfolioCategory, resolvePortfolioFilter, type PortfolioFilter} from '@/lib/portfolio-filters';
import {p} from '@/lib/page-copy';
import interfaceCopy from '@/content/interface.json';
import {ProjectImage} from './ProjectImage';

export type PublicProject = {
  id: string; slug: string; category: string;
  title: Record<string, string>; summary: Record<string, string>;
  coverImage?: string | null;
  images?: Array<{id: string; url: string; alt?: Record<string, string> | null; sortOrder: number}>;
};
const filterIcons = {all: Layers3, websites: Code2, services: Wrench, '3d-printing': Box, 'linux-servers': Server};
const translated = (value: Record<string, string> | null | undefined, locale: string) => value?.[locale] || value?.en || '';

export function PortfolioExplorer({locale, projects, total, page, filter}: {
  locale: string; projects: PublicProject[]; total: number; page: number; filter: PortfolioFilter;
}) {
  const copy=portfolioBrowseCopy(locale), c=p(locale).portfolio;
  const ui=interfaceCopy[locale as keyof typeof interfaceCopy] ?? interfaceCopy.en;
  const query=useSearchParams(), router=useRouter(), path=usePathname();
  const signature=query.toString(), search=query.get('q') || '';
  const [draft,setDraft]=useState(search), [pending,startTransition]=useTransition();
  const timer=useRef<ReturnType<typeof setTimeout> | null>(null);
  const desired=useRef(signature), ownNavigations=useRef(new Set<string>());
  const cancelDebounce=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};

  // Keep back/forward and external links in sync without overwriting newer typing
  // when a slower, earlier search response commits.
  useEffect(()=>{
    if(ownNavigations.current.delete(signature))return;
    desired.current=signature;
    setDraft(new URLSearchParams(signature).get('q') || '');
  },[signature]);
  useEffect(()=>{
    const restore=()=>{
      if(timer.current!==null)clearTimeout(timer.current);
      timer.current=null;ownNavigations.current.clear();
      desired.current=window.location.search.slice(1);
      setDraft(new URLSearchParams(desired.current).get('q') || '');
    };
    window.addEventListener('popstate',restore);
    return ()=>{window.removeEventListener('popstate',restore);if(timer.current!==null)clearTimeout(timer.current);};
  },[]);

  function update(values: {q?: string; filter?: PortfolioFilter; page?: string}) {
    const next=new URLSearchParams(desired.current);
    // Existing category/filter links remain understood by the server. New actions
    // write one canonical public group and never leave a hidden category constraint.
    const current=resolvePortfolioFilter({filter:next.get('filter')||undefined,category:next.get('category')||undefined});
    next.delete('category');
    if(!('filter' in values)){if(current==='all')next.delete('filter');else next.set('filter',current);}
    for(const [key,value] of Object.entries(values)){
      const normalized=key==='q'?value.trim():value;
      if(normalized&&normalized!=='all')next.set(key,normalized);else next.delete(key);
    }
    if(!('page' in values))next.delete('page');
    desired.current=next.toString();ownNavigations.current.add(desired.current);
    startTransition(()=>router.push(`${path}${desired.current?`?${desired.current}`:''}`,{scroll:false}));
  }
  function changeSearch(value: string) {
    setDraft(value);cancelDebounce();
    timer.current=setTimeout(()=>{timer.current=null;update({q:value});},300);
  }
  const filtered=Boolean(search.trim())||filter!=='all';
  return <section className="section portfolio-content">
    <div className="portfolio-toolbar">
      <form className="portfolio-search" role="search" aria-label={copy.search} onSubmit={event=>{event.preventDefault();cancelDebounce();update({q:draft});}}>
        <label className="sr-only" htmlFor="portfolio-search">{copy.search}</label>
        <Search aria-hidden="true" size={20}/>
        <input id="portfolio-search" type="search" name="q" maxLength={120} value={draft} onChange={event=>changeSearch(event.target.value)} placeholder={copy.placeholder}/>
        {draft?<button type="button" aria-label={copy.clear} onClick={()=>{cancelDebounce();setDraft('');update({q:''});document.getElementById('portfolio-search')?.focus();}}><X aria-hidden="true" size={18}/></button>:null}
      </form>
      <div className="portfolio-filter" role="group" aria-label={copy.filters.all}>
        {portfolioFilters.map(key=>{const Icon=filterIcons[key];return <button key={key} type="button" aria-pressed={filter===key} className={filter===key?'is-active':''} onClick={()=>{cancelDebounce();update({filter:key,q:draft});}}><Icon aria-hidden="true" size={18}/>{copy.filters[key]}</button>;})}
      </div>
    </div>
    <p className="portfolio-result-count" role="status" aria-live="polite" aria-atomic="true">{pending?copy.updating:`${copy.results}: ${new Intl.NumberFormat(locale).format(total)}`}</p>
    <div className="portfolio-results" aria-busy={pending}>
      {projects.length?<div className="portfolio-grid">{projects.map(project=>{
        const title=translated(project.title,locale), cover=project.images?.[0];
        const contain=project.category==='3d-printing';
        const fallback=<span className="portfolio-card__placeholder" role="img" aria-label={`${copy.preview}: ${title}`}><Layers3 aria-hidden="true" size={36}/><strong>TiLADYS</strong><small>{copy.preview}</small></span>;
        return <article className="portfolio-card" key={project.id}>
          <Link href={`/${locale}/portfolio/${project.slug}`} className={`portfolio-card__image${contain?' portfolio-card__image--contain':''}`} aria-label={title}>
            <ProjectImage src={cover?.url||project.coverImage} alt={translated(cover?.alt,locale)||title} sizes={portfolioImageSizes} fallback={fallback}/>
          </Link>
          <div className="portfolio-card__body">
            <span className="portfolio-card__category">{copy.filters[publicPortfolioCategory(project.category)]}</span>
            <h2><Link href={`/${locale}/portfolio/${project.slug}`}>{title}</Link></h2>
            <p>{translated(project.summary,locale)}</p>
            <Link className="portfolio-card__action" href={`/${locale}/portfolio/${project.slug}`}>{c.viewProject}<ArrowRight aria-hidden="true" size={17}/></Link>
          </div>
        </article>;
      })}</div>:<div className="portfolio-empty"><Layers3 aria-hidden="true" size={36}/><h2>{filtered?copy.noMatches:copy.empty}</h2>{filtered?<button className="secondary" type="button" onClick={()=>{cancelDebounce();setDraft('');update({q:'',filter:'all'});}}>{copy.reset}</button>:<p>{copy.emptyText}</p>}</div>}
    </div>
    {total>12?<nav className="record-pagination" aria-label={copy.page}>
      <button className="secondary" aria-label={ui.previous} disabled={page<=1||pending} onClick={()=>{cancelDebounce();update({q:draft,page:String(page-1)});}}>←</button>
      <span>{page} / {Math.ceil(total/12)}</span>
      <button className="secondary" aria-label={ui.next} disabled={page*12>=total||pending} onClick={()=>{cancelDebounce();update({q:draft,page:String(page+1)});}}>→</button>
    </nav>:null}
  </section>;
}
