import { NextRequest, NextResponse } from 'next/server';
import { reserveProjectSlug, validateSocialImage } from '@/lib/project-slugs';
import { db } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';
import { parseProjectPayload, projectData } from '@/lib/projects';

export const runtime = 'nodejs';

function projectError(error: unknown) {
  const message = error instanceof Error ? error.message : 'PROJECT_CREATE_FAILED';
  const details = error instanceof Error && 'details' in error
    ? (error as Error & { details?: unknown }).details
    : undefined;
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : '';

  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: message }, { status: 401 });
  if (message === 'INVALID_ORIGIN') return NextResponse.json({ error: message }, { status: 403 });
  if (message === 'INVALID_SOCIAL_IMAGE') return NextResponse.json({ error: message }, { status: 400 });
  if (message === 'PROJECT_SLUG_EXISTS' || code === 'P2002' || message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: 'PROJECT_SLUG_EXISTS', details: { issues: [{ path: 'slug', message: 'This slug is already used by another project.' }] } },
      { status: 409 },
    );
  }
  if (message === 'INVALID_PROJECT') {
    return NextResponse.json({ error: message, details }, { status: 400 });
  }

  console.error('[PROJECT_CREATE_FAILED]');
  return NextResponse.json({ error: 'PROJECT_CREATE_FAILED' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const payload = parseProjectPayload(await req.json());
    const row = await db.$transaction(async (tx) => {
      await reserveProjectSlug(tx, payload.slug);
      await validateSocialImage(tx, payload.socialImageId);
      const row = await tx.project.create({
        data: projectData(payload),
        include: { images: { select: { id: true, filename: true, size: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } } },
      });
      await tx.auditLog.create({ data: { userId: user.id, action: 'PROJECT_CREATE', entity: 'Project', entityId: row.id } });
      return row;
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return projectError(error);
  }
}
