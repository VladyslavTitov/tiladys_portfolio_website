import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { invoiceInclude, parseInvoiceDraft, serializeInvoice } from '@/lib/invoices';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireUser(); const { id } = await params; return NextResponse.json(serializeInvoice(await db.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude }))); }
  catch (error) { const e = adminError(error, 'INVOICE_READ_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertOrigin(); const user = await requireUser(); const { id } = await params; const parsed = parseInvoiceDraft(await req.json()); const row = await db.$transaction(async (tx) => { const current = await tx.invoice.findUniqueOrThrow({ where: { id }, select: { status: true } }); if (current.status !== 'DRAFT') throw new Error('ISSUED_INVOICE_IMMUTABLE'); await tx.invoiceLine.deleteMany({ where: { invoiceId: id } }); const invoice = await tx.invoice.update({ where: { id }, data: { ...parsed.invoice, lines: { create: parsed.lines } }, include: invoiceInclude }); await tx.auditLog.create({ data: { userId: user.id, action: 'INVOICE_DRAFT_UPDATE', entity: 'Invoice', entityId: id } }); return invoice; }); return NextResponse.json(serializeInvoice(row)); }
  catch (error) { const e = adminError(error, 'INVOICE_UPDATE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
