# Business Control: Phase 0 audit

Date: 2026-09-21. Branch: `feature/services-redesign`. Baseline commit: `cd3c4ca` (updated image style). Working tree was clean. Requirements: [master prompt including section 86](master-prompt-v2.md).

This is a source-code audit and implementation plan, not a production audit or a claim of completed implementation. No production data, deployed configuration, backups, or migration history were accessed. No migrations, seeds, commits, or deployments were executed. No AGENTS.md files were found under the workspace parent.

## 1. Current architecture

- npm workspaces: Next.js 16.2.11 / React 19 public web and control applications, shared Zod/locales, Prisma/PostgreSQL package. Six locales: en, de, uk, ru, sk, fr.
- Portfolio and prices use `apps/web/lib/api.ts` to call control public APIs. Separate app builds and ports remain intact.
- **Critical divergence from the brief:** `apps/web/app/api/contact/route.ts` imports Prisma and writes ContactMessage, ContactAttachment, and ContactRateLimit directly. There is no control `/api/public/contact` route. Web also declares/transpiles the database package and generates Prisma during prebuild. Credentials are server-side in this implementation, but the public deployment still requires database access, contrary to the target boundary.
- Existing schema has AdminUser, Session, Project, ProjectImage, PriceSection, PriceItem, ContactMessage, VisitorDay, AuditLog, ContactAttachment, ContactRateLimit. No CRM, work, planner or finance models exist.
- Four checked-in migrations: initial schema; portfolio fields/images; NEW-to-UNREAD enum rename; contact attachments/rate limits. Applied production state is unknown.
- Deployment intent is documented in README and per-app Next configuration. No checked-in Vercel deployment configuration was found; deployed versions and environment assignments are unverified.

## 2. Reusable features

- Portfolio publishing, localized editor, image management, explicit public field selection, and publication checks on list, detail and media APIs.
- Full price catalogue/editor; seed catalogue contains 12 sections and 145 services. Public prices now redirect to services; retain this branch's intentional consolidation and the underlying catalogue.
- Contact validation, honeypot, bounded uploads, decoded image validation, shared database rate limiting, private admin attachment access.
- Argon2 verification, random session tokens stored as hashes, HttpOnly/Secure production/SameSite Strict cookies, account lockout, admin route guards, mutation origin checks, audit logging and security headers.
- SMTP requires provider acceptance before storing reply success; failure cases already have focused tests.
- Responsive public components, localized routes, metadata helper, sitemap, robots, founder content and configured business identity.
- Carousel already has 15-second timing, previous/next/pause, focus/hover/visibility pauses and reduced-motion support.

## 3. Problems and limitations

- Featured flag dependency chain: Prisma schema and initial migration → shared projectSchema → control projectData → active project-manager and older project-form → publicProjectSelect/serializer → public list ordering → PortfolioExplorer type/candidates/grid → public-safety fixture. README also describes it. Historical initial migration must stay intact; remove the live field using a new isolated migration.
- Carousel currently selects flagged projects (or just the first project) and removes all candidates from the grid. Both behaviors conflict with section 86.
- Project metadata uses localized title/summary but has no editor SEO overrides, dedicated social image settings or social-card metadata. Slugs are editable without redirect history. Missing detail pages use notFound; metadata failure path should explicitly avoid indexable fallback metadata.
- Sitemap already includes service routes and project slugs from the publication-filtered API for all six locales. API failure silently omits projects. Behavioral inclusion/exclusion tests are still needed.
- Service metadata and Service/Breadcrumb structured data already exist. Provider areaServed is shared across services; PC-specific NRW coverage needs explicit, consistent localized copy without restricting remote website services.
- About content confirms Vladyslav Titov as founder. Central business data lists Kronenstraße 19, 45479 Mülheim an der Ruhr, contact@tiladys.com and +49 163 7235608. Reuse configured social URLs; source presence alone is not fresh verification of external accounts.
- No Windows 11/Fedora project content was found in checked-in source. Its actual project record cannot be verified or edited during this production-free audit.
- Login uses the existing `/brand/logo.svg` inside a white form card. Move it into the navy region using presentation-only changes.
- Messages have one reply slot; no real conversation history or inbound mail adapter. Attachments and portfolio images are currently database bytes.
- Dashboard only counts portfolio, messages and active prices. No roles, customer numbering, private storage abstraction, financial snapshots or planner exist.
- Tests include many source-pattern assertions, with some behavioral security/image/mail tests. No browser test configuration was found. Passing them does not establish database or browser behavior.

