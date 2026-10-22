# Control Preview schema recovery — Phase 4 complete

**Approved recovery completed:** [Public rollback, token revocation and remaining Preview steps](approved-recovery-results.md). The live public Portfolio is restored to the verified `e82bff0` release; Production data/schema and Control remain unchanged. The unintended public bypass token is revoked. Preview origin correction is prepared and administrator creation remains deferred.

**New incident checkpoint:** [Preview login and Production Portfolio investigation](portfolio-login-incident.md) confirms separate Preview account/origin issues and a Production code/schema mismatch. Hosted recovery-candidate validation and explicit approval requirements are recorded there. The Phase 4 Preview migration approval below does not authorize Production changes.

**Current status: Phase 4 was approved and completed on 21 October 2026 at 16:28 Europe/Amsterdam. Exactly the ten approved Preview migrations were applied; all 23 migrations are complete, the release guard passes, and original data is intact. Control Preview is ready for a new Vercel deployment from the schema/build standpoint. No deployment or Production change occurred.** See [final Phase 4 results and evidence](phase4-results.md).

The approval checkpoint below is retained as historical evidence of the checks completed before authorization.

**Historical checkpoint status: Phases 1–3 completed. STOPPED at Phase 4 pending approval. At this checkpoint no migration had been applied to the real Preview or Production database. No deployment, alias, environment setting, application source, Prisma model or migration SQL was changed. The failed Vercel deployment still requires a new deployment and release verification after the now-completed Preview migration.**

## Confirmed incident and target

| Item | Verified value |
| --- | --- |
| Git incident | `qa/complete-security-20261019`, `141b2edd8f51597a90d9727241fad29a0cf45e83` |
| Failed deployment | `dpl_5yDK5tjCZCJW9t562fa9FCK1TXBc`; `tiladys-control-ky4qaq2ja-tiladys.vercel.app`; created 2026-10-21 10:54:43 UTC |
| Vercel project | `tiladys-control`, `prj_6YJMTiWWHE0lX8nzUYCUpA82tEvV`; team `team_xIA4aFDewxF4sHVLtMnss2me`; root `apps/control` |
| Deployment environment | **Preview**, no custom environment. CLI inspection identifies Preview; API raw target is null, not Production. |
| Build command | `npm --prefix ../.. run db:generate && npm --prefix ../.. run db:check:crm && npm run build` |
| Failure boundary | Prisma Client 6.19.3 generated; schema guard exited 1; Next.js compilation did not start. |
| Actual current Preview DB | Neon `tiladys-control-preview` / `plain-sound-02437622`, branch **main** / `br-delicate-block-b19w0iqs`, endpoint `ep-purple-unit-b1brl6mf` |
| Database identity | `neondb`, schema `public`, role `neondb_owner`, PostgreSQL 18.6; TLS connection |
| Direct host | `ep-purple-unit-b1brl6mf.c-5.eu-central-1.aws.neon.tech` |
| Runtime host | `ep-purple-unit-b1brl6mf-pooler.c-5.eu-central-1.aws.neon.tech` |
| Control Production mapping | Separate `tiladys-database` / `blue-recipe-81197878`, endpoint `ep-frosty-hall-a2rder07`; current Control Production DB entries do **not** share Preview's endpoint. Production SQL/data were not accessed. |

Verification used explicit Vercel project/team IDs, deployment Git SHA/ref, current scoped environment entries and independent Neon branch/endpoint metadata. DATABASE_URL and DATABASE_URL_UNPOOLED Preview entries predate the failed deployment (last updated 2026-09-23); there are no branch-specific database overrides. **Historical plaintext environment values are unavailable from the deployment API.** This report therefore confirms the current mapping and its predeployment metadata, without claiming reconstruction of historical plaintext. Other projects' consumers were not exhaustively audited. The Neon branch's name `main` and integration “production branch” metadata do not determine Vercel's deployment environment.

The Vercel connector lacked project scope; the installed authenticated CLI provided the scoped read-only evidence. No project relinking or environment-file pull occurred. The repository root's existing Vercel link points to the public project, so implicit root-level Vercel commands must not be used for this recovery.

