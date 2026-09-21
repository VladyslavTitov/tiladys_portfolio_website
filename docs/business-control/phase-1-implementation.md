# Portfolio, SEO and login implementation

Implemented on `feature/services-redesign`, 2026-09-21. This phase does not implement CRM. No production data was accessed, no production migrations applied, and nothing was committed or deployed.

## Result

- Removed the portfolio featured selection from the live Prisma model, validation, write path, public DTO, API ordering and both admin forms. The historical initial migration remains unchanged.
- All published projects are eligible for the 15-second carousel and remain in the normal grid. Category filtering applies to both. Previous/next/pause, keyboard activation, reduced-motion handling, focus/hover/hidden-tab pauses and zero/one-project static states are retained.
- Added optional SEO title/description and social title/description for all six locales, with project-copy fallbacks. An override in a different language does not displace the requested locale's project copy.
- Social preview selection is limited to saved images owned by that project. It defaults to the existing cover; deleting the selected image clears the reference. Draft images stay private until publication.
- Published project pages render canonical URLs, reciprocal language alternates, Open Graph and Twitter cards server-side. Missing/unpublished pages return 404/noindex. Sitemap includes canonical published project and real service URLs with language alternates.
- Old slugs resolve directly to the current project, and the public page issues a 308 redirect. Renaming back is supported. A database transaction/advisory lock protects the current-slug/alias namespace against concurrent claims. Alias reads still require PUBLISHED status; archiving a project hides its old URLs too.
- The existing PC/laptop page now has localized NRW service-area content and matching Service.areaServed data for Mülheim an der Ruhr, Düsseldorf, Dortmund, Duisburg, Oberhausen, Wuppertal and Essen. These are service areas, not branch addresses. Web and business services retain their actual content and no longer inherit a blanket provider-level NRW restriction.
- Service pages have social-card images as well as their existing unique localized metadata. About metadata and structured data use the existing approved Vladyslav Titov founder facts, existing business address/contact data and configured social URLs. No external social-account ownership claims were newly verified.
- The original logo now sits above the white login card on navy. All three credential inputs remain empty, required and unchanged. Authentication handlers, session code, rate limiting, audit behavior and security headers were not modified.

## Contact boundary investigation

Exact path: `ContactForm` → same-origin `POST /api/contact` → `apps/web/app/api/contact/route.ts` → server-side Prisma → PostgreSQL. The handler explicitly uses the Node.js runtime. `apps/web` currently owns request validation, rate limiting and contact/message-attachment storage; there is no control `/api/public/contact` endpoint yet.

This is direct database access by the public **server deployment**, not a database connection exposed to visitors. The browser posts HTTP form data and receives a small success/error response. A scan of 35 built web client JavaScript files found no PrismaClient, DATABASE_URL, CONTACT_RATE_LIMIT_SECRET, SMTP_PASSWORD or synthetic build database URL references. No production credentials or deployed environment were inspected, so this finding describes the reviewed source and local build.

As requested, this phase leaves the working contact flow intact. The CRM foundation must first move storage, persistent rate limiting and attachment processing behind control's bounded public contact API, turn web `/api/contact` into a bounded forwarding endpoint, then remove Prisma/database dependencies, generation and credentials from the web deployment. Preserve origin/consent validation, honeypot, JSON/multipart contracts, upload limits and private admin attachment access. See the CRM steps in [the audit](phase-0-audit.md).

## Migrations and rollout instructions

Two separate forward migrations were authored:

1. `20260921100000_remove_project_featured`: exactly `ALTER TABLE "Project" DROP COLUMN "featured";`. It removes no project rows, translations, status/order fields or media.
2. `20260921101000_project_seo_and_slug_history`: adds nullable metadata fields, a nullable social-image FK with ON DELETE SET NULL, and ProjectSlugAlias with its FK/index. Existing projects require no backfill.

Both SQL migrations were executed only in a fresh disposable local PostgreSQL 16 schema with synthetic legacy records. Before/after snapshots proved that projects, translations, display order, image bytes, prices, messages and contact attachment bytes were preserved. Prisma schema comparison returned no difference. Real concurrent rename tests allowed only one owner of a requested slug; alias reservation, rename-back, archived alias exclusion, image ownership validation and selected-image deletion also passed.

For a later authorized rollout, take and verify a database backup first. Check applied migration history and rehearse on a staging copy. Stop old control instances/writers during the schema/application transition: old Prisma clients expect `featured`, and the new application expects the added SEO/alias fields. Apply the checked-in chain with `npm run db:deploy`, generate the matching client with `npm run db:generate`, build and start the matching control and web versions. Do not seed or reset the database. This is a coordinated transition, not a claim of zero-downtime compatibility. Do not roll old code back against the dropped column; recovery requires a reviewed compatibility or backup-restore procedure. No such rollout was performed here.

