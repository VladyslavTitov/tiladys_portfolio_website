// Explicitly opt-in, disposable LOCAL PostgreSQL only. Each run owns a fresh schema.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { reserveProjectSlug, validateSocialImage } from '../apps/control/lib/project-slugs';

const configured = process.env.PHASE1_TEST_DATABASE_URL;
test('real PostgreSQL migrations preserve records/media; slug locks and preview ownership are safe', { skip: !configured }, async () => {
  const url = new URL(configured!);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Only loopback test databases allowed');
  assert.equal(url.pathname, '/tiladys_phase1', 'Only the dedicated synthetic database is allowed');
  const schema = `phase1_${Date.now()}`;
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.href });
  const cli = 'node_modules/prisma/build/index.js';
  const migrations = 'packages/db/prisma/migrations';
  function execute(sql: string) {
    const result = spawnSync(process.execPath, [cli, 'db', 'execute', '--url', url.href, '--stdin'], { input: sql, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    for (const name of readdirSync(migrations).filter((name) => /^\d/.test(name) && name < '20260921').sort()) {
      execute(readFileSync(`${migrations}/${name}/migration.sql`, 'utf8'));
    }
    execute(`
      INSERT INTO "Project" ("id", "slug", "category", "status", "featured", "sortOrder", "title", "summary", "updatedAt") VALUES
        ('a', 'alpha', 'pc-support', 'PUBLISHED', true, 7, '{"en":"Alpha","de":"Projekt Alpha"}', '{"en":"Summary"}', '2026-01-01'),
        ('b', 'beta', 'web-development', 'PUBLISHED', false, 8, '{"en":"Beta"}', '{"en":"Summary"}', '2026-01-02'),
        ('c', 'private', 'pc-support', 'DRAFT', true, 9, '{"en":"Private"}', '{"en":"Summary"}', '2026-01-03');
      INSERT INTO "ProjectImage" ("id", "projectId", "filename", "mimeType", "size", "data") VALUES
        ('image-a', 'a', 'fixture.png', 'image/png', 4, decode('01020304','hex')),
        ('image-b', 'b', 'fixture-b.png', 'image/png', 4, decode('05060708','hex'));
      INSERT INTO "PriceSection" ("id", "number", "title") VALUES ('section', '01', '{"en":"Fixture"}');
      INSERT INTO "PriceItem" ("id", "sectionId", "code", "name", "price", "updatedAt") VALUES ('price', 'section', 'TEST01', '{"en":"Fixture"}', '99', '2026-01-01');
      INSERT INTO "ContactMessage" ("id", "name", "email", "message", "status", "updatedAt") VALUES ('message', 'Synthetic', 'fixture@example.test', 'Preserve this message', 'UNREAD', '2026-01-01');
      INSERT INTO "ContactAttachment" ("id", "messageId", "filename", "mimeType", "size", "width", "height", "data") VALUES ('attachment', 'message', 'test.png', 'image/png', 4, 1, 1, decode('090a0b0c','hex'));
    `);
    const snapshot = async () => {
      const projects = await db.$queryRawUnsafe(`SELECT to_jsonb(p) - ARRAY['featured','seoTitle','seoDescription','socialTitle','socialDescription','socialImageId'] AS record FROM "Project" p ORDER BY id`);
      const images = await db.$queryRawUnsafe('SELECT to_jsonb(i) AS record FROM "ProjectImage" i ORDER BY id');
      const prices = await db.$queryRawUnsafe('SELECT to_jsonb(i) AS record FROM "PriceItem" i ORDER BY id');
      const messages = await db.$queryRawUnsafe('SELECT to_jsonb(i) AS record FROM "ContactMessage" i ORDER BY id');
      const attachments = await db.$queryRawUnsafe('SELECT to_jsonb(i) AS record FROM "ContactAttachment" i ORDER BY id');
      return { projects, images, prices, messages, attachments };
    };
    const before = await snapshot();
    for (const name of ['20260921100000_remove_project_featured', '20260921101000_project_seo_and_slug_history']) execute(readFileSync(`${migrations}/${name}/migration.sql`, 'utf8'));
    assert.deepEqual(await snapshot(), before);
    const columns = await db.$queryRaw<Array<{ column_name: string }>>`SELECT column_name FROM information_schema.columns WHERE table_schema = ${schema} AND table_name = 'Project'`;
    assert.equal(columns.some((column) => column.column_name === 'featured'), false);
    const diff = spawnSync(process.execPath, [cli, 'migrate', 'diff', '--from-url', url.href, '--to-schema-datamodel', 'packages/db/prisma/schema.prisma', '--exit-code'], { encoding: 'utf8', env: { ...process.env, DATABASE_URL: url.href } });
    assert.equal(diff.status, 0, diff.stdout + diff.stderr);
    const rename = (id: string, slug: string) => db.$transaction(async (tx) => {
      await reserveProjectSlug(tx, slug, id);
      return tx.project.update({ where: { id }, data: { slug } });
    });
    const concurrent = await Promise.allSettled([rename('a', 'shared'), rename('b', 'shared')]);
    assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1);
    const winner = await db.project.findUniqueOrThrow({ where: { slug: 'shared' } });
    const original = winner.id === 'a' ? 'alpha' : 'beta';
    const loser = winner.id === 'a' ? 'b' : 'a';
    await assert.rejects(rename(loser, original), /PROJECT_SLUG_EXISTS/);
    await rename(winner.id, 'latest');
    assert.equal((await db.projectSlugAlias.findUniqueOrThrow({ where: { slug: original } })).projectId, winner.id);
    assert.equal((await db.projectSlugAlias.findUniqueOrThrow({ where: { slug: 'shared' } })).projectId, winner.id);
    await rename(winner.id, original);
    assert.equal(await db.projectSlugAlias.findUnique({ where: { slug: original } }), null);
    await db.$transaction(async (tx) => {
      await validateSocialImage(tx, 'image-a', 'a');
      await tx.project.update({ where: { id: 'a' }, data: { socialImageId: 'image-a' } });
    });
    await assert.rejects(db.$transaction((tx) => validateSocialImage(tx, 'image-b', 'a')), /INVALID_SOCIAL_IMAGE/);
    await db.projectImage.delete({ where: { id: 'image-a' } });
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: 'a' } })).socialImageId, null);
    // Aliases continue to point at a project; publication is checked at lookup time.
    await db.project.update({ where: { id: winner.id }, data: { status: 'ARCHIVED' } });
    assert.equal(await db.project.findFirst({ where: { status: 'PUBLISHED', OR: [{ slug: 'shared' }, { slugAliases: { some: { slug: 'shared' } } }] } }), null);
    console.log('Preserved projects/translations/order/media/prices/messages/attachments; schema diff empty; concurrent slug collision, rename-back, private aliases and preview deletion passed.');
  } finally {
    await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await db.$disconnect();
  }
});