Evidence: [target](evidence/verified-target.json), [failure excerpt](evidence/vercel-build-failure.log), [separate Production mapping](evidence/control-production-consumer-mapping.json).

## Diagnosis

`docs/production-recovery.md` was reviewed; its older 13-migration incident was preserved. The existing `npm run db:diagnose` and `npm run db:check:crm` were run against the explicitly verified real Preview direct target. The guard's failure was reproduced without disabling or editing it.

- Repository: 23 migrations. Target: first 13 finished, active, exact SHA-256 checksums; final ten absent. No failed ledger entry or checksum mismatch.
- Actual schema: 25 tables including the ledger; 331 columns; 244 constraints and 64 indexes in the catalog snapshot. Exact comparison with a clean first-13 PostgreSQL 18 baseline passed for tables, column types/defaults/nullability/precision, enum values/order, constraint definitions/validation and index definitions, including the custom invoice check and partial unique draft index.
- Diagnosis reported 130 missing columns and 12 missing enum values, consistent with the absent ten migrations. Owner/schema and ledger read permissions were verified; schema ownership supports DDL. No evidence of an incorrect current target, partial objects or schema drift was found.
- All 24 business tables have zero rows except NumberSequence (three rows). Customers, companies, admin users, messages, jobs, quotes (not yet created), invoices, payments and uploaded-media records are absent on this Preview snapshot. Production data were not inspected.
- Final read-only source check at **2026-10-21 11:33:43 UTC** still found the same 13 checksums, schema, counts and exact NumberSequence row fingerprint.

**Cause: ten genuinely pending migrations on the verified current Control Preview database.** The generic release message alone was not used to reach this conclusion.

Evidence: [read-only diagnosis](evidence/preview-diagnose.log), [reproduced guard failure](evidence/preview-check.log), [source catalog](evidence/preview-catalog.json), [baseline comparison](evidence/baseline13-comparison.json), [final real Preview check](evidence/real-preview-final-readonly.json).

## Exact pending migrations

1. `20261013210000_rebuild_core`
2. `20261013220000_mail_outbox`
3. `20261013223000_quote_invoice_source`
4. `20261013230000_enquiry_detail`
5. `20261013233000_structured_catalogue`
6. `20261014003000_private_exports`
7. `20261014010000_editor_retention`
8. `20261014013000_quote_expiry_reason`
9. `20261014020000_task_timezone`
10. `20261014023000_curation_unit_text`

Every SQL statement was reviewed. [Migration risk review](migration-review.md) explains each change, FK, uniqueness rule, enum addition, default and data implication. [Exact SQL/checksums/inventory](evidence/pending-migration-review.json) and [all 23 checksums](evidence/migration-file-checksums.json) make the approved scope reproducible.

The SQL is additive: 13 new tables, three new enums, new enum value EXPIRED, nullable fields and defaulted fields. No pending UPDATE, DELETE, DROP or TRUNCATE occurs. Invoice quoteRevisionId and payment idempotency fields start NULL; old invoice snapshots, PDF bytes, document versions, numbers, financial amounts and payment records are not rewritten. Multiple historical NULL-key payments remain valid. Existing projects receive homepageFeatured=false; section updatedAt receives a migration-time default. These defaults are intentional compatibility considerations, not a guessed data backfill.

## Backup and restore proof

An isolated Neon child was forked from the verified source before any staging migration:

- Child `recovery-141b2ed-20261021` / `br-winter-haze-b19z750x`; endpoint `ep-morning-queen-b11zgtsf`.
- Parent `br-delicate-block-b19w0iqs`, LSN `0/1DDE4C8`, parent timestamp `2026-10-21T11:17:06Z`; child created `11:17:37Z`.
- A PostgreSQL 18 custom-format archive was taken from that pre-migration child, public schema/data only, excluding ownership/grants.
- Retained archive: `.env.recovery-backups/2026-10-21/preview-before.dump` in this workspace; **68,012 bytes**, SHA-256 **`7aec2e2dc2d95897296fd80d269d38e6a455e213c3271717d3572ef12a055aa6`**. File mode 0600, directory 0700, already excluded by Git. No credentials or archive contents are committed.
- The archive was restored to the owned local lab. The exact retained archive also passed an independent second restore into `recovery_restore_verify`: all schema definitions/counts, exact three sequence rows and all 13 migration checksums matched. No real-target restore occurred.

