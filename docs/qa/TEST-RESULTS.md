# QA test results

2026-10-19. Branch `qa/complete-security-20261019`, initial HEAD `444af89`. The pre-existing dirty working tree (including Contact/Portfolio changes) was checkpointed under `/tmp/tiladys-complete-qa` before testing. Production was never accessed or deployed.

## Environment and safety

Public/Control are npm workspaces on Next16.3.8, React19.1.1, Prisma6.19.3, Node22.23.1. `scripts/safe-execution.mjs` verified the existing `postgres:17-alpine` synthetic container, role `tiladys_test`, exact loopback binding `127.0.0.1:55432`, database `tiladys_rebuild_test`; it replaced configured URLs in child processes and disabled external mail/storage. Owner apps on 3000/3001 were left alone. QA production used 3100/3101; unreachable-DB server3102; copied-source Turbopack dev3104/3105; non-relaying SMTP sink2525. No production Neon branch or unknown configured URL was tested.

Unique fixture projects covered all public mappings, localized/missing-cover/draft/archived data and pagination. Test credentials were randomly generated and stored mode600 in `/tmp`; positive sessions came from actual password+secret-phrase login, including a real browser form login. Existing harnesses reused that legitimate token; no seeded session substituted for positive authentication proof. The first fixture setup omitted required image alt metadata, failed and was corrected; its exact partial fixture prefix was retained privately and its session revoked. Durable checkpoints were added before later setup operations. No unknown rows were deleted to clean up a test.

Baseline lint/typecheck/default tests and **both production builds passed before fixes**. Existing conditional CRM migration coverage was initially skipped, then executed successfully in its own new disposable PostgreSQL container on loopback55434. That exact container was stopped and retained; original containers were preserved.

## Executed results

Counts use each artifact's own unit (cases, groups, commands or scans); they must not be added as a universal test total.

