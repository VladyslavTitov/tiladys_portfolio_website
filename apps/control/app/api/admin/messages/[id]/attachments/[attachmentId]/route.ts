import { NextRequest, NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import { requireUser, assertOrigin } from '@/lib/security';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" };
type Context = { params: Promise<{ id: string; attachmentId: string }> };
function failure(error: unknown) {
  const reason = error instanceof Error ? error.message : '';
  return new NextResponse('Unable to access attachment', { status: reason === 'UNAUTHORIZED' ? 401 : reason === 'INVALID_ORIGIN' ? 403 : 500, headers });
}
export async function GET(req: NextRequest, { params }: Context) {
  try {
    await requireUser();
    const { id, attachmentId } = await params;
    const attachment = await db.contactAttachment.findFirst({ where: { id: attachmentId, messageId: id }, select: { data: true, filename: true, mimeType: true } });
    if (!attachment) return new NextResponse('Not found', { status: 404, headers });
    const disposition = req.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new NextResponse(new Uint8Array(attachment.data), { headers: { ...headers, 'Content-Type': attachment.mimeType, 'Content-Disposition': `${disposition}; filename="${attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"` } });
  } catch (error) { return failure(error); }
}
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    await assertOrigin();
    const user = await requireUser();
    const { id, attachmentId } = await params;
    const result = await db.$transaction(async (tx) => {
      const deleted = await tx.contactAttachment.deleteMany({ where: { id: attachmentId, messageId: id } });
      if (deleted.count) await tx.auditLog.create({ data: { userId: user.id, action: 'CONTACT_ATTACHMENT_DELETE', entity: 'ContactMessage', entityId: id } });
      return deleted;
    });
    return NextResponse.json({ ok: Boolean(result.count) }, { status: result.count ? 200 : 404, headers });
  } catch (error) { return failure(error); }
}
