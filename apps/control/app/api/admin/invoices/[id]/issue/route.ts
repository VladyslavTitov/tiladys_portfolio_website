import {z} from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { adminError } from '@/lib/business-records';
import { issueInvoice, serializeInvoice } from '@/lib/invoices';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin(); const user = await requireUser(); const { id } = await params;
    const body=z.object({expectedInvoiceUpdatedAt:z.string().datetime(),expectedSettingsUpdatedAt:z.string().datetime().nullable()}).strict().safeParse(await req.json().catch(()=>null));if(!body.success)throw Error('INVALID_ISSUANCE_REVIEW');const row = await issueInvoice(db, id, user.id,{invoiceUpdatedAt:body.data.expectedInvoiceUpdatedAt,settingsUpdatedAt:body.data.expectedSettingsUpdatedAt});
    return NextResponse.json(serializeInvoice(row));
  } catch (error) { const e = adminError(error, 'INVOICE_ISSUE_FAILED'); return NextResponse.json(e.body, { status: e.status }); }
}
