import type { Prisma } from '@prisma/client';

// Explicit publication boundary, including when new schema fields are added.
export const publicProjectSelect = {
  id: true, slug: true, category: true, featured: true,
  title: true, summary: true, description: true, type: true, role: true,
  workItems: true, projectDate: true, websiteUrl: true, githubUrl: true,
  coverImage: true, technologies: true,
  images: { select: { id: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.ProjectSelect;

type PublishedProject = Prisma.ProjectGetPayload<{ select: typeof publicProjectSelect }>;
export function publicProject(project: PublishedProject, origin: string) {
  return {
    id: project.id, slug: project.slug, category: project.category, featured: project.featured,
    title: project.title, summary: project.summary, description: project.description,
    type: project.type, role: project.role, workItems: project.workItems,
    projectDate: project.projectDate, websiteUrl: project.websiteUrl, githubUrl: project.githubUrl,
    coverImage: project.coverImage, technologies: project.technologies,
    images: project.images.map((image) => ({ id: image.id, alt: image.alt, sortOrder: image.sortOrder,
      url: `${origin}/api/public/media/${image.id}?v=2` })),
  };
}
