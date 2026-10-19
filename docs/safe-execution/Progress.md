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

- [ ] Phase 0: finish fresh baseline browser review and checkpoint.
- [ ] Phase 1: repair public shared layout; desktop/tablet/mobile checks; checkpoint.
- [ ] Phase 2: inspect and improve dashboard usability without changing business rules; checkpoint.
- [ ] Phase 3: compare production performance/accessibility, optimize measured bottlenecks; checkpoint.
- [ ] Phase 4: structured security review, focused remediation and regression checks; checkpoint.
- [ ] Phase 5: isolated business-flow/browser/build verification and final handoff.

No production writes, real invoices/payments, customer mail, deployment, production infrastructure or authentication replacement are authorized by this task.
