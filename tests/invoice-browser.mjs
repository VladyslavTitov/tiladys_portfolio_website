import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const control = process.env.INVOICE_BROWSER_CONTROL_URL ?? 'http://127.0.0.1:3101';
const databaseUrl = process.env.INVOICE_BROWSER_DATABASE_URL;
if (!databaseUrl) throw new Error('INVOICE_BROWSER_DATABASE_URL is required');
const parsed = new URL(databaseUrl); if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.port !== '55434' || parsed.pathname !== '/tiladys_crm_test') throw new Error('Browser test database must be local');
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const suffix = Date.now(); const email = `invoice-browser-${suffix}@example.test`; const password = 'InvoiceBrowserPass123!'; const secretWord = 'invoice browser secret';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label, timeout = 20_000) { const start = Date.now(); while (Date.now() - start < timeout) { try { if (await check()) return; } catch {} await sleep(100); } throw new Error(`Timed out: ${label}`); }
class CDP {
  constructor(url) { this.socket = new WebSocket(url); this.next = 0; this.pending = new Map(); this.errors = []; this.rejectDialog = false; this.dialogs = 0; this.ready = new Promise((resolve, reject) => { this.socket.addEventListener('open', resolve); this.socket.addEventListener('error', reject); }); this.socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Page.javascriptDialogOpening' && this.rejectDialog) { this.dialogs++; this.rejectDialog = false; void this.send('Page.handleJavaScriptDialog', { accept: false }); } if (message.method === 'Runtime.exceptionThrown') this.errors.push(message.params.exceptionDetails.text); if (message.id) { const pending = this.pending.get(message.id); this.pending.delete(message.id); message.error ? pending.reject(message.error) : pending.resolve(message.result); } }); }
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
  assert.equal(await connection.evaluate(`[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Customer')).querySelector('select').value`), customer.id);
  assert.match(await connection.evaluate(`[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Customer')).querySelector('select').selectedOptions[0].textContent`), /archived/);
  assert.match(await connection.evaluate('document.body.textContent'), /Create service line from existing estimate/);
  assert.equal(await connection.evaluate(`getComputedStyle(document.querySelector('.job-editor')).color`), 'rgb(10, 30, 59)');
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Title')).querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Save and create draft')).click()`); await sleep(300);
  assert.equal(await db.invoice.count({ where: { serviceJobId: job.id } }), 0);
  connection.rejectDialog = true;
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('New service job')).click()`);
  assert.equal(connection.dialogs, 1); assert.match(await connection.evaluate('document.body.textContent'), new RegExp(job.jobNumber));
  assert.match(await connection.evaluate('document.body.textContent'), /Please correct the highlighted fields/);
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Title')).querySelector('input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'Browser invoice workflow');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`(()=>{const original=window.fetch;let fail=true;window.fetch=(url,options)=>String(url).startsWith('/api/admin/catalogue')&&fail?(fail=false,Promise.resolve(new Response('{}',{status:503,headers:{'Content-Type':'application/json'}}))):original(url,options);})()`);
  await connection.evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Add service');button.focus();button.click();})()`);
  await until(() => connection.evaluate(`document.querySelector('dialog')?.textContent.includes('Could not load services')`), 'catalogue failure is visible');
  await connection.evaluate(`[...document.querySelectorAll('dialog button')].find(button=>button.textContent==='Retry').click()`);

  await until(() => connection.evaluate(`document.querySelectorAll('#service-results button').length > 0`), 'job catalogue loads');
  await connection.evaluate(`(()=>{const input=document.querySelector('[role=combobox]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'clean');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  assert.match(await connection.evaluate(`document.querySelector('#service-results').textContent`), /[Cc]lean/);
  await connection.evaluate(`(()=>{const input=document.querySelector('[role=combobox]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'no-such-synthetic-service');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  assert.match(await connection.evaluate(`document.querySelector('dialog').textContent`), /No matching services/);

  await connection.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await until(() => connection.evaluate(`!document.querySelector('dialog')`), 'job picker closes');
  assert.equal(await connection.evaluate(`document.activeElement.textContent.trim()`), 'Add service');
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Create service line from existing estimate')).click()`);
  await connection.evaluate(`(()=>{const select=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Tax treatment')).querySelector('select');const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;setter.call(select,'VAT_STANDARD');select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Service name (German)')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Testleistung');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.includes('Save and create draft')).click()`);
  await until(() => connection.evaluate(`location.pathname === '/dashboard/invoices'`), 'invoice navigation');
  invoiceId = new URL(await connection.evaluate('location.href')).searchParams.get('invoiceId'); assert.ok(invoiceId);
  const reloadedJob = await db.serviceJob.findUniqueOrThrow({ where: { id: job.id }, include: { lineItems: true } }); assert.equal(reloadedJob.customerId, customer.id); assert.equal(reloadedJob.lineItems.length, 1); assert.equal(reloadedJob.lineItems[0].agreedUnitPrice.toString(), '45');
  assert.match(await connection.evaluate('document.body.textContent'), /DRAFT/); assert.match(await connection.evaluate('document.body.textContent'), /Browser invoice workflow/);
  assert.equal(await db.invoice.count({ where: { serviceJobId: job.id, status: 'DRAFT' } }), 1);
  const evidence = 'docs/business-control/samples/bilingual-review/browser'; mkdirSync(evidence, { recursive: true });
  for (const width of [360,390,768,1440]) {
    await connection.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await connection.navigate(`${control}/dashboard/invoices?invoiceId=${invoiceId}`);
    assert.ok(await connection.evaluate('document.documentElement.scrollWidth <= innerWidth'), `Invoice overflow at ${width}`);
    writeFileSync(`${evidence}/invoice-${width}.png`, Buffer.from((await connection.send('Page.captureScreenshot', { captureBeyondViewport: true })).data,'base64'));
    await connection.evaluate(`document.getElementById('invoice-add-line').click()`);
    await until(() => connection.evaluate(`document.querySelectorAll('#service-results button').length > 0`), 'invoice picker loads');
    await connection.evaluate(`(()=>{const input=document.querySelector('[role=combobox]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Reinigung');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    assert.ok(await connection.evaluate(`document.querySelectorAll('#service-results button').length > 0`));
    assert.ok(await connection.evaluate(`document.querySelector('dialog').getBoundingClientRect().right <= innerWidth`));
    writeFileSync(`${evidence}/picker-${width}.png`, Buffer.from((await connection.send('Page.captureScreenshot')).data,'base64'));
    // Reduce available viewport to approximate the space remaining above a mobile keyboard.
    if (width < 768) { await connection.send('Emulation.setDeviceMetricsOverride', { width, height: 420, deviceScaleFactor: 1, mobile: true }); assert.ok(await connection.evaluate(`document.querySelector('dialog').getBoundingClientRect().height <= innerHeight`)); }
    await connection.send('Input.dispatchKeyEvent', { type:'keyDown', key:'ArrowDown', code:'ArrowDown', windowsVirtualKeyCode:40 });
    await connection.send('Input.dispatchKeyEvent', { type:'keyDown', key:'Enter', code:'Enter', windowsVirtualKeyCode:13 });
    await until(() => connection.evaluate(`!document.querySelector('dialog')`), 'Enter selects service');
    assert.equal(await connection.evaluate(`document.querySelectorAll('.invoice-lines article').length`),2);
    await connection.evaluate(`[...document.querySelectorAll('.invoice-lines article')].at(-1).querySelector('button[aria-label="Remove line"]').click()`);
  }
  await connection.send('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
  await connection.evaluate(`(()=>{const input=document.getElementById('invoice-lines.0.serviceNameDe');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Geänderte Testleistung');input.dispatchEvent(new Event('input',{bubbles:true}));window.originalFetch=window.fetch;window.fetch=(url,options)=>options?.method==='PATCH'?Promise.reject(new Error('Synthetic network failure')):window.originalFetch(url,options);})()`);
  await connection.evaluate(`document.getElementById('invoice-save').click()`);
  await until(() => connection.evaluate(`document.body.textContent.includes('Could not save draft')`), 'failed save is visible');
  assert.equal(await connection.evaluate(`document.getElementById('invoice-lines.0.serviceNameDe').value`),'Geänderte Testleistung');
  await connection.evaluate(`window.fetch=window.originalFetch;document.getElementById('invoice-save').click()`);
  await until(() => connection.evaluate(`document.body.textContent.includes('Draft saved.')`), 'retry saves preserved edits');
  assert.equal((await db.serviceJobLineItem.findFirstOrThrow({where:{serviceJobId:job.id}})).serviceNameDe,'Testleistung');
  await connection.navigate(`${control}/dashboard/invoices?invoiceId=${invoiceId}`);
  assert.equal(await connection.evaluate(`document.getElementById('invoice-lines.0.serviceNameDe').value`),'Geänderte Testleistung');
  const saveTimes = [];
  for (let iteration = 0; iteration < 7; iteration++) {
    const start = performance.now(); await connection.evaluate(`document.getElementById('invoice-save').click()`);
    await until(() => connection.evaluate(`document.body.textContent.includes('Draft saved.') && !document.getElementById('invoice-save').disabled`), 'timed persisted save');
    saveTimes.push(+(performance.now() - start).toFixed(2));
  }
  writeFileSync(`${evidence}/save-timings.json`, JSON.stringify({ method: 'Seven UI saves; wall time from click to persisted success observed by 100ms polling; includes browser protocol and polling overhead.', milliseconds: saveTimes }, null, 2));
  const draftPdf = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/pdf').then(async r=>({status:r.status,type:r.headers.get('content-type'),magic:String.fromCharCode(...new Uint8Array(await r.arrayBuffer()).slice(0,4))}))`); assert.deepEqual(draftPdf, { status: 200, type: 'application/pdf', magic: '%PDF' });
  const blocked = await connection.evaluate(`fetch('/api/admin/invoices/${invoiceId}/issue',{method:'POST'}).then(async r=>({status:r.status,body:await r.json()}))`); assert.equal(blocked.status, 422); assert.equal(blocked.body.error, 'BILLING_SETTINGS_UNCONFIRMED');
  await connection.evaluate(`(()=>{const input=[...document.querySelectorAll('label')].find(l=>l.textContent==='Tax number').querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'SYNTHETIC-TEST');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await connection.evaluate(`(()=>{const select=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Tax treatment')).querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,'VAT');select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await connection.evaluate(`[...document.querySelectorAll('label')].find(l=>l.textContent.includes('I confirm that the tax treatment')).querySelector('input').click()`);
  await connection.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save billing settings')).click()`);
  await until(()=>connection.evaluate(`document.body.textContent.includes('Billing settings saved and confirmed.')`),'billing settings UI save');

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
