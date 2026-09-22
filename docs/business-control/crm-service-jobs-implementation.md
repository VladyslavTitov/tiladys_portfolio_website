# CRM and service jobs implementation

Date: 2026-09-22. This is a local implementation report. It does not claim a production rollout.

## Implemented locally

- Additive Prisma models and migration for `Company`, canonical `Customer`, `CustomerNote`, `CustomerActivity`, `NumberSequence`, `ServiceJob`, and private `FileAsset` metadata.
- Transactional `C-YYYY-NNNN` and `JOB-YYYY-NNNN` allocation using a database upsert/row lock rather than `count + 1`.
- Exact `Decimal(12,2)` service-job price and cost fields.
- Authenticated, origin-checked admin APIs for customer search/create/read/update/archive, notes, companies, and service jobs.
- Customer/job mutations couple their audit and customer-activity records in the same transaction.
- Responsive navy/cyan admin navigation, real dashboard CRM/work counts, customer/company screens, customer profiles, notes/activity, and linked service-job create/edit workflows.
- Existing public Portfolio `Project`, prices, messages, authentication, contact records, project images, and public APIs are unchanged.
- Customer/work records and file metadata have no public routes.

## Private file status

`FileAsset` stores provider-neutral private metadata only. Binary upload/download is intentionally not represented as complete: no private object-storage resource is connected. Customer files are not stored in PostgreSQL, the existing public `ProjectImage` table, or a public URL. Complete this stage by selecting and connecting one private provider (Vercel Blob, S3-compatible storage, or Cloudflare R2), then implementing validated upload, authenticated download, deletion/retention, checksum verification, and signed/authorized access.

## Verification completed

- Actual migration chain rehearsed in disposable PostgreSQL 16.
- Legacy project, project-image bytes, and contact-message records remained unchanged.
- Twelve concurrent customer allocations produced twelve unique numbers.
- Company/customer/job/note/activity/audit records and exact decimal values persisted.
- Repeat `migrate deploy` was a no-op and Prisma schema diff was empty.
- Existing test suite, workspace type checks, lint, and both production builds passed.
- Browser workflow against a second disposable database passed: synthetic login, customer creation, persisted profile, service-job creation, private note, linked history, and dashboard navigation.
- At 390 × 844 the customer profile had no horizontal overflow or framework error overlay.

## Exact release order

Do not deploy the current local change until private storage is completed or the file UI remains explicitly disabled and the owner accepts that reduced scope.

1. Complete provider-specific private storage and its isolated upload/download/authorization tests.
2. Review the additive migration SQL and create a fresh recoverable production snapshot.
3. Capture production baselines for all existing tables/media plus the migration ledger.
4. Deploy a preview of the matching application revision and run build/browser checks against an isolated migrated database.
5. Quiesce admin/contact writers for the short schema transition.
6. Apply `npm run db:deploy` once with the verified direct Production connection. Never reset, seed, `db push`, or `migrate dev`.
7. Verify the new migration record/tables/indexes and unchanged legacy counts/media bytes.
8. Deploy the matching control revision. The public web application does not require a CRM schema change, but regression-check its portfolio, prices, and contact flow.
9. Verify authenticated customer/company/job/note/file workflows, public API isolation, and runtime logs before resuming writers.

No production CRM migration or application deployment has been performed.
