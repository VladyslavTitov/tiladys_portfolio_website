# Production recovery: contact and Control

Audit date: 2026-10-03 (Europe/Amsterdam). Repository: VladyslavTitov/tiladys_portfolio_website. Clean starting branch: `feature/services-redesign`; HEAD: `0b3ecfc6d280557b870c616dc1763f1705fdadc4`, matching the supplied production commit.

## Evidence and unresolved diagnosis

The supplied public request returned 503 on deployment `dpl_5KJTJAimtrvtxNbwXWQoYzBSWAGk`; its function ran in iad1 after ingress in fra1. Current code returns 503 before database access when CONTACT_RATE_LIMIT_SECRET is missing. This fits the supplied timing/outgoing-request evidence but does **not prove** absence. Other database/rate-counter/image/insert failures also return 503.

The supplied Control build failed the schema release guard. That proves the guard did not verify compatibility, but its generic error does not identify pending migrations, a failed migration, checksum drift, missing objects, wrong target, connectivity or read-permission failure. Older schema-recovery.md evidence concerns a previous incident; it is not a current production catalog inspection.

Live production inspection was unavailable: the local Vercel credential returned HTTP 403 for both project lookups; the connected app returned no teams and project lookup failed connector argument validation. No DATABASE_URL was injected or local env file available. A read-only GET confirmed https://tiladys.com/en/contact returned 200; GET /api/contact returned 405. Account project/team enumeration also returned 403 (forbidden). No production target, migration ledger, env presence/scope, backup, Neon region, canonical Control origin, Git trigger or latest deployed environment has been verified. **No production mutation is authorized by this audit.**

## Architecture and inventory

Browser → same-origin POST `/api/contact` → shared PostgreSQL ContactRateLimit → ContactMessage (UNREAD) and optional ContactAttachment → authenticated `/dashboard/messages`. No browser database connection, secret, public message GET or public attachment URL. Public web direct database access occurs only in `apps/web/app/api/contact/route.ts`; portfolio and sitemap fetch Control public APIs through `apps/web/lib/api.ts`. That helper is imported by server pages/sitemap, not client components. Browser image URLs and the CSP may expose the Control origin; an origin is configuration, never a credential.

Set each project's variables in **Vercel → project → Settings → Environment Variables**. Entries below describe required configuration; they do not claim it is currently installed. Production scope only for production credentials. Preview runs NODE_ENV=production too: give it separate secrets, staging database and staging SMTP/Control origins. Do not allow ordinary previews to write production data.

| Variable | App | Server/client | Type | Production / Preview requirement | Code / purpose |
| --- | --- | --- | --- | --- | --- |
| DATABASE_URL | Both | Server | Secret | Required / separate staging required | packages/db/prisma/schema.prisma:7; contact storage, Control CRUD and release verifier |
| CONTACT_RATE_LIMIT_SECRET | Web | Server | Secret | Required / separate required | app/api/contact/route.ts; unique CSPRNG HMAC key, distinct from AUTH_SECRET |
| CONTACT_IP_HEADER | Web | Server | Config | Required on Vercel / required on Vercel | route.ts, lib/contact-rate-limit.ts; `x-vercel-forwarded-for` |
| CONTACT_UPLOADS_ENABLED | Web | Server; boolean passed to form | Config | Explicit true/false decision / explicit staging decision | route.ts, app/[locale]/contact/page.tsx, components/LegalPage.tsx |
| NEXT_PUBLIC_SITE_URL | Web | Intentionally public | Config | `https://tiladys.com` / staging site origin | lib/seo.ts, app/layout.tsx, sitemap.ts, robots.ts, contact origin allowlist |
| CONTROL_API_URL | Web | Server (origin also in CSP/media) | Config | Verified Control production origin / staging Control origin | lib/api.ts and next.config.ts; prefer over legacy fallback |
| NEXT_PUBLIC_CONTROL_API_URL | Web | Public prefix | Config | Legacy optional fallback; leave unset when CONTROL_API_URL is set | lib/api.ts, next.config.ts; no browser JS dependency found |
| AUTH_SECRET | Control | Server | Secret | Required / separate required | lib/security.ts:3; IP pseudonymization; never empty |
| CONTROL_URL | Control | Server | Config | Required exact canonical origin / exact staging origin | lib/security.ts, lib/trusted-origins.ts, logout route |
| CONTROL_ALLOWED_ORIGINS | Control | Server | Config | Optional empty / optional exact staging aliases | lib/security.ts; comma-separated exact origins, no wildcards |
| SITE_URL | Control | Server; emitted CORS origin | Config | `https://tiladys.com` / exact staging web origin | proxy.ts:5; public API CORS, still used |
| SMTP_HOST | Control | Server | Config | Required for email / staging SMTP or deliberately unavailable | lib/mail.ts:4; replies and login alerts |
| SMTP_PORT | Control | Server | Config | Provider port / staging port; default 587 | lib/mail.ts:5; implicit TLS at 465, requireTLS otherwise |
| SMTP_USER | Control | Server | Secret/credential | Authenticated provider requirement / staging account | lib/mail.ts:9; optional only for intentionally unauthenticated transport |
| SMTP_PASSWORD | Control | Server | Secret | Authenticated provider requirement / staging credential | lib/mail.ts:9; never public |
| SMTP_FROM | Control | Server | Config | Required provider-approved sender / staging sender | lib/mail.ts:11 |
| ADMIN_ALERT_EMAIL | Control | Server | Private operational config | Optional / optional test recipient | login route; defaults to authenticated admin email |
| SHADOW_DATABASE_URL | DB development | Server | Secret | Not a production deploy target; no production value needed | schema.prisma:8; migrate dev only, separate disposable shadow database |
| RELEASE_SCHEMA_CHECK | Control build | Server | Config | Optional local opt-in only | scripts/control-prebuild.mjs; VERCEL=1 always verifies, value 0 cannot bypass |
| VERCEL, VERCEL_URL, NODE_ENV | Platform / both | Server | Platform config | Supplied by hosting/build tools | origin allowlists, prebuild, cookies, development behavior |
| REDIS_URL | None | N/A | Obsolete | Unset | No code use; contact rate limiting is PostgreSQL-backed |

