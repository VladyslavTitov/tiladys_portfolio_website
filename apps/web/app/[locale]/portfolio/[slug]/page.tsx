/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Code2, ExternalLink, Github, Layers3, Link2 } from 'lucide-react';
import { ContactCta } from '@/components/ContactCta';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import { p } from '@/lib/page-copy';
import { projectCategoryLabel, projectLinksAvailable } from '@/lib/project-categories';

type Localized = Record<string, string>;
type ProjectImage = { id: string; url: string; alt?: Localized | null; sortOrder: number };
type ProjectDetail = {
  id: string;
  slug: string;
  category: string;
  title: Localized;
  summary: Localized;
  description?: Localized | null;
  type?: Localized | null;
  role?: Localized | null;
  workItems?: Record<string, string[]> | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  coverImage?: string | null;
  technologies?: string[] | null;
  projectDate?: string | null;
  images?: ProjectImage[];
};

function translated(value: Localized | undefined | null, locale: string) {
  return value?.[locale] || value?.en || value?.ru || '';
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  try {
    const project = await api<ProjectDetail>(`/api/public/projects/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    const title = translated(project.title, locale);
    const description = translated(project.summary, locale);
    return { title: title || p(locale).project.notFound, description };
  } catch {
    return { title: p(locale).project.notFound };
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const c = p(locale).project;
  let project: ProjectDetail | null = null;
  try {
    project = await api<ProjectDetail>(`/api/public/projects/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  } catch {}
  if (!project) notFound();

  const title = translated(project.title, locale);
  const summary = translated(project.summary, locale);
  const description = translated(project.description, locale);
  const role = translated(project.role, locale);
  const type = translated(project.type, locale);
  const workItems: string[] = project.workItems?.[locale] || project.workItems?.en || project.workItems?.ru || [];
  const images: ProjectImage[] = project.images ?? [];
  const cover = images[0]?.url || project.coverImage || '/portfolio/placeholders/project-2.png';
  const date = project.projectDate ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(project.projectDate)) : '—';
  const category = projectCategoryLabel(project.category, locale);
  const linksLabel = projectLinksAvailable(locale);

  return (
    <Shell locale={locale}>
      <section className="project-detail-hero">
        <div className="project-detail-hero__inner">
          <div className="project-detail-hero__copy">
            <span className="project-detail-hero__category">{category}</span>
            <h1>{title}</h1><p>{summary}</p>
            <div className="project-detail-hero__actions">
              {project.websiteUrl ? <Link className="primary" href={project.websiteUrl} target="_blank" rel="noreferrer">{c.visitWebsite}<ExternalLink aria-hidden="true" size={18} /></Link> : null}
              {project.githubUrl ? <Link className="secondary secondary--dark" href={project.githubUrl} target="_blank" rel="noreferrer"><Github aria-hidden="true" size={18} />{c.viewRepository}</Link> : null}
              <Link className="secondary secondary--dark" href={`/${locale}/portfolio`}><ArrowLeft aria-hidden="true" size={18} />{c.back}</Link>
            </div>
          </div>
          <div className="project-detail-hero__image"><img src={cover} alt={title} /></div>
        </div>
        <div className="project-meta">
          <div><CalendarDays aria-hidden="true" /><span><strong>{c.completed}</strong>{date}</span></div>
          <div><Layers3 aria-hidden="true" /><span><strong>{c.category}</strong>{category}</span></div>
          <div><Code2 aria-hidden="true" /><span><strong>{c.type}</strong>{type || '—'}</span></div>
          <div><Link2 aria-hidden="true" /><span><strong>{c.links}</strong>{project.websiteUrl || project.githubUrl ? linksLabel : '—'}</span></div>
        </div>
      </section>

      <section className="section project-detail-content">
        <div className="project-detail-copy">
          <h2>{c.about}</h2><p>{description || summary}</p>
          {role ? <><h2>{c.role}</h2><p>{role}</p></> : null}
          {workItems.length ? <><h2>{c.work}</h2><ul>{workItems.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></> : null}
        </div>
        <div className="project-detail-main-image"><img src={cover} alt={title} /></div>
      </section>

      {images.length ? <section className="section project-gallery-section"><h2>{c.screenshots}</h2><div className={`project-gallery project-gallery--${Math.min(images.length, 4)}`}>{images.map((image) => <figure key={image.id}><img src={image.url} alt={translated(image.alt, locale) || title} /></figure>)}</div></section> : null}
      {project.technologies?.length ? <section className="section project-tools"><h2>{c.tools}</h2><div>{project.technologies.map((tool: string) => <span key={tool}>{tool}</span>)}</div></section> : null}
      <ContactCta locale={locale} title={c.similarTitle} text={c.similarText} />
    </Shell>
  );
}
