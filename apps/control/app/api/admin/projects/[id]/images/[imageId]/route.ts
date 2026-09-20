import { NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser } from '@/lib/security';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    await requireUser();
    const { id, imageId } = await params;
    const image = await db.projectImage.findFirst({ where: { id: imageId, projectId: id }, select: { data: true, mimeType: true } });
    if (!image) return new NextResponse('Not found', { status: 404, headers });
    return new NextResponse(new Uint8Array(image.data), { headers: { ...headers, 'Content-Type': image.mimeType } });
  } catch { return new NextResponse('Unauthorized', { status: 401, headers }); }
}
