import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { publicProject, publicProjectSelect } from '@/lib/public-projects';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await db.project.findFirst({ where: { status: 'PUBLISHED', OR: [{ slug }, { slugAliases: { some: { slug } } }] }, select: publicProjectSelect });
  return NextResponse.json(project ? publicProject(project, req.nextUrl.origin) : { error: 'NOT_FOUND' }, {
    status: project ? 200 : 404, headers: { 'Cache-Control': 'no-store' },
  });
}
