import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { customerNoteSchema } from '@tiladys/shared';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const parsed = customerNoteSchema.safeParse(await req.json()); if (!parsed.success) throw Object.assign(new Error('INVALID_CUSTOMER_NOTE'), { details: parsed.error.flatten() }); const note = await db.$transaction(async (tx) => { const created = await tx.customerNote.create({ data: { customerId: id, body: parsed.data.body, createdById: user.id }, include: { createdBy: { select: { displayName: true } } } }); await tx.customerActivity.create({ data: { customerId: id, type: 'NOTE_ADDED', summary: 'Private note added', createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'CUSTOMER_NOTE_CREATE', entity: 'Customer', entityId: id } }); return created; }); return NextResponse.json(note, { status: 201 }); }
  catch (error) { const e = adminError(error, 'CUSTOMER_NOTE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
