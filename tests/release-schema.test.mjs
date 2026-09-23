import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { checkDatabase, verifySchema } from '../scripts/check-crm-schema.mjs';

const url = process.env.RELEASE_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  assert.ok(['localhost','127.0.0.1'].includes(parsed.hostname) && parsed.port === '55435' && parsed.pathname === '/recovery', 'Only isolated recovery rehearsal database is permitted');
}
test('release gate rejects pending migrations, modified history, missing columns and enum drift', { skip: !url }, async () => {
  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await checkDatabase(db);
    for (const sql of [
      `DELETE FROM "_prisma_migrations" WHERE migration_name='20260923140000_invoice_billing_recipient'`,
      `UPDATE "_prisma_migrations" SET checksum='modified' WHERE migration_name='20260725212133_init'`,
      `ALTER TABLE "Invoice" DROP COLUMN "billingCompanyId" CASCADE`,
      `ALTER TYPE "MessageStatus" RENAME VALUE 'UNREAD' TO 'NEW'`,
    ]) {
      const rollback = new Error('rehearsal rollback');
      await assert.rejects(db.$transaction(async tx => {
        await tx.$executeRawUnsafe(sql);
        await assert.rejects(verifySchema(tx));
        throw rollback;
      }, { timeout: 60000 }), error => error === rollback);
    }
    await checkDatabase(db);
    await assert.rejects(db.$transaction(async tx => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      await tx.$executeRawUnsafe(`UPDATE "Invoice" SET "notes"='must not write'`);
    }));
  } finally { await db.$disconnect(); }
});
