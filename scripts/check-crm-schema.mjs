import { PrismaClient } from '@prisma/client';
// Read-only release gate. Run against the deployment database after migrate deploy.
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must identify the intended deployment database');
const db = new PrismaClient();
try {
  await db.$queryRaw`SELECT i."billingCompanyId", i."billingRecipientType", i."issuedPdfChecksum", c.id, j.id, p.id
    FROM "Invoice" i LEFT JOIN "Company" c ON c.id = i."billingCompanyId"
    LEFT JOIN "ServiceJob" j ON j.id = i."serviceJobId"
    LEFT JOIN "InvoicePayment" p ON p."invoiceId" = i.id LIMIT 0`;
  const migrations = await db.$queryRaw`SELECT migration_name FROM "_prisma_migrations"
    WHERE migration_name = '20260923140000_invoice_billing_recipient' AND finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  if (migrations.length !== 1) throw new Error('Required CRM migration is not recorded as applied');
  console.log('CRM release schema verified: required tables, billing columns and migration are present.');
} catch {
  console.error('CRM release blocked: required schema is missing or unavailable. Apply migrations to the intended deployment database before deploying the app.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
