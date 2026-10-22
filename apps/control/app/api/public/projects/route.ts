import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { publicProject, publicProjectSelect } from '@/lib/public-projects';

export async function GET(req: NextRequest) {
  const rows = await db.project.findMany({
    where: { status: 'PUBLISHED' }, select: publicProjectSelect,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json(rows.map((row) => publicProject(row, req.nextUrl.origin)), { headers: { 'Cache-Control': 'no-store' } });
}
