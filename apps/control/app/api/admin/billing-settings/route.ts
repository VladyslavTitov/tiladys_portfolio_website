import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { defaultBillingSettings, parseBillingSettings } from '@/lib/invoices';

export async function GET() {
  try { await requireUser(); const settings = await db.businessBillingSettings.findUnique({ where: { id: 'default' } }); return NextResponse.json(settings ?? defaultBillingSettings); }
  catch (error) { const e = adminError(error, 'BILLING_SETTINGS_READ_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function PUT(req: NextRequest) {
  try { await assertOrigin(); const user = await requireUser(); const data = parseBillingSettings(await req.json()); const settings = await db.$transaction(async (tx) => { const row = await tx.businessBillingSettings.upsert({ where: { id: 'default' }, create: { id: 'default', ...data }, update: data }); await tx.auditLog.create({ data: { userId: user.id, action: 'BILLING_SETTINGS_UPDATE', entity: 'BusinessBillingSettings', entityId: row.id, metadata: { taxMode: row.taxMode, confirmed: Boolean(row.settingsConfirmedAt) } } }); return row; }); return NextResponse.json(settings); }
  catch (error) { const e = adminError(error, 'BILLING_SETTINGS_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
