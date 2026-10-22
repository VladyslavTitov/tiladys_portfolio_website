# Reusable release checklist

Run from the repository root. Never substitute a configured production URL. Every mutation command must be preceded by verification of local container name/image, role and exact loopback binding. Credentials stay in mode-600 `/tmp` checkpoints, never in terminal arguments, traces or committed files.

## Gates

- [ ] Archive the current dirty state/source hashes; create a QA branch. Never stage owner changes with `git add -A`.
- [ ] Read `TEST-INVENTORY.md` and regenerate route/entity inventory after route/schema changes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` before fixes. Preserve failures independently.
- [ ] `node scripts/safe-execution.mjs npm run build`; this helper refuses an unexpected synthetic container/port/role and disables email/storage. Preserve owner dev apps and their `.next/dev` folders.
- [ ] Start QA production apps on 3100/3101 using the helper, from each app directory. Never assume owner 3000/3001 connections are disposable.
- [ ] Prepare optional test tooling outside app manifests: Playwright core 1.64.1, installed Chrome, Lighthouse 13.4.1; axe is already installed. Review/approve any required external package metadata transfer before installation/audit.
- [ ] `node scripts/safe-execution.mjs node --import tsx tests/qa-fixtures.mts setup`. Setup creates unique task-owned records and performs real HTTP login; it refuses an existing checkpoint. An incomplete checkpoint must be cleaned up before retry.
- [ ] `node scripts/safe-execution.mjs npm run test:rebuild:db` (synthetic domain/upload/concurrency only).
- [ ] `node scripts/safe-execution.mjs node tests/qa-http.mjs` (all private exported methods/pages, six-locale public SEO and expired sessions).
- [ ] `node scripts/safe-execution.mjs node tests/qa-reuse.mjs business`, then `api`, then `query`.
- [ ] `node tests/qa-reuse.mjs pdf`, `mapping`; direct bilingual-validation and release-schema suites.
- [ ] `node tests/qa-browser.playwright.mjs`: 10 required widths, all concrete public route families and 12 modules, all locale rendering, links, axe, UI login/logout, low heights and equivalent 200%/400% reflow. Choose a fresh `QA_BROWSER_STAGE` to preserve prior evidence.
- [ ] `node tests/qa-reuse.mjs contact before`, then `contact after`; all ten widths and six locales after. No external actions are clicked.
- [ ] `node tests/qa-reuse.mjs portfolio after`; 60 layout cases and 7 functional groups. Run editor and empty modes with the guard and sequentially; never race visibility mutations with other browser/query tests.
- [ ] `node scripts/safe-execution.mjs node tests/qa-reuse.mjs interactions`: actual contact→Inbox, native validation, unsent drafts and disabled-SMTP behavior.
- [ ] `node tests/qa-performance.mjs` while no other browser/build/load tests run. Three production Lighthouse runs per route/device; report median and full spread, no field p75/INP inference.
- [ ] `node tests/qa-latency.playwright.mjs`; separate warm filter/search/history and private API timings from Lighthouse.
- [ ] `node scripts/safe-execution.mjs node tests/qa-reuse.mjs empty`; original visibility and timestamps restored in finally; verify its checkpoint was removed.
- [ ] `node scripts/safe-execution.mjs node tests/qa-server.mjs outage` starts only an additional 3102 server with an unreachable loopback DB. Run `tests/qa-failures.playwright.mjs`; do not stop PostgreSQL to simulate an outage.
- [ ] Optional local SMTP: generate a one-day localhost/127.0.0.1 test certificate under `/tmp/tiladys-complete-qa`; start `qa-smtp-server.mjs`. Stop only QA Control 3101, restart through the guard with `qa-server.mjs smtp`, then run guarded `qa-smtp.playwright.mjs`. The sink uses STARTTLS, no relay and only `@example.test` recipients. Production TLS verification remains enabled; the test CA is injected only into the child. Stop the SMTP-enabled QA server afterwards.
- [ ] Run guarded `qa-dashboard.playwright.mjs` for both supported admin languages, all module roots, notification counts, Inbox transitions/notes, stale tasks and no-invoice calculator behavior.
- [ ] Run guarded `qa-security.mts` against a fresh isolated QA public process after real login tests: the bounded 13-attempt synthetic throttle check may intentionally throttle subsequent logins in its 15-minute window. Do not clear arbitrary counters to make tests pass. Repeating its contact POST cases against an already saturated shared synthetic bucket correctly yields 429; preserve that result and use a fresh QA process/environment for a full independent run.
- [ ] `qa-crm-lab.mjs` optionally creates its own named disposable PostgreSQL container on 127.0.0.1:55434 for the legacy migration rehearsal. It chooses a fresh timestamped name, refuses an existing matching container, then stops and retains its exact container. Never relax the original migration suite guards.
- [ ] Optional dev warning reproduction: guarded `qa-dev-lab.mjs web|control` copies source without `.env` into `.qa-complete-dev`, uses 3104/3105 and explicit original monorepo Turbopack root. Only copied next.config sets the build root. Never touch owner app dev locks. Record cold compilation separately from runtime failures.
- [ ] With approval, run dependency registry audit and scoped passive ZAP. Record missing tool/provider/access as BLOCKED, never PASS.
- [ ] Guarded `qa-reuse.mjs secrets`, then `qa-artifact-scan.mjs` before deleting fixture credentials. The latter scans uncompressed trace contents and current tracked files for exact known values; it is not a full history/PII scanner.
- [ ] Compare application source hashes to initial checkpoint. Restore generated next-env declarations to owner originals. Retest only affected areas after minimal fixes.
- [ ] Guarded `node tests/qa-cleanup.mjs` (wraps `qa-fixtures.mts cleanup` and verifies results): retain owned public test content privately, restore saved local settings, revoke owned sessions, verify original project status/featured/timestamps. Never delete unknown records or issued financial artifacts.
- [ ] Stop only QA-created apps/browsers/sink. Verify owner ports 3000/3001 and existing PostgreSQL remain available.
- [ ] Commit new QA scripts/reports only. Explicitly list unchanged owner edits, unexecuted coverage, unresolved findings and exact release blockers. No automatic deploy.

## Required human/infrastructure checks

- [ ] Actual screen reader and assistive technology review, physical browser zoom and representative touch devices; automated axe/DOM checks alone do not prove WCAG compliance.
- [ ] Production hosting/TLS, proxy identity, database least privilege, backup/restore evidence, private storage retention and signed-link expiry.
- [ ] Real sandbox mail/provider receipt, storage worker and external payment/bank integrations once configured. Local sink acceptance is not external provider delivery.
- [ ] Business/legal review of actual tax status and published material rights; QA must not infer or change them.
- [ ] Focused framework security update and its regression matrix before release; field performance telemetry where available.
