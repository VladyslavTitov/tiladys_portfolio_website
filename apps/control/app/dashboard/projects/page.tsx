import { db } from '@tiladys/db';
import { ProjectManager } from './project-manager';

export default async function ProjectsPage() {
  const rows = await db.project.findMany({
    include: { images: { select: { id: true, filename: true, size: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  const projects = rows.map((project) => ({
    ...project,
    projectDate: project.projectDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    images: project.images.map((image) => ({ ...image, url: `/api/public/media/${image.id}` })),
  }));

  return (
    <>
      <h1>Portfolio projects</h1>
      <p className="admin-intro">Create, translate, publish and edit portfolio projects. Each project can contain 1–10 images.</p>
      <ProjectManager initialProjects={projects as unknown as Array<Record<string, unknown>>} />
    </>
  );
}
