import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@tiladys/db';
import { assertOrigin, requireUser } from '@/lib/security';

export const runtime = 'nodejs';

const statusSchema = z.object({ status: z.enum(['UNREAD', 'READ']) }).strict();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id } = await params;
    if (!id || id.length > 100) return NextResponse.json({ error: 'INVALID_MESSAGE' }, { status: 400 });

    const parsed = statusSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });

    const result = await db.contactMessage.updateMany({ where: { id }, data: { status: parsed.data.status } });
    if (!result.count) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    await db.auditLog.create({
      data: { userId: user.id, action: 'MESSAGE_STATUS_UPDATE', entity: 'ContactMessage', entityId: id, metadata: { status: parsed.data.status } },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MESSAGE_STATUS_FAILED';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: message }, { status: 401 });
    if (message === 'INVALID_ORIGIN') return NextResponse.json({ error: message }, { status: 403 });
    console.error('[MESSAGE_STATUS_FAILED]', { name: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ error: 'MESSAGE_STATUS_FAILED' }, { status: 500 });
  }
}
