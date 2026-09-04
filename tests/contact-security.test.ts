import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { contactSchema } from '../packages/shared/src/index.ts';
import { rateLimit } from '../apps/control/lib/rate-limit.ts';

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const valid = {
  website: '',
  name: 'Vladyslav',
  email: 'visitor@example.com',
  service: 'Website Creation',
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
  ];
  for (const payload of invalid) assert.equal(contactSchema.safeParse(payload).success, false);
});

test('honeypot is accepted for indistinguishable discard handling', () => {
  assert.equal(contactSchema.safeParse({ ...valid, website: 'https://spam.example' }).success, true);
  const route = read('apps/control/app/api/public/contact/route.ts');
  assert.match(route, /if \(website\) return NextResponse\.json\(\{ ok: true \}/);
});

test('rate limiter rejects rapid repeated submissions', () => {
  const key = `contact-test-${Date.now()}-${Math.random()}`;
  for (let attempt = 0; attempt < 5; attempt += 1) assert.equal(rateLimit(key, 5, 60_000), true);
  assert.equal(rateLimit(key, 5, 60_000), false);
});

test('contact and admin endpoints enforce their security boundaries', () => {
  const publicRoute = read('apps/control/app/api/public/contact/route.ts');
  const adminRoute = read('apps/control/app/api/admin/messages/[id]/status/route.ts');
  assert.match(publicRoute, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(publicRoute, /Buffer\.byteLength/);
  assert.match(publicRoute, /JSON\.parse/);
  assert.match(publicRoute, /contactSchema\.safeParse/);
  assert.doesNotMatch(publicRoute, /export async function GET/);
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
