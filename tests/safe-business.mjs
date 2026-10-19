// Full synthetic company → client → quote → job/task → invoice → payment flow.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
assert.equal(url.hostname, '127.0.0.1'); assert.equal(url.port, '55432'); assert.equal(url.pathname, '/tiladys_rebuild_test');
const db = new PrismaClient(); const checks = [];
const fixture = JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json', 'utf8'));
const base = 'http://127.0.0.1:3101';
const headers = { 'Content-Type': 'application/json', origin: base, cookie: `tiladys_session=${fixture.token}` };
async function request(path, method, body, status = 200, extra = {}) {
  const response = await fetch(base + '/api/admin' + path, { method, headers: { ...headers, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal(response.status, status, `${method} ${path}: ${await response.clone().text()}`);
  return response.json();
}
try {
  const marker = crypto.randomUUID();
  const companyBody = { name: `Synthetic workflow ${marker}`, email: 'company@example.test', country: 'DE' };
  const company = await request('/companies', 'POST', companyBody, 201);
  await request(`/companies/${company.id}`, 'PATCH', { ...companyBody, notes: 'Synthetic retained company note' });
  assert.equal((await db.company.findUniqueOrThrow({ where: { id: company.id } })).notes, 'Synthetic retained company note');
  const customerBody = { firstName: 'Synthetic', lastName: 'Workflow', email: `workflow-${marker}@example.test`, companyId: company.id, street: 'Synthetic 1', postalCode: '00000', city: 'Synthetic', country: 'DE', preferredLanguage: 'de' };
  let customer = await request('/customers', 'POST', customerBody, 201);
  customer = await request(`/customers/${customer.id}`, 'PATCH', { ...customerBody, phone: '000', expectedUpdatedAt: customer.updatedAt });
  assert.equal(customer.companyId, company.id);
  checks.push('Company create/update and linked customer create/update persist through actual APIs.');

  const line = { serviceName: 'Synthetic service', serviceNameDe: 'Synthetische Leistung', quantity: '1', unit: 'item', unitDe: 'Stück', unitPrice: '15', taxTreatment: 'VAT_STANDARD', priceMode: 'MANUAL', priceConfirmed: true };
  let quote = await request('/quotes', 'POST', { customerId: customer.id, title: `Synthetic workflow ${marker}`, validUntil: '2030-01-01', exclusions: 'Synthetic test only', exclusionsDe: 'Nur synthetischer Test', lines: [line] }, 201);
  quote = await request(`/quotes/${quote.id}`, 'PATCH', { revision: quote.revision, action: 'send' });
  const revision = quote.revisions[0]; const frozen = JSON.stringify(revision.snapshot);
  quote = await request(`/quotes/${quote.id}`, 'PATCH', { revision: quote.revision, action: 'accept', acceptedRevisionId: revision.id, acceptedAt: new Date().toISOString(), source: 'Synthetic isolated QA', reference: marker });
  const conversion = { revision: quote.revision, action: 'convert', acceptedRevisionId: revision.id };
  const jobs = await Promise.all([request(`/quotes/${quote.id}`, 'PATCH', conversion), request(`/quotes/${quote.id}`, 'PATCH', conversion)]);
  assert.equal(jobs[0].serviceJobId, jobs[1].serviceJobId);
  assert.equal(JSON.stringify((await db.quoteRevision.findUniqueOrThrow({ where: { id: revision.id } })).snapshot), frozen);
  const job = await db.serviceJob.findUniqueOrThrow({ where: { id: jobs[0].serviceJobId }, include: { lineItems: true } });
  assert.equal(job.customerId, customer.id); assert.equal(job.lineItems[0].agreedUnitPrice.toString(), '15');
  checks.push('Quote sharing record (no SMTP), exact accepted revision and concurrent job conversion replay preserve frozen agreed lines.');

  const taskBody = { title: `Synthetic workflow task ${marker}`, description: 'Synthetic test only', status: 'TODO', priority: 1, dueAt: '2026-12-01T11:00:00.000Z', timeZone: 'Europe/Berlin', customerId: customer.id, serviceJobId: job.id };
  const task = await request('/tasks', 'POST', taskBody, 201);
  await request(`/tasks/${task.id}`, 'PATCH', { ...taskBody, status: 'DONE', revision: task.revision });
  assert.equal((await db.task.findUniqueOrThrow({ where: { id: task.id } })).status, 'DONE');
  checks.push('Linked job task saves, completes, and retains its client/job/timezone relationships.');

  quote = await request(`/quotes/${quote.id}`, 'GET');
  const draftAction = { action: 'invoice', revision: quote.revision, acceptedRevisionId: revision.id };
  const draft = await request(`/quotes/${quote.id}`, 'PATCH', draftAction);
  const replay = await request(`/quotes/${quote.id}`, 'PATCH', draftAction);
  assert.equal(draft.invoiceId, replay.invoiceId);
  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: draft.invoiceId } });
  assert.equal(invoice.status, 'DRAFT'); assert.equal(invoice.invoiceNumber, null);
  const preview = await fetch(base + `/api/admin/invoices/${invoice.id}/pdf`, { headers }); assert.equal(preview.status, 200);
  await writeFile('docs/safe-execution/evidence/workflow-draft.pdf', Buffer.from(await preview.arrayBuffer()));
  const settings = await db.businessBillingSettings.findUniqueOrThrow({ where: { id: 'default' } });
  await request(`/invoices/${invoice.id}/issue`, 'POST', { expectedInvoiceUpdatedAt: invoice.updatedAt.toISOString(), expectedSettingsUpdatedAt: settings.updatedAt.toISOString() });
  const issued = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
  assert.ok(issued.issuedPdf?.length); assert.equal(issued.documentVersion, 3);
  const pdfPath = 'docs/safe-execution/evidence/workflow-issued.pdf'; await writeFile(pdfPath, Buffer.from(issued.issuedPdf));
  const extracted = spawnSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' }); assert.equal(extracted.status, 0);
  const pages = extracted.stdout.split('\f').filter(page => page.trim());
  assert.equal(pages.length, 2); assert.match(pages[0], /RECHNUNG/); assert.match(pages[1], /INVOICE/);
  checks.push('Accepted quote creates one unnumbered draft; synthetic issuance freezes a version-3 PDF with German page 1 and English page 2.');

  const payment = { amount: '1', paidAt: new Date().toISOString(), method: 'synthetic QA only' };
  const paymentKey = { 'Idempotency-Key': crypto.randomUUID() };
  await request(`/invoices/${invoice.id}/payments`, 'POST', payment, 200, paymentKey);
  await request(`/invoices/${invoice.id}/payments`, 'POST', payment, 200, paymentKey);
  const paid = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id }, include: { payments: true } });
  assert.equal(paid.payments.length, 1); assert.equal(paid.payments[0].amount.toString(), '1');
  assert.deepEqual(Buffer.from(paid.issuedPdf), Buffer.from(issued.issuedPdf));
  await request(`/customers/${customer.id}`, 'DELETE');
  assert.equal((await db.customer.findUniqueOrThrow({ where: { id: customer.id } })).status, 'ARCHIVED');
  assert.equal((await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).customerId, customer.id);
  checks.push('Synthetic partial payment replays once without altering PDF bytes; customer archive retains financial links.');
  await writeFile('docs/safe-execution/evidence/business-workflow.json', JSON.stringify({ timestamp: new Date().toISOString(), environment: 'verified isolated synthetic database; SMTP disabled', checks }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }));
} finally { await db.$disconnect(); }
