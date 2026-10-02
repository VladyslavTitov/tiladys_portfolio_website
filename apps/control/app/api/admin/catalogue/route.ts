import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser } from '@/lib/security';
import { adminError, cataloguePriceDetails } from '@/lib/business-records';
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const cursor = req.nextUrl.searchParams.get('cursor');
    const rows = await db.priceItem.findMany({ where: { active: true, section: { active: true } }, select: { id: true, code: true, name: true, note: true, price: true, sectionId: true, section: { select: { title: true } } }, orderBy: { id: 'asc' }, take: 201, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    return NextResponse.json({ items: rows.slice(0, 200).map(item => { const details = cataloguePriceDetails(item.price); return { ...item, ...details, amount: details.amount?.toString() ?? '', currency: 'EUR' }; }), nextCursor: rows.length > 200 ? rows[199].id : null }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { const result = adminError(error, 'CATALOGUE_SEARCH_FAILED'); return NextResponse.json(result.body, { status: result.status }); }
}