## 4. Proposed database additions

First public phase: isolated removal of Project.featured; separate additive migration for optional localized SEO title/description, social title/description, a project-owned social image reference, and ProjectSlugAlias with unique old slug. Validate ownership on image selection and publication on alias resolution. Existing status is sufficient for indexing; no extra switch is needed initially.

CRM phase: Customer, Company, CustomerNote, CustomerActivity and a transactional NumberSequence (scope/year unique). Customer retains an immutable internal ID plus unique display number, optional company, contact/address/language/status/source fields. Email should be searchable, not a unique identity that forces unrelated contacts to merge. Archive by default. Add an explicit owner permission foundation without granting future staff financial access automatically.

Later additive modules: ClientProject, ServiceJob, Task, FileAsset/Document; Conversation/ConversationMessage/MessageAttachment; Appointment/Availability; BusinessSettings/TaxProfile/FinancialTransaction/Expense; Quote/Invoice and line items, Payment, immutable issuance snapshots and correction links. Retain existing public Project separately. Use exact database decimals and decimal calculations for finance. Validate current official German requirements before designing operative tax/invoice behavior.

## 5. Proposed routes and APIs

- Preserve `/[locale]/portfolio`, `/[locale]/portfolio/[slug]`, existing three service routes, public prices/projects/media APIs and current admin editor URLs.
- Add control `POST /api/public/contact`; make web `/api/contact` a bounded forwarding endpoint, with persistent rate limits and contact storage owned by control. Preserve JSON/multipart contracts, origin checks, consent, upload limits and private attachment access. Remove web database imports/dependency/build generation only after regression coverage.
- CRM: `/dashboard/customers`, `/dashboard/customers/new`, `/dashboard/customers/[id]`, `/dashboard/companies`, `/dashboard/companies/[id]`; authenticated `/api/admin/customers`, `/api/admin/customers/[id]`, nested notes/activity routes, company routes and `/api/admin/search`.
- Later use distinct `/dashboard/work/projects` and `/api/admin/client-projects`; planner, finance, reports and settings stay admin-only. No customer fields added to public DTOs.

## 6. Proposed navigation

Dashboard; CRM (Customers, Companies, Leads, Messages); Work (Projects, Service Jobs, Tasks, Files); Planner (Calendar, Appointments, Tasks, Availability); Finance (Overview, Income, Expenses, Quotes, Invoices, Payments, Receipts); Reports (Financial, Tax Preparation, Customers, Projects, Services, Statistics); Website (Portfolio, Prices); Settings (Business, Invoice, Tax, Email, Security).

Introduce working destinations incrementally. Existing Portfolio, Prices and Messages links remain available. Planner/Work task views share the same task records. Leads are a Customer status/view, not duplicate customers.

## 7. Migration risks and recovery

- Do not run README's seed-on-deploy instructions against existing business data. Seed upserts can overwrite owner-edited catalogue text/prices.
- Dropping featured requires code/schema rollout coordination: old Prisma queries can still request the removed field. Prepare compatibility code before the drop; retain a backup of flags for rollback. Do not combine this drop with CRM migrations.
- Test migration chains and data preservation against a disposable database with synthetic records; compare projects, translations, images, prices and messages before/after. Production backups and a restore rehearsal are prerequisites to any later authorized rollout, not actions authorized here.
- Slug history must prevent old aliases being reused for another project and avoid redirect chains. Deleted/archived projects must not resolve publicly through aliases.
- Conversation backfill must be idempotent and preserve ContactMessage and original replies. Do not invent delivery proof for historical replies.
- Preserve current binary image storage. New private files use vendor-independent metadata/storage interfaces; do not migrate existing media incidentally.

## 8. Security risks

