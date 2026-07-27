import { NextResponse } from 'next/server';
import { db } from '@tiladys/db';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await db.projectImage.findUnique({ where: { id }, select: { data: true, mimeType: true, filename: true } });
  if (!image) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Disposition': `inline; filename="${image.filename.replace(/[\r\n"\\]/g, '')}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
