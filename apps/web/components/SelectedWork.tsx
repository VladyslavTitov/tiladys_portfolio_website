import { cardImageSizes } from '@/lib/image-sizes';
import Link from 'next/link';
import { getPublishedProjects, type PublicProjectRecord } from '@/lib/public-projects-db';
import { rebuildCopy } from '@/lib/rebuild-copy';
import { ProjectImage } from './ProjectImage';
export async function SelectedWork({ locale, category, excludeId, featuredOnly=false }: { locale: string; category?: string;excludeId?:string;featuredOnly?:boolean }) {
 const c = rebuildCopy(locale);
 let projects: PublicProjectRecord[];
 try { projects = await getPublishedProjects({locale,category,take:4,homepageFeatured:featuredOnly}); projects=projects.filter(p=>p.id!==excludeId).slice(0,3); } catch { return <section className="section" role="status"><h2>{c.work}</h2><p>{c.unavailable}</p><Link href={`/${locale}/portfolio`}>{c.projects}</Link></section>; }
  return <section className="section"><div className="rebuild-section-heading"><h2>{c.work}</h2><Link href={`/${locale}/portfolio${category ? `?category=${category}` : ''}`}>{c.projects} →</Link></div>{projects.length ? <div className="rebuild-grid">{projects.map(p => <article className="rebuild-card" key={p.id}><ProjectImage src={p.images[0]?.url} alt={p.images[0]?.alt?.[locale] || p.title[locale] || p.title.en || ''} sizes={cardImageSizes} /><div><h3><Link href={`/${locale}/portfolio/${p.slug}`}>{p.title[locale] || p.title.en}</Link></h3><p>{p.summary[locale] || p.summary.en}</p></div></article>)}</div> : <p className="rebuild-state">{c.empty}</p>}</section>;

}
