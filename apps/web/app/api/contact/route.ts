import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@tiladys/shared';
import { db } from '@tiladys/db';
import { contactRateLimit, requestSource } from '@/lib/contact-rate-limit';
import { boundedBody, ContactInputError, prepareContactImages } from '@/lib/contact-images';
import { MAX_CONTACT_REQUEST_BYTES } from '@/lib/contact-upload-limits';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 16 * 1024;
const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function allowedOrigins(req: NextRequest) {
  const origins = new Set(['https://tiladys.com', 'https://www.tiladys.com']);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { origins.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch {}
  }
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') origins.add(req.nextUrl.origin);
  return origins;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins(req).has(origin)) return json({ code: 'SECURITY' }, 403);
  const type = req.headers.get('content-type') ?? '';
  const multipart = type.toLowerCase().startsWith('multipart/form-data;');
  if (!multipart && !/^application\/json(?:;|$)/i.test(type)) return json({ code: 'VALIDATION' }, 415);
  if (multipart && process.env.CONTACT_UPLOADS_ENABLED !== 'true') return json({ code: 'UPLOADS_DISABLED' }, 400);
  try {
    const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') return json({ code: 'SERVER' }, 503);
    const allowed = await contactRateLimit(requestSource(req.headers, process.env.CONTACT_IP_HEADER), async (key, expiresAt) => {
      // Shared PostgreSQL counter: atomic across concurrent instances, no external provider.
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        INSERT INTO "ContactRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
        ON CONFLICT ("key") DO UPDATE SET "count" = LEAST("ContactRateLimit"."count" + 1, 6)
        RETURNING "count"`;
      await db.contactRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      return rows[0].count;
    }, secret ?? 'local-development-only');
    if (!allowed) return json({ code: 'RATE_LIMIT' }, 429);
    const raw = await boundedBody(req, multipart ? MAX_CONTACT_REQUEST_BYTES : MAX_BODY_BYTES);
    let payload: unknown;
    let files: File[] = [];
    if (multipart) {
      const form = await new Response(raw, { headers: { 'Content-Type': type } }).formData();
      if ([...form.keys()].some((key) => key !== 'payload' && key !== 'images') || form.getAll('payload').length !== 1) throw new ContactInputError('VALIDATION');
      const text = form.get('payload');
      if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_BODY_BYTES) throw new ContactInputError('VALIDATION');
      payload = JSON.parse(text);
      const entries = form.getAll('images');
      if (entries.some((entry) => !(entry instanceof File))) throw new ContactInputError('VALIDATION');
      files = entries as File[];
    } else payload = JSON.parse(new TextDecoder().decode(raw));
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) throw new ContactInputError('VALIDATION');
    const { website, ...data } = parsed.data;
    if (website) return NextResponse.json({ ok: true }, { status: 201 });
    const attachments = await prepareContactImages(files);
    await db.contactMessage.create({ data: { ...data, service: data.service || null, status: 'UNREAD', attachments: { create: attachments } } });
    return json({ ok: true }, 201);
  } catch (error) {
    if (error instanceof ContactInputError) return json({ code: error.code }, error.code === 'REQUEST_SIZE' ? 413 : 400);
    if (error instanceof SyntaxError || error instanceof TypeError) return json({ code: 'VALIDATION' }, 400);
    console.error('[CONTACT_CREATE_FAILED]', { stage: 'request-processing' });
    return json({ code: 'SERVER' }, 503);
  }
}