All future portfolio create/rename writers must use `reserveProjectSlug` within their write transaction. Alias history starts with changes made after this implementation; old slugs lost before it cannot be reconstructed from the current records.

## Checks

- `npm test`: existing structural/contact/image/mail tests plus metadata, validation, slug reservation, migration-shape and actual public-handler tests passed. Public-handler tests substitute an in-memory repository; they never connect to production.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed for both apps. Builds use an unavailable loopback database/control URL; build success alone is not a database connectivity test.
- `npm run test:browser`: passed against local production builds with a synthetic control API and headless Chrome. Covers six localized project pages, canonical/hreflang/social images, 308 redirects, unpublished 404/noindex, sitemap inclusion/exclusion, keyboard/15-second carousel/pause/reduced-motion controls, both grid and carousel membership, empty/single-project states, EN/DE mobile service content, founder data, desktop/mobile login, empty credentials, and unauthenticated admin guards. No browser exceptions were recorded.
- `npm run test:db:phase1` with `PHASE1_TEST_DATABASE_URL` pointing to the disposable local `tiladys_phase1` database: passed. The script requires loopback plus that database name, creates its own schema and removes only that schema afterward. Without the explicit variable it skips. It does not use DATABASE_URL for its test connection.
- `git diff --check`: passed. Login mobile screenshot inspected visually; logo is clearly visible on navy.
- No new application dependencies. Tests reuse installed tsx/Prisma and local Chrome; the disposable database uses the official PostgreSQL container image.

To repeat browser checks, build first, then run `npm run test:browser` on a machine with Chrome (`CHROME_BIN` may select its binary). Ports 3100, 3101, 3199 and 9334 must be free. The runner owns and shuts down its local servers and Chrome profile. It uses synthetic portfolio/pricing data and an unavailable database URL.

## Changed files

Paths are relative to the repository root.

| Area | Files |
| --- | --- |
| Database | `packages/db/prisma/schema.prisma`; the two migration directories named above |
| Shared validation | `packages/shared/src/index.ts` |
| Control model helpers | `apps/control/lib/projects.ts`, `public-projects.ts`, new `project-slugs.ts` |
| Control APIs | `apps/control/app/api/admin/projects/route.ts`, `projects/[id]/route.ts`; `apps/control/app/api/public/projects/route.ts`, `projects/[slug]/route.ts` |
| Editor | `apps/control/app/dashboard/projects/project-manager.tsx`, `project-form.tsx` |
| Login | `apps/control/app/login/page.tsx`, `apps/control/app/globals.css` |
| Public pages | `apps/web/app/[locale]/portfolio/[slug]/page.tsx`, `services/[slug]/page.tsx`, `about/page.tsx`; `apps/web/app/sitemap.ts` |
| Public components/helpers | `apps/web/components/PortfolioExplorer.tsx`; `apps/web/lib/seo.ts`, `business.ts`, new `project-seo.ts`, new `service-area.ts` |
| Tests/tooling | `package.json`; `tests/public-safety.test.ts`; new `portfolio-seo.test.ts`, `portfolio-public-routes.test.ts`, `phase1-database.test.ts`, `phase1-browser.mjs` |
| Documentation | `README.md`, this report; prior audit/master prompt retained |

## Remaining owner actions and limits

- Migrations and deployment remain unapplied to production. Production authentication/SMTP, actual private records and the authenticated editor were not exercised in the browser; source/auth guards and isolated database behavior were checked.
- No real Windows 11/Fedora project was edited because its content exists outside the checked-in source and production access was prohibited. Use the editor to add accurate localized project copy/SEO once that record can be reviewed. Synthetic test wording is never seeded into the application.
- Default sitemap URL is `https://tiladys.com/sitemap.xml`; confirm `NEXT_PUBLIC_SITE_URL` is the intended canonical production origin before building for deployment. An unavailable control API still produces the existing static-only sitemap fallback; check project entries after rollout.
- After authorized deployment, submit the sitemap in the owner's verified Search Console property, inspect a canonical published project/service URL with URL Inspection, test the live URL and request indexing if appropriate. Check chosen canonical, crawl permissions and rendered metadata. No Search Console account was accessed or changed. Submission does not guarantee indexing or rankings: see [Google's sitemap instructions](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [URL Inspection guidance](https://support.google.com/webmasters/answer/9012289).
- Implementation follows [Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) and [localized-page guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). Geographic markup uses [Schema.org Service.areaServed](https://schema.org/Service) rather than fabricated offices.
