import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Prisma, PrismaClient } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import { allocateNumber, cataloguePriceDetails, prepareJobLineItems } from '../apps/control/lib/business-records';
import { calculateInvoiceLines, issueInvoice } from '../apps/control/lib/invoices';
import { generateInvoicePdf } from '../apps/control/lib/invoice-pdf';

test('catalogue price modes do not turn starting or monthly prices into fixed charges', () => {
  assert.deepEqual({ ...cataloguePriceDetails('от 1 050 €'), amount: cataloguePriceDetails('от 1 050 €').amount?.toString() }, { mode: 'FROM', unit: 'item', amount: '1050' });
  assert.equal(cataloguePriceDetails('149 €/месяц').mode, 'MONTHLY');
  assert.equal(cataloguePriceDetails('59 €/час').mode, 'HOURLY');
});

test('job repair keeps persisted associations, explicit payloads, save-before-invoice flow, and scoped navigation CSS', () => {
  const manager = readFileSync('apps/control/app/dashboard/service-jobs/service-job-manager.tsx', 'utf8');
  const page = readFileSync('apps/control/app/dashboard/service-jobs/page.tsx', 'utf8');
  const css = readFileSync('apps/control/app/globals.css', 'utf8');
  assert.match(manager, /customerId: draft\.customerId/);
  assert.doesNotMatch(manager, /const body = \{ \.\.\.draft/);
  assert.match(manager, /Save and create draft/);
  assert.match(manager, /Create service line from existing estimate/);
  assert.match(manager, /Add and save at least one service before creating an invoice\./);
  assert.doesNotMatch(page, /status: \{ not: 'ARCHIVED' \}/);
  assert.match(css, /\.dash>aside/);
  assert.doesNotMatch(css, /\.dash aside\{/);
});

test('long invoice PDFs paginate and omit private job fields by construction', async () => {
  const lines = Array.from({ length: 70 }, (_, index) => ({ serviceName: `Service ${index + 1}`, description: 'A sufficiently detailed customer-facing description for pagination testing.', quantity: { toString: () => '1' }, unit: 'item', unitPrice: { toString: () => '10' }, taxRate: { toString: () => '19' }, subtotal: { toString: () => '10' }, taxAmount: { toString: () => '1.9' }, total: { toString: () => '11.9' }, taxTreatment: 'VAT_STANDARD' }));
  const bytes = await generateInvoicePdf({ status: 'DRAFT', invoiceNumber: null, issueDate: new Date(), dueDate: null, serviceDateFrom: new Date(), serviceDateTo: null, sellerLegalName: 'TiLADYS – Vladyslav Titov', sellerStreet: 'Kronenstraße 19', sellerPostalCode: '45479', sellerCity: 'Mülheim an der Ruhr', sellerCountry: 'Germany', sellerEmail: 'contact@tiladys.com', sellerPhone: '+49 163 7235608', sellerTaxMode: 'UNCONFIRMED', sellerTaxNumber: null, sellerVatId: null, sellerTaxStatement: null, sellerBankAccountHolder: null, sellerIban: null, sellerBic: null, sellerBankName: null, paymentInstructions: null, recipientName: 'Test Customer', recipientCompany: null, recipientEmail: null, recipientStreet: 'Teststraße 1', recipientPostalCode: '45479', recipientCity: 'Mülheim', recipientCountry: 'DE', customerReference: null, notes: null, subtotal: { toString: () => '700' }, taxTotal: { toString: () => '133' }, total: { toString: () => '833' }, lines });
  assert.ok((await PDFDocument.load(bytes)).getPageCount() > 1);
});

const configured = process.env.CRM_TEST_DATABASE_URL;
test('CRM migration preserves legacy data and customer/job workflows persist atomically', { skip: !configured }, async () => {
  const url = new URL(configured!);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  assert.match(url.pathname, /^\/tiladys_crm_test(?:_migrations)?$/);
  assert.equal(url.port, '55434');
  const schema = `crm_${Date.now()}`; url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.href, log: [] });
  const directory = mkdtempSync(join(tmpdir(), 'tiladys-crm-'));
  const source = 'packages/db/prisma/migrations'; const target = join(directory, 'migrations'); mkdirSync(target);
  copyFileSync(join(source, 'migration_lock.toml'), join(target, 'migration_lock.toml'));
  const schemaFile = join(directory, 'schema.prisma'); writeFileSync(schemaFile, readFileSync('packages/db/prisma/schema.prisma', 'utf8').replace(/^.*shadowDatabaseUrl.*$/m, ''));
  const env = { ...process.env, DATABASE_URL: url.href };
  const cli = (args: string[]) => { const result = spawnSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), ...args], { encoding: 'utf8', env }); assert.equal(result.status, 0, `Prisma ${args.join(' ')} failed${args[1] !== 'diff' ? '; output withheld' : `:\n${result.stdout}\n${result.stderr}`}`); };
  const stage = (name: string) => { mkdirSync(join(target, name)); copyFileSync(join(source, name, 'migration.sql'), join(target, name, 'migration.sql')); };
  const names = readdirSync(source).filter((name) => /^\d/.test(name)).sort();
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    names.filter((name) => name < '20260922110000').forEach(stage); cli(['migrate','deploy','--schema',schemaFile]);
    await db.$transaction([
      db.$executeRawUnsafe(`INSERT INTO "AdminUser" (id,email,"passwordHash","secretWordHash","updatedAt") VALUES ('admin','owner@example.test','x','x',CURRENT_TIMESTAMP)`),
      db.$executeRawUnsafe(`INSERT INTO "Project" (id,slug,category,status,title,summary,"updatedAt") VALUES ('project','preserved','other','PUBLISHED','{"en":"Preserved"}','{"en":"Preserved"}',CURRENT_TIMESTAMP)`),
      db.$executeRawUnsafe(`INSERT INTO "ProjectImage" (id,"projectId",filename,"mimeType",size,data) VALUES ('image','project','preserved.webp','image/webp',4,decode('01020304','hex'))`),
      db.$executeRawUnsafe(`INSERT INTO "ContactMessage" (id,name,email,message,status,"updatedAt") VALUES ('message','Preserved','preserved@example.test','Keep me','UNREAD',CURRENT_TIMESTAMP)`),
    ]);
    const before = { projects: await db.project.count(), images: await db.projectImage.count(), imageBytes: await db.$queryRaw`SELECT sum(octet_length(data))::text AS bytes FROM "ProjectImage"`, messages: await db.contactMessage.count() };
    stage('20260922110000_crm_service_jobs'); stage('20260922150000_service_job_line_items'); stage('20260922170000_invoices'); stage('20260922230000_unique_draft_per_service_job'); cli(['migrate','deploy','--schema',schemaFile]);
    // Rehearse the new migration with an existing issued document, without loading new columns first.
    await db.$executeRawUnsafe(`INSERT INTO "Customer" (id,"customerNumber","updatedAt") VALUES ('legacy-contact','LEGACY-1',CURRENT_TIMESTAMP)`);
    await db.$executeRawUnsafe(`INSERT INTO "Invoice" (id,status,"customerId","invoiceNumber","sellerLegalName","sellerStreet","sellerPostalCode","sellerCity","sellerCountry","sellerEmail","sellerPhone","sellerTaxMode","recipientName","recipientCompany","recipientStreet","recipientPostalCode","recipientCity","recipientCountry",subtotal,total,"issuedPdf","issuedPdfChecksum","updatedAt") VALUES ('legacy-invoice','ISSUED','legacy-contact','LEGACY-INV','Original seller','Street','10000','City','DE','a@example.test','123','VAT','Original contact','Ambiguous company name','Original street','10000','City','DE',10,10,decode('255044462d707265736572766564','hex'),'original-checksum',CURRENT_TIMESTAMP)`);
    names.filter(name => name > '20260922230000_unique_draft_per_service_job').forEach(stage); cli(['migrate','deploy','--schema',schemaFile]);
    const legacy = await db.invoice.findUniqueOrThrow({ where: { id: 'legacy-invoice' } });
    assert.equal(legacy.billingCompanyId, null); assert.equal(legacy.billingRecipientType, 'LEGACY');
    assert.equal(legacy.recipientCompany, 'Ambiguous company name'); assert.equal(legacy.recipientStreet, 'Original street');
    assert.equal(legacy.status, 'ISSUED'); assert.equal(legacy.issuedPdfChecksum, 'original-checksum');
    assert.equal(Buffer.from(legacy.issuedPdf!).toString(), '%PDF-preserved');
    await db.invoice.delete({ where: { id: legacy.id } }); await db.customer.delete({ where: { id: 'legacy-contact' } });
    assert.deepEqual({ projects: await db.project.count(), images: await db.projectImage.count(), imageBytes: await db.$queryRaw`SELECT sum(octet_length(data))::text AS bytes FROM "ProjectImage"`, messages: await db.contactMessage.count() }, before);
    const company = await db.company.create({ data: { name: 'Synthetic GmbH' } });
    const created = await Promise.all(Array.from({ length: 12 }, (_, index) => db.$transaction(async (tx) => {
      const customerNumber = await allocateNumber(tx, 'CUSTOMER', 'C');
      return tx.customer.create({ data: { customerNumber, firstName: `Customer ${index}`, companyId: company.id, status: 'ACTIVE' } });
    })));
    assert.equal(new Set(created.map((row) => row.customerNumber)).size, 12);
    const job = await db.$transaction(async (tx) => {
      const jobNumber = await allocateNumber(tx, 'SERVICE_JOB', 'JOB');
      const row = await tx.serviceJob.create({ data: { jobNumber, customerId: created[0].id, companyId: company.id, title: 'Synthetic service', status: 'IN_PROGRESS', estimatedPrice: '89.00', materialCost: '8.00', privateNotes: 'Private' } });
      await tx.customerNote.create({ data: { customerId: created[0].id, body: 'Persistent note', createdById: 'admin' } });
      await tx.customerActivity.create({ data: { customerId: created[0].id, type: 'SERVICE_JOB_CREATED', summary: 'Created', createdById: 'admin' } });
      await tx.auditLog.create({ data: { userId: 'admin', action: 'SERVICE_JOB_CREATE', entity: 'ServiceJob', entityId: row.id } });
      return row;
    });
    assert.match(job.jobNumber, /^JOB-\d{4}-0001$/); assert.equal((await db.serviceJob.findUniqueOrThrow({ where: { id: job.id } })).estimatedPrice.toString(), '89');
    const section = await db.priceSection.create({ data: { number: 'T', title: { en: 'Test' } } });
    const catalogueItem = await db.priceItem.create({ data: { sectionId: section.id, code: 'TEST-1', name: { en: 'Monthly care' }, note: { en: 'No automatic renewal' }, price: '149 €/month' } });
    await assert.rejects(db.$transaction(async (tx) => prepareJobLineItems(tx, [{ id: '', cataloguePriceItemId: catalogueItem.id, serviceName: 'Monthly care', description: '', quantity: '1', unit: 'month', agreedUnitPrice: '160', priceConfirmed: false, taxTreatment: 'UNCONFIRMED', internalUnitCost: '', sortOrder: 0 }])), /PRICE_CONFIRMATION_REQUIRED/);
    const pricedJob = await db.$transaction(async (tx) => {
      const lines = await prepareJobLineItems(tx, [
        { id: '', cataloguePriceItemId: catalogueItem.id, serviceName: 'Monthly care', description: 'One month only', quantity: '2', unit: 'month', agreedUnitPrice: '160', priceConfirmed: true, taxTreatment: 'VAT_STANDARD', internalUnitCost: '30', sortOrder: 0 },
        { id: '', cataloguePriceItemId: '', serviceName: 'Private custom service', description: '', quantity: '1.5', unit: 'hour', agreedUnitPrice: '80', priceConfirmed: true, taxTreatment: 'UNCONFIRMED', internalUnitCost: '', sortOrder: 1 },
      ]);
      return tx.serviceJob.create({ data: { jobNumber: 'JOB-2099-9999', customerId: created[0].id, title: 'Priced job', lineItems: { create: lines } }, include: { lineItems: { orderBy: { sortOrder: 'asc' } } } });
    });
    assert.equal(pricedJob.lineItems[0].subtotal.toString(), '320'); assert.equal(pricedJob.lineItems[0].taxAmount?.toString(), '60.8'); assert.equal(pricedJob.lineItems[0].total.toString(), '380.8');
    assert.equal(pricedJob.lineItems[1].subtotal.toString(), '120'); assert.equal(pricedJob.lineItems[1].cataloguePriceItemId, null);
    await db.priceItem.update({ where: { id: catalogueItem.id }, data: { name: { en: 'Changed later' }, price: '999 €' } });
    const snapshot = await db.serviceJobLineItem.findFirstOrThrow({ where: { serviceJobId: pricedJob.id }, orderBy: { sortOrder: 'asc' } });
    assert.equal(snapshot.serviceName, 'Monthly care'); assert.equal(snapshot.cataloguePriceText, '149 €/month'); assert.equal(snapshot.agreedUnitPrice.toString(), '160');
    assert.equal((await db.priceItem.findUniqueOrThrow({ where: { id: catalogueItem.id } })).price, '999 €');
    await db.businessBillingSettings.create({ data: { id: 'default', taxMode: 'VAT', taxNumber: 'TEST-NOT-REAL', settingsConfirmedAt: new Date(), paymentTermsDays: 14 } });
    const invoiceLines = calculateInvoiceLines(pricedJob.lineItems.map((line) => ({ serviceName: line.serviceName, description: line.description ?? '', quantity: line.quantity.toString(), unit: line.unit, unitPrice: line.agreedUnitPrice.toString(), taxTreatment: line.taxTreatment === 'UNCONFIRMED' ? 'VAT_STANDARD' : line.taxTreatment })));
    const invoiceSubtotal = invoiceLines.reduce((sum, line) => sum.add(line.subtotal), new Prisma.Decimal(0));
    const invoiceTax = invoiceLines.reduce((sum, line) => sum.add(line.taxAmount ?? 0), new Prisma.Decimal(0));
    const invoice = await db.invoice.create({ data: { customerId: created[0].id, serviceJobId: pricedJob.id, sellerLegalName: 'TiLADYS – Vladyslav Titov', sellerStreet: 'Kronenstraße 19', sellerPostalCode: '45479', sellerCity: 'Mülheim an der Ruhr', sellerCountry: 'Germany', sellerEmail: 'contact@tiladys.com', sellerPhone: '+49 163 7235608', sellerTaxMode: 'VAT', sellerTaxNumber: 'TEST-NOT-REAL', recipientName: 'Synthetic Customer', recipientStreet: 'Teststraße 1', recipientPostalCode: '45479', recipientCity: 'Mülheim', recipientCountry: 'DE', issueDate: new Date(), subtotal: invoiceSubtotal, taxTotal: invoiceTax, total: invoiceSubtotal.add(invoiceTax), lines: { create: invoiceLines } } });
    await assert.rejects(db.invoice.create({ data: { customerId: created[0].id, serviceJobId: pricedJob.id, sellerLegalName: 'TiLADYS – Vladyslav Titov', sellerStreet: 'Kronenstraße 19', sellerPostalCode: '45479', sellerCity: 'Mülheim an der Ruhr', sellerCountry: 'Germany', sellerEmail: 'contact@tiladys.com', sellerPhone: '+49 163 7235608', sellerTaxMode: 'VAT', recipientName: 'Duplicate Draft', recipientStreet: 'Teststraße 1', recipientPostalCode: '45479', recipientCity: 'Mülheim', recipientCountry: 'DE', subtotal: '1', total: '1' } }), (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002');
    const issued = await Promise.all(Array.from({ length: 6 }, () => issueInvoice(db, invoice.id, 'admin')));
    assert.equal(new Set(issued.map((row) => row.invoiceNumber)).size, 1); assert.match(issued[0].invoiceNumber!, /^INV-\d{4}-0001$/); assert.ok(issued[0].issuedPdfSize! > 1_000);
    const frozenHash = issued[0].issuedPdfChecksum; const frozenBytes = Buffer.from(issued[0].issuedPdf!);
    await db.$transaction([db.customer.update({ where: { id: created[0].id }, data: { firstName: 'Changed' } }), db.serviceJobLineItem.update({ where: { id: pricedJob.lineItems[0].id }, data: { serviceName: 'Changed source', agreedUnitPrice: '999' } }), db.businessBillingSettings.update({ where: { id: 'default' }, data: { legalName: 'Changed seller' } })]);
    const stillFrozen = await db.invoice.findUniqueOrThrow({ where: { id: invoice.id } }); assert.equal(stillFrozen.issuedPdfChecksum, frozenHash); assert.deepEqual(Buffer.from(stillFrozen.issuedPdf!), frozenBytes); assert.equal(stillFrozen.recipientName, 'Synthetic Customer'); assert.equal(stillFrozen.sellerLegalName, 'TiLADYS – Vladyslav Titov');
    await db.invoicePayment.create({ data: { invoiceId: invoice.id, amount: '100', paidAt: new Date(), createdById: 'admin' } }); assert.equal((await db.invoicePayment.aggregate({ where: { invoiceId: invoice.id }, _sum: { amount: true } }))._sum.amount?.toString(), '100');
    assert.equal(await db.customerNote.count({ where: { customerId: created[0].id } }), 1); assert.equal(await db.customerActivity.count({ where: { customerId: created[0].id } }), 2); assert.equal(await db.customerActivity.count({ where: { customerId: created[0].id, type: 'INVOICE_ISSUED' } }), 1);
    assert.equal(await db.fileAsset.count(), 0); assert.equal(await db.project.count(), 1); assert.equal(await db.contactMessage.count(), 1);
    cli(['migrate','deploy','--schema',schemaFile]); cli(['migrate','diff','--from-url',url.href,'--to-schema-datamodel',schemaFile,'--exit-code']);
  } finally { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await db.$disconnect(); rmSync(directory,{recursive:true,force:true}); }
});
