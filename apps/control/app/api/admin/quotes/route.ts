import { NextRequest } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { createQuote } from '@/lib/rebuild-domain';
import { dateRange, paging, privateJson, privateError } from '@/lib/admin-response';
export async function GET(req: NextRequest) {
 try { await requireUser(); const { page, q } = paging(req.nextUrl); const customerId = req.nextUrl.searchParams.get('customerId');
 const status=req.nextUrl.searchParams.get('status');
 const where = { ...dateRange(req.nextUrl),...(status&&['DRAFT','SENT','ACCEPTED','DECLINED','EXPIRED','ARCHIVED'].includes(status)?{status:status as 'DRAFT'|'SENT'|'ACCEPTED'|'DECLINED'|'EXPIRED'|'ARCHIVED'}:{}), ...(customerId ? { customerId } : {}), ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { quoteNumber: { contains: q, mode: 'insensitive' as const } }] } : {}) };
 const [items, total] = await Promise.all([db.quote.findMany({ where, take: 25, skip: (page - 1)*25, orderBy: { updatedAt: 'desc' }, include: { customer: { select: { customerNumber: true, firstName: true, lastName: true } }, revisions: { orderBy: { number: 'desc' } } } }), db.quote.count({ where })]); return privateJson({ items, total, page });
 } catch(e) { return privateError(e,'QUOTE_LIST_FAILED'); }
}
export async function POST(req: NextRequest) { try { await assertOrigin(); const u = await requireUser(); return privateJson(await createQuote(db,await req.json(),u.id),201); } catch(e) { return privateError(e,'QUOTE_CREATE_FAILED'); } }
