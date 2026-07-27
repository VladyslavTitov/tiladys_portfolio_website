import type { Prisma } from "@prisma/client";
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

  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: message }, { status: 401 });
  if (message === 'INVALID_ORIGIN') return NextResponse.json({ error: message }, { status: 403 });
  if (code === 'P2002' || message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: 'PROJECT_SLUG_EXISTS', details: { issues: [{ path: 'slug', message: 'This slug is already used by another project.' }] } },
      { status: 409 },
    );
  }
  if (code === 'P2025') return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  if (message === 'INVALID_PROJECT') return NextResponse.json({ error: message, details }, { status: 400 });

  console.error(`[${fallback}]`, error);
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

    const row = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {      
        if (removeImageIds.length) {
        await tx.projectImage.deleteMany({ where: { projectId: id, id: { in: removeImageIds } } });
      }
      return tx.project.update({
        where: { id },
        data: projectData(payload),
        include: { images: { select: { id: true, filename: true, size: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } } },
      });
    });
    await db.auditLog.create({ data: { userId: user.id, action: 'PROJECT_UPDATE', entity: 'Project', entityId: id } });
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
    await db.project.delete({ where: { id } });
    await db.auditLog.create({ data: { userId: user.id, action: 'PROJECT_DELETE', entity: 'Project', entityId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return projectError(error, 'PROJECT_DELETE_FAILED');
  }
}
