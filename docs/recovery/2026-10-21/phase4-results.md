# Control Preview recovery — Phase 4 completed

**Control Preview is ready for a new Vercel Preview deployment from the database, schema and build standpoint.** The ten approved migrations were applied successfully on 21 October 2026, **16:28:10–16:28:16 Europe/Amsterdam** (14:28:10–14:28:16 UTC). No deployment was created. The previously failed deployment remains failed; hosted release verification follows a separately initiated deployment.

| Result | Verified outcome |
| --- | --- |
| Authorized target | Neon `tiladys-control-preview` / `plain-sound-02437622`, `main` / `br-delicate-block-b19w0iqs`, `neondb.public` |
| Connection | Control project `prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV`, team `team_xIA4aFDewxF4sHVLtMnss2me`; freshly read Preview direct and pooled entries match the approved audit; no branch overrides |
| Preconditions | Original schema, all table counts, all original row fingerprints and 13 completed ledger entries unchanged; exact ten approved migrations pending; all 23 file checksums match |
| Fresh recoverable backup | PASS; direct Preview dump independently restored to a new local PostgreSQL 18 database; all schema definitions, table counts, row fingerprints and 13 ledger rows match |
| Migration | Existing `npm run db:deploy` → `prisma migrate deploy`; exactly the ten approved migrations; command duration **6.052 seconds**, with no retry or history resolution |
| Final migration ledger | **23 completed, zero pending, zero failed**, all SHA-256 checksums match; original 13 ledger rows unchanged |
| Schema | Matches the reviewed migrated child; Prisma datamodel diff empty |
| Release schema guard | `db:check:crm` PASS through both real Preview direct and runtime pooled connections |
| Existing data | All 24 original business-table fingerprints unchanged; NumberSequence retains its exact three rows; the other original tables and all 13 new tables remain empty |
| Automated regressions | **52/52 passed, zero skipped**, in the isolated local recovery lab |
| HTTP authentication | **16 checks passed**: login, cookie attributes, origin/size/JSON validation, throttling, private reads, logout and revocation |
| Browser and actual API flows | Portfolio filtering/search/detail, login/logout, customer/job/quote/invoice screens, **62 anonymous private API requests denied**, and five grouped synthetic company/customer/quote/job/task/invoice/PDF/payment/archive checks passed |
| Builds | Control and Web production builds PASS on **Node 24.22.1**, matching Vercel's 24.x major; release schema guard enabled |

The user explicitly approved Phase 4 before this execution. Production databases were neither queried nor modified. No real database was reset, restored or seeded. No environment file, remote environment setting, role/database default, deployment, alias, application source, Prisma model or migration SQL was changed. Database URL selection and timeouts were confined to child-process/session settings, as specified in the approved proposal. No real email, invoice, payment or uploaded object was created by tests.

## Backup retained

The fresh archive remains private and Git-ignored:

- `.env.recovery-backups/2026-10-21/preview-phase4-before-20261021T142701059Z.dump`
- **68,012 bytes**; SHA-256 **`14f9252b27e4a0e64d3c5be143f10f9320ad6904dc418276932a8742bc959a90`**.
- File mode 0600, directory mode 0700. PostgreSQL 18 custom archive of public schema/data, excluding ownership/grants.
- Restored successfully into **`recovery_phase4_restore_1792592821271`**, only in the recovery-owned loopback PostgreSQL 18 lab. The restored schema, every row fingerprint and original migration ledger matched Preview before migration. Preview was rechecked unchanged after this restore verification and immediately before migration.
- The retained archive checksum was rechecked after migration. The prior audit archive remains retained separately. These local archives are not off-device backups; a real-target restore was not performed or authorized.

## Execution and data evidence

Independent Neon metadata confirmed the approved project, branch and endpoint. The Vercel connector still lacked the required team grant, so scoped read-only requests used the installed authenticated CLI with explicit project/team IDs. No project link or environment-file pull occurred. An initial sandboxed connectivity attempt failed before any target inspection; the same authorized read-only verification then succeeded with network access. No database verification precondition failed.

Immediately before migration, no other owner client sessions were present. The source schema, ledger, fingerprints and backup still matched; the ten migration files were checked again. The direct migration session verified **lock_timeout=5s** and **statement_timeout=120s** without changing remote defaults. There was no application setting change to enforce a longer write pause; migration locking applied normally, and original data remained unchanged afterward.

