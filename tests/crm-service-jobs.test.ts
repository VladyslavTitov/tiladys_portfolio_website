import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { allocateNumber } from '../apps/control/lib/business-records';

const configured = process.env.CRM_TEST_DATABASE_URL;
test('CRM migration preserves legacy data and customer/job workflows persist atomically', { skip: !configured }, async () => {
  const url = new URL(configured!);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  assert.equal(url.pathname, '/tiladys_crm_test');
  assert.equal(url.port, '55434');
  const schema = `crm_${Date.now()}`; url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.href, log: [] });
  const directory = mkdtempSync(join(tmpdir(), 'tiladys-crm-'));
  const source = 'packages/db/prisma/migrations'; const target = join(directory, 'migrations'); mkdirSync(target);
  copyFileSync(join(source, 'migration_lock.toml'), join(target, 'migration_lock.toml'));
  const schemaFile = join(directory, 'schema.prisma'); writeFileSync(schemaFile, readFileSync('packages/db/prisma/schema.prisma', 'utf8').replace(/^.*shadowDatabaseUrl.*$/m, ''));
  const env = { ...process.env, DATABASE_URL: url.href };
  const cli = (args: string[]) => { const result = spawnSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), ...args], { encoding: 'utf8', env }); assert.equal(result.status, 0, `Prisma ${args.join(' ')} failed; output withheld`); };
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
    stage('20260922110000_crm_service_jobs'); cli(['migrate','deploy','--schema',schemaFile]);
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
    assert.equal(await db.customerNote.count({ where: { customerId: created[0].id } }), 1); assert.equal(await db.customerActivity.count({ where: { customerId: created[0].id } }), 1);
    assert.equal(await db.fileAsset.count(), 0); assert.equal(await db.project.count(), 1); assert.equal(await db.contactMessage.count(), 1);
    cli(['migrate','deploy','--schema',schemaFile]); cli(['migrate','diff','--from-url',url.href,'--to-schema-datamodel',schemaFile,'--exit-code']);
  } finally { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await db.$disconnect(); rmSync(directory,{recursive:true,force:true}); }
});
