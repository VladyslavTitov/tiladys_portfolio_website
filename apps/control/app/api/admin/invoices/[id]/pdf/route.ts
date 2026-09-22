import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { invoiceInclude } from '@/lib/invoices';
import { generateInvoicePdf } from '@/lib/invoice-pdf';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(); const { id } = await params; const invoice = await db.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
    const bytes = invoice.status === 'ISSUED' && invoice.issuedPdf ? Buffer.from(invoice.issuedPdf) : await generateInvoicePdf(invoice);
    const filename = invoice.status === 'ISSUED' ? `${invoice.invoiceNumber}.pdf` : `draft-${invoice.id}.pdf`;
    return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { const e = adminError(error, 'INVOICE_PDF_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
