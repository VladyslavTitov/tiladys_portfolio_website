# Safe execution checkpoint — 19 October 2026

The owner's attached Safe Execution Instructions override the earlier redesign specification. This repair continues the existing implementation. Older evidence in `docs/tiladys-rebuild/implementation/` is historical, not a fresh test result.

## Phase 0 — baseline and safety

- Branch: `repair/responsive-safe-20261019`, created from `feature/services-redesign`. Initial HEAD and dirty status are in `evidence/initial-*`. All owner changes were retained. Initial tracked patch is `/tmp/tiladys-initial-20261019.patch`; source checkpoint (excluding secrets, dependencies and builds) is `/tmp/tiladys-safe-checkpoints/phase-0-source.tar.gz`.
- Architecture: npm workspaces; separate Next.js 16.3.8/React 19.1.1 public and Control apps; shared Prisma 6.19.3/PostgreSQL package and Zod schemas. Custom Argon2/hashed opaque sessions remain. Runtime: Node 22.23.1/npm 10.9.8.
- No apps listened on 3000/3001 at inspection. Production QA apps use loopback 3100/3101. Public server components query explicit published projections directly through Prisma; public contact posts to same-origin `/api/contact`. Control uses same-origin `/api/admin/*`, server-side user and exact-origin checks. Browser never receives database credentials.
- Existing environment files do not establish a verified production database target. They are preserved and are not used for tests. No remote database was connected. Explicit test binding was independently verified through Docker port mapping plus SQL identity: `127.0.0.1:55432/tiladys_rebuild_test`, role `tiladys_test`, PostgreSQL 17.11, 23 migrations. Container: `tiladys-rebuild-dev-20261013`. Only synthetic records are used; SMTP is disabled.
- Baseline `npm test`: passed; one optional CRM database case skipped because its dedicated variable is unset. Complete output: `evidence/baseline-tests.log`.
- Both baseline production builds passed using the verified synthetic target. Screenshots and fresh layout/performance results are captured under `evidence/baseline/` by `tests/safe-layouts.mjs`.
- Suspected shared CSS defect: `.section` acquired a constrained width but kept legacy full-viewport computed side padding, and lacks shared centering. Ultra-wide viewports are now included alongside the previous seven sizes. Browser evidence must confirm before editing.
- Dependencies: invoices retain exact decimal operations, locking, immutable issued artifacts and bilingual renderer; auth retains server-side sessions; private file handlers validate parent ownership. These are regression targets, not redesign targets. No migrations or existing business-record edits are needed for layout repair.

## Phase status

- [x] Phase 0: baseline browser review and checkpoint `94a8caa`.
- [x] Phase 1: public shared layout repaired; 99 production browser cases pass.
- [x] Phase 2: dashboard presentation repaired; 108 production browser cases pass.
- [x] Phase 3: measured image optimization and automated accessibility checks complete.
- [x] Phase 4: confirmed auth-throttle/logout fixes and structured security review verified.
- [ ] Phase 5: isolated business-flow/browser/build verification and final handoff.

No production writes, real invoices/payments, customer mail, deployment, production infrastructure or authentication replacement are authorized by this task.

## Baseline browser qualifications

The first public capture used an H1-presence readiness check. Next.js streaming can place an H1 inside a hidden pending boundary, so some service-route rows/screenshots captured loading UI. Those zero-width rows are invalid layout evidence. The visible homepage screenshots and width measurements independently reproduce the real defect: cards are 357px at 1280px, 144px at 1920px and 2px at 2560px. The initial mobile homepage performance samples are usable; service skeleton captures are not. The harness now waits for the matching document's load lifecycle and a visible H1. Centering checks use the layout viewport, excluding the desktop scrollbar. Separate public/Control Chrome ports prevent browser-session interference; interrupted diagnostic runs are not passing evidence.

The fresh Control baseline passed all 108 route/viewport checks with German labels. Its screenshots are under `evidence/baseline-control/`. No Control records were mutated by these layout checks.

## Phase 1 — verified public layout repair

Changed `apps/web/app/globals.css`: centered contained sections, removed the duplicate desktop and phone gutters, and allowed long card/service text to wrap within its grid column. Logo, footer, content and business operations were preserved. `tests/safe-layouts.mjs` now checks actual visible streamed content, 11 public routes at 9 widths (320–2560px), readable card widths, centered sections, form labels, five footer sections, horizontal overflow and uncaught browser exceptions.

Final production browser run: **99/99 passed**, no captured exceptions. Service cards now remain 384px wide at 1440, 1920 and 2560px. Screenshots/results: `evidence/after/`. The mobile Websites overflow found during validation was fixed before checkpointing. Baseline mobile inherited 18px side padding as well as its width gutters; that duplication is removed too.

