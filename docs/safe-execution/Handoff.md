# Safe execution handoff — 19 October 2026

Work completed locally on `repair/responsive-safe-20261019`, continuing the existing implementation. No remote push, deployment, production migration, real customer mail, real invoice issuance or real payment was performed. All database tests used the verified synthetic PostgreSQL container; it was already running and remains unchanged as infrastructure.

## Result

- Fixed the shared section sizing defect: a capped width inherited viewport gutters twice. Wide-screen service cards went from **2px at 2560px to 384px**; public sections are centered and long German text stays inside its cards.
- Improved dashboard filter rows, mobile form stacking, language-picker sizing, selected view buttons and job-section navigation. Removed page-level clipping and fixed the inbox/task/overview overflow it had concealed. Business mutation rules were preserved.
- Corrected the homepage hero's responsive size declaration. Measured hero transfer fell **51% on mobile and 76% on wide desktop**. Mobile local production LCP median fell **1084 → 724ms**, CLS remained zero. [Measurement details](Performance-and-accessibility.md) retain first-request variation and desktop timing noise.
- Fixed confirmed small-text contrast failures. Final axe checks reported zero WCAG-tagged violations across **22 public + 24 private** page/viewport combinations. Native menu Escape/focus and reduced-motion behavior passed. This is not full manual WCAG certification.
- Reproduced and fixed the login IP-throttle bypass using caller-selected forwarding headers, and corrected rejected logout origin handling from 500 to 403. Custom authentication/session policy was retained. [Security findings and limits](Security-review.md) explain `AUTH_IP_HEADER`, dependency advisories and production verification boundaries.

## Fresh verification

| Check | Actual result / evidence |
| --- | --- |
| Public production browser | 99 route/width cases, 320–2560px; no overflow or captured exceptions; `evidence/final/results.json` |
| Dashboard production browser | 108 route/width cases, German labels; no overflow or captured exceptions; `evidence/final-control/results.json` |
| Accessibility | 22 public and 24 private mobile/desktop combinations; zero reported violations; `evidence/phase3-axe-after*` |
| Authentication | 16 real HTTP checks passed, including login/logout, cookie flags, revoked sessions, body/origin guards and spoofed-header throttle; `evidence/auth-after.json` |
| Existing HTTP suite | 15 business/security groups passed; `evidence/api-checks.json` |
| Company → client → quote → job/task → invoice → payment | 5 end-to-end groups passed through actual APIs and persisted rows; conversion/payment replay and archival relationships verified; `evidence/business-workflow.json` |
| Invoice PDFs | Short synthetic issued PDF visually inspected: German page 1, English page 2, same totals. Existing bilingual tests also cover long German continuation/Unicode/pagination. `evidence/workflow-issued.pdf`, `evidence/workflow-draft.pdf` |
| Historical artifact preservation | Existing isolated DB/API tests passed immutable legacy bytes/version/checksum, no regeneration when original is missing, stale saves, concurrency and payment balance guards |
| Interactive browser | Fresh private phase: 84 layout rows + 30 German rows; actual task DST/calendar/Back, photo lost-response retry, exact Unicode receipt/inbox storage, private attachment/media denial, export expiry and reauthentication; `evidence/interactive-browser.json` |
| Locale/SEO routing | 10 groups passed: all six locales, canonical/lang/hreflang, legacy redirects, actual 404, sitemap exclusions; `evidence/routes.json` |
| Client secret check | 161 client artifacts; no exact known secret values; `evidence/client-secret-scan.json`. This is a scoped known-value comparison |
| Automated/build | `npm test`, `npm run typecheck`, `npm run lint`, domain tests, 10 isolated DB cases, bilingual/PDF tests, release-schema tests, both production builds and `git diff --check` passed |

The default test suite still skips its separately configured original CRM database case because `CRM_TEST_DATABASE_URL` is unset. The dedicated synthetic DB/API/business suites above actually ran. No unexecuted test is presented as passing.

The interactive script's `control` mode imports 98 historical public rows. They are explicitly excluded from the fresh interactive evidence here; the new **99-case production public matrix** is the current public evidence. Upload interaction ran in a webpack development preview with the guarded local worker; production-mode photo uploads intentionally remained unavailable. Local rendering/performance results are not deployed field p75/INP, production SMTP delivery or a real-device screen-reader audit.

## Review and checkpoints