Operational-only variables (not application Vercel requirements): `CONTROL_RELEASE_URL`, `AGENT_BROWSER_BIN`, `CONTROL_BROWSER_SESSION`, `CONTROL_CHECK_CUSTOMER_ID`, `CONTROL_CHECK_COMPANY_ID` in scripts/verify-control-release.mjs. Isolated test variables: `RELEASE_TEST_DATABASE_URL`, `SCHEMA_RECOVERY_DATABASE_URL`, `CRM_TEST_DATABASE_URL`, `PHASE1_TEST_DATABASE_URL`, `INVOICE_BROWSER_DATABASE_URL`, `INVOICE_BROWSER_CONTROL_URL`, `CHROME_BIN`, `TZ`, `CI`, `TSX_TSCONFIG_PATH`; tests also inherit PATH/HOME. Never supply production data to these harnesses. setup-admin.mjs uses interactive input, not environment admin passwords.

Use Secret/sensitive storage for credentials. Never configure AUTH_SECRET, SMTP credentials, admin credentials, migration credentials or SHADOW_DATABASE_URL in tiladys-public. `.env.example` contains local placeholders only, no real addresses/passwords. Generate secrets privately using `openssl rand -hex 32`, entering them directly in the Vercel UI; never display them in chat, logs or command arguments. Sensitive values are unreadable after creation; verify their presence and runtime behavior, not their plaintext.

## Verified settings required before release

| Setting | tiladys-public | tiladys-control | Live state |
| --- | --- | --- | --- |
| Root Directory | apps/web | apps/control | Unverified |
| Framework | Next.js | Next.js | Unverified |
| Production Branch | Verify feature/services-redesign against current UI | Same | Unverified; supplied logs show production from this branch |
| Domain | https://tiladys.com | Exact canonical admin origin from project Domains | Public supplied; Control unverified |
| Build Command | npm run build | npm run build | Proposed; actual override unverified |
| Git/promotion | Review auto deployment, ignored build and promotion | Same | Unverified; hold production release during recovery |
| Region | Candidate fra1 after provider/plan review | Same | Supplied public execution iad1; remaining settings unverified |

UI: project **Settings → Build and Deployment** for root/build; **Settings → Environments → Production** for branch; **Settings → Git** for repository/triggers; **Settings → Domains** for origins; **Deployments → production deployment** for commit, environment, aliases and build/runtime evidence. Do not infer production status from branch naming.