Checks: `npm test`, `npm run typecheck`, `npm run lint`, `npm run test:rebuild:unit`, `npm run test:bilingual`, `npm run test:rebuild:db` (10 executed isolated database cases), production public build, and `git diff --check` passed. One direct contact-test invocation omitted `TSX_TSCONFIG_PATH` and failed alias resolution; the repository's complete `npm test` command supplied the correct config and passed. No unexecuted integration check is claimed.

Source checkpoint: `/tmp/tiladys-safe-checkpoints/phase-1-source.tar.gz`. Business logic and database schema are unchanged by Phase 1. Production lab measurements remain separate from field data; optimization and comparison follow in Phase 3.

## Phase 2 — verified dashboard usability

Changed only `apps/control/app/globals.css`: desktop filters now share rows and wrap, mobile filters stack, the language picker no longer consumes a full toolbar row, selected List/Board buttons are distinct, and job-section links have separated 44px targets. Removed the existing phone `overflow-x:hidden` workaround. Corrected the underlying long-text, grid-item minimum sizing and inbox reply-form overflow it had concealed. No invoice, quote, payment, job, message, catalogue or customer mutation rules changed.

Final production matrix: **108/108 passed** (12 dashboard routes × 9 widths), German labels, synthetic persisted records, no captured uncaught exceptions. The 320px inbox failed during development and passed after the final grid/reply-form correction; it is not left clipped. Evidence: `evidence/after-control/`, with comparative job screenshots in `evidence/baseline-control/`. Typecheck, lint, isolated domain/database regressions, Control production build and diff whitespace review passed. Source checkpoint: `/tmp/tiladys-safe-checkpoints/phase-2-source.tar.gz`.

## Phase 3 — measured performance and accessibility

Changed the homepage hero's `sizes` declaration in the already-modified `apps/web/app/[locale]/page.tsx`, plus contrast rules in both global stylesheets. Hero transfers fell 51% on mobile and 76% on wide desktop. Mobile local production LCP median: 1084 → 724ms, CLS 0 in both. See `Performance-and-accessibility.md` for all three samples per device, first-request caveats, total transfer and desktop timing noise.

Axe 4.12.1 WCAG-tagged checks: final **22 public + 24 private page/viewport combinations passed with zero reported violations**. Native menu opening, Escape/trigger-focus restoration and reduced-motion scrolling also passed in both apps. These are automated checks; complete manual WCAG/device assessment remains outstanding. Baseline and final evidence are under `evidence/phase3-*`. Production builds, npm tests, type checking, lint and whitespace review passed.

Source checkpoint: `/tmp/tiladys-safe-checkpoints/phase-3-source.tar.gz`; exact one-line homepage delta against its owner-supplied initial version: `/tmp/tiladys-safe-checkpoints/phase-3-home.patch`. That page already contained substantial uncommitted owner implementation, so the checkpoint commit intentionally stages the isolated CSS/docs/tests only, retaining the page in the existing working changes. No owner implementation is silently included in an unrelated CSS commit.

## Phase 4 — confirmed security improvements

`Security-review.md` maps the review and limits. Reproduced the spoofable forwarded-IP throttle and logout origin-error 500 against the original production build, then fixed them without replacing auth/session/financial logic. New `request-source.ts` is used by login, account reauthentication and session IP metadata; `.env.example` documents the trusted-ingress selection. Logout now returns explicit 403/private no-store for rejected origins. Default regression command includes the new request-source unit tests.

Final **16/16 real HTTP auth checks passed**, including Secure/HttpOnly/SameSite cookie flags, valid login/logout, stored-session revocation, private API denial, exact-origin protection, JSON/body limits and 429 despite a rotated untrusted forwarding header. **15 existing HTTP business/security groups also passed** against the synthetic database (files/ownership/publication/withdrawal/financial immutability/account access/CSV/XSS and related workflows). npm tests, typecheck, lint, Control production build and whitespace review passed.

Added `scripts/safe-execution.mjs` to make the verified local database/SMTP boundaries repeatable; it does not start containers, migrate, deploy or contact a production database. Public advisory review and locally resolved dependency versions are recorded. The installed Sharp version meets the new image-advisory workaround; Next feature-specific advisories and a separate security-update recommendation remain explicit. No full transitive dependency-audit or production least-privilege claim is made.

Source checkpoint: `/tmp/tiladys-safe-checkpoints/phase-4-source.tar.gz`. Login/account/root package files already contained substantial owner changes; precise additional deltas are retained in that checkpoint rather than staging those unrelated changes into the security commit.
