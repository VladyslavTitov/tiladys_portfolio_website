import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const configured = process.env.SCHEMA_RECOVERY_DATABASE_URL;
test('reproduce P2022/22P02, then migrate forward without losing projects/media/messages/status meaning', { skip: !configured }, async () => {
  const url = new URL(configured!);
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
  assert.equal(url.pathname, '/tiladys_schema_recovery');
  assert.equal(url.port, '55433');
  const schema = `recovery_${Date.now()}`;
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.href, log: [] });
  const directory = mkdtempSync(join(tmpdir(), 'tiladys-schema-recovery-'));
  const source = 'packages/db/prisma/migrations';
  const target = join(directory, 'migrations');
  mkdirSync(target);
  copyFileSync(join(source, 'migration_lock.toml'), join(target, 'migration_lock.toml'));
  const schemaFile = join(directory, 'schema.prisma');
  writeFileSync(schemaFile, readFileSync('packages/db/prisma/schema.prisma', 'utf8').replace(/^.*shadowDatabaseUrl.*$/m, ''));
  const env = { ...process.env, DATABASE_URL: url.href, SHADOW_DATABASE_URL: url.href };
  function cli(args: string[]) {
    const result = spawnSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), ...args], { encoding: 'utf8', env });
    // Prisma CLI prints datasource metadata; intentionally never forward its output.
    assert.equal(result.status, 0, `Disposable database command failed: ${args[0]} ${args[1]}; codes: ${(result.stderr + result.stdout).match(/P[0-9]{4}/g)?.join(',') ?? 'none'}; output withheld to avoid connection information`);
  }
  function stageMigration(name: string) {
    mkdirSync(join(target, name));
    copyFileSync(join(source, name, 'migration.sql'), join(target, name, 'migration.sql'));
  }
  const migrationNames = readdirSync(source).filter((name) => /^\d/.test(name)).sort();
  const snapshots = async () => ({
    projects: await db.$queryRawUnsafe(`SELECT to_jsonb(p) - ARRAY['featured','seoTitle','seoDescription','socialTitle','socialDescription','socialImageId'] AS record FROM "Project" p ORDER BY id`),
    images: await db.$queryRawUnsafe('SELECT to_jsonb(i) AS record FROM "ProjectImage" i ORDER BY id'),
    messages: await db.$queryRawUnsafe(`SELECT to_jsonb(m) - 'status' AS record, CASE WHEN status::text = 'NEW' THEN 'UNREAD' ELSE status::text END AS status FROM "ContactMessage" m ORDER BY id`),
  });
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    for (const name of migrationNames.filter((name) => name < '202609')) stageMigration(name);
    cli(['migrate', 'deploy', '--schema', schemaFile]);
    await db.$executeRawUnsafe(`INSERT INTO "Project" (id,slug,category,status,title,summary,"updatedAt") VALUES
      ('published','published','pc-support','PUBLISHED','{"en":"Preserve title"}','{"en":"Preserve summary"}','2026-01-01'),
      ('draft','draft','pc-support','DRAFT','{}','{}','2026-01-01'),
      ('archived','archived','pc-support','ARCHIVED','{}','{}','2026-01-01')`);
    await db.$executeRawUnsafe(`INSERT INTO "ProjectImage" (id,"projectId",filename,"mimeType",size,data) VALUES ('image','published','fixture.png','image/png',4,decode('01020304','hex'))`);
    for (const status of ['NEW', 'READ', 'REPLIED', 'ARCHIVED', 'SPAM']) {
      await db.$executeRaw`INSERT INTO "ContactMessage" (id,name,email,message,status,"updatedAt") VALUES (${status},'Synthetic','fixture@example.test','Preserve body',${status}::"MessageStatus",'2026-01-01')`;
    }
    const before = await snapshots();
    await assert.rejects(db.project.findMany({ select: { seoTitle: true } }), (error: unknown) => (error as { code?: string }).code === 'P2022');
    await assert.rejects(db.contactMessage.count({ where: { status: 'UNREAD' } }), (error: unknown) => /22P02|invalid input value for enum/.test(String(error)));
    const missing = await db.$queryRaw<Array<{ name: string }>>`SELECT name FROM unnest(ARRAY['seoTitle','seoDescription','socialTitle','socialDescription','socialImageId']) name WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ${schema} AND table_name = 'Project' AND column_name = name)`;
    assert.equal(missing.length, 5);
    console.log('Reproduced P2022 and invalid UNREAD enum failure; all five SEO columns absent in synthetic old schema.');
    for (const name of migrationNames.filter((name) => name >= '202609')) stageMigration(name);
    cli(['migrate', 'deploy', '--schema', schemaFile]);
    assert.deepEqual(await snapshots(), before);
    const enumValues = await db.$queryRaw<Array<{ enumlabel: string }>>`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=${schema} AND t.typname='MessageStatus' ORDER BY e.enumsortorder`;
    assert.deepEqual(enumValues.map((row) => row.enumlabel), ['UNREAD','READ','REPLIED','ARCHIVED','SPAM']);
    assert.equal(await db.contactMessage.count({ where: { status: 'UNREAD' } }), 1);
    const rows = await db.project.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, seoTitle: true, seoDescription: true, socialTitle: true, socialDescription: true, socialImageId: true } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 'published');
    assert.equal(rows[0].seoTitle, null);
    assert.equal(await db.project.count(), 3);
    assert.equal(await db.projectImage.count(), 1);
    assert.equal(await db.contactMessage.count(), 5);
    assert.equal(await db.projectSlugAlias.count(), 0);
    const history = await db.$queryRaw<Array<{ migration_name: string }>>`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
    assert.deepEqual(history.map((row) => row.migration_name), migrationNames);
    const after = await snapshots();
    cli(['migrate', 'deploy', '--schema', schemaFile]);
    assert.deepEqual(await snapshots(), after);
    cli(['migrate', 'diff', '--from-url', url.href, '--to-schema-datamodel', schemaFile, '--exit-code']);
    console.log('Forward migrate deploy and repeat no-op passed; schema aligned; published query recovered; all project/media/message contents and status meanings preserved.');
  } finally {
    await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await db.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
});