Control `npm run build` runs scripts/control-prebuild.mjs: Prisma generate, schema verification on Vercel (including Preview), then Next build. This is the single authoritative proposed flow. The supplied explicit generate/check/build override duplicates this prebuild. Leave live settings unchanged until reviewed; reducing duplication must retain the guard. Migrations remain a separate controlled operation, never part of a build. Public prebuild generates Prisma only.

## Read-only diagnosis

Operator must privately confirm both runtime targets against the provider: host/project, database, schema/search_path and environment. Different usernames and pooled/direct hostnames need not imply different databases. Do not compare raw URLs or print them. A restricted public role may lack ledger access: diagnose through the authorized Control/read-only operator connection, not by expanding public permissions.

Securely inject DATABASE_URL into the process outside shell history. From the repository root:

```sh
npm run db:generate
npm run db:diagnose
npm run db:check:crm
```

`db:diagnose` performs one repeatable-read, READ ONLY transaction. It reports checked-in migration names/states, checksum match state, missing scalar columns/enums and aggregate preservation counts. It does not read customer records, ledger error logs, credentials or binary data. `productionTargetVerified: false` deliberately prevents its output from being mistaken for provider identity verification. The report does not prove constraint/index/type/default equivalence: inspect actual catalog/diff separately before selecting category A.

For Prisma 6.19.3 migration status, run the following in an operator-private terminal (Prisma prints datasource metadata, so do not forward raw output to CI/chat):

```sh
npm --workspace @tiladys/db exec -- prisma migrate status --schema prisma/schema.prisma
```

Classify only after target, ledger and schema review: A ordinary pending; B failed; C applied ledger with missing object; D checksum mismatch; E external drift; F wrong database/schema; G connectivity/permissions/unbaselined/other. A diagnostic A candidate is not authorization to migrate. Stop on any B–G condition; identify deployed Git SQL, ledger state/checksum and real objects. No automatic migrate resolve or historical SQL edits.

## Existing migration chain and risks

Checked-in order:

1. 20260725212133_init
2. 20260727160000_portfolio_images_and_fields
3. 20260904120000_rename_new_message_status_to_unread
4. 20260920120000_private_contact_attachments
5. 20260921100000_remove_project_featured
6. 20260921101000_project_seo_and_slug_history
7. 20260922110000_crm_service_jobs
8. 20260922150000_service_job_line_items
9. 20260922170000_invoices
10. 20260922230000_unique_draft_per_service_job
11. 20260923140000_invoice_billing_recipient
12. 20260927150000_bilingual_invoice_snapshots
13. 20260927151000_project_image_schema_guard

Review every actually pending SQL file. NEW→UNREAD preserves enum identity/status meaning but requires coordinated web/Control versions. `remove_project_featured` drops the obsolete flag irreversibly without a backup. The unique draft index can fail if multiple active drafts reference one service job; use an aggregate duplicate-group count, never delete/rewrite invoices to pass. Foreign-key repairs can fail on existing orphans; inspect aggregate orphan counts before applying. CRM/invoice migrations add tables, constraints and fields; billing-recipient migration deliberately preserves existing rows as LEGACY, and bilingual fields/defaults do not rewrite issued PDF blobs. Historical SQL remains immutable.

**PRODUCTION MUTATION CHECKPOINT** — stop before changing a production database, environment setting, deployment or a Git push that can trigger production. Request approval for exact pending migration names, verified target, reviewed SQL risks, completed recoverable backup (timestamp/timezone, personal-data/media coverage), successful staging restore/rehearsal and coordinated maintenance/release plan. For environment changes, approve exact project/key/scope and enter secrets privately. Do not apply a speculative recovery plan.

Only for proven category A, after approval:

1. Record recoverable backup/restore procedure and staging rehearsal evidence. Pause public/admin writers and coordinate old code compatibility.
2. Capture `db:diagnose` aggregate baseline (projects/messages by status, customers, jobs, invoices, project images, contact attachments). Retain private backup/content-integrity evidence too: counts alone cannot prove content preservation.
3. Securely inject the provider-approved production migration/direct connection as DATABASE_URL for this one process; verify it reaches the same canonical data. Run `npm run db:deploy` once. No reset, db push, migrate dev, seed, ad-hoc ALTER or blind resolve.
4. Run `npm run db:check:crm` and `npm run db:diagnose`. Require a passing guard, expected objects/enums and preserved baseline counts (NEW renamed to UNREAD). Investigate failures, do not suppress them.
5. Configure approved Production env separately for both projects, then build/release matching code. New settings do not update old deployments. Redeploy Control only after the schema guard passes.
6. Record deployment IDs/SHAs, verify aliases, runtime health and the smoke sequence below; resume writes after checks pass.

