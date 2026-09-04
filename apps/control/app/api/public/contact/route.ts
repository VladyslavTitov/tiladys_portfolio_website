import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@tiladys/shared';
import { db } from '@tiladys/db';
import { ipHash } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16 * 1024;
const PUBLIC_ERROR = { error: 'Unable to send your message. Please try again.' };

function configuredSiteOrigin() {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return new URL(configured).origin;
}

function corsHeaders(req: NextRequest) {
  const allowedOrigin = configuredSiteOrigin();
  const requestOrigin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonError(req: NextRequest, status: number) {
  return NextResponse.json(PUBLIC_ERROR, { status, headers: corsHeaders(req) });
}

function requestIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get('origin');
  if (requestOrigin && requestOrigin !== configuredSiteOrigin()) return jsonError(req, 403);
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get('origin');
  if (requestOrigin && requestOrigin !== configuredSiteOrigin()) return jsonError(req, 403);
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return jsonError(req, 415);

  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) return jsonError(req, 413);

  const ip = requestIp(req);
  // The source address is hashed only for this process-local limiter and is not persisted.
  if (!rateLimit(`contact:${ipHash(ip)}`, 5, 10 * 60_000)) return jsonError(req, 429);

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return jsonError(req, 400);
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return jsonError(req, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(req, 400);
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) return jsonError(req, 400);
  const { website, ...data } = parsed.data;

  // Do not reveal that the honeypot was triggered.
  if (website) return NextResponse.json({ ok: true }, { status: 201, headers: corsHeaders(req) });

  try {
    await db.contactMessage.create({
      data: {
        ...data,
        service: data.service || null,
        status: 'UNREAD',
      },
    });
    return NextResponse.json({ ok: true }, { status: 201, headers: corsHeaders(req) });
  } catch (error) {
    const diagnostic = error && typeof error === 'object'
      ? { name: error.constructor?.name, code: 'code' in error ? String(error.code) : undefined }
      : { name: 'UnknownError' };
    console.error('[CONTACT_CREATE_FAILED]', diagnostic);
    return jsonError(req, 500);
  }
}