The checkout began with 97 modified tracked files and substantial untracked implementation/reference work. It has been preserved. Incremental checkpoint commits are **not a standalone release of that pre-existing redesign**; review the complete working tree before any release. The homepage, login, account and root package files already held owner changes, so their small additional deltas remain in those working changes rather than silently folding unrelated work into a repair commit. `evidence/session-delta.patch` records those precise additional deltas for review; they are already applied and must not be applied a second time.

Checkpoint commits: `94a8caa` baseline, `eff0b72` public layout, `43feaff` dashboard usability, `15f2af8` accessibility/performance evidence, `3432ed4` focused security. Final verification checkpoint follows this document. Initial dirty state/HEAD are in `evidence/initial-*`; source snapshots are under `/tmp/tiladys-safe-checkpoints/phase-0-source.tar.gz` through `phase-5-source.tar.gz`. They exclude secrets, dependencies and build output. The original reference archive remains untouched.

Final visual examples: [wide homepage before](evidence/baseline/home-2560.png), [wide homepage after](evidence/final/home-2560.png), [full homepage](evidence/final-full-focused/home-1440.png), [About with genuine portrait](evidence/final-full-focused/-about-1440.png), [dashboard filters](evidence/final-control/-service-jobs-1440.png). Blue synthetic project images are labelled QA fixtures, not portfolio evidence. Original brand vectors and preferred five-column footer were retained.

## Repeating local QA

The helper requires the existing running container `tiladys-rebuild-dev-20261013`, PostgreSQL image `postgres:17-alpine`, role `tiladys_test`, loopback port 55432 and database `tiladys_rebuild_test`. It refuses a different binding, derives credentials privately, disables SMTP and never provisions/migrates/deploys automatically. Do not replace these guards with production URLs.

From the repository root:

```bash
npm test
npm run typecheck
npm run lint
node scripts/safe-execution.mjs npm run build
node scripts/safe-execution.mjs node --import tsx scripts/rebuild-browser-fixtures.mts
node scripts/safe-execution.mjs npm run test:rebuild:db
```

In separate terminals, start the matching production previews:

```bash
cd apps/web
node ../../scripts/safe-execution.mjs node ../../node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3100
```

```bash
cd apps/control
node ../../scripts/safe-execution.mjs node ../../node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3101
```

Then, from the root:

```bash
node tests/safe-layouts.mjs after
node tests/safe-layouts.mjs after control
node tests/safe-routes.mjs
node scripts/safe-execution.mjs node tests/safe-auth.mjs after
node scripts/safe-execution.mjs node tests/safe-business.mjs
node scripts/safe-execution.mjs npm run test:rebuild:api
npm run test:bilingual
```

Fixtures expire after one hour; prepare them again when needed. The contact browser suite additionally requires stopping the public production preview and starting webpack development with the helper's `--photos` flag, plus the local worker:

```bash
# In apps/web, in place of its production preview:
node ../../scripts/safe-execution.mjs --photos node ../../node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 -p 3100
# In a root terminal:
node scripts/safe-execution.mjs --photos node --import tsx scripts/local-photo-worker.ts
# In another root terminal:
REBUILD_BROWSER_PHASE=control node scripts/safe-execution.mjs --photos npm run test:rebuild:browser
```

Owned preview/worker processes were stopped at handoff. Temporary test-user sessions were revoked and `/tmp/tiladys-rebuild/browser-fixtures.json` was removed. Synthetic records and PDFs remain in the isolated database for inspection. Generated `next-env.d.ts` was restored to its initial owner-provided bytes after preview checks.

## Remaining work and release boundaries

Production database binding/permissions, private storage and bounded workers/cleanup, SMTP delivery, matched production backup/restore, actual tax/bank/legal/content/rights configuration and deployment still require the existing release review. See [prior launch dependencies](../tiladys-rebuild/implementation/Launch-decisions.md). The framework security update recommendation is in the security review; no blanket clean dependency-audit claim is made.

Complete manual WCAG/device/keyboard/screen-reader/zoom checks and field Core Web Vitals remain outstanding. Existing master-spec partial controls—including older editor recovery/navigation, shared Save/Discard/Stay behavior and provider-dependent modules—are still individually listed in [Control coverage](../tiladys-rebuild/implementation/Control-coverage.md) and [acceptance results](../tiladys-rebuild/implementation/Acceptance-results.md). This pass verifies and repairs the requested responsive/performance/security scope; it does not reclassify all 390 controls or all 52 master acceptance cases as complete.
