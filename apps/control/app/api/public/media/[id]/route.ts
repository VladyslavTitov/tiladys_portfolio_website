import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import sharp from 'sharp';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Association and publication status are checked on EVERY request, including resized images.
  const image = await db.projectImage.findFirst({ where: { id, project: { status: 'PUBLISHED' } }, select: { data: true, mimeType: true } });
  if (!image) return new NextResponse('Not found', { status: 404, headers });
  const width = req.nextUrl.searchParams.get('w');
  if (width !== null) {
    const size = Number(width);
    if (!Number.isInteger(size) || size < 16 || size > 1920) return new NextResponse('Invalid size', { status: 400, headers });
    try {
      const data = await sharp(image.data, { limitInputPixels: 24_000_000 }).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      return new NextResponse(new Uint8Array(data), { headers: { ...headers, 'Content-Type': 'image/webp' } });
    } catch {
      return new NextResponse('Invalid image', { status: 422, headers });
    }
  }
  return new NextResponse(new Uint8Array(image.data), { headers: { ...headers, 'Content-Type': image.mimeType } });
}
