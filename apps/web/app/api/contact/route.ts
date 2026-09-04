import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@tiladys/shared';
import { db } from '@tiladys/db';
import { contactRateLimit } from '@/lib/contact-rate-limit';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16 * 1024;
const PUBLIC_ERROR = { error: 'Unable to send your message. Please try again.' };

function allowedOrigins(req: NextRequest) {
  const origins = new Set(['https://tiladys.com', 'https://www.tiladys.com']);
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost = process.env.VERCEL_URL;
  if (configured) {
    try { origins.add(new URL(configured).origin); } catch {}
  }
  if (vercelHost) origins.add(`https://${vercelHost}`);
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
    origins.add(req.nextUrl.origin);
  }
  return origins;
}

function reject(status: number, stage: 'origin' | 'content-type' | 'size' | 'rate-limit' | 'parse' | 'validation') {
  console.warn('[CONTACT_REJECTED]', { stage, status });
  return NextResponse.json(PUBLIC_ERROR, { status });
}

function requestSource(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins(req).has(origin)) return reject(403, 'origin');
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reject(415, 'content-type');

  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) return reject(413, 'size');
  if (!contactRateLimit(requestSource(req))) return reject(429, 'rate-limit');

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return reject(400, 'parse');
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return reject(413, 'size');

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return reject(400, 'parse');
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) return reject(400, 'validation');
  const { website, ...data } = parsed.data;

  // Return the normal success shape so bots cannot learn that the trap fired.
  if (website) return NextResponse.json({ ok: true }, { status: 201 });

  try {
    await db.contactMessage.create({
      data: { ...data, service: data.service || null, status: 'UNREAD' },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const diagnostic = error && typeof error === 'object'
      ? { name: error.constructor?.name, code: 'code' in error ? String(error.code) : undefined }
      : { name: 'UnknownError' };
    console.error('[CONTACT_CREATE_FAILED]', { stage: 'database-insert', ...diagnostic });
    return NextResponse.json(PUBLIC_ERROR, { status: 500 });
  }
}
