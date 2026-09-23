import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const url = process.env.CRM_TEST_DATABASE_URL;
if (!url) throw new Error('CRM_TEST_DATABASE_URL required');
const parsed = new URL(url);
assert.ok(['localhost', '127.0.0.1'].includes(parsed.hostname)); assert.equal(parsed.port, '55434'); assert.equal(parsed.pathname, '/tiladys_crm_test');
const base = process.env.INVOICE_BROWSER_CONTROL_URL ?? 'http://127.0.0.1:3101';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const db = new PrismaClient({ datasourceUrl: url });
const token = crypto.randomBytes(32).toString('hex'), suffix = Date.now().toString();
let admin, customer, company, other, previousSettings; const jobs = [], invoices = [];
async function api(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, { method, headers: { Cookie: `tiladys_session=${token}`, Origin: base, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, data };
}
const invoiceBody = invoice => ({
  customerId: invoice.customerId, serviceJobId: invoice.serviceJobId ?? '', billingCompanyId: invoice.billingCompanyId ?? '', billingRecipientType: invoice.billingRecipientType,
  issueDate: invoice.issueDate ?? '', dueDate: invoice.dueDate ?? '', serviceDateFrom: invoice.serviceDateFrom ?? '', serviceDateTo: invoice.serviceDateTo ?? '',
  ...Object.fromEntries(['recipientName','recipientCompany','recipientEmail','recipientStreet','recipientPostalCode','recipientCity','recipientCountry','customerReference','notes'].map(key=>[key,invoice[key] ?? ''])),
  lines: invoice.lines.map(line => ({ serviceName: line.serviceName, description: line.description ?? '', quantity: line.quantity, unit: line.unit, unitPrice: line.unitPrice, taxTreatment: line.taxTreatment })),
});
const jobData = (title, companyId) => ({ customerId: customer.id, companyId: companyId ?? '', title, description: '', privateNotes: 'INTERNAL NEVER ON PDF', customerVisibleNotes: '', serviceDate: '2026-09-23T12:00:00Z', status: 'PLANNED', estimatedPrice: '', finalPrice: '', materialCost: '', otherCost: '', startTime: '', endTime: '', workDurationMinutes: null, lineItems: [{ cataloguePriceItemId: '', serviceName: 'Wartung · Підтримка · Maintenance', description: 'Français: é è ê ë ç œ · Slovensky: ľ š č ť ž ý á í é ô ä', quantity: '2', unit: 'hour', agreedUnitPrice: '80', priceConfirmed: true, taxTreatment: 'VAT_STANDARD', internalUnitCost: '20', sortOrder: 0 }] });
try {
  admin = await db.adminUser.create({ data: { email: `workflow-${suffix}@example.test`, passwordHash: 'unused', secretWordHash: 'unused' } });
  await db.session.create({ data: { userId: admin.id, tokenHash: crypto.createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now()+3600000) } });
  company = await db.company.create({ data: { name: `Workflow GmbH ${suffix}`, street: 'Geschäftsstraße 20', postalCode: '45479', city: 'Mülheim an der Ruhr', email: 'billing@example.test' } });
  other = await db.company.create({ data: { name: `Other company ${suffix}` } });
  customer = await db.customer.create({ data: { customerNumber: `TEST-${suffix}`, firstName: 'Олена', lastName: 'Коваль', companyId: company.id, status: 'ARCHIVED', street: 'Privatstraße 8', postalCode: '45127', city: 'Essen' } });
  for (const [title, companyId] of [['Individual service', null], ['Company service', company.id]]) {
    const created = await api('/api/admin/service-jobs', 'POST', jobData(title, companyId)); assert.equal(created.status, 201, JSON.stringify(created.data)); jobs.push(created.data);
  }
  const invalid = await api(`/api/admin/service-jobs/${jobs[0].id}`, 'PATCH', { ...jobData('', null) }); assert.equal(invalid.status, 400); assert.equal(await db.invoice.count({ where: { serviceJobId: jobs[0].id } }), 0);
  const personal = await api('/api/admin/invoices', 'POST', { serviceJobId: jobs[0].id, billingRecipientType: 'INDIVIDUAL' }); assert.equal(personal.status, 201, JSON.stringify(personal.data)); invoices.push(personal.data);
  assert.equal(personal.data.billingCompanyId, null); assert.equal(personal.data.recipientCompany, null); assert.equal(personal.data.recipientStreet, 'Privatstraße 8');
  const concurrent = await Promise.all(Array.from({ length: 4 }, () => api('/api/admin/invoices', 'POST', { serviceJobId: jobs[1].id, billingRecipientType: 'COMPANY', billingCompanyId: company.id })));
  concurrent.forEach(result => assert.equal(result.status, 201, JSON.stringify(result.data))); assert.equal(new Set(concurrent.map(r => r.data.id)).size, 1); invoices.push(concurrent[0].data);
  const business = concurrent[0].data;
  assert.equal(business.recipientStreet, 'Geschäftsstraße 20'); assert.equal(business.billingCompanyId, company.id); assert.equal(business.customerId, customer.id);
  const missingName = await api(`/api/admin/invoices/${personal.data.id}`, 'PATCH', { ...invoiceBody(personal.data), recipientName: '' }); assert.equal(missingName.status, 400); assert.ok(missingName.data.details.fieldErrors.recipientName);
  const wrongJob = await api(`/api/admin/invoices/${personal.data.id}`, 'PATCH', { ...invoiceBody(personal.data), serviceJobId: jobs[1].id }); assert.equal(wrongJob.status, 400);
  const optionalContact = await api(`/api/admin/invoices/${business.id}`, 'PATCH', { ...invoiceBody(business), recipientName: '' }); assert.equal(optionalContact.status, 200, JSON.stringify(optionalContact.data));
  let companyInvoices = await api(`/api/admin/invoices?companyId=${company.id}`); assert.deepEqual(companyInvoices.data.map(i=>i.id), [business.id]);
  const contactInvoices = await api(`/api/admin/invoices?customerId=${customer.id}`); assert.equal(contactInvoices.data.length, 2);
  for (const path of [`/dashboard/customers/${customer.id}`, `/dashboard/companies/${company.id}`]) { const page = await api(path); assert.equal(page.status, 200); assert.ok(page.data.includes(business.id)); }
  const companyPage = await api(`/dashboard/companies/${company.id}`); assert.ok(!companyPage.data.includes(personal.data.id));
  previousSettings = await db.businessBillingSettings.findUnique({ where: { id: 'default' } });
  await db.businessBillingSettings.upsert({ where: { id: 'default' }, create: { taxMode: 'UNCONFIRMED' }, update: { taxMode: 'UNCONFIRMED', settingsConfirmedAt: null } });
  assert.equal((await api(`/api/admin/invoices/${business.id}/issue`, 'POST')).status, 422);
  await db.businessBillingSettings.update({ where: { id: 'default' }, data: { taxMode: 'VAT', taxNumber: 'SYNTHETIC-TEST', settingsConfirmedAt: new Date(), bankAccountHolder: 'Synthetic Seller', paymentInstructions: 'Use the invoice number as payment reference.' } });
  const issued = await api(`/api/admin/invoices/${business.id}/issue`, 'POST'); assert.equal(issued.status, 200, JSON.stringify(issued.data)); assert.equal(issued.data.status, 'ISSUED');
  assert.equal((await api(`/api/admin/invoices/${business.id}`, 'PATCH', invoiceBody(business))).status, 409);
  const frozen = await db.invoice.findUniqueOrThrow({ where: { id: business.id } });
  await db.customer.update({ where: { id: customer.id }, data: { companyId: other.id, street: 'Changed private address' } });
  await db.company.update({ where: { id: company.id }, data: { street: 'Changed business address' } });
  const savedJob = await api(`/api/admin/service-jobs/${jobs[1].id}`, 'PATCH', jobData('Company service updated', company.id)); assert.equal(savedJob.status, 200, JSON.stringify(savedJob.data)); assert.equal(savedJob.data.companyId, company.id);
  companyInvoices = await api(`/api/admin/invoices?companyId=${company.id}`); assert.deepEqual(companyInvoices.data.map(i=>i.id), [business.id]); assert.equal((await api(`/api/admin/invoices?companyId=${other.id}`)).data.length, 0);
  const repeated = await api('/api/admin/invoices', 'POST', { serviceJobId: jobs[1].id }); assert.equal(repeated.data.id, business.id); assert.equal(await db.invoice.count({ where: { serviceJobId: jobs[1].id } }), 1);
  const paid = await api(`/api/admin/invoices/${business.id}/payments`, 'POST', { amount: '40.40', paidAt: new Date().toISOString(), method: 'BANK', reference: 'test', note: '' });
  assert.equal(paid.status, 200, JSON.stringify(paid.data)); assert.equal(paid.data.paidTotal, '40.4'); assert.equal(paid.data.outstanding, '150'); assert.equal(paid.data.paymentStatus, 'PARTIAL');
  const same = await db.invoice.findUniqueOrThrow({ where: { id: business.id } }); assert.deepEqual(same.issuedPdf, frozen.issuedPdf); assert.equal(same.recipientStreet, 'Geschäftsstraße 20'); assert.equal(same.billingCompanyId, company.id);
  assert.equal((await api(`/api/admin/invoices/${business.id}/issue`, 'POST')).data.issuedPdfChecksum, frozen.issuedPdfChecksum);
  const sampleDir = 'docs/business-control/samples/crm-workflow'; mkdirSync(sampleDir, { recursive: true }); writeFileSync(`${sampleDir}/company-issued.pdf`, frozen.issuedPdf);
  const draftPdf = await fetch(`${base}/api/admin/invoices/${personal.data.id}/pdf?preview=1`, { headers: { Cookie: `tiladys_session=${token}` } }); assert.equal(draftPdf.status, 200); assert.match(draftPdf.headers.get('content-disposition'), /^inline/); writeFileSync(`${sampleDir}/individual-draft.pdf`, Buffer.from(await draftPdf.arrayBuffer()));
  assert.equal((await fetch(`${base}/api/admin/invoices/${business.id}/pdf`)).status, 401);
  await db.invoice.update({ where: { id: business.id }, data: { issuedPdf: null } });
  assert.equal((await api(`/api/admin/invoices/${business.id}/pdf`)).status, 409);
  assert.equal((await db.invoice.findUniqueOrThrow({ where: { id: business.id } })).issuedPdf, null);
  await db.invoice.update({ where: { id: business.id }, data: { issuedPdf: frozen.issuedPdf } });
  assert.equal((await fetch(`${base}/api/admin/companies/${company.id}`, { method: 'PATCH', headers: { Origin: 'https://invalid.example', 'Content-Type': 'application/json', Cookie: `tiladys_session=${token}` }, body: '{}' })).status, 403);
  console.log('PASS: individual/company drafts, explicit profile ownership, concurrent deduplication, issuance validation, frozen snapshots after contact/company edits, archived job save, repeat billing prevention, partial balances, PDF auth and origin checks.');
} finally {
  for (const invoice of invoices) { await db.invoicePayment.deleteMany({ where: { invoiceId: invoice.id } }); await db.invoice.deleteMany({ where: { id: invoice.id } }); }
  await db.serviceJob.deleteMany({ where: { id: { in: jobs.map(j=>j.id) } } });
  if (customer) await db.customer.delete({ where: { id: customer.id } });
  for (const record of [company, other]) if (record) await db.company.delete({ where: { id: record.id } });
  if (admin) { await db.auditLog.deleteMany({ where: { userId: admin.id } }); await db.adminUser.delete({ where: { id: admin.id } }); }
  if (previousSettings !== undefined) { await db.businessBillingSettings.deleteMany({ where: { id: 'default' } }); if (previousSettings) await db.businessBillingSettings.create({ data: previousSettings }); }
  await db.$disconnect();
}