Rollback: env/code rollback requires another deployment and schema compatibility review. Old code may require NEW or featured. Do not blindly revert app code after migration; use a reviewed forward recovery or coordinated restore, preserving writes since backup. No automatic production seeding.

## Contact and admin verification

Local verification: `npm ci`, `npm run db:generate`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Focused tests: contact-security, contact-images, trusted-origins, release-schema, schema-recovery and CRM/invoice tests. Database harnesses enforce localhost and dedicated database/port restrictions. Local build without VERCEL is compilation evidence, not a production schema pass.

After approved recovery, perform **one** synthetic production submission with an operator-owned test address, selected service/locale and consent. Record status 201 / `{ok:true}` without logging values. Authenticate normally (no passwords/cookies in chat), inspect `/dashboard/messages` and privately compare every field. Confirm exactly one matching database row, UNREAD, no duplicate; then verify READ/status flow deliberately. SMTP reply tests should use only the synthetic recipient: REPLIED must follow SMTP acceptance. Existing delivery code already avoids recording success after SMTP failure.

If uploads are enabled by owner decision: use one harmless synthetic image, verify processed WebP and generated filename after authenticated access. Verify unauthenticated attachment access fails. Test invalid/oversized uploads and concurrent limits in staging/local, not by stressing production. Production negative admin GET checks must cover dashboard/messages, customer/invoice APIs and attachment routes; require no private body. Cookies remain HttpOnly, Secure in production, SameSite=Strict; mutating admin routes retain exact Origin checks and authentication.

Contact diagnostics log only fixed stage labels (`config`, `rate-limit`, `body`, `validation`, `attachments`, `message-insert`) or a missing-variable name. Never log Prisma error text, SQL/user values, URLs, IPs, names/emails/message bodies, images or secret values. Browser errors remain generic/no-store. No new tracking, raw-IP ContactMessage storage or HTML rendering is introduced. Message rendering uses React escaping; SQL uses Prisma parameterization. Honeypot still discards, schema requires explicit consent, bounded body/type/Origin and distributed HMAC counters remain.

Uploads retain 2-file limit, 1 MiB/file, 2 MiB aggregate, MIME/signature validation, 4096 dimension/12M pixel limits, no animation, bounded Sharp decode, resize/re-encode and generated names; original bytes, names and metadata are not stored. Private admin attachment routes require auth; deletion also requires Origin. No public message/attachment GET exists.

## Privacy and EU regions

Technical review only; no legal certification. Six-locale privacy copy (apps/web/content/legal.json and LegalPage.tsx) already describes PostgreSQL contact storage, SMTP replies, HMAC counters, private optional images and unresolved provider/retention decisions. **Owner/legal-review TODO:** confirm provider identities, processing locations, recipients, processor contracts/transfers, legal basis/consent text, inquiry/reply/security-record retention periods and backup deletion/restoration treatment. Approve retention separately; no automatic inquiry deletion is added. Backups containing attachments/messages are personal-data backups. Hosting-level request logging/integrations still need live review.

Official Vercel request-header documentation confirms `x-vercel-forwarded-for` is the Vercel client-IP header and distinguishes it from proxy-overwritable forwarding headers. Only configure it behind verified Vercel ingress; no arbitrary custom header is trusted: https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for

Vercel supports one function region on Hobby, five on Pro and all on Enterprise. Candidate smallest configuration for EACH app project root is `{"regions":["fra1"]}` in vercel.json or Settings → Functions → Function Region → Frankfurt. **Not installed:** actual plan, Neon region, latency and project compatibility are unverified. Rehearse supported configuration before release; Node runtime regions do not guarantee every platform component executes there. Ingress fra1 and execution iad1 alone establish neither a legal violation nor compliance. EU hosting alone is insufficient: https://vercel.com/docs/functions/configuring-functions/region

Secrets can be marked sensitive for Production/Preview, hiding values after creation: https://vercel.com/docs/environment-variables/sensitive-environment-variables . Configuration changes require a new deployment: https://vercel.com/docs/environment-variables .

## Least-privilege proposal (not executed)

Inventory found web DB use only in contact route. Migration role needs DDL and ledger permissions; Control runtime needs verified application CRUD without DDL where feasible. Review every Control DB route listed by `rg '@tiladys/db|db\.' apps/control` before reducing permissions.

