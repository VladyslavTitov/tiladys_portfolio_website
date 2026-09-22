import { NextRequest, NextResponse } from 'next/server';
import { Prisma, db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { calculateInvoiceLines, defaultBillingSettings, invoiceInclude, sellerSnapshot, serializeInvoice } from '@/lib/invoices';

export async function GET(req: NextRequest) {
  try { await requireUser(); const customerId = req.nextUrl.searchParams.get('customerId'); const rows = await db.invoice.findMany({ where: customerId ? { customerId } : {}, include: invoiceInclude, orderBy: { createdAt: 'desc' }, take: 200 }); return NextResponse.json(rows.map(serializeInvoice)); }
  catch (error) { const e = adminError(error, 'INVOICE_LIST_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try {
    await assertOrigin(); const user = await requireUser(); const body = await req.json(); const serviceJobId = typeof body.serviceJobId === 'string' ? body.serviceJobId : '';
    if (!serviceJobId) throw new Error('INVALID_INVOICE_JOB');
    const row = await db.$transaction(async (tx) => {
      const existingDraft = await tx.invoice.findFirst({ where: { serviceJobId, status: 'DRAFT' }, include: invoiceInclude });
      if (existingDraft) return existingDraft;
      const [job, storedSettings] = await Promise.all([
        tx.serviceJob.findUniqueOrThrow({ where: { id: serviceJobId }, include: { customer: { include: { company: true } }, lineItems: { orderBy: { sortOrder: 'asc' } } } }),
        tx.businessBillingSettings.findUnique({ where: { id: 'default' } }),
      ]);
      if (!job.lineItems.length) throw new Error('INVOICE_JOB_HAS_NO_LINES');
      const settings = storedSettings ?? defaultBillingSettings;
      const lines = calculateInvoiceLines(job.lineItems.map((line) => ({ serviceName: line.serviceName, description: line.description ?? '', quantity: line.quantity.toString(), unit: line.unit, unitPrice: line.agreedUnitPrice.toString(), taxTreatment: line.taxTreatment })));
      const subtotal = lines.reduce((sum, line) => sum.add(line.subtotal), new Prisma.Decimal(0));
      const taxTotal = lines.some((line) => line.taxAmount === null) ? null : lines.reduce((sum, line) => sum.add(line.taxAmount ?? 0), new Prisma.Decimal(0));
      const customerName = [job.customer.firstName, job.customer.lastName].filter(Boolean).join(' ') || job.customer.company?.name || job.customer.customerNumber;
      const issueDate = new Date(); const dueDate = settings.paymentTermsDays === null ? null : new Date(issueDate.getTime() + settings.paymentTermsDays * 86_400_000);
      const invoice = await tx.invoice.create({ data: { customerId: job.customerId, serviceJobId: job.id, ...sellerSnapshot(settings), issueDate, dueDate, serviceDateFrom: job.serviceDate, serviceDateTo: job.serviceDate, recipientName: customerName, recipientCompany: job.customer.company?.name ?? null, recipientEmail: job.customer.email, recipientStreet: job.customer.street ?? job.customer.company?.street ?? '', recipientPostalCode: job.customer.postalCode ?? job.customer.company?.postalCode ?? '', recipientCity: job.customer.city ?? job.customer.company?.city ?? '', recipientCountry: job.customer.country || job.customer.company?.country || 'DE', customerReference: `${job.jobNumber} · ${job.title}`, subtotal, taxTotal, total: subtotal.add(taxTotal ?? 0), lines: { create: lines } }, include: invoiceInclude });
      await tx.customerActivity.create({ data: { customerId: job.customerId, type: 'INVOICE_DRAFT_CREATED', summary: `Invoice draft created for ${job.jobNumber}`, metadata: { invoiceId: invoice.id, serviceJobId: job.id }, createdById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'INVOICE_DRAFT_CREATE', entity: 'Invoice', entityId: invoice.id } }); return invoice;
    }).catch(async (error) => {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const existing = await db.invoice.findFirst({ where: { serviceJobId, status: 'DRAFT' }, include: invoiceInclude });
      if (!existing) throw error;
      return existing;
    });
    return NextResponse.json(serializeInvoice(row), { status: 201 });
  } catch (error) { const e = adminError(error, 'INVOICE_CREATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
