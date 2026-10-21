import { NextRequest } from 'next/server';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';
import { changeQuote } from '@/lib/rebuild-domain';
import { privateJson, privateError } from '@/lib/admin-response';
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: Context) { try { await requireUser(); return privateJson(await db.quote.findUniqueOrThrow({ where: { id: (await params).id }, include: { revisions: { orderBy: { number: 'desc' } } } })); } catch(e) { return privateError(e,'QUOTE_READ_FAILED'); } }
export async function PATCH(req: NextRequest, { params }: Context) { try { await assertOrigin(); const u = await requireUser(); return privateJson(await changeQuote(db,(await params).id,await req.json(),u.id)); } catch(e) { return privateError(e,'QUOTE_UPDATE_FAILED'); } }