The provider advertises six hours of history and listed no explicit snapshots at inspection. This is not a long-term backup or tested in-place restore guarantee. The retained file survives `/tmp` cleanup but is not an off-device disaster-recovery backup. Refresh and verify the backup immediately before an approved operation, including any intervening writes. Restoring the actual target would require separate approval and could discard later writes.

The first local restore attempt stopped safely because fresh PostgreSQL already has public schema. The restore list was narrowed to exclude only its CREATE entry; no source schema was dropped. Rehearsal helper parameter/composite-key issues were corrected locally before successful verification. A retained resolved-attempt log is historical evidence, not a current failing check.

Evidence: [initial restore](evidence/backup-restore.json), [independent retained-archive restore](evidence/retained-backup-verification.json).

## Staging results

| Check | Result |
| --- | --- |
| Ten migrations on isolated Neon child | PASS; command duration 3.347 seconds on the empty-business-data clone |
| Prisma migration status/checksums | PASS; all 23 finished and match exact files; repeat deploy has no pending migrations |
| Existing `db:diagnose` / `db:check:crm` | PASS on child and migrated restored local copy |
| Prisma datamodel diff | No difference on both child and local copy |
| Original child data | All old table counts and exact NumberSequence values unchanged |
| Populated migration rehearsal | Synthetic pre-migration customer/company/job/line/catalogue/message/media/issued invoice/two payments added only to restored local copy; **every original-column row fingerprint preserved** after the ten migrations |
| Historical invoice/payment integrity | Exact stored PDF bytes/checksum, documentVersion=2, invoice number, 119.00 total and two payments totaling 40.00 preserved; new invoice link and old payment idempotency keys remain NULL |
| Existing release-schema adversarial suite | 1/1 pass; pending ledger, modified checksum, missing column and enum drift rejected; simulated mutations rolled back |
| Existing CRM suite | 4/4 pass, database test executed rather than skipped; legacy migration, association and concurrent invoice workflows |
| Existing rebuild integration suite | 10/10 pass; quote acceptance/conversion, frozen invoice terms, concurrent issuance/payments, replay/overpayment protection, numbering, outbox and upload boundaries |
| Bilingual/PDF/issuance suites | 10/10 pass; selectable Unicode, pagination, financial parity, German section before English |
| Both production builds | PASS under Node 22 and independently under official SHA-256-verified Node **24.22.1**, matching Vercel's configured 24.x major; Control guard enabled with RELEASE_SCHEMA_CHECK=1 |
| Contact Playwright | All seven actions 150×44, 16px icons/8px gap, one-line text, equal padding/right edges, no overlap or horizontal overflow at 375/430/768/1280/1440/1920; all original hrefs retained |
| Portfolio Playwright | Websites filter, debounced search, synthetic result and detail page render |
| Dashboard | Actual local login form, authenticated customer/job/quote/invoice pages and logout pass; secure HttpOnly SameSite=Strict session |
| Private API authorization | 62 anonymous method/route requests all return 401 |
| Actual HTTP synthetic business workflow | Five grouped checks pass: company/customer persistence, frozen accepted quote→one job, task relationships, one issued German-first/English-second PDF, idempotent partial payment and archival preserving financial links |

These are **staging results**, not verification of a repaired Vercel release. The 25 automated suite tests ran without skips. Existing suites were reused through temporary incident-only copies with exact local guard substitutions; their repository originals were unchanged. Evidence/PDF output paths were redirected to this incident. SMTP was disabled; no real customer emails, invoices, payments or uploaded objects were created. Authentication used synthetic credentials only. Preview has no AdminUser, so actual deployed dashboard login will need an intended Preview administrator/account before it can be verified; none was provisioned as a migration shortcut.

Evidence: [child result](evidence/child-migration-result.json), [financial fingerprints](evidence/financial-preservation.json), [release guard](evidence/release-schema-tests.log), [CRM](evidence/crm-regression-tests.log), [quote/invoice/payment/media](evidence/invoice-payment-quote-media-regressions.log), [bilingual PDFs](evidence/bilingual-invoice-regressions.log), [Node 24 builds](evidence/build-result-node24.json), [browser results/screenshots](evidence/browser/results.json), [actual API workflow](evidence/business-workflow.json).

