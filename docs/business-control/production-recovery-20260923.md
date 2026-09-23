# CRM production recovery — 23 September 2026

## Confirmed incident

Production deployment `dpl_EejgYkjVVLkG6uKVDL7pzBZgqruJ` served commit `da82cf80b49ce08c4157c021e5444310652ad746` from `feature/services-redesign`. Deployment metadata identifies a promotion of preview `dpl_GtuXFygZhVMNQfKVrZc34zUxbt7D`. Runtime failures were recorded with HTTP **200**, so status-only monitoring missed them.

Both supplied requests threw `PrismaClientKnownRequestError`, code `P2022`: **The column Invoice.billingCompanyId does not exist in the current database.**

- Customer: request `n9lw5-1790192694156-90b8dde29a85`, digest `3868002785`, stack `at async i (.next/server/app/dashboard/customers/[id]/page.js:2:24793)`.
- Company: request `dlq6f-1790192746312-07ad5895e443`, digest `3768918988`, stack `at async n (.next/server/app/dashboard/companies/[id]/page.js:1:4350)`.
- Invoice list: digest `224364943`, stack `at async h (.next/server/app/dashboard/invoices/page.js:1:1711)`; same missing column.

The Invoice table existed. The new customer/company profile queries include invoice relations, and Prisma selects the new invoice scalar fields. This was a pending migration, not evidence of corrupt customer data or a rendering fallback problem.

## Database recovery

The direct recovery connection targets Neon PostgreSQL 17, database `neondb`, schema `public`. Both exact affected records existed. A hash of the session established by a real production browser login matched a live session in this database, independently confirming that this is the Production application target.

All ten previously applied migration checksums matched repository SQL. Only `20260923140000_invoice_billing_recipient` was pending; `billingCompanyId` and `billingRecipientType` were absent. No falsely-applied migration was found.

A private full custom-format `pg_dump` was restored into isolated local PostgreSQL 17. SHA-256 of the archive: `dcd952736c8e0c887530cca356d083758c491c1559bf7c0d1df95e7940293e0d`. The backup is retained outside the repository at `../production-recovery-20260923/before-billing-migration.dump` with private filesystem permissions. Restore rehearsal and forward migration both passed. Row-content hashes matched before/after for customers, companies, jobs, saved line items, invoices (including binary PDF fields), invoice lines/payments, billing settings, projects and images.

The reviewed migration was then applied using `prisma migrate deploy` against Production. All eleven migrations are now applied. Production before/after hashes also matched. Existing invoices receive `LEGACY` billing type and no inferred company ownership; new drafts default to `INDIVIDUAL`. No reset, seed, migration-history override, issued invoice rewrite or rollback was used.

## Release controls

The actual Vercel project has root `apps/control`, Production Branch `main`, and Git deployments enabled. Before this repair its build command was auto-detected, prebuild generated Prisma Client only, and automatic production-domain assignment was enabled. The old release helper was not on the deployment path.

The live project build command now is:

```sh
npm --prefix ../.. run db:generate && npm --prefix ../.. run db:check:crm && npm run build
```

Automatic production-domain assignment is disabled. Future production builds are staged for verification. The control prebuild also runs the compatibility gate on Vercel (or with `RELEASE_SCHEMA_CHECK=1` locally). The gate is read-only: it checks every required migration and checksum, every Prisma scalar column, and required enum values. It fails if the connection or schema is unavailable. No Preview or Production build runs migrations.

`release:prepare:control` is now read-only with respect to the database. Apply migrations separately only after target, backup, rehearsal and compatibility review. Historical migration SQL is unchanged. `.vercelignore` explicitly excludes environment files; the deployment upload manifest was checked to confirm recovery credentials were excluded.

### Required release verification

