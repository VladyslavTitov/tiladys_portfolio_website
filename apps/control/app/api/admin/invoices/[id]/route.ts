import { NextRequest, NextResponse } from 'next/server';
import { Prisma, db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { invoiceInclude, parseInvoiceDraft, serializeInvoice } from '@/lib/invoices';

type Context = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    await requireUser(); const { id } = await params;
    const invoice = await db.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error) {
    const e = adminError(error, 'INVOICE_READ_FAILED');
    return NextResponse.json(e.body, { status: e.status });
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    await assertOrigin(); const user = await requireUser(); const { id } = await params;
    const parsed = parseInvoiceDraft(await req.json());
    const row = await db.$transaction(async (tx) => {
      // Serialize edits with issuance so a delayed save cannot rewrite a frozen document.
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`);
      const current = await tx.invoice.findUniqueOrThrow({ where: { id } });
      if (current.status !== 'DRAFT') throw new Error('ISSUED_INVOICE_IMMUTABLE');
      if (parsed.invoice.customerId !== current.customerId || parsed.invoice.serviceJobId !== current.serviceJobId) {
        throw new Error('INVALID_INVOICE_RELATIONSHIP');
      }
      if ((parsed.invoice.billingRecipientType === 'COMPANY') !== Boolean(parsed.invoice.billingCompanyId)) {
        throw new Error('INVALID_BILLING_RECIPIENT');
      }
      if (parsed.invoice.billingRecipientType === 'LEGACY' && current.billingRecipientType !== 'LEGACY') {
        throw new Error('INVALID_BILLING_RECIPIENT');
      }
      if (parsed.invoice.billingCompanyId) await tx.company.findUniqueOrThrow({ where: { id: parsed.invoice.billingCompanyId } });
      if (parsed.invoice.billingRecipientType === 'INDIVIDUAL') parsed.invoice.recipientCompany = null;
      await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      const invoice = await tx.invoice.update({ where: { id }, data: { ...parsed.invoice, lines: { create: parsed.lines } }, include: invoiceInclude });
      await tx.auditLog.create({ data: { userId: user.id, action: 'INVOICE_DRAFT_UPDATE', entity: 'Invoice', entityId: id } });
      return invoice;
    });
    return NextResponse.json(serializeInvoice(row));
  } catch (error) {
    const e = adminError(error, 'INVOICE_UPDATE_FAILED');
    return NextResponse.json(e.body, { status: e.status });
  }
}
