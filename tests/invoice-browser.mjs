import assert from 'node:assert/strict';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const control = process.env.INVOICE_BROWSER_CONTROL_URL ?? 'http://127.0.0.1:3101';
const databaseUrl = process.env.INVOICE_BROWSER_DATABASE_URL;
if (!databaseUrl) throw new Error('INVOICE_BROWSER_DATABASE_URL is required');
const parsed = new URL(databaseUrl); if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) throw new Error('Browser test database must be local');
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const suffix = Date.now(); const email = `invoice-browser-${suffix}@example.test`; const password = 'InvoiceBrowserPass123!'; const secretWord = 'invoice browser secret';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label, timeout = 20_000) { const start = Date.now(); while (Date.now() - start < timeout) { try { if (await check()) return; } catch {} await sleep(100); } throw new Error(`Timed out: ${label}`); }
class CDP {
  constructor(url) { this.socket = new WebSocket(url); this.next = 0; this.pending = new Map(); this.errors = []; this.ready = new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve); this.socket.addEventListener('error', reject); }); this.socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text); if (message.id) { const pending = this.pending.get(message.id); this.pending.delete(message.id); message.error ? pending.reject(message.error) : pending.resolve(message.result); } }); }
  async send(method, params = {}) { await this.ready; return new Promise((resolve, reject) => { const id = ++this.next; this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) { const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
  async navigate(url) { await this.send('Page.navigate', { url }); await until(() => this.evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`), url); await sleep(250); }
}
let user; let customer; let job; let invoiceId; let connection; let previousSettings;
try {
  previousSettings = await db.businessBillingSettings.findUnique({ where: { id: 'default' } }); await db.businessBillingSettings.deleteMany({ where: { id: 'default' } });
  user = await db.adminUser.create({ data: { email, passwordHash: await argon2.hash(password), secretWordHash: await argon2.hash(secretWord), displayName: 'Invoice Browser Test' } });
  customer = await db.customer.create({ data: { customerNumber: `C-2098-${String(suffix).slice(-4)}`, status: 'ARCHIVED', firstName: 'Browser', lastName: 'Customer', email, street: 'Teststraße 2', postalCode: '45479', city: 'Mülheim an der Ruhr', country: 'DE' } });
  job = await db.serviceJob.create({ data: { jobNumber: `JOB-2098-${String(suffix).slice(-4)}`, customerId: customer.id, title: 'Browser invoice workflow', serviceDate: new Date(), estimatedPrice: '45', privateNotes: 'PRIVATE WORK NOTE — MUST NOT APPEAR ON PDF' } });
  await until(async () => (await fetch(`${control}/login`)).ok, 'control server');
  const targets = await (await fetch('http://127.0.0.1:9335/json')).json(); connection = new CDP(targets.find((target) => target.type === 'page').webSocketDebuggerUrl); await connection.send('Page.enable'); await connection.send('Runtime.enable');
  await connection.navigate(`${control}/login`);
  assert.equal(await connection.evaluate(`fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(${JSON.stringify({ email, password, secretWord })})}).then(r=>r.status)`), 200);
  await connection.navigate(`${control}/dashboard/service-jobs?jobId=${job.id}`);
  assert.equal(await connection.evaluate(`document.querySelector('label select').value`), customer.id);
  assert.match(await connection.evaluate(`document.querySelector('label select').selectedOptions[0].textContent`), /archived/);
  assert.match(await connection.evaluate('document.body.textContent'), /Create service line from existing estimate/);
  assert.equal(await connection.evaluate(`getComputedStyle(document.querySelector('.job-editor')).color`), 'rgb(10, 30, 59)');
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Title')).querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Save and create draft')).click()`); await sleep(300);
  assert.equal(await db.invoice.count({ where: { serviceJobId: job.id } }), 0); assert.match(await connection.evaluate('document.body.textContent'), /Please correct the highlighted fields/);
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Title')).querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'Browser invoice workflow');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Create service line from existing estimate')).click()`);
  await connection.evaluate(`(()=>{const select=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Tax treatment')).querySelector('select');const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;setter.call(select,'VAT_STANDARD');select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Save and create draft')).click()`);
  await until(() => connection.evaluate(`location.pathname === '/dashboard/invoices'`), 'invoice navigation');
  invoiceId = new URL(await connection.evaluate('location.href')).searchParams.get('invoiceId'); assert.ok(invoiceId);
  const reloadedJob = await db.serviceJob.findUniqueOrThrow({ where: { id: job.id }, include: { lineItems: true } }); assert.equal(reloadedJob.customerId, customer.id); assert.equal(reloadedJob.lineItems.length, 1); assert.equal(reloadedJob.lineItems[0].agreedUnitPrice.toString(), '45');
  assert.match(await connection.evaluate('document.body.textContent'), /DRAFT/); assert.match(await connection.evaluate('document.body.textContent'), /Browser invoice workflow/);
  assert.equal(await db.invoice.count({ where: { serviceJobId: job.id, status: 'DRAFT' } }), 1);
  const draftPdf = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/pdf').then(async r=>({status:r.status,type:r.headers.get('content-type'),magic:String.fromCharCode(...new Uint8Array(await r.arrayBuffer()).slice(0,4))}))`); assert.deepEqual(draftPdf, { status: 200, type: 'application/pdf', magic: '%PDF' });
  const blocked = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/issue',{method:'POST'}).then(async r=>({status:r.status,body:await r.json()}))`); assert.equal(blocked.status, 422); assert.equal(blocked.body.error, 'BILLING_SETTINGS_UNCONFIRMED');
  const settingsStatus = await connection.evaluate(`fetch('/api/admin/billing-settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({legalName:'TiLADYS – Vladyslav Titov',street:'Kronenstraße 19',postalCode:'45479',city:'Mülheim an der Ruhr',country:'Germany',email:'contact@tiladys.com',phone:'+49 163 7235608',taxMode:'VAT',taxNumber:'SYNTHETIC-TEST',vatId:'',taxStatement:'',bankAccountHolder:'Vladyslav Titov',iban:'',bic:'',bankName:'',paymentTermsDays:14,paymentInstructions:'Synthetic browser test',confirmSettings:true})}).then(r=>r.status)`); assert.equal(settingsStatus, 200);
  const issued = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/issue',{method:'POST'}).then(r=>r.json())`); assert.match(issued.invoiceNumber, /^INV-\d{4}-\d{4}$/); assert.equal(issued.total, '53.55'); assert.equal(issued.outstanding, '53.55');
  const payment = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:'3.55',paidAt:new Date().toISOString(),method:'BANK',reference:'TEST',note:''})}).then(r=>r.json())`); assert.equal(payment.paidTotal, '3.55'); assert.equal(payment.outstanding, '50');
  await connection.navigate(`${control}/dashboard/invoices?invoiceId=${invoiceId}`); assert.match(await connection.evaluate('document.body.textContent'), /Outstanding/); assert.match(await connection.evaluate('document.body.textContent'), /50,00/);
  await connection.navigate(`${control}/dashboard/customers/${customer.id}`); assert.match(await connection.evaluate('document.body.textContent'), new RegExp(issued.invoiceNumber));
  await connection.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await connection.navigate(`${control}/dashboard/invoices?invoiceId=${invoiceId}`); assert.ok(await connection.evaluate('document.documentElement.scrollWidth <= innerWidth'));
  assert.equal(connection.errors.length, 0, connection.errors.join('\n'));
  const unauthorized = await fetch(`${control}/api/admin/invoices/${invoiceId}/pdf`); assert.equal(unauthorized.status, 401);
  console.log('PASS: customer → job → draft → PDF → blocked-until-confirmed issue → issued snapshot → partial payment → customer list; auth and mobile checks pass.');
} finally {
  connection?.socket.close();
  if (invoiceId) { await db.invoicePayment.deleteMany({ where: { invoiceId } }); await db.invoice.deleteMany({ where: { id: invoiceId } }); }
  if (job) await db.serviceJob.delete({ where: { id: job.id } }).catch(() => {});
  if (customer) await db.customer.delete({ where: { id: customer.id } }).catch(() => {});
  if (user) { await db.session.deleteMany({ where: { userId: user.id } }); await db.auditLog.deleteMany({ where: { userId: user.id } }); await db.adminUser.delete({ where: { id: user.id } }).catch(() => {}); }
  await db.businessBillingSettings.deleteMany({ where: { id: 'default' } }); if (previousSettings) { const { createdAt: _createdAt, updatedAt: _updatedAt, ...data } = previousSettings; await db.businessBillingSettings.create({ data }); }
  await db.$disconnect();
}
