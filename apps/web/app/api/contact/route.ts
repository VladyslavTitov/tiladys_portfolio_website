import {deliverOnce} from '@tiladys/db/outbox';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { finalizedPhotos } from '@/lib/upload-reservations';
import { contactSchema } from '@tiladys/shared';
import { db } from '@tiladys/db';
import { contactRateLimit, requestSource } from '@/lib/contact-rate-limit';
import { boundedBody, ContactInputError, prepareContactImages } from '@/lib/contact-images';
import { MAX_CONTACT_REQUEST_BYTES } from '@/lib/contact-upload-limits';
import { sendMail } from '@/lib/mail';
import { contactAcknowledgement } from '@/lib/contact-acknowledgement';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 16 * 1024;
const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

function allowedOrigins(req: NextRequest) {
  const origins = new Set(['https://tiladys.com', 'https://www.tiladys.com']);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { origins.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch {}
  }
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.NODE_ENV !== 'production') {origins.add(req.nextUrl.origin); for(const port of [3000,3100]){origins.add(`http://localhost:${port}`);origins.add(`http://127.0.0.1:${port}`);}}
  return origins;
}

export async function POST(req: NextRequest) {
  let stage = 'config';
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins(req).has(origin)) return json({ code: 'SECURITY' }, 403);
  const type = req.headers.get('content-type') ?? '';
  const multipart = type.toLowerCase().startsWith('multipart/form-data;');
  if (!multipart && !/^application\/json(?:;|$)/i.test(type)) return json({ code: 'VALIDATION' }, 415);
  if (multipart && (process.env.VERCEL || process.env.CONTACT_UPLOADS_ENABLED !== 'true')) return json({ code: 'UPLOADS_DISABLED' }, 400);
  try {
    const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      console.error('[CONTACT_CONFIG_MISSING] key=CONTACT_RATE_LIMIT_SECRET');
      return json({ code: 'SERVER' }, 503);
    }
    stage = 'rate-limit';
    const allowed = await contactRateLimit(requestSource(req.headers, process.env.CONTACT_IP_HEADER), async (key, expiresAt) => {
      // Shared PostgreSQL counter: atomic across concurrent instances, no external provider.
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        INSERT INTO "ContactRateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
        ON CONFLICT ("key") DO UPDATE SET "count" = LEAST("ContactRateLimit"."count" + 1, 6)
        RETURNING "count"`;
      await db.contactRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      return rows[0].count;
    }, secret ?? 'local-development-only');
    if (!allowed) return NextResponse.json({code:'RATE_LIMIT'}, {status:429,headers:{'Cache-Control':'no-store','Retry-After':'600'}});
    stage = 'body';
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
    stage = 'validation';
    const upload = payload && typeof payload === 'object' && 'uploadReservation' in payload ? (payload as {uploadReservation:unknown}).uploadReservation : undefined;
    if (upload !== undefined) { if (!upload || typeof upload !== 'object' || !('id' in upload) || !('capability' in upload) || typeof upload.id !== 'string' || typeof upload.capability !== 'string' || upload.id.length > 100 || upload.capability.length > 100) throw new ContactInputError('VALIDATION'); delete (payload as {uploadReservation?:unknown}).uploadReservation; }
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) throw new ContactInputError('VALIDATION');
    const { website, ...data } = parsed.data;
    if(data.requestDetail&&!(data.service==='websites'&&data.requestDetail.startsWith('web-')||data.service==='pc-laptop'&&data.requestDetail.startsWith('pc-')))throw new ContactInputError('VALIDATION');
    if (data.requestMode && !(data.service === '3d-printing' ? ['idea','file','batch'] : data.service === 'pc-laptop' ? ['local','remote'] : []).includes(data.requestMode)) throw new ContactInputError('VALIDATION');
    if (website) return json({ ok: true }, 201);
    stage = 'attachments';
    const attachments = await prepareContactImages(files);
    stage = 'message-insert';
    const key = req.headers.get('Idempotency-Key');if(upload&&!key)throw new ContactInputError('VALIDATION');
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify({data,upload})).digest('hex');
    let replay = false;
    const insert = { ...data, service: data.service || null, status: 'UNREAD' as const, attachments: { create: attachments } };
    const stored = key ? await db.$transaction(async tx => {
      if (!/^[A-Za-z0-9_-]{16,100}$/.test(key)) throw new ContactInputError('VALIDATION');
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
      const prior = await tx.idempotencyRecord.findUnique({where:{scope_key:{scope:'CONTACT',key}}});
      if(prior){if(prior.payloadHash!==fingerprint) throw Error('IDEMPOTENCY_CONFLICT');replay=true;return {id:prior.resultId};}
      const accepted = upload ? await finalizedPhotos(tx,(upload as {id:string}).id,(upload as {capability:string}).capability) : attachments;
      const message = await tx.contactMessage.create({data:{...insert,attachments:{create:accepted}}});
      await tx.idempotencyRecord.create({data:{scope:'CONTACT',key,payloadHash:fingerprint,resultId:message.id}});return message;
    },{timeout:15000,maxWait:5000}) : await db.contactMessage.create({data:insert});
    if (!replay && process.env.CONTACT_AUTO_REPLY_ENABLED === 'true') {
      stage = 'acknowledgement';
      try {
        const acknowledgement = contactAcknowledgement(data.locale, data.name);
        await deliverOnce(db,`CONTACT_ACK:${stored.id}`,key||crypto.randomUUID(),{receipt:stored.id},()=>sendMail({to:data.email,...acknowledgement}),async()=>{});
      } catch {
        // The inquiry is already safely stored. A mail outage must never make the
        // browser retry and create duplicate customer inquiries.
        console.warn('[CONTACT_ACK_DELIVERY_FAILED]');
      }
    }
    return json({ ok: true, ...(stored.id ? {reference:stored.id}: {}) }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT') return json({code:'CONFLICT'},409);
    if (error instanceof Error && /^(INVALID_UPLOAD|UPLOAD_PROVIDER)/.test(error.message)) return json({code:'UPLOAD_FAILED'},422);
    if (error instanceof ContactInputError) return json({ code: error.code }, error.code === 'REQUEST_SIZE' ? 413 : 400);
    if (stage === 'body' && (error instanceof SyntaxError || error instanceof TypeError)) return json({ code: 'VALIDATION' }, 400);
    console.error('[CONTACT_CREATE_FAILED]', { stage });
    return json({ code: 'SERVER' }, 503);
  }
}
