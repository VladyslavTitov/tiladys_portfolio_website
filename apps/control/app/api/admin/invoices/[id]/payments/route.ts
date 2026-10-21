import { NextRequest } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { serializeInvoice } from '@/lib/invoices';
import { recordPayment } from '@/lib/payments';
import { privateJson,privateError } from '@/lib/admin-response';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await assertOrigin();const u=await requireUser();const {id}=await params;return privateJson(serializeInvoice(await recordPayment(db,id,await req.json(),req.headers.get('Idempotency-Key')||'',u.id)));}catch(e){return privateError(e,'INVOICE_PAYMENT_FAILED');}}