1. Review pending migrations, confirm the Production target, back up, restore-test and rehearse before running an explicitly authorized `npm run db:deploy`.
2. Build a Production candidate with `vercel deploy --prod --skip-domain`. Do not promote a Preview build checked only against a different database.
3. Sign in normally to the candidate in an isolated browser session. Supply the candidate URL, browser session name and exact fixture/profile IDs, then run:

   ```sh
   CONTROL_RELEASE_URL=https://candidate.vercel.app \
   CONTROL_BROWSER_SESSION=release-check \
   CONTROL_CHECK_CUSTOMER_ID=customer-id \
   CONTROL_CHECK_COMPANY_ID=company-id \
   npm run release:verify:control
   ```

   `AGENT_BROWSER_BIN` can select the installed agent-browser executable. Credentials/cookies must stay in private local browser state, never command examples, repository files or logs.
4. This check exercises Dashboard, lists, exact customer/company profiles, saved job lines, invoices, draft PDF bytes and invoice ownership. It requires real rendered content and rejects login redirects/server-error pages even when HTTP status is 200. Use fixtures with a saved job/line and draft. Run synthetic write tests separately; never modify issued invoices to create test coverage.
5. Promote only the verified Production candidate. Recheck `autoAssignCustomDomains=false` after promotion, because promotion tools may reset that project setting. Re-run the checks through the Production alias and inspect all runtime severities/statuses.

Project administrators can still explicitly bypass operational controls through Vercel settings or manual promotion. The build gate prevents ordinary incompatible builds; staged domains prevent automatic promotion before authenticated verification. Neither is a claim that an administrator cannot override a release policy.

### Regression test

`tests/release-schema.test.mjs` uses only the isolated loopback recovery database on port 55435. It verifies that pending migrations, changed historical checksums, missing columns and enum drift fail the gate; mutations are rolled back. The compatible restored schema passes, and read-only transactions reject writes.

## Completed verification and release

- Production recovery release: `dpl_74DSJr21je8BVaNMoQPb5d5crsxD`, `https://tiladys-control-9ke4p8knq-tiladys.vercel.app`, built from the `da82cf8` workspace plus the release-gate and deterministic timestamp changes. The canonical `tiladys-control.vercel.app` lookup resolves to this READY, PROMOTED deployment. No public-site deployment was needed.
- Vercel build logs show the strengthened schema check passed before the Next.js build. The staged Production candidate passed the complete authenticated browser check before promotion.
- The original exact customer/company profiles passed, as did Dashboard, customer/company lists, service jobs, saved line items, invoice list, authenticated draft PDF preview and ownership visibility.
- Production write tests used newly created synthetic company/customer/job/draft records. Personal/company draft ownership, saved lines and duplicate-draft prevention passed, including browser profile checks. Only owned synthetic records and their test audit entries were removed. Number sequences were not rewound. No invoice was issued during these tests.
- The original data hashes still matched after synthetic test cleanup.
- Public `https://tiladys.com/en/portfolio` rendered all seven distinct project links and images. The published `/en/portfolio/jobadys` detail page and its images loaded without an error page.
- `npm test`, `npm run lint`, the isolated release-schema regression test, and the Vercel production build (including TypeScript) passed.

The older `schema-recovery.md` documents a separate historical SEO/message-enum incident. Its “not verified/not applied” statements describe that earlier work, not the completed September 23 CRM recovery recorded here.

## Additional rendering defect found during verification

Fresh customer-profile navigation reproduced React error 418 (server/client text mismatch). Activity and private-note timestamps used the host timezone during SSR and the browser timezone during hydration. Shared admin formatting now explicitly uses `Europe/Berlin` for activity timestamps and UTC for persisted invoice/payment calendar dates. Messages and company activity use the same deterministic formatter. No hydration warning is suppressed.

The browser release check was strengthened to reject new browser exceptions, not only error-page text. It correctly rejected the previous release and passed the final staged candidate with zero new exceptions, including Messages and admin Portfolio. A timezone regression test covers UTC, Amsterdam, Los Angeles and Tokyo, including winter/summer business time and UTC date boundaries.
