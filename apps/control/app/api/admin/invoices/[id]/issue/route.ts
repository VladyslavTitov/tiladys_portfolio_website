import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { issueInvoice, serializeInvoice } from '@/lib/invoices';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin(); const user = await requireUser(); const { id } = await params;
    const row = await issueInvoice(db, id, user.id);
    return NextResponse.json(serializeInvoice(row));
  } catch (error) { const e = adminError(error, 'INVOICE_ISSUE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
