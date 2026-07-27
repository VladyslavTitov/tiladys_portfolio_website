import { NextResponse } from 'next/server';
import { db } from '@tiladys/db';

export async function GET() {
  const rows = await db.priceSection.findMany({
    where: { active: true },
    include: { items: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
}
