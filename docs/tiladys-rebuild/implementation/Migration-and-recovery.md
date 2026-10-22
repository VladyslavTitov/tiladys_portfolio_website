# Migration, local setup and recovery

This rebuild has not been deployed and has made no production database writes. Existing local environment files were retained. Database exercises use only the explicitly isolated PostgreSQL container `tiladys-rebuild-dev-20261013`, published at `127.0.0.1:55432`, with synthetic records. Local SMTP is pointed at `127.0.0.1:1025`; no customer mail was sent.

## Runtime and installation

The repository uses npm workspaces. Node 24.21.0 was installed in a temporary tool cache for deployment-runtime verification; the repository does not depend on that absolute cache path. Use your installed Node 24 and npm 10:

```bash
node --version
npm --version
npm ci --no-audit --no-fund
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run test:rebuild:unit
npm run test:bilingual
npm run build
```

`npm run build` generates Prisma Client and builds Control and Web. Sharp is pinned/overridden to 0.35.5 in both applications and the root test tools, following upstream decoder security advisories. The lockfile changes are confined to Sharp and its decoder packages. Next, React, Prisma, mail, PDF and identity dependencies were not upgraded. See `Dependency-review.md` for the public advisory review and the bulk-audit limitation.

## Isolated test setup

Use a disposable local PostgreSQL 17 database, never an existing customer database. The integration scripts refuse a URL unless its host is exactly `127.0.0.1`, port `55432`, and database name `tiladys_rebuild_test`.

```bash
docker run --name tiladys-rebuild-dev-20261013 \
  --label purpose=tiladys-isolated-synthetic-tests \
  -e POSTGRES_USER=tiladys_test \
  -e POSTGRES_PASSWORD=local_synthetic_only \
  -e POSTGRES_DB=tiladys_rebuild_test \
  -p 127.0.0.1:55432:5432 -d postgres:17-alpine
export DATABASE_URL='postgresql://tiladys_test:local_synthetic_only@127.0.0.1:55432/tiladys_rebuild_test'
npm run db:deploy
npm run test:rebuild:db
node --import tsx scripts/rebuild-browser-fixtures.mts
```

The password in this example is intentionally non-secret and only for this disposable localhost container. If the named container already exists, inspect/start that owned test container; do not replace or remove an unrelated container. Do not run the production seed/setup-admin scripts against an established database.

Run these three commands in separate terminals, retaining the synthetic `DATABASE_URL`:

```bash
CONTACT_AUTO_REPLY_ENABLED=false SMTP_HOST=127.0.0.1 SMTP_PORT=1025 \
  CONTACT_STORAGE_DRIVER=local-test CONTACT_LOCAL_STORAGE_DIR=/tmp/tiladys-browser-photos \
  CONTACT_LOCAL_UPLOAD_URL=http://127.0.0.1:3002 \
  npm exec --workspace @tiladys/web -- next dev --webpack -p 3100
```

```bash
CONTROL_URL=http://127.0.0.1:3101 CONTROL_ALLOWED_ORIGINS=http://127.0.0.1:3101 \
  SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_USER= ADMIN_ALERT_EMAIL=synthetic@example.test \
  npm exec --workspace @tiladys/control -- next dev --webpack -p 3101
```

```bash
CONTACT_STORAGE_DRIVER=local-test CONTACT_LOCAL_STORAGE_DIR=/tmp/tiladys-browser-photos \
  CONTACT_LOCAL_UPLOAD_URL=http://127.0.0.1:3002 \
  node --import tsx scripts/local-photo-worker.ts
```

Then run `npm run test:rebuild:browser` and `npm run test:rebuild:api`. They require the local previews, Google Chrome, and the private one-hour synthetic fixture in `/tmp/tiladys-rebuild/browser-fixtures.json`. The fixture is mode 0600 and contains synthetic credentials/session material; never copy it into the repository, screenshots, review package or deployment. The browser script clears rate-limit records only after checking the exact synthetic database binding. Database tests create only synthetic clients, quotes, invoices, tasks and uploads.

The ordinary owner development commands remain `npm run dev`, `npm run dev:web`, `npm run dev:control`; default ports are 3000/3001. Those commands use the caller’s real configuration. Use the explicit isolated commands above for these acceptance exercises.

## Additive migrations

Apply the 13 existing migrations followed by these 10 additions, in chronological order:

1. `20261013210000_rebuild_core`: quotes/revisions/acceptance, products/aliases/media, tasks, upload reservations/media, scoped retries, enquiry links/notes, job briefs/due fields.
2. `20261013220000_mail_outbox`: mail reservation and delivery-attempt records.
3. `20261013223000_quote_invoice_source`: unique immutable accepted-quote revision source on invoices.
4. `20261013230000_enquiry_detail`: allowlisted request detail.
5. `20261013233000_structured_catalogue`: nullable structured price fields; existing display prices remain intact.
6. `20261014003000_private_exports`: scoped owner-bound expiring CSV artifacts.
7. `20261014010000_editor_retention`: catalogue version timestamps and retained project-image archival state.
8. `20261014013000_quote_expiry_reason`: explicit quote expiry and state reason.
9. `20261014020000_task_timezone`: intended task timezone, with existing UTC instants retained.
10. `20261014023000_curation_unit_text`: explicit homepage curation and translated catalogue unit text.

There is no reset, destructive backfill, invoice renumbering, client merge, email uniqueness constraint, auth migration, status replacement on legacy jobs or PDF regeneration. The existing partial unique active-draft index on invoices remains in place. Historical invoices retain their identifiers, document version, snapshots, checksum and stored bytes. New previews/issues use renderer version 3 with German first and English afterward.