Candidate public grants, using an operator-reviewed role placeholder and verified schema `public` (substitute actual schema; do not execute blindly):

```sql
GRANT USAGE ON SCHEMA public TO "web_contact_runtime";
GRANT INSERT, UPDATE, SELECT, DELETE ON TABLE public."ContactRateLimit" TO "web_contact_runtime";
GRANT INSERT, SELECT ON TABLE public."ContactMessage" TO "web_contact_runtime";
GRANT INSERT, SELECT ON TABLE public."ContactAttachment" TO "web_contact_runtime";
```

SELECT on message/attachment is needed for Prisma create RETURNING; test exact generated queries and nested inserts on staging before reducing to column grants. String CUID IDs require no sequence grant. The role must be newly reviewed for no inherited elevated roles, no CREATE/DDL, AdminUser/password-hash, CRM or invoice access. Do not REVOKE privileges on an existing role shared by Control; inspect existing grants/default privileges/PUBLIC grants first. PostgreSQL roles and provider connection permissions require operator-specific setup. Stage full JSON/multipart/rate-limit cleanup and returning behavior before replacing public DATABASE_URL. This proposal does not claim an existing credential is restricted.

## Local verification evidence (2026-10-03)

- `npm ci --no-audit --no-fund`: passed after rerunning outside the sandbox's esbuild execution restriction.
- `npm run db:generate`, `npm test`, `npm run typecheck`, `npm run lint`: passed. The default suite initially skipped its optional CRM DB case; that case subsequently passed separately against dedicated localhost:55434 synthetic data.
- `npm run test:contact:route`: passed configuration-stage/error-stage redaction, generic 503, malformed input 400, one mocked UNREAD insert and honeypot no-store.
- `node --experimental-strip-types --test tests/contact-security.test.ts tests/contact-images.test.ts`: 12 passed.
- `node --test tests/release-schema.test.mjs` with isolated RELEASE_TEST_DATABASE_URL: passed real release verification and rejected missing ledger entries, modified checksums, missing scalar columns, enum drift and writes under READ ONLY; new diagnostic report passed.
- `node --import tsx --test tests/schema-recovery.test.ts` with isolated SCHEMA_RECOVERY_DATABASE_URL: passed; reproduced old-schema errors, diagnosed pending history/missing enum/columns, migrated forward, compared synthetic project/media/message contents and status meaning, repeated deploy as a no-op.
- `node --import tsx --test tests/crm-service-jobs.test.ts` with isolated CRM_TEST_DATABASE_URL: all 4 passed, including legacy data, CRM jobs and invoice preservation.
- `npm run test:bilingual`: 6 invoice validation/PDF tests passed. Generated sample PDFs were restored to the clean starting version after testing.
- `npm run db:diagnose`, `npm run db:check:crm`, `npm --workspace @tiladys/db exec -- prisma migrate status --schema prisma/schema.prisma`: passed against disposable localhost:55435/recovery after all 13 existing migrations. CLI datasource output was withheld.
- `npm run build` with local DATABASE_URL and RELEASE_SCHEMA_CHECK=1: both apps passed with the release guard enabled. Web emitted expected sanitized PUBLIC_PORTFOLIO_UNAVAILABLE markers because no Control API server was running during compilation. This is no evidence of production API health.
- `npm run test:contact:integration` with isolated RELEASE_TEST_DATABASE_URL: real Chrome form submission → one HTTP 201 → exactly one UNREAD row → normal synthetic admin login → escaped Messages rendering passed. Private processed WebP, unauthenticated admin/attachment rejection, cookie flags, READ update, foreign-Origin rejection and SMTP failure without REPLIED passed; concurrent real PostgreSQL counters accepted only the four remaining attempts and returned one 429 without creating extra inquiries; no synthetic PII/credential values appeared in captured server output. agent-browser CLI was absent, so the test uses installed Chrome's local DevTools protocol. Synthetic records are removed only from the guarded disposable local database.
- Public browser static assets contained no matches for DATABASE_URL, AUTH_SECRET, SMTP_PASSWORD or CONTACT_RATE_LIMIT_SECRET. No real production secrets were available to the build; this cannot certify an uninspected deployed bundle or repository history.

Production POST, exactly-once database verification, authenticated production Messages, attachments, preservation counts, migration consistency and new deployment health remain pending. No production submission, database mutation, settings change, push or deployment was performed.
