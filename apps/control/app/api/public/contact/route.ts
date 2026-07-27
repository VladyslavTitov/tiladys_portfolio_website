import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@tiladys/shared';
import { db } from '@tiladys/db';
import { ipHash } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

function corsHeaders(req: NextRequest) {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const allowedOrigin = new URL(configured).origin;
  const requestOrigin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const requestOrigin = req.headers.get('origin');
  const allowedOrigin = new URL(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').origin;
  if (requestOrigin && requestOrigin !== allowedOrigin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers });
  }

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid form' }, { status: 400, headers });
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }, { headers });

  await db.contactMessage.create({
    data: {
      ...data,
      phone: data.phone || null,
      service: data.service || null,
      ipHash: ipHash(ip),
      userAgent: (req.headers.get('user-agent') ?? '').slice(0, 300),
    },
  });
  return NextResponse.json({ ok: true }, { status: 201, headers });
}