## Historical approval proposal — real Control Preview only

Authorize applying **only the ten exact migrations above** to `plain-sound-02437622` → `br-delicate-block-b19w0iqs` → `neondb.public`, through the independently verified direct endpoint. Production is excluded. Revalidate the current Vercel mapping, file checksums, source ledger/schema and current data; obtain a fresh recoverable backup before execution. Stop if any precondition changed.

Expected interruption: a brief **Control Preview write pause**; no planned full-site outage. The observed migration command took 3.347 seconds on its clone, which is not a downtime guarantee. ALTER TABLE/FK validation/ordinary indexes acquire locks. Proposed migration connection uses **session-only lock_timeout=5s and statement_timeout=120s**, verified on the isolated child through Prisma URL `options`; no role/database defaults are altered. If a migration fails, stop and inspect the ledger/partial objects before recovery; do not blindly retry or resolve history. Restoring an old schema is not an automatic rollback once new-feature writes exist.

The following commands are a proposal, **not executed against the real target**. `VERIFIED_PREVIEW_DIRECT_URL` must be privately supplied from the freshly reverified Control Preview entry, with the exact host/db/schema assertion and the session timeout options above. Never echo it, enable shell tracing, put a URL/password in argv, or use an implicit `.env` target.

```bash
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" npm run db:diagnose
# Refresh/restore-check backup and quiesce Preview writes before this approved mutation:
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" npm run db:deploy
npm run db:generate
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" npm run db:check:crm
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" ./node_modules/.bin/prisma migrate status --schema packages/db/prisma/schema.prisma
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" RELEASE_SCHEMA_CHECK=1 npm run build:control
DATABASE_URL="$VERIFIED_PREVIEW_DIRECT_URL" npm run build:web
```

After approval and successful execution, run Phase 5 against the actual intended environment with suitable test/account access: Portfolio/Contact, dashboard login, customer/job/quote reads, stored invoice/PDF/payment integrity and private API authorization. Use isolated records for write tests. Do not seed Production, automatically deploy, promote a deployment or change aliases. An explicit release action would be separate from this database approval.

## Preserved state and retained artifacts

- Initial working tree was clean; no uncommitted user work needed stashing. Initial state/empty diff and hashes were saved privately. Recovery branch: `recovery/vercel-neon-schema-20261021`.
- All **1,171 initial tracked files** remain byte-for-byte unchanged, including both applications, migration SQL, package manifests/lockfile and historical reports. Build-generated next-env files were restored only after exact expected-content checks. New files are confined to `scripts/recovery-*` and this report/evidence directory. A local checkpoint records these additions; no push occurred.
- Local recovery servers 3100/3101 and the specifically labeled PostgreSQL 18 container `tiladys-schema-recovery-20261021` (127.0.0.1:55435) are stopped and retained. The migrated lab, clean first-13 reference and independent pre-migration restore are retained. Existing owner servers/containers were preserved.
- The Neon child is retained; its **own endpoint is confirmed idle after suspension**. The account's suspend timeout is zero, so future connections can wake it and may keep it active. No branch was deleted and no source endpoint was changed.
- Connection exports and synthetic credentials stayed in restricted private files and process environments; public evidence contains metadata/counts/hashes only. The ignored backup is private and intentionally excluded from the checkpoint.

At this historical checkpoint recovery was ready for Phase 4 approval. **The user subsequently approved only the real Preview migration, which is now complete; no deployment or alias change was authorized or performed.** See [Phase 4 results](phase4-results.md) for current state.

Reference behavior was checked against primary documentation: [Neon branching](https://github.com/neondatabase/website/blob/main/content/docs/manage/branches.md), [Neon restore semantics](https://github.com/neondatabase/website/blob/main/content/docs/postgres/backup-restore/branch-restore.md), [Prisma v6 PostgreSQL connector](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql), [official Node 24 distribution](https://nodejs.org/en/download/archive/v24).
