import { NextRequest, NextResponse } from 'next/server';
import { Prisma, db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { invoiceInclude, parsePayment, serializeInvoice } from '@/lib/invoices';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin(); const user = await requireUser(); const { id } = await params; const data = parsePayment(await req.json());
    const invoice = await db.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Invoice" WHERE "id" = ${id} FOR UPDATE`);
      const current = await tx.invoice.findUniqueOrThrow({ where: { id }, include: { payments: true } });
      if (current.status !== 'ISSUED') throw new Error('PAYMENT_REQUIRES_ISSUED_INVOICE');
      if (data.amount.lte(0)) throw new Error('INVALID_PAYMENT_AMOUNT');
      const paid = current.payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0));
      if (paid.add(data.amount).gt(current.total)) throw new Error('PAYMENT_EXCEEDS_BALANCE');
      await tx.invoicePayment.create({ data: { invoiceId: id, ...data, createdById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'INVOICE_PAYMENT_CREATE', entity: 'Invoice', entityId: id, metadata: { amount: data.amount.toString(), paidAt: data.paidAt.toISOString() } } });
      return tx.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error) { const e = adminError(error, 'INVOICE_PAYMENT_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
