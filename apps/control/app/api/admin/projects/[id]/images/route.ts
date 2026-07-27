import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';
import { MAX_PROJECT_IMAGES, parseProjectImage } from '@/lib/projects';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id } = await params;
    const count = await db.projectImage.count({ where: { projectId: id } });
    if (count >= MAX_PROJECT_IMAGES) return NextResponse.json({ error: 'TOO_MANY_IMAGES' }, { status: 400 });

    const maxSort = await db.projectImage.aggregate({ where: { projectId: id }, _max: { sortOrder: true } });
    const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    const form = await req.formData();
    const imageData = await parseProjectImage(form.get('image'), sortOrder);
    const image = await db.projectImage.create({
      data: { projectId: id, ...imageData },
      select: { id: true, filename: true, size: true, sortOrder: true },
    });
    await db.auditLog.create({ data: { userId: user.id, action: 'PROJECT_IMAGE_CREATE', entity: 'Project', entityId: id, metadata: { imageId: image.id } } });
    return NextResponse.json({ ...image, url: `/api/public/media/${image.id}` }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'IMAGE_UPLOAD_FAILED';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'INVALID_ORIGIN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
