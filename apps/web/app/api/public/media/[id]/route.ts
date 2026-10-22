import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { publicThumbnail } from '@/lib/public-thumbnail';

export const runtime = 'nodejs';

const responseHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const width = req.nextUrl.searchParams.get('w');
  const size = width === null ? null : Number(width);
  if (size !== null && (!Number.isInteger(size) || size < 16 || size > 1920)) {
    return new NextResponse('Invalid size', { status: 400, headers: responseHeaders });
  }
  // Always validate publication live, including when a derivative is cached.
  // Hot thumbnail requests fetch no original image bytes from Postgres.
  const image = await db.projectImage.findFirst({
    where: { id, archivedAt: null, project: { status: 'PUBLISHED' } },
    select: { id: true, ...(size === null ? { data: true, mimeType: true } : {}) },
  });
  if (!image) return new NextResponse('Not found', { status: 404, headers: responseHeaders });

  if (size !== null) {
    try {
      const data = await publicThumbnail('project', id, size);
      return new NextResponse(new Uint8Array(data), {
        headers: { ...responseHeaders, 'Content-Type': 'image/webp' },
      });
    } catch {
      return new NextResponse('Invalid image', { status: 422, headers: responseHeaders });
    }
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: { ...responseHeaders, 'Content-Type': image.mimeType },
  });
}
