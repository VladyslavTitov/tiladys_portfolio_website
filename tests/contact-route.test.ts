import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { db } from '@tiladys/db';
import { POST } from '../apps/web/app/api/contact/route';

test('contact route reports configuration and failure stages without leaking exception or inquiry data', async t => {
  const keys = ['NODE_ENV', 'CONTACT_RATE_LIMIT_SECRET', 'CONTACT_IP_HEADER'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => logs.push(args));
  const payload = { name: 'Synthetic inquiry', email: 'synthetic@example.test', service: 'websites', locale: 'en', message: '<script>alert(1)</script>', website: '', consent: true };
  const request = (body = JSON.stringify(payload)) => new NextRequest('https://tiladys.com/api/contact', { method: 'POST', headers: { origin: 'https://tiladys.com', 'content-type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.1' }, body });
  const failure = new TypeError('private-connection-and-customer-details');
  let failCounter = false;
  let failInsert = false;
  let inserts = 0;
  const originalQuery = db.$queryRaw;
  const originalDelete = db.contactRateLimit.deleteMany;
  const originalCreate = db.contactMessage.create;
  db.$queryRaw = (async () => { if (failCounter) throw failure; return [{ count: 1 }]; }) as typeof db.$queryRaw;
  db.contactRateLimit.deleteMany = (async () => ({ count: 0 })) as typeof originalDelete;
  db.contactMessage.create = (async ({ data }: { data: typeof payload & { status: string } }) => {
    if (failInsert) throw failure;
    assert.equal(data.status, 'UNREAD');
    assert.equal(data.message, payload.message);
    inserts++;
    return {};
  }) as typeof originalCreate;
  try {
    process.env.NODE_ENV = 'production';
    process.env.CONTACT_IP_HEADER = 'x-vercel-forwarded-for';
    delete process.env.CONTACT_RATE_LIMIT_SECRET;
    assert.equal((await POST(request())).status, 503);
    assert.deepEqual(logs.pop(), ['[CONTACT_CONFIG_MISSING] key=CONTACT_RATE_LIMIT_SECRET']);
    process.env.CONTACT_RATE_LIMIT_SECRET = 'synthetic-secret-never-log';
    failCounter = true;
    assert.equal((await POST(request())).status, 503);
    assert.deepEqual(logs.pop(), ['[CONTACT_CREATE_FAILED]', { stage: 'rate-limit' }]);
    failCounter = false;
    assert.equal((await POST(request('{'))).status, 400);
    failInsert = true;
    const failed = await POST(request());
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { code: 'SERVER' });
    assert.deepEqual(logs.pop(), ['[CONTACT_CREATE_FAILED]', { stage: 'message-insert' }]);
    failInsert = false;
    const accepted = await POST(request());
    assert.equal(accepted.status, 201);
    assert.equal(accepted.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await accepted.json(), { ok: true });
    const discarded = await POST(request(JSON.stringify({ ...payload, website: 'synthetic-honeypot' })));
    assert.equal(discarded.status, 201);
    assert.equal(discarded.headers.get('cache-control'), 'no-store');
    assert.equal(inserts, 1);
    assert.deepEqual(logs, []);
  } finally {
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    db.$queryRaw = originalQuery;
    db.contactRateLimit.deleteMany = originalDelete;
    db.contactMessage.create = originalCreate;
    t.mock.restoreAll();
  }
});