| Suite / command | Actual result | Evidence |
|---|---|---|
| `npm run lint`, `npm run typecheck`, `npm test`, guarded `npm run build` | PASS all four baseline commands; default CRM conditional group skipped | `evidence/checks/baseline-*.log` |
| `npm run test:rebuild:unit`, `npm run test:release:schema` | PASS both existing runners; logs report file-level results | `checks/domain.log`, `schema.log` |
| guarded `npm run test:rebuild:db` | PASS10 integration groups | `checks/database.log` |
| `node tests/qa-reuse.mjs mapping` | PASS3 pure mapping/locale groups | `checks/mapping.log` |
| `node --import tsx tests/bilingual-validation.test.ts` | PASS2 validation groups | `checks/bilingual-validation.log` |
| `node tests/qa-reuse.mjs pdf` | PASS4 actual-byte PDF groups | `checks/pdf.log`, `existing/pdfs/` |
| `node tests/qa-crm-lab.mjs` | PASS4, including full legacy-data migration rehearsal; no skip | `checks/crm-migration-lab.log` |
| guarded `node tests/qa-http.mjs` | PASS232 authorization/SEO/route/header checks | `evidence/http.json`, `checks/http.log` |
| guarded `qa-reuse.mjs business` | PASS5 real API workflow groups | `workflows/business-workflow.json`, actual draft/issued PDFs |
| guarded `qa-reuse.mjs api` | PASS15 broad API workflow/security groups | `existing/api-checks.json`, `checks/api.log` |
| guarded `qa-reuse.mjs query` | PASS36 actual DB query groups + legacy/page edge assertions | `portfolio/query-checks.json`, `checks/query.log` |
| `node tests/qa-browser.playwright.mjs`, corrected readiness stage | PASS376 rendering/geometry cases, 56 axe scans, keyboard and login/logout; zero unexpected JS/network errors | `browser-verified/results.json`, `checks/browser-verified.log` |
| public internal link crawl | PASS312 distinct local destinations, no HTTP errors; external protocol/target attributes checked without visiting external sites | `browser-verified/links.json` |
| `qa-reuse.mjs contact before/after` | baseline10 cases; PASS60 final locale/width cases, 420 button boxes | `contact/before`, `contact/after` |
| `qa-reuse.mjs portfolio after` | PASS60 layout cases +7 real functional/privacy groups | `portfolio/after/results.json` |
| guarded `qa-reuse.mjs editor` | PASS4 reviewed-publication/editor groups | `portfolio/editor-checks.json` |
| guarded `qa-reuse.mjs empty` | PASS2 real zero-publication states; exact state restored | `portfolio/empty-checks.json`, `checks/empty-retest.log` |
| guarded `qa-reuse.mjs interactions` | PASS16 browser workflow groups | `ui/current/results.json`, `checks/interactions.log` |
| `qa-failures.playwright.mjs` | PASS4 groups: real DB fallback, offline form preservation, injected API503/retry, anonymous trace | `failures/results.json`, `checks/failures-complete.log` |
| guarded `qa-smtp.playwright.mjs` | PASS3 groups: actual UI→TLS sink→DB reply, replay dedupe, explicit rejected non-test recipient | `smtp-results.json`, `smtp-sink.json`, `checks/smtp-retest.log` |
| guarded `qa-security.mts` | PASS6 final groups (upload/MIME/path, URL/money validators, optimizer URL rejection, contact concurrency/replay, bounded auth throttle) | `security-regressions.json`, `checks/security-final.log` |
| guarded `qa-dashboard.playwright.mjs` | PASS48 EN/DE module/viewport cases +5 workflow/count groups | `dashboard-extra.json`, `checks/dashboard-extra-verified.log` |
| `qa-dev-check.mjs` before fix | FAIL8 of30 checks: dev UNAUTHORIZED serialized in logged-out redirects; valid routes loaded | `dev-before-checks.json`, `checks/dev-checks-verified.log` |
| `qa-dev-check.mjs` after page fix | PASS46 expanded dev checks | `dev-after-checks.json`, `checks/dev-after-expanded.log` |
| `QA_PRODUCTION=true node tests/qa-dev-check.mjs` after rebuild | PASS46 final production checks; clean redirects and valid user pages | `production-after-checks.json`, `checks/production-after.log` |
| Lighthouse `qa-performance.mjs` |36 executed samples,12 median/range groups; budget findings below | `performance/results.json`, raw LHRs |
| `qa-latency.playwright.mjs` | PASS35 measured interactions/API reads,7 operation groups | `performance/latency.json` |
| guarded client-secret scan | PASS203 client artifacts, zero exact known values | `workflows/client-secret-scan.json`, `checks/secrets-final.log` |
| Final exact-secret artifact scan | PASS886 QA artifacts/current tracked files, zero exact known values (includes uncompressed traces) | `evidence/artifact-secrets.json`, `checks/artifact-scan-final.log` |
| final lint/default tests/types and guarded Control build | PASS all four commands after page fix; default CRM conditional skip separately covered above | `checks/final-*.log`, `control-after-build.log` |

## Confirmed fix and remaining failures

**Fixed P2 — development page authentication error handling.** Layouts and pages render concurrently. Fifteen server pages called API-oriented `requireUser()`, which threw a generic error before/alongside the layout redirect. A new page-only `requirePageUser()` uses the unchanged `currentUser()` and Next `redirect('/login')`. It returns the same user for valid sessions. API auth/401 behavior, session policy, origins, schema, billing and data are unchanged. Before8 failures; after46/46 dev and46/46 production checks passed. Exact already-applied working-tree delta: `evidence/page-redirect-only.patch`; changed files: `page-guard-files.json`. The owner's unrelated source remains unstaged/preserved.

No P0/P1 application failure or private-data canary leak was observed in the tested scope. A dedicated synthetic task and draft-product canary were absent from tested anonymous production/dev redirect bodies; that bounded check is not a universal proof about all possible private data.

**Remaining performance findings (3 P2 items):** services mobile median LCP3332ms; Contact mobile median2685ms; Portfolio desktop maxCLS0.312 in1/3 samples (median0), attributed by Lighthouse to CTA movement during streamed loading. These exceed the stated lab targets. No unrelated rendering/dependency overhaul or made-up speedup was bundled into this QA. See `PERFORMANCE-REPORT.md` for complete medians/spreads and proposed next work.

