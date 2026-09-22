import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, parseCompany } from '@/lib/business-records';

export async function GET(req: NextRequest) {
  try { await requireUser(); const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100); const rows = await db.company.findMany({ where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined, include: { _count: { select: { customers: true, serviceJobs: true } } }, orderBy: { name: 'asc' }, take: 100 }); return NextResponse.json(rows); }
  catch (error) { const e = adminError(error, 'COMPANY_LIST_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try { await assertOrigin(); const user = await requireUser(); const data = parseCompany(await req.json()); const row = await db.$transaction(async (tx) => { const company = await tx.company.create({ data }); await tx.auditLog.create({ data: { userId: user.id, action: 'COMPANY_CREATE', entity: 'Company', entityId: company.id } }); return company; }); return NextResponse.json(row, { status: 201 }); }
  catch (error) { const e = adminError(error, 'COMPANY_CREATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
