import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError, allocateNumber, parseServiceJob, prepareJobLineItems } from '@/lib/business-records';

const include = { customer: { select: { id: true, customerNumber: true, firstName: true, lastName: true, company: { select: { name: true } } } }, company: { select: { id: true, name: true } }, servicePriceItem: { select: { id: true, code: true, name: true } }, lineItems: { orderBy: { sortOrder: 'asc' as const } }, files: { select: { id: true, kind: true, filename: true, mimeType: true, size: true, caption: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } } };

export async function GET(req: NextRequest) {
  try { await requireUser(); const customerId = req.nextUrl.searchParams.get('customerId'); const status = req.nextUrl.searchParams.get('status'); const rows = await db.serviceJob.findMany({ where: { ...(customerId ? { customerId } : {}), ...(status && ['PLANNED','IN_PROGRESS','WAITING_CUSTOMER','COMPLETED','CANCELLED'].includes(status) ? { status: status as 'PLANNED'|'IN_PROGRESS'|'WAITING_CUSTOMER'|'COMPLETED'|'CANCELLED' } : {}) }, include, orderBy: [{ serviceDate: 'desc' }, { createdAt: 'desc' }], take: 100 }); return NextResponse.json(rows); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_LIST_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try { await assertOrigin(); const user = await requireUser(); const parsed = parseServiceJob(await req.json()); const row = await db.$transaction(async (tx) => { const customer = await tx.customer.findUniqueOrThrow({ where: { id: parsed.job.customerId }, select: { companyId: true } }); if (parsed.job.companyId && parsed.job.companyId !== customer.companyId) throw new Error('INVALID_SERVICE_JOB_COMPANY'); const lineItems = await prepareJobLineItems(tx, parsed.lineItems); const jobNumber = await allocateNumber(tx, 'SERVICE_JOB', 'JOB'); const job = await tx.serviceJob.create({ data: { ...parsed.job, jobNumber, lineItems: { create: lineItems } }, include }); await tx.customerActivity.create({ data: { customerId: parsed.job.customerId, type: 'SERVICE_JOB_CREATED', summary: `Service job ${jobNumber} created`, metadata: { serviceJobId: job.id }, createdById: user.id } }); await tx.auditLog.create({ data: { userId: user.id, action: 'SERVICE_JOB_CREATE', entity: 'ServiceJob', entityId: job.id } }); return job; }); return NextResponse.json(row, { status: 201 }); }
  catch (error) { const e = adminError(error, 'SERVICE_JOB_CREATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
