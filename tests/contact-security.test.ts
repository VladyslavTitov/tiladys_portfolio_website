import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { contactSchema } from '../packages/shared/src/index.ts';
import { requestSource, contactRateLimit } from '../apps/web/lib/contact-rate-limit.ts';

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const valid = {
  website: '',
  name: 'Vladyslav',
  email: 'visitor@example.com',
  service: 'websites',
  locale: 'en',
  message: 'Please tell me more about this service.',
  consent: true,
};

test('contact validation accepts ordinary and harmless plain-text content', () => {
  for (const message of [
    '<script>alert(1)</script>',
    "' OR 1=1 -- This remains ordinary text.",
    'Потрібна допомога з комп’ютером.',
    'Ich benötige Unterstützung für meinen Laptop.',
    'Potrebujem pomoc s webovou stránkou.',
    'Je souhaite créer un nouveau site internet.',
    'Can you help with my laptop? 😊',
  ]) assert.equal(contactSchema.safeParse({ ...valid, message }).success, true, message);
});

test('contact validation rejects invalid, oversized, whitespace and unexpected input', () => {
  const invalid = [
    { ...valid, message: '' },
    { ...valid, message: '        ' },
    { ...valid, email: 'not-an-email' },
    { ...valid, name: 'x'.repeat(81) },
    { ...valid, message: 'x'.repeat(5001) },
    { ...valid, unexpected: 'field' },
    { ...valid, consent: false },
    { ...valid, message: 123 },
    { ...valid, service: 'invalid-service' },
  ];
  for (const payload of invalid) assert.equal(contactSchema.safeParse(payload).success, false);
});

test('honeypot is accepted for indistinguishable discard handling', () => {
  assert.equal(contactSchema.safeParse({ ...valid, website: 'https://spam.example' }).success, true);
  const route = read('apps/web/app/api/contact/route.ts');
  assert.match(route, /if \(website\) return NextResponse\.json\(\{ ok: true \}/);
});

test('shared rate limiter rejects concurrent attempts and separates windows', async () => {
  const counts = new Map<string, number>();
  const increment = async (key: string) => { const count = (counts.get(key) ?? 0) + 1; counts.set(key, count); return count; };
  const results = await Promise.all(Array.from({ length: 12 }, () => contactRateLimit('192.0.2.1', increment, 'test-key', 1000)));
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(await contactRateLimit('192.0.2.1', increment, 'test-key', 601000), true);
  assert.ok([...counts.keys()].every((key) => !key.includes('192.0.2.1')));
});

test('untrusted forwarded IP values cannot evade the shared unknown-source counter', () => {
  const headers = new Headers({ 'x-forwarded-for': '192.0.2.10, 192.0.2.20', 'x-real-ip': 'forged' });
  assert.equal(requestSource(headers), 'unknown');
  assert.equal(requestSource(headers, 'x-forwarded-for'), '192.0.2.10');
  assert.equal(requestSource(headers, 'x-real-ip'), 'unknown');
  assert.equal(requestSource(headers, 'arbitrary-header'), 'unknown');
});

test('contact and admin endpoints enforce their security boundaries', () => {
  const publicRoute = read('apps/web/app/api/contact/route.ts');
  const adminRoute = read('apps/control/app/api/admin/messages/[id]/status/route.ts');
  assert.match(publicRoute, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(publicRoute, /boundedBody/);
  assert.match(publicRoute, /JSON\.parse/);
  assert.match(publicRoute, /contactSchema\.safeParse/);
  assert.doesNotMatch(publicRoute, /export async function GET/);
  assert.match(read('apps/web/components/ContactForm.tsx'), /fetch\('\/api\/contact'/);
  assert.match(adminRoute, /await assertOrigin\(\)/);
  assert.match(adminRoute, /await requireUser\(\)/);
  assert.match(adminRoute, /message === 'UNAUTHORIZED'/);
  assert.match(adminRoute, /z\.enum\(\['UNREAD', 'READ'\]\)/);
});

test('admin message content is rendered with React text escaping', () => {
  const list = read('apps/control/app/dashboard/messages/message-list.tsx');
  assert.match(list, /\{message\.message\}/);
  assert.doesNotMatch(list, /dangerouslySetInnerHTML/);
});
