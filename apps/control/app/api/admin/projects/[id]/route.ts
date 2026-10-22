import { reserveProjectSlug, validateSocialImage } from '@/lib/project-slugs';
import { z } from 'zod';
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';
import { parseProjectPayload, projectData } from '@/lib/projects';

export const runtime = 'nodejs';

function projectError(error: unknown, fallback: 'PROJECT_UPDATE_FAILED' | 'PROJECT_DELETE_FAILED') {
  const message = error instanceof Error ? error.message : fallback;
  const details = error instanceof Error && 'details' in error
    ? (error as Error & { details?: unknown }).details
    : undefined;
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : '';

  if(message==='STALE_WRITE')return NextResponse.json({error:message},{status:409});
  if(message==='PUBLICATION_REVIEW_REQUIRED')return NextResponse.json({error:message},{status:422});
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: message }, { status: 401 });
  if (message === 'INVALID_ORIGIN') return NextResponse.json({ error: message }, { status: 403 });
  if (message === 'INVALID_SOCIAL_IMAGE') return NextResponse.json({ error: message }, { status: 400 });
  if (message === 'PROJECT_SLUG_EXISTS' || code === 'P2002' || message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: 'PROJECT_SLUG_EXISTS', details: { issues: [{ path: 'slug', message: 'This slug is already used by another project.' }] } },
      { status: 409 },
    );
  }
  if (code === 'P2025') return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  if (message.startsWith('INVALID_')) return NextResponse.json({ error: message, details }, { status: 400 });

  console.error(`[${fallback}]`);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

function imageIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((value): value is string => typeof value === 'string' && value.length > 0))].slice(0, 10);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const payload = parseProjectPayload(body?.payload ?? body);
    const removeImageIds = imageIds(body?.removeImageIds);
    const imageMetadata = body.imageMetadata === undefined ? undefined : z.array(z.object({id:z.string(),alt:z.record(z.enum(['en','de','uk','ru','sk','fr']),z.string().max(500))})).max(10).parse(body.imageMetadata);

    const row = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Project" WHERE "id"=${id} FOR UPDATE`);
      const current=await tx.project.findUniqueOrThrow({where:{id},select:{updatedAt:true}});
      if(typeof body.expectedUpdatedAt!=='string'||body.expectedUpdatedAt!==current.updatedAt.toISOString())throw Error('STALE_WRITE');
      if(payload.status==='PUBLISHED'&&(body.publicationConfirmed!==true||!await tx.projectImage.count({where:{projectId:id,archivedAt:null}})))throw Error('PUBLICATION_REVIEW_REQUIRED');
      await reserveProjectSlug(tx, payload.slug, id);
      if (removeImageIds.length) {
        if(await tx.projectImage.count({where:{projectId:id,archivedAt:null,id:{in:removeImageIds}}})!==removeImageIds.length)throw Error('INVALID_IMAGE_RELATIONSHIP');
        await tx.projectImage.updateMany({ where: { projectId: id, id: { in: removeImageIds } }, data: { archivedAt: new Date() } });
      }
      if(payload.status==='PUBLISHED'&&!await tx.projectImage.count({where:{projectId:id,archivedAt:null}}))throw Error('PUBLICATION_REVIEW_REQUIRED');
      if(imageMetadata) {
        const active = await tx.projectImage.findMany({where:{projectId:id,archivedAt:null},select:{id:true}});
        if(new Set(imageMetadata.map(im=>im.id)).size!==imageMetadata.length || active.length!==imageMetadata.length || active.some(im=>!imageMetadata.some(m=>m.id===im.id))) throw Error('INVALID_IMAGE_RELATIONSHIP');
        for(const [sortOrder,image] of imageMetadata.entries()) await tx.projectImage.update({where:{id:image.id},data:{sortOrder,alt:image.alt}});
      }
      await validateSocialImage(tx, payload.socialImageId, id);
      const row = await tx.project.update({
        where: { id },
        data: projectData(payload),
        include: { images: { where: { archivedAt: null }, select: { id: true, filename: true, size: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } } },
      });
      await tx.auditLog.create({ data: { userId: user.id, action: payload.status==='PUBLISHED'?'PROJECT_PUBLISH':'PROJECT_UPDATE', entity: 'Project', entityId: id } });
      return row;
    });
    return NextResponse.json(row);
  } catch (error) {
    return projectError(error, 'PROJECT_UPDATE_FAILED');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id } = await params;
    await db.project.update({where:{id},data:{status:'ARCHIVED'}});
    await db.auditLog.create({ data: { userId: user.id, action: 'PROJECT_ARCHIVE', entity: 'Project', entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return projectError(error, 'PROJECT_DELETE_FAILED');
  }
}