**Reproduced P3 warning:** Turbopack CommonJS Prisma `unexpected export *`; valid pages loaded and production webpack builds passed. Logs: `checks/turbopack-web.log`, `turbopack-control.log`. Occasional production “destination stream closed early” logs accompanied canceled streamed navigations; no unexpected browser errors remained in the verified matrix. Neither warning was globally suppressed.

## Harness corrections and non-passes retained

The first browser matrix counted hidden streamed DOM/source-swapping images too early; it also logged transient Chrome network suspension. Its failures remain under `browser/`; visible-result and decoded-image readiness passed the full repeated matrix without CSS changes. Initial failure-path/empty-state scripts used an immediate visibility check or overly broad/incorrect alert selectors; actual headings, network state and the first of two legitimate lookup alerts are now awaited. A Fetch harness used `status()` instead of native Fetch `status`; corrected before final dev execution. The original security assertion expected an internal arithmetic helper to reject inputs before validation; the actual shared schema boundary rejects them and is now tested. Repeating contact POSTs on a saturated synthetic bucket correctly returned429 rather than409: the failure is retained in `checks/security-retest.log`; the final independent run used a fresh QA public process and passed6/6 without clearing counters. Invalid login requests were bounded to13 per recorded security run, with only nonexistent synthetic accounts.

These were test-harness failures/corrections, not silently reclassified application passes. No assertion, security guard or input limit was weakened. Permission review timed out once for a Portfolio tool call; one short retry succeeded. The separate npm audit rejection remains blocked below.

## Coverage status and limitations

| Status | Count / scope | Evidence / next step |
|---|---|---|
| FAIL unresolved |3 measured P2 performance findings;0 unresolved P0/P1 in executed scope | Reproduce/optimize loading priorities and stable Portfolio loading layout, then repeat targeted production measurements |
| BLOCKED |6 coverage groups: npm registry audit; ZAP; production infrastructure/backup/DB grants; real external storage/payment/mail providers; actual screen-reader/device/field telemetry; CI execution | Explicit npm transfer approval pending; install scoped passive tooling, provision sandbox providers/CI, obtain authorized deployment/operator access and real devices/RUM |
| SKIPPED |1 conditional CRM migration group in default runner | Not enabled in default env; independently PASS4 in a new dedicated55434 lab, not skipped there |
| NOT APPLICABLE |8 current optional capability families: MFA, bank sync, auto reminders, structured e-invoices, model uploads, reviews, expenses, website-copy management;4 additional admin interface languages | Settings/source explicitly mark them unconfigured/disabled. Control UI supports EN/DE only; all6 public/content locales are covered |

All present modules received authenticated smoke/geometry; write behavior was verified through the listed real API/browser groups. This is not a claim that every field/tab/filter/permutation has its own E2E test. Quote acceptance/conversion/frozen terms and invoice creation/issue/replay/payment paths were executed; every decline/expire/correction variant, arbitrary large datasets, provider outage permutations and full malicious-input space were not exhaustively covered. Financial cancellation/credit correction is limited to the application's current model; no unsupported workflow was invented. Manual screen-reader, actual OS zoom, production legal/media-rights review and deployments remain unverified.

## Final safety/checkpoint

`evidence/source-integrity.json` compares359 initial files: only15 expected page-guard substitutions changed; no unexpected/missing files. The new helper is the sole new application file. Contact, Portfolio, logo/assets, APIs, Prisma schema/shared contracts and manifests stayed unchanged; owner next-env declarations/build cache were restored. No real message, invoice or payment was created. Synthetic financial histories are retained, never deleted as cleanup. Cleanup verified26 owned projects and2 owned products private, zero owned sessions,65 original projects unchanged, successful-setup settings checkpoint restored and credentials removed (`evidence/cleanup.json`). Final socket check found only the owner3000/3001 listeners among all tested ports; original PostgreSQL still running and the dedicated CRM lab stopped. QA scripts/reports and the incremental fix patch are committed separately from the owner's pre-existing dirty application changes. No deployment occurred.
