import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const migrationsDirectory = new URL('../packages/db/prisma/migrations/', import.meta.url);
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

// Never migrate here: Preview and Production builds only verify their own target.
export async function verifySchema(tx) {
  const ledger = await tx.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  for (const entry of entries.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = await readFile(new URL(`${entry.name}/migration.sql`, migrationsDirectory));
    const checksum = createHash('sha256').update(sql).digest('hex');
    const active = ledger.filter((row) => row.migration_name === entry.name && !row.rolled_back_at);
    if (active.length !== 1 || !active[0].finished_at || active[0].checksum !== checksum) {
      throw new Error(`Missing, failed or modified migration: ${entry.name}`);
    }
  }
  // Check every scalar column, even when all tables are empty. This catches
  // ledger/schema drift without loading customer data or binary attachments.
  for (const model of Prisma.dmmf.datamodel.models) {
    const columns = model.fields.filter((field) => field.kind !== 'object').map((field) => quote(field.dbName || field.name));
    await tx.$queryRawUnsafe(`SELECT ${columns.join(', ')} FROM ${quote(model.dbName || model.name)} LIMIT 0`);
  }
  const enums = await tx.$queryRawUnsafe(`SELECT t.typname, e.enumlabel FROM pg_enum e
    JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname=current_schema()`);
  for (const enumeration of Prisma.dmmf.datamodel.enums) {
    for (const value of enumeration.values) {
      if (!enums.some((row) => row.typname === (enumeration.dbName || enumeration.name) && row.enumlabel === (value.dbName || value.name))) {
        throw new Error(`Missing enum value: ${enumeration.name}.${value.name}`);
      }
    }
  }
}

export async function checkDatabase(db) {
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await verifySchema(tx);
  }, { timeout: 60000 });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must identify the intended deployment database');
  const db = new PrismaClient();
  try {
    await checkDatabase(db);
    console.log('Release schema verified: every required migration, scalar column and enum value is present.');
  } catch {
    // Prisma errors may contain connection details. Do not expose them in build logs.
    console.error('Release blocked: migration history or database schema is incompatible. Review and apply required migrations through the recovery process before releasing.');
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
