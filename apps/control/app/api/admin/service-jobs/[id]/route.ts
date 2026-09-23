import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, parseServiceJob, prepareJobLineItems } from '@/lib/business-records';

const include = { invoices: { select: { id: true, invoiceNumber: true, status: true } }, customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, company: { select: { name: true } } } }, company: { select: { id: true, name: true } }, servicePriceItem: { select: { id: true, code: true, name: true } }, lineItems: { orderBy: { sortOrder: 'asc' as const } }, files: { select: { id: true, kind: true, filename: true, mimeType: true, size: true, caption: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } } };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); const { id } = await params; return NextResponse.json(await db.serviceJob.findUniqueOrThrow({ where: { id }, include })); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_READ_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const parsed = parseServiceJob(await req.json()); const row = await db.$transaction(async (tx) => { const previous = await tx.serviceJob.findUniqueOrThrow({ where: { id }, select: { customerId: true, companyId: true, status: true } }); const customer = await tx.customer.findUniqueOrThrow({ where: { id: parsed.job.customerId }, select: { companyId: true } }); if (parsed.job.companyId && parsed.job.companyId !== previous.companyId && parsed.job.companyId !== customer.companyId) throw new Error('INVALID_SERVICE_JOB_COMPANY'); const lineItems = await prepareJobLineItems(tx, parsed.lineItems); await tx.serviceJobLineItem.deleteMany({ where: { serviceJobId: id } }); const job = await tx.serviceJob.update({ where: { id }, data: { ...parsed.job, lineItems: { create: lineItems } }, include }); await tx.customerActivity.create({ data: { customerId: parsed.job.customerId, type: previous.status === parsed.job.status ? 'SERVICE_JOB_UPDATED' : 'SERVICE_JOB_STATUS_CHANGED', summary: previous.status === parsed.job.status ? `Service job ${job.jobNumber} updated` : `${job.jobNumber}: ${previous.status} → ${parsed.job.status}`, metadata: { serviceJobId: id }, createdById: user.id } }); if (previous.customerId !== parsed.job.customerId) await tx.customerActivity.create({ data: { customerId: previous.customerId, type: 'SERVICE_JOB_REASSIGNED', summary: `Service job ${job.jobNumber} reassigned`, metadata: { serviceJobId: id }, createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'SERVICE_JOB_UPDATE', entity: 'ServiceJob', entityId: id } }); return job; }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
