import type { Prisma } from '@prisma/client';

// All project create/rename writers take the same transaction-scoped lock.
// This protects the namespace shared by current slugs and historical aliases,
// including concurrent creates/renames across different server instances.
export async function reserveProjectSlug(tx: Prisma.TransactionClient, slug: string, projectId?: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(746452901)`;
  const [current, alias] = await Promise.all([
    tx.project.findUnique({ where: { slug }, select: { id: true } }),
    tx.projectSlugAlias.findUnique({ where: { slug }, select: { projectId: true } }),
  ]);
  if ((current && current.id !== projectId) || (alias && alias.projectId !== projectId)) {
    throw new Error('PROJECT_SLUG_EXISTS');
  }
  if (projectId) {
    const previous = await tx.project.findUniqueOrThrow({ where: { id: projectId }, select: { slug: true } });
    if (previous.slug !== slug) {
      await tx.projectSlugAlias.upsert({
        where: { slug: previous.slug }, create: { slug: previous.slug, projectId }, update: {},
      });
      // Renaming back to an owned historical slug is safe; it becomes canonical again.
      await tx.projectSlugAlias.deleteMany({ where: { slug, projectId } });
    }
  }
}

export async function validateSocialImage(tx: Prisma.TransactionClient, imageId: string | undefined, projectId?: string) {
  if (!imageId) return;
  if (!projectId || !await tx.projectImage.findFirst({ where: { id: imageId, projectId }, select: { id: true } })) {
    throw new Error('INVALID_SOCIAL_IMAGE');
  }
}
