import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Prisma, PrismaClient } from '@prisma/client';

const directory = new URL('../packages/db/prisma/migrations/', import.meta.url);
const quote = value => `"${value.replaceAll('"', '""')}"`;

// No migration execution, customer rows, connection strings or database error text.
export async function diagnoseDatabase(db) {
  const names = (await readdir(directory, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
  const expected = await Promise.all(names.map(async name => ({ name, checksum: createHash('sha256').update(await readFile(new URL(`${name}/migration.sql`, directory))).digest('hex') })));
  return db.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const columns = await tx.$queryRawUnsafe('SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=current_schema()');
    const has = (table, column) => columns.some(c => c.table_name === table && c.column_name === column);
    const ledgerAvailable = ['migration_name', 'checksum', 'finished_at', 'rolled_back_at'].every(column => has('_prisma_migrations', column));
    const ledger = ledgerAvailable ? await tx.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"') : [];
    const migrations = expected.map(({ name, checksum }) => {
      const active = ledger.filter(row => row.migration_name === name && !row.rolled_back_at);
      const state = !active.length ? (ledger.some(row => row.migration_name === name) ? 'rolled-back' : 'absent')
        : active.length !== 1 ? 'multiple-active' : !active[0].finished_at ? 'unfinished'
        : active[0].checksum !== checksum ? 'checksum-mismatch' : 'verified';
      return { name, state };
    });
    const missingColumns = Prisma.dmmf.datamodel.models.flatMap(model => model.fields.filter(field => field.kind !== 'object' && !has(model.dbName || model.name, field.dbName || field.name)).map(field => `${model.name}.${field.name}`));
    const enums = await tx.$queryRawUnsafe('SELECT t.typname,e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=current_schema()');
    const missingEnumValues = Prisma.dmmf.datamodel.enums.flatMap(enumeration => enumeration.values.filter(value => !enums.some(row => row.typname === (enumeration.dbName || enumeration.name) && row.enumlabel === (value.dbName || value.name))).map(value => `${enumeration.name}.${value.name}`));
    const counts = {};
    for (const table of ['Project', 'ContactMessage', 'Customer', 'ServiceJob', 'Invoice', 'ProjectImage', 'ContactAttachment']) {
      if (!columns.some(c => c.table_name === table)) { counts[table] = { unavailable: true }; continue; }
      const [row] = await tx.$queryRawUnsafe(`SELECT count(*)::text AS count FROM ${quote(table)}`);
      counts[table] = { total: row.count };
      if (['Project', 'ContactMessage'].includes(table) && has(table, 'status')) {
        const rows = await tx.$queryRawUnsafe(`SELECT status::text AS status, count(*)::text AS count FROM ${quote(table)} GROUP BY status`);
        // Do not echo unexpected text if a drifted column contains private values.
        counts[table].byStatus = {};
        for (const row of rows) {
          const status = ['NEW','UNREAD','READ','REPLIED','ARCHIVED','SPAM','DRAFT','PUBLISHED'].includes(row.status) ? row.status : 'OTHER';
          counts[table].byStatus[status] = (BigInt(counts[table].byStatus[status] || '0') + BigInt(row.count)).toString();
        }
      }
    }
    const historyIssues = migrations.filter(m => !['verified', 'absent'].includes(m.state));
    const absent = migrations.filter(m => m.state === 'absent');
    const compatible = ledgerAvailable && migrations.every(m => m.state === 'verified') && !missingColumns.length && !missingEnumValues.length;
    return { ledgerAvailable, migrations, unexpectedLedgerRecords: ledger.filter(row => !names.includes(row.migration_name)).length, missingColumns, missingEnumValues, counts, assessment: compatible ? 'release-guard-compatible' : !ledgerAvailable ? 'G: missing/incomplete ledger; verify target and baseline' : historyIssues.length ? 'B/D/G: history requires specific recovery; do not deploy migrations' : absent.length ? 'A candidate: pending migrations; exclude C/E/F through schema/target review before mutation' : 'C/E/F: ledger complete but schema incompatible; verify target and drift', productionTargetVerified: false };
  }, { isolationLevel: 'RepeatableRead', timeout: 60000 });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.DATABASE_URL) {
    console.error('[SCHEMA_DIAGNOSIS_UNAVAILABLE] key=DATABASE_URL');
    process.exitCode = 1;
  } else {
    const db = new PrismaClient({ log: [] });
    try { console.log(JSON.stringify(await diagnoseDatabase(db), null, 2)); }
    catch { console.error('[SCHEMA_DIAGNOSIS_FAILED] Connection, read permissions or catalog inspection unavailable; details withheld.'); process.exitCode = 1; }
    finally { await db.$disconnect(); }
  }
}
