// Production-build rehearsal. Refuses every target except the disposable local DB.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import sharp from 'sharp';

const configured = process.env.RELEASE_TEST_DATABASE_URL;
assert.ok(configured, 'RELEASE_TEST_DATABASE_URL must identify the disposable local recovery DB');
const target = new URL(configured);
assert.ok(['127.0.0.1', 'localhost'].includes(target.hostname));
assert.equal(target.port, '55435');
assert.equal(target.pathname, '/recovery');
assert.equal(target.searchParams.get('schema'), 'public');
const db = new PrismaClient({ datasourceUrl: configured, log: [] });
const web = 'http://127.0.0.1:3100';
const control = 'http://127.0.0.1:3101';
const marker = `synthetic-${randomUUID()}`;
const email = `${marker}@example.test`;
const password = randomBytes(24).toString('hex');
const secretWord = randomBytes(24).toString('hex');
const body = '<script>alert(1)</script> This is synthetic plain-text test content.';
const children = [];
const output = [];
const profile = await mkdtemp(join(tmpdir(), 'tiladys-contact-browser-'));
let browser;
let user;
let inquiry;
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function until(check, label) {
  const started = Date.now();
  while (Date.now() - started < 30000) { if (await check().catch(() => false)) return; await sleep(100); }
  throw new Error(`Timed out at ${label}; runtime output withheld`);
}
function launch(command, args, env) {
  const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', chunk => output.push(chunk.toString()));
  child.stderr.on('data', chunk => output.push(chunk.toString()));
  children.push(child);
  child.on('error', () => {});
  return child;
}
class Browser {
  constructor(url) {
    this.socket = new WebSocket(url); this.next = 0; this.pending = new Map(); this.errors = []; this.posts = [];
    this.ready = new Promise((done, fail) => { this.socket.addEventListener('open', done); this.socket.addEventListener('error', fail); });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Runtime.exceptionThrown') this.errors.push('browser runtime exception');
      if (message.method === 'Network.responseReceived' && message.params.response.url === `${web}/api/contact`) this.posts.push(message.params.response.status);
      if (message.id) { const pending = this.pending.get(message.id); this.pending.delete(message.id); if (message.error) pending.fail(new Error('Browser command failed')); else pending.done(message.result); }
    });
  }
  async send(method, params = {}) { await this.ready; return new Promise((done, fail) => { const id = ++this.next; this.pending.set(id, { done, fail }); this.socket.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) { const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error('Browser evaluation failed; contents withheld'); return result.result.value; }
  async navigate(url) { await this.send('Page.navigate', { url }); await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`), 'page load'); await sleep(500); }
}
try {
  user = await db.adminUser.create({ data: { email, passwordHash: await argon2.hash(password), secretWordHash: await argon2.hash(secretWord) } });
  const env = { ...process.env, NODE_ENV: 'production', DATABASE_URL: configured, CONTROL_API_URL: control, NEXT_PUBLIC_SITE_URL: web, CONTROL_URL: control, SITE_URL: web, AUTH_SECRET: randomBytes(32).toString('hex'), CONTACT_RATE_LIMIT_SECRET: randomBytes(32).toString('hex'), CONTACT_IP_HEADER: 'x-vercel-forwarded-for', CONTACT_UPLOADS_ENABLED: 'true', SMTP_HOST: '', SMTP_FROM: '', NEXT_TELEMETRY_DISABLED: '1' };
  const next = resolve('node_modules/next/dist/bin/next');
  launch(process.execPath, [next, 'start', 'apps/web', '-p', '3100', '-H', '127.0.0.1'], env);
  launch(process.execPath, [next, 'start', 'apps/control', '-p', '3101', '-H', '127.0.0.1'], env);
  launch(process.env.CHROME_BIN || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9335', `--user-data-dir=${profile}`, 'about:blank'], env);
  await until(async () => (await fetch(`${control}/login`)).ok && (await fetch(`${web}/en/contact`)).ok, 'local servers');
  for (const path of ['/dashboard', '/dashboard/messages', '/api/admin/messages/missing/attachments/missing', '/api/admin/customers', '/api/admin/invoices']) {
    const response = await fetch(`${control}${path}`, { redirect: 'manual' });
    assert.ok([307, 401].includes(response.status), `Unauthenticated access rejected: ${path}`);
  }
  await until(async () => (await fetch('http://127.0.0.1:9335/json')).ok, 'browser startup');
  const tabs = await (await fetch('http://127.0.0.1:9335/json')).json();
  browser = new Browser(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await browser.send('Runtime.enable'); await browser.send('Network.enable');
  await browser.navigate(`${web}/en/contact`);
  assert.equal(await browser.evaluate('!!document.querySelector("#contact-form")'), true);
  const image = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#336699' } }).png().toBuffer();
  await browser.evaluate(`(() => {
    const form = document.querySelector('#contact-form');
    for (const [name,value] of Object.entries(${JSON.stringify({ name: marker, email, message: body })})) form.elements[name].value = value;
    form.elements.service.value = 'websites'; form.elements.service.dispatchEvent(new Event('change',{bubbles:true}));
    form.elements.consent.checked = true;
    const files = new DataTransfer(); files.items.add(new File([new Uint8Array(${JSON.stringify([...image])})], '../../dangerous-name.png', {type:'image/png'})); form.elements.images.files = files.files;
    form.requestSubmit();
  })()`);
  await until(() => browser.evaluate('document.querySelector("[data-result]")?.dataset.result === "success"'), 'contact UI success');
  assert.deepEqual(browser.posts, [201]);
  const rows = await db.contactMessage.findMany({ where: { email }, include: { attachments: true } });
  assert.equal(rows.length, 1); inquiry = rows[0];
  assert.equal(inquiry.name, marker); assert.equal(inquiry.message, body); assert.equal(inquiry.locale, 'en'); assert.equal(inquiry.service, 'websites'); assert.equal(inquiry.status, 'UNREAD');
  assert.equal(inquiry.attachments.length, 1);
  const attachment = inquiry.attachments[0];
  assert.equal(attachment.mimeType, 'image/webp'); assert.equal(attachment.filename, 'inquiry-image-1.webp');
  assert.equal((await sharp(attachment.data).metadata()).format, 'webp');
  const attachmentPath = `/api/admin/messages/${inquiry.id}/attachments/${attachment.id}`;
  assert.equal((await fetch(`${control}${attachmentPath}`)).status, 401);
  // Four remaining attempts in the same unknown-source window; no extra rows.
  const limited = await Promise.all(Array.from({ length: 5 }, async () => (await fetch(`${web}/api/contact`, {
    method: 'POST', headers: { origin: web, 'content-type': 'application/json' },
    body: JSON.stringify({ name: marker, email, message: body, locale: 'en', service: 'websites', consent: true, website: 'synthetic-honeypot' }),
  })).status));
  assert.equal(limited.filter(status => status === 201).length, 4);
  assert.equal(limited.filter(status => status === 429).length, 1);
  assert.equal(await db.contactMessage.count({ where: { email } }), 1);
  await browser.navigate(`${control}/login`);
  await browser.evaluate(`(() => {const form=document.querySelector('form');for(const [name,value] of Object.entries(${JSON.stringify({ email, password, secretWord })}))form.elements[name].value=value;form.requestSubmit();})()`);
  await until(() => browser.evaluate('location.pathname === "/dashboard" && document.readyState === "complete"'), 'normal admin login');
  const cookies = (await browser.send('Network.getCookies', { urls: [control] })).cookies;
  const session = cookies.find(cookie => cookie.name === 'tiladys_session');
  assert.ok(session?.httpOnly && session.secure && session.sameSite === 'Strict');
  await browser.navigate(`${control}/dashboard/messages`);
  assert.equal(await browser.evaluate(`document.body.textContent.includes(${JSON.stringify(marker)}) && document.body.textContent.includes(${JSON.stringify(body)})`), true);
  assert.equal(await browser.evaluate(`fetch(${JSON.stringify(attachmentPath)}).then(r=>r.status)`), 200);
  const statusPath = `/api/admin/messages/${inquiry.id}/status`;
  assert.equal(await browser.evaluate(`fetch(${JSON.stringify(statusPath)}, {method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status:'READ'})}).then(r=>r.status)`), 200);
  assert.equal((await db.contactMessage.findUniqueOrThrow({ where: { id: inquiry.id } })).status, 'READ');
  assert.equal((await fetch(`${control}${statusPath}`, { method: 'PATCH', headers: { origin: 'https://evil.example', cookie: `${session.name}=${session.value}`, 'content-type': 'application/json' }, body: JSON.stringify({ status: 'UNREAD' }) })).status, 403);
  const failedReply = await browser.evaluate(`fetch('/api/admin/messages/${inquiry.id}/reply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reply:'Synthetic local reply; SMTP intentionally unavailable.'})}).then(r=>r.status)`);
  assert.equal(failedReply, 503); assert.equal((await db.contactMessage.findUniqueOrThrow({ where: { id: inquiry.id } })).status, 'READ');
  assert.ok(await db.contactRateLimit.count() > 0);
  assert.deepEqual(browser.errors, []);
  const logs = output.join('');
  for (const privateValue of [email, marker, body, password, secretWord, configured]) assert.equal(logs.includes(privateValue), false, 'No synthetic PII/secrets in server output');
  console.log('PASS: browser form → HTTP 201 once → one UNREAD database inquiry → normal admin login → escaped Messages rendering.');
  console.log('PASS: processed private WebP, unauthenticated rejection, HttpOnly/Secure/Strict cookie, READ flow, foreign Origin rejection, SMTP failure leaves status unchanged, shared rate counter and no PII/secret logs.');
} finally {
  browser?.socket.close();
  for (const child of children) child.kill('SIGTERM');
  await Promise.all(children.map(child => child.exitCode === null ? new Promise(done => child.once('exit', done)) : Promise.resolve()));
  await db.contactMessage.deleteMany({ where: { email } });
  if (user) { await db.auditLog.deleteMany({ where: { userId: user.id } }); await db.adminUser.delete({ where: { id: user.id } }); }
  await db.$disconnect();
  await rm(profile, { recursive: true, force: true });
}
