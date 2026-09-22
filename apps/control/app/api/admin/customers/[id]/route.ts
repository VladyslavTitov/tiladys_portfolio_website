import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, parseCustomer } from '@/lib/business-records';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); const { id } = await params; const row = await db.customer.findUniqueOrThrow({ where: { id }, include: { company: true, customerNotes: { include: { createdBy: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' } }, activities: { include: { createdBy: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }, serviceJobs: { include: { files: true }, orderBy: { createdAt: 'desc' } }, files: { orderBy: { createdAt: 'desc' } } } }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'CUSTOMER_READ_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const data = parseCustomer(await req.json()); const row = await db.$transaction(async (tx) => { const customer = await tx.customer.update({ where: { id }, data, include: { company: true } }); await tx.customerActivity.create({ data: { customerId: id, type: data.status === 'ARCHIVED' ? 'CUSTOMER_ARCHIVED' : 'CUSTOMER_UPDATED', summary: data.status === 'ARCHIVED' ? 'Customer archived' : 'Customer details updated', createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'CUSTOMER_UPDATE', entity: 'Customer', entityId: id } }); return customer; }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'CUSTOMER_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const row = await db.$transaction(async (tx) => { const customer = await tx.customer.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } }); await tx.customerActivity.create({ data: { customerId: id, type: 'CUSTOMER_ARCHIVED', summary: 'Customer archived', createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'CUSTOMER_ARCHIVE', entity: 'Customer', entityId: id } }); return customer; }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'CUSTOMER_ARCHIVE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
