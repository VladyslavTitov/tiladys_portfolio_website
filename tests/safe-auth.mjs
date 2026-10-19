// Real HTTP authentication regressions; refuses every non-synthetic database.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL || 'http://missing');
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '55432'); assert.equal(url.pathname, '/tiladys_rebuild_test');
const phase = process.argv[2]; assert.ok(['baseline', 'after'].includes(phase));
const base = 'http://127.0.0.1:3101';
const fixture = JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json', 'utf8'));
assert.match(fixture.email, /^browser-.*@example\.test$/);
const db = new PrismaClient(); const checks = [], failures = [];
const headers = { origin: base, 'Content-Type': 'application/json' };
const login = body => fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify(body) });
function check(name, passed, details) { checks.push({ name, passed, details }); if (!passed) failures.push(name); }
try {
  // Guarded synthetic counters only; no account or business records are deleted.
  await db.contactRateLimit.deleteMany({ where: { key: { startsWith: 'login:' } } });
  const anonymous = await fetch(base + '/dashboard', { redirect: 'manual' });
  check('Anonymous dashboard redirects to login', [302, 303, 307, 308].includes(anonymous.status) && anonymous.headers.get('location')?.endsWith('/login'));
  for (const path of ['/customers', '/invoices', '/tasks', '/products', '/catalogue', '/account']) {
    const response = await fetch(base + '/api/admin' + path);
    check('Anonymous private API denied: ' + path, response.status === 401 && /no-store/.test(response.headers.get('cache-control') || ''), { status: response.status });
  }
  const forged = await fetch(base + '/api/auth/logout', { method: 'POST', headers: { origin: 'https://evil.example.test' }, redirect: 'manual' });
  check('Forged logout returns 403 and no-store', forged.status === 403 && /no-store/.test(forged.headers.get('cache-control') || ''), { status: forged.status });
  const authenticated = await login({ email: fixture.email, password: fixture.password, secretWord: fixture.secretWord });
  assert.equal(authenticated.status, 200, 'Synthetic custom login');
  const cookieHeader = authenticated.headers.get('set-cookie') || '';
  const token = cookieHeader.match(/tiladys_session=([^;]+)/)?.[1]; assert.ok(token);
  check('Production session cookie is HttpOnly, Secure and SameSite=Strict', /httponly/i.test(cookieHeader) && /secure/i.test(cookieHeader) && /samesite=strict/i.test(cookieHeader));
  const sessionHeaders = { ...headers, cookie: `tiladys_session=${token}` };
  const privateResponse = await fetch(base + '/api/admin/customers?lookup=1', { headers: sessionHeaders });
  check('Authenticated private read succeeds without caching', privateResponse.status === 200 && /no-store/.test(privateResponse.headers.get('cache-control') || ''));
  const signedOut = await fetch(base + '/api/auth/logout', { method: 'POST', headers: sessionHeaders, redirect: 'manual' });
  check('Logout redirects and revokes stored session', signedOut.status === 303 && !await db.session.findUnique({ where: { tokenHash: crypto.createHash('sha256').update(token).digest('hex') } }));
  const expired = await fetch(base + '/api/admin/customers', { headers: sessionHeaders });
  check('Revoked session cannot access private records', expired.status === 401);
  const denied = await fetch(base + '/api/auth/login', { method: 'POST', headers: { ...headers, origin: 'https://evil.example.test' }, body: '{}' });
  check('Forged login origin denied', denied.status === 403);
  const malformed = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: '{' });
  check('Malformed login body rejected', malformed.status === 400);
  const large = await fetch(base + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ padding: 'x'.repeat(17000) }) });
  check('Oversized login body rejected', large.status === 413);
  const statuses = [];
  for (let i = 0; i < 13; i++) {
    const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { ...headers, 'x-forwarded-for': `198.51.100.${i + 1}` }, body: JSON.stringify({ email: `missing-${crypto.randomUUID()}@example.test`, password: 'synthetic-invalid', secretWord: 'synthetic-invalid' }) });
    statuses.push(response.status);
  }
  check('Rotating an untrusted forwarded header cannot bypass IP throttle', statuses.at(-1) === 429 && statuses.every(status => [401, 429].includes(status)), { statuses });
  await writeFile(`docs/safe-execution/evidence/auth-${phase}.json`, JSON.stringify({ phase, timestamp: new Date().toISOString(), checks, failures, syntheticOnly: true, smtpDisabled: true }, null, 2));
  if (phase === 'after') assert.deepEqual(failures, []);
  console.log(JSON.stringify({ phase, checks: checks.length, failures }));
} finally {
  await db.contactRateLimit.deleteMany({ where: { key: { startsWith: 'login:' } } });
  await db.$disconnect();
}
