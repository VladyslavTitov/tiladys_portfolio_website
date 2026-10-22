import { isIP } from 'node:net';

/** Trust only an ingress-overwritten header explicitly selected by the operator.
 * Without a verified ingress, requests share a conservative unknown bucket.
 */
export function requestSource(headers: Headers, trustedHeader?: string): string {
  if (!trustedHeader || !['x-forwarded-for', 'x-real-ip', 'x-vercel-forwarded-for'].includes(trustedHeader)) return 'unknown';
  const candidate = headers.get(trustedHeader)?.split(',')[0]?.trim() || '';
  return isIP(candidate) ? candidate.toLowerCase() : 'unknown';
}
