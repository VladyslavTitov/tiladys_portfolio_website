# Service job line items implementation

Date: 2026-09-22. Local implementation only; this document does not claim a production rollout.

## Implemented

- Additive `ServiceJobLineItem` records linked to the existing customer service job and optionally to an existing `PriceItem`.
- Immutable catalogue snapshots: copied display name, description, original price text, parsed catalogue amount, and price mode are stored with each job line.
- Job-specific quantity, unit, agreed unit price, tax treatment, calculated subtotal/tax/total, and separately stored internal unit cost.
- Multiple catalogue or custom-private services per job. Custom lines do not create or update public catalogue entries.
- Catalogue selection prefills the localized name, note, unit, and numeric starting price in the admin UI. Editing the agreed price does not update `PriceItem`.
- `FROM`, `MONTHLY`, and percentage catalogue prices require explicit price confirmation. Monthly selection creates only a job line; it creates no recurrence or automatic billing.
- Server-side `Prisma.Decimal` arithmetic with half-up rounding to two currency decimals. The server recalculates all persisted totals and ignores client-calculated totals.
- Existing aggregate job price/cost fields are retained so historical records are not rewritten or inferred into line items.
- Customer-profile “Create service job” now opens a blank job with that customer selected, even when other jobs already exist.
- Private file upload remains disabled because no private object-storage provider has been configured.

## Isolated verification

Migration `20260922150000_service_job_line_items` was rehearsed after the complete existing migration chain in a disposable PostgreSQL 16 database. The test verified:

- existing project, project-image bytes, and contact-message records remain unchanged;
- starting/monthly price modes are detected and an unconfirmed monthly price is rejected;
- exact quantities, prices, 19% tax, half-up totals, and internal costs persist independently;
- custom line items have no catalogue relation;
- changing the catalogue later leaves saved names, source price text, and agreed prices unchanged;
- a repeated `prisma migrate deploy` is a no-op and schema diff is empty.

The complete unit/integration suite, type checks, lint, control build, and public-web build pass.

## Production release order

Do not deploy the application before its schema exists: service-job reads include `ServiceJobLineItem`.

1. Commit the matching application and migration together, but do not push an auto-deploying production branch yet.
2. Confirm the intended Vercel project/revision and actual direct Neon Production target (`main`, database `neondb`, schema `public`) without printing credentials.
3. Confirm a fresh recoverable snapshot and record legacy counts/media-byte totals plus the Prisma migration ledger.
4. Rehearse the exact commit and migration in an isolated database (already completed locally; repeat from the release commit if it changes).
5. Quiesce admin writers for the short transition.
6. Apply only `prisma migrate deploy`/`npm run db:deploy` using the verified direct Production connection. Never use reset, seed, `db push`, or `migrate dev`.
7. Verify migration `20260922150000_service_job_line_items`, its table/constraints/indexes, and unchanged legacy baselines.
8. Deploy the matching control revision, then verify authenticated customer → create job → catalogue/custom line → save/edit workflows on desktop and mobile.
9. Verify the public project and price APIs/pages and confirm runtime logs are clean before resuming writers.

## Still awaiting later stages or owner setup

- Persistent private work-photo storage requires an owner-selected private provider.
- Invoice issuing remains blocked until the owner securely confirms tax treatment/tax identifiers and optional bank/payment-term settings. No tax status has been assumed.
- Invoice/PDF/payment, accounting, and scheduling stages are not represented as complete by this change.
