type OriginConfiguration = { CONTROL_URL?: string; CONTROL_ALLOWED_ORIGINS?: string; VERCEL_URL?: string; VERCEL?: string };
function exactOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}

export function trustedAdminOrigins(config: OriginConfiguration): Set<string> {
  const values = [config.CONTROL_URL ?? (config.VERCEL === '1' ? '' : 'http://localhost:3001'), ...(config.CONTROL_ALLOWED_ORIGINS ?? '').split(',')];
  // This hostname comes from deployment configuration, never Host/Forwarded headers.
  // It permits testing the exact staged deployment before assigning canonical domains.
  if (config.VERCEL === '1' && config.VERCEL_URL) values.push(`https://${config.VERCEL_URL}`);
  return new Set(values.map(value => exactOrigin(value.trim())).filter((value): value is string => value !== null));
}

export function isTrustedAdminOrigin(origin: string | null, config: OriginConfiguration): boolean {
  if (!origin) return false;
  const parsed = exactOrigin(origin);
  return parsed !== null && trustedAdminOrigins(config).has(parsed);
}