Existing projects default to `homepageFeatured=false`; review and select actual homepage work deliberately. Publication itself is preserved. Existing unstructured catalogue strings remain display data: no guessed numeric agreement is backfilled. Legacy optional translations remain optional drafts and block final invoice issuance when required. Existing task instants are not shifted; the default zone is UTC until an owner explicitly edits the intended zone. Original enquiries remain unchanged.

## Preflight and release order

Before an authorized production release, verify the intended project/branch/database binding without printing connection credentials. Obtain a recoverable database backup and the corresponding private-object inventory/backup. Rehearse all migrations on an isolated branch or restored copy, compare record counts and historical PDF hashes, and check the existing active-draft and sequence constraints. The local migration/restore evidence is not proof of a production backup.

After owner approval, use an approved **direct** migration connection for `npm run db:deploy`. Do not run `prisma migrate dev`, reset, seed or schema push on production. Deploy the code only after the additive migrations succeed; rebuilding against the intended binding avoids shipping synthetic QA output. Recheck auth, public publication/withdrawal, receipt persistence, invoice preview/issuance and private file denial using authorized synthetic records. Deployment, production migration, customer emails and accounting corrections were not authorized or executed in this task.

## Configuration names, without secret values

- Database: `DATABASE_URL`; use the provider’s appropriate direct connection for migrations and its supported runtime connection for applications.
- Identity/origins: `AUTH_SECRET`, `CONTROL_URL`, `CONTROL_ALLOWED_ORIGINS`, and the hosting platform’s `VERCEL`/`VERCEL_URL` where applicable. Existing custom password/secret-phrase sessions remain authoritative. Managed-auth tables are not an instruction to migrate identity.
- Public origin: `NEXT_PUBLIC_SITE_URL`.
- Mail: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_REPLY_TO`, `ADMIN_ALERT_EMAIL`; public acknowledgement opt-in is `CONTACT_AUTO_REPLY_ENABLED`.
- Contact abuse controls: `CONTACT_RATE_LIMIT_SECRET`, `CONTACT_IP_HEADER` with a deployment-verified trusted client-IP header.
- Development photo adapter only: `CONTACT_STORAGE_DRIVER=local-test`, `CONTACT_LOCAL_STORAGE_DIR`, `CONTACT_LOCAL_UPLOAD_URL`. The root must be an owned `/tmp/tiladys-*` directory. `NODE_ENV=production` disables this adapter. Legacy multipart opt-in `CONTACT_UPLOADS_ENABLED` is development-only and is disabled on Vercel.

Production direct-photo storage requires a selected private object provider, purpose-bound signed upload mechanism, verified CORS/origin policy, bounded processing worker, quarantine/expiry/orphan cleanup, deployment credentials, and restore evidence. The local adapter is not a durable provider and must not be enabled as one. Private job documents/model uploads and file-archive exports also remain gated on their actual storage/validation/inventory implementation. Do not invent environment variables or claim a provider is connected merely because the local interface exists.

## Retention and recovery

- Catalogue and project removal archives records; project images removed from a gallery retain private original bytes, while both public origins deny original and resize requests. Reordering/alt/cover updates share the project’s stale-write guard.
- Issued invoices and payment history are retained. Later client, catalogue, bank or UI-language edits do not regenerate an issued artifact. A missing issued PDF returns `ISSUED_PDF_MISSING`; recover the original from a verified backup, not a fresh rendering of mutable data.
- Acknowledgements/replies reserve durable attempts before SMTP. `UNKNOWN`, `SENDING` and `RECORD_FAILED` require provider/outbox reconciliation; never delete their retry state and blindly resend.
- Contact reservations expire after 15 minutes. A completed enquiry owns its attachments once; wrong-purpose, expired, stolen-capability, changed-byte and repeated claims are rejected. Production cleanup/retention scheduling is a provider/worker launch prerequisite. Local test leftovers are synthetic and are not a production retention policy.
- CSV exports are capped at 1000 rows, scoped to their creating account, protected by the current session, formula-neutralized and expire after 15 minutes. Full file archives are unavailable until a bounded private export worker exists.

For rollback, prefer rolling application code forward with a fix or returning to the prior compatible application while leaving additive schema in place. Do not drop new tables or rewind a database after new invoices, payments, outbox claims or enquiries have been written without a reviewed reconciliation plan. Restore only into a separate verified target first. The isolated restore exercise has never overwritten the source database.


## Final isolated recovery evidence

After stopping the owned web/control/photo-worker writers, `scripts/rebuild-recovery-check.mjs` dumped the synthetic database, copied both local object roots, restored into a newly named database and separate object directories, and compared all 38 table row fingerprints, every index and all 23 file byte hashes. Every accepted media key had restored bytes. See `evidence/recovery-final.json` and `evidence/checks/recovery.log`. The source was not overwritten. This is local recovery evidence, not production backup coverage. The backup/destination paths are recorded in that JSON and remain outside the repository with private directory/file permissions.

To repeat with owned synthetic writers stopped:

```bash
REBUILD_WRITERS_STOPPED=true node scripts/rebuild-recovery-check.mjs
```

The command still requires the exact synthetic `DATABASE_URL` above and checks the Docker purpose label. It always creates a new restore database; it never resets an existing one. Temporary browser credentials are removed and their current test session revoked after verification; regenerate them with the fixture script before repeating browser/API tests.