Every migration finished with `applied_steps_count=1`, a completion timestamp, no rollback marker and its reviewed checksum. The exact applied list is in [migration-result.json](evidence/phase4/migration-result.json) and the existing Prisma output is in [db-deploy.log](evidence/phase4/db-deploy.log). Final read-only verification at **16:33:51 Europe/Amsterdam** confirmed both direct and runtime pooled targets, all 23 migrations, unchanged records, the expected empty new tables and passing release guards.

Evidence: [provider identity](evidence/phase4/provider-identity.json), [Vercel target](evidence/phase4/target.json), [preflight](evidence/phase4/preflight.json), [restored backup](evidence/phase4/backup.json), [execution preconditions](evidence/phase4/execution-preconditions.json), [before](evidence/phase4/before.json), [after](evidence/phase4/after.json), [migration status](evidence/phase4/migration-status.log), [empty datamodel diff](evidence/phase4/datamodel-diff.log), [final Preview audit](evidence/phase4/final-preview-verification.json).

## Regression scope and qualifications

| Existing suite | Passed |
| --- | ---: |
| Release schema adversarial checks | 1 |
| CRM migration/association/concurrency | 4 |
| Quote, invoice, payment, outbox and media integration | 10 |
| Bilingual invoice validation, Unicode PDF and issuance | 10 |
| Forward database recovery and preserved historical content | 1 |
| Domain, authentication request source, trusted origins, dates and Portfolio | 26 |

Tests used the retained isolated migrated local PostgreSQL 18 lab; temporary copies changed only exact local target guards and artifact paths, except for one necessary compatibility update to the old recovery test. That test's whole-row snapshot initially treated the approved additive columns as changed historical content. Its incident-only copy now compares original fields and separately asserts `homepageFeatured=false`, image `archivedAt=NULL`, and new nullable message fields `NULL`. The original suite remains unchanged and its initial failure is retained in [database-recovery-initial-stale-expectation.log](evidence/phase4/database-recovery-initial-stale-expectation.log). A temporary adapter quoting error was corrected before the successful run. No application fix or migration edit was needed.

Both Node 24 builds succeeded. Cleanup initially stopped on an additional generated `root-params.d.ts` import path; the two generated Next.js import changes were reviewed, then both next-env files were restored byte-for-byte. The final pooled audit initially rejected a startup timeout parameter unsupported by the pooler; the audit used explicit read-only transactions instead. The original pooled Preview URL and remote configuration were unchanged. All final checks pass; these harness/cleanup issues did not affect the migration or business data.

The synthetic authentication-abuse checks logged `LOGIN_ALERT_FAILED` because SMTP was deliberately disabled; no alert email was sent and all authentication assertions passed.

Evidence: [52 test results](evidence/phase4/test-results.json), [CRM](evidence/phase4/crm-regression-tests.log), [invoice/payment/quote/media](evidence/phase4/invoice-payment-quote-media-tests.log), [database recovery](evidence/phase4/database-recovery-tests.log), [authentication](evidence/phase4/auth-after.json), [browser results](evidence/phase4/browser/results.json), [business workflow](evidence/phase4/business-workflow.json), [builds](evidence/phase4/build-result.json), [generated-file cleanup](evidence/phase4/build-generated-cleanup.json).

## Deployment readiness and retained state

The schema mismatch that stopped the earlier Vercel build is resolved. A new Control Preview deployment can now be initiated explicitly; it has not been deployed, promoted or aliased here. Local regression results do not assert that a new hosted release has been verified. Preview still has **zero AdminUser records**, so authenticated hosted smoke testing will require an intended Preview account; no administrator was provisioned as part of recovery.

The recovery-owned local servers on 3100/3101 and PostgreSQL container on 55435 are stopped and retained. The fresh restore database, earlier lab databases and both backups remain available. Other owner processes and remote endpoints were not changed. No push or commit was performed. New execution helpers and public evidence are confined to `scripts/recovery-phase4-*` and this incident's documentation; private credentials and archives remain excluded from Git.

The final [workspace audit](evidence/phase4/workspace-audit.json) verified all **1,171 original tracked file hashes** unchanged, checked all eight new execution helpers for syntax, found no temporary test copies, and passed `git diff --check`. Public Phase 4 artifacts were checked against the actual private Preview connection secrets without exposing them.

The procedure used the existing Prisma migration workflow described in [Prisma v6 deployment guidance](https://docs.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production), and direct dump/restore connections as described in [Neon backup transfer guidance](https://neon.com/docs/import/migrate-from-postgres).
