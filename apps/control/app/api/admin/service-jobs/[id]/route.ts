import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, parseServiceJob } from '@/lib/business-records';

const include = { customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, company: { select: { name: true } } } }, company: { select: { id: true, name: true } }, servicePriceItem: { select: { id: true, code: true, name: true } }, files: { select: { id: true, kind: true, filename: true, mimeType: true, size: true, caption: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } } };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); const { id } = await params; return NextResponse.json(await db.serviceJob.findUniqueOrThrow({ where: { id }, include })); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_READ_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const data = parseServiceJob(await req.json()); const row = await db.$transaction(async (tx) => { const previous = await tx.serviceJob.findUniqueOrThrow({ where: { id }, select: { customerId: true, status: true } }); const customer = await tx.customer.findUniqueOrThrow({ where: { id: data.customerId }, select: { companyId: true } }); if (data.companyId && data.companyId !== customer.companyId) throw new Error('INVALID_SERVICE_JOB_COMPANY'); const job = await tx.serviceJob.update({ where: { id }, data, include }); await tx.customerActivity.create({ data: { customerId: data.customerId, type: previous.status === data.status ? 'SERVICE_JOB_UPDATED' : 'SERVICE_JOB_STATUS_CHANGED', summary: previous.status === data.status ? `Service job ${job.jobNumber} updated` : `${job.jobNumber}: ${previous.status} → ${data.status}`, metadata: { serviceJobId: id }, createdById: user.id } }); if (previous.customerId !== data.customerId) await tx.customerActivity.create({ data: { customerId: previous.customerId, type: 'SERVICE_JOB_REASSIGNED', summary: `Service job ${job.jobNumber} reassigned`, metadata: { serviceJobId: id }, createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'SERVICE_JOB_UPDATE', entity: 'ServiceJob', entityId: id } }); return job; }); return NextResponse.json(row); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
