import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, parseCompany } from '@/lib/business-records';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const data = parseCompany(await req.json()); const row = await db.$transaction(async (tx) => { const company = await tx.company.update({ where: { id }, data }); await tx.auditLog.create({ data: { userId: user.id, action: 'COMPANY_UPDATE', entity: 'Company', entityId: id } }); return company; }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'COMPANY_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
