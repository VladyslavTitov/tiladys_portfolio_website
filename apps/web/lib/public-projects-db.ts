import { connection } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@tiladys/db';
import { focusedCategoryIds, focusedPortfolioCategories, resolvePortfolioFilter } from './portfolio-filters';

export type LocalizedText = Record<string, string>;
export type PublicProjectRecord = {
  id: string;
  slug: string;
  category: string;
  seoTitle: LocalizedText | null;
  seoDescription: LocalizedText | null;
  socialTitle: LocalizedText | null;
  socialDescription: LocalizedText | null;
  socialImageId: string | null;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText | null;
  type: LocalizedText | null;
  role: LocalizedText | null;
  workItems: Record<string, string[]> | null;
  projectDate: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  technologies: string[];
  images: Array<{ id: string; alt: LocalizedText | null; sortOrder: number; url: string }>;
};

// Keep the public projection explicit so private/future fields never leak by accident.
const publicProjectSelect = {
  id: true,
  slug: true,
  category: true,
  seoTitle: true,
  seoDescription: true,
  socialTitle: true,
  socialDescription: true,
  socialImageId: true,
  title: true,
  summary: true,
  description: true,
  type: true,
  role: true,
  workItems: true,
  projectDate: true,
  websiteUrl: true,
  githubUrl: true,
  coverImage: true,
  technologies: true,
  images: {
    where: { archivedAt: null },
    select: { id: true, alt: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProjectSelect;

type PublishedProject = Prisma.ProjectGetPayload<{ select: typeof publicProjectSelect }>;

function localized(value: Prisma.JsonValue | null): LocalizedText | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as LocalizedText : null;
}

function workItems(value: Prisma.JsonValue | null): Record<string, string[]> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, string[]> : null;
}

function technologies(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function serialize(project: PublishedProject): PublicProjectRecord {
  return {
    id: project.id,
    slug: project.slug,
    category: project.category,
    seoTitle: localized(project.seoTitle),
    seoDescription: localized(project.seoDescription),
    socialTitle: localized(project.socialTitle),
    socialDescription: localized(project.socialDescription),
    socialImageId: project.socialImageId,
    title: localized(project.title) ?? {},
    summary: localized(project.summary) ?? {},
    description: localized(project.description),
    type: localized(project.type),
    role: localized(project.role),
    workItems: workItems(project.workItems),
    projectDate: project.projectDate?.toISOString() ?? null,
    websiteUrl: project.websiteUrl,
    githubUrl: project.githubUrl,
    coverImage: project.coverImage,
    technologies: technologies(project.technologies),
    images: project.images.map((image) => ({
      id: image.id,
      alt: localized(image.alt),
      sortOrder: image.sortOrder,
      // Same-origin media avoids exposing the protected Control deployment or any bypass secret.
      url: `/api/public/media/${image.id}?v=2`,
    })),
  };
}

export async function getPublishedProjects(options?:{homepageFeatured?:boolean;locale?:string;category?:string;take?:number;skip?:number}): Promise<PublicProjectRecord[]> {
  await connection();
  const rows = await db.project.findMany({
    where: { status: 'PUBLISHED',...(options?.homepageFeatured?{homepageFeatured:true}:{}),...(options?.locale?{AND:['title','summary'].map(key=>({[key]:{path:[options.locale!],not:''}}))}:{}), ...(options?.category?{category:options.category}:{}) },
    ...(options?.take?{take:options.take,skip:options.skip||0}:{}),
    select: publicProjectSelect,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  return rows.map(serialize);
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublicProjectRecord | null> {
  await connection();
  const project = await db.project.findFirst({
    where: {
      status: 'PUBLISHED',
      OR: [{ slug }, { slugAliases: { some: { slug } } }],
    },
    select: publicProjectSelect,
  });
  return project ? serialize(project) : null;
}

// The browsing grid needs one cover and public card text, not full case-study/SEO data.
const portfolioCardSelect = {
  id: true, slug: true, category: true, title: true, summary: true, coverImage: true,
  images: {where: {archivedAt: null}, take: 1, select: {id: true, alt: true, sortOrder: true}, orderBy: [{sortOrder: 'asc'}, {id: 'asc'}]},
} satisfies Prisma.ProjectSelect;

/** A bounded database page. Only published, localized public text participates. */
export async function getPublishedPortfolio(locale:string, query:{category?:string;filter?:string;q?:string;page?:string}) {
  await connection();
  const language = ['en','de','uk','ru','sk','fr'].includes(locale) ? locale : 'en';
  const filter = resolvePortfolioFilter(query);
  const search=(query.q||'').trim().slice(0,120);
  const pattern=`%${search.replace(/[\\%_]/g,'\\$&')}%`;
  const constraints=[Prisma.sql`"status"='PUBLISHED'`,Prisma.sql`length(btrim(COALESCE("title"->>${language},'')))>0 AND length(btrim(COALESCE("summary"->>${language},'')))>0`];
  if(filter==='services')constraints.push(Prisma.sql`"category" NOT IN (${Prisma.join(focusedCategoryIds)})`);
  else if(filter!=='all')constraints.push(Prisma.sql`"category" IN (${Prisma.join(focusedPortfolioCategories[filter])})`);
  if(search)constraints.push(Prisma.sql`(COALESCE("title"->>${language},"title"->>'en','') ILIKE ${pattern} OR COALESCE("summary"->>${language},"summary"->>'en','') ILIKE ${pattern})`);
  const where=Prisma.join(constraints,' AND ');
  const counts=await db.$queryRaw<Array<{total:bigint}>>(Prisma.sql`SELECT COUNT(*) AS total FROM "Project" WHERE ${where}`);
  const total=Number(counts[0].total);
  const requested=Number(query.page);const page=Math.min(Math.max(1,Number.isSafeInteger(requested)?requested:1),Math.max(1,Math.ceil(total/12)));
  const ids=await db.$queryRaw<Array<{id:string}>>(Prisma.sql`SELECT "id" FROM "Project" WHERE ${where} ORDER BY "sortOrder" ASC,"updatedAt" DESC,"id" ASC LIMIT 12 OFFSET ${(page-1)*12}`);
  const rows=ids.length?await db.project.findMany({where:{status:'PUBLISHED',id:{in:ids.map(r=>r.id)}},select:portfolioCardSelect}):[];
  const byId=new Map(rows.map(row=>[row.id,row]));
  const projects=ids.flatMap(({id})=>{
    const row=byId.get(id);return row?[{id:row.id,slug:row.slug,category:row.category,title:localized(row.title)??{},summary:localized(row.summary)??{},coverImage:row.coverImage,images:row.images.map(image=>({id:image.id,alt:localized(image.alt),sortOrder:image.sortOrder,url:`/api/public/media/${image.id}?v=2`}))}]:[];
  });
  return {projects,total,page,filter};
}

export async function publishedProjectSitemap(){return db.project.findMany({where:{status:'PUBLISHED'},select:{slug:true,title:true,summary:true,updatedAt:true}});}
