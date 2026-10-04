import type { Prisma } from '@prisma/client';
import { db } from '@tiladys/db';

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

export async function getPublishedProjects(): Promise<PublicProjectRecord[]> {
  const rows = await db.project.findMany({
    where: { status: 'PUBLISHED' },
    select: publicProjectSelect,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  return rows.map(serialize);
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublicProjectRecord | null> {
  const project = await db.project.findFirst({
    where: {
      status: 'PUBLISHED',
      OR: [{ slug }, { slugAliases: { some: { slug } } }],
    },
    select: publicProjectSelect,
  });
  return project ? serialize(project) : null;
}
