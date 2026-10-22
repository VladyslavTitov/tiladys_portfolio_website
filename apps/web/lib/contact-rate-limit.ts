import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export function requestSource(headers: Headers, trustedHeader?: string) {
  // Configure ONLY a header overwritten by the trusted ingress. Never trust arbitrary forwarded headers.
  if (!trustedHeader || !['x-forwarded-for', 'x-real-ip', 'x-vercel-forwarded-for'].includes(trustedHeader)) return 'unknown';
  const ip = headers.get(trustedHeader)?.split(',')[0]?.trim() ?? '';
  return isIP(ip) ? ip.toLowerCase() : 'unknown';
}

export async function contactRateLimit(source: string, increment: (key: string, expiresAt: Date) => Promise<number>, secret: string, now = Date.now()) {
  const windowMs = 10 * 60_000;
  const bucket = Math.floor(now / windowMs);
  const key = createHmac('sha256', secret).update(`${bucket}:${source}`).digest('hex');
  return (await increment(key, new Date((bucket + 1) * windowMs))) <= 5;
}
