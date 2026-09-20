import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';
import { deliverReply } from '@/lib/reply-delivery';
import { sendMail } from '@/lib/mail';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id } = await params;
    const { reply } = await req.json();
    if (typeof reply !== 'string' || reply.trim().length < 2 || reply.length > 10_000) return NextResponse.json({ error: 'Invalid reply.' }, { status: 400 });
    const message = await db.contactMessage.findUnique({ where: { id }, select: { email: true } });
    if (!message) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const outcome = await deliverReply(
      () => sendMail(message.email, 'Re: Your TiLADYS request', reply),
      () => db.$transaction([
        db.contactMessage.update({ where: { id }, data: { replyText: reply, status: 'REPLIED', repliedAt: new Date() } }),
        db.auditLog.create({ data: { userId: user.id, action: 'MESSAGE_REPLY', entity: 'ContactMessage', entityId: id } }),
      ]),
    );
    if (outcome === 'delivery-failed') {
      console.warn('[MESSAGE_REPLY_DELIVERY_FAILED]');
      return NextResponse.json({ error: 'Email was not sent. Check SMTP and retry; the inquiry is unchanged.' }, { status: 503 });
    }
    if (outcome === 'record-failed') return NextResponse.json({ error: 'SMTP accepted the email, but saving failed. Check delivery before sending again.' }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: 'Unable to process reply.' }, { status: reason === 'UNAUTHORIZED' ? 401 : reason === 'INVALID_ORIGIN' ? 403 : 400 });
  }
}