- Highest architectural concern: web server currently has direct database access; repair before storing expanded CRM/finance data.
- Login rate limits are process-local, so distributed instances do not share limits. Failed-login updates use read/modify/write and need concurrency review. Login has basic type validation but no call to assertOrigin; existing origin protection must not be overstated. Shared assertOrigin accepts missing Origin. Track hardening separately from login visual changes.
- Session cookies contain opaque random tokens, not signed JWTs, despite README wording. Preserve server-side hashed-token lookup.
- Admin guards exist on current routes; future APIs require explicit permissions and object authorization. UI hiding is not sufficient.
- Audit inserts often occur after data mutations instead of in the same transaction. For customer and financial mutations, persist required audit/activity records atomically.
- Explicit public DTO allowlists are a strong existing boundary. Keep private models and private file handlers outside public routes. CORS is not authentication.
- Configure private file access, retention, download auditing, session management and backup monitoring before financial rollout. Do not expose personal data in audit payloads.

## 9. Implementation phases

0. This source audit and baseline report.
1. Section 86 public portfolio/SEO/login changes in small independent changes, plus isolated contact-boundary repair before CRM storage.
2. Original Phase 1 CRM foundation.
3. Original Phase 2 work management and private storage.
4. Original Phase 3 conversations/SMTP/attachments; inbound separately.
5. Original Phase 4 planner.
6. Original Phase 5 finance foundation/settings/tax profiles.
7. Original Phase 6 quotes, invoices, payments and immutable issuance.
8. Original Phase 7 reports and exports.
9. Original Phase 8 structured e-invoices following official-law verification.
10. Original Phase 9 evaluation of public booking/customer portal after core stability; no public booking implementation yet.

## 10. Exact first implementation and CRM plan

Public phase:
1. Extract/test published carousel selection; retain all filtered published projects in both carousel and grid, preserve accessibility/timing/static states.
2. Remove live featured inputs, serializers/orderings/types and editor controls; prepare isolated drop migration, retain historical migrations and all other columns/data.
3. Add optional six-locale SEO/social fields and validated project-owned social image selector in a separate migration. Add transactional slug history and permanent redirects resolving only published projects.
4. Generate server metadata from canonical resolved project routes, with localized fallbacks, social image/card, language alternates and non-indexable missing/unpublished states. Expand sitemap behavior tests.
5. Improve existing PC/laptop page with NRW-only service-area text (Mülheim an der Ruhr, Düsseldorf, Dortmund, Duisburg, Oberhausen, Wuppertal, Essen) and matching structured data; preserve real service catalogue/prices and remote service scope. Reuse approved founder facts and brand data.
6. Move existing login logo above white card on navy, improve responsive/focus states, preserve all three credentials and backend behavior.
7. Verify tests/typecheck/lint/build, migration preservation in disposable PostgreSQL, localized desktop/mobile browser flows, unpublished media/detail protection and unchanged prices/contact/authentication.
8. Provide sitemap and owner-operated Search Console instructions; no external account action or ranking claim. Exact Fedora project copy remains pending a non-production supplied record/export.

Original CRM Phase 1:
1. Finish tested control-owned contact storage and remove web database access.
2. Add only CRM/numbering/permission foundation tables and indexes. No legacy record rewrite or automatic name/email merge.
3. Add strict Zod input/response validation, bounded paginated search, owner authorization and transactionally coupled audit/activity records.
4. Allocate C-YYYY-NNNN display numbers through atomic database sequence updates with unique constraints and concurrency tests; use Europe/Berlin for business-year boundaries.
5. Implement responsive customer/company list, create/edit/archive, company association, notes and actual activity timeline. Profile shows existing data, not invented financial totals or empty future-module links.
6. Test CRUD/validation, unauthenticated and unauthorized access, numbering concurrency, archive/search/company relations, public DTO separation and regression of contact/prices/portfolio.
7. Record dependency/license decisions (prefer existing dependencies), migration SQL, disposable-db verification, backup/restore prerequisites and remaining deployment steps.

## Baseline verification

- `npm test`: passed (27 source/structure checks and all three additional TypeScript test files).
- `npm run typecheck`: passed both applications.
- `npm run lint`: passed both applications.
- `npm run build`: passed both production builds, including Prisma generation. Build used explicitly overridden loopback database/control URLs to avoid production access; it does not prove live database/API connectivity. Generated tracked build/type files were restored to the clean baseline afterward.
- No browser checks, real PostgreSQL integration/migration execution, live SMTP, production deployment inspection or Google indexing verification performed in this audit.
