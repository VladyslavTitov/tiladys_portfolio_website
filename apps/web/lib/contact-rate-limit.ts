import { createHash } from 'node:crypto';

const hits = new Map<string, { count: number; reset: number }>();

function sourceKey(source: string) {
  return createHash('sha256').update(source).digest('hex');
}

export function contactRateLimit(source: string, limit = 5, windowMs = 10 * 60_000) {
  const key = sourceKey(source);
  const now = Date.now();
  const item = hits.get(key);
  if (!item || item.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (item.count >= limit) return false;
  item.count += 1;
  return true;
}
