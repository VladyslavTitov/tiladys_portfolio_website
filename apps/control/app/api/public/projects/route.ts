import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';

export async function GET(req: NextRequest) {
  const rows = await db.project.findMany({
    where: { status: 'PUBLISHED' },
    include: { images: { select: { id: true, alt: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  const origin = req.nextUrl.origin;
  const result = rows.map((project) => ({
    ...project,
    images: project.images.map((image) => ({ ...image, url: `${origin}/api/public/media/${image.id}` })),
  }));
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
