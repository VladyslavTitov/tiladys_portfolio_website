# CRM and invoice workflow — implementation and verification

Implemented locally on 23 September 2026. Nothing was pushed, deployed, or migrated in production. The recovery environment file was not read or changed. All database and browser verification used synthetic records in a disposable local PostgreSQL 16 container on port 55434.

## Behavior

- Draft and issued PDFs use one A4 layout with the existing logo, embedded DejaVu regular/bold Unicode fonts, searchable text, separate seller/recipient/invoice-information blocks, metric-based wrapping, repeated table headings, split oversized descriptions, right-aligned amounts, a kept-together totals block, payment information, and reserved numbered footers. Drafts have only a small `Draft` label. Issued documents have none.
- Existing issued PDF bytes are served unchanged. A missing issued PDF returns `ISSUED_PDF_MISSING` (409), instead of silently generating a replacement. Issuance validation and transactional numbering remain in place.
- Invoice `customerId` and `serviceJobId` stay fixed after creation. `billingRecipientType` explicitly distinguishes individual/company billing; `billingCompanyId` is a direct company foreign key. Recipient address fields are prefilled from the selected recipient, remain editable in draft, and freeze on issuance. A company can have an optional printed contact name while retaining the CRM customer/job association.
- Customer profiles at `/dashboard/customers/[id]` show every explicitly linked invoice, including drafts, in the **Invoices** section below the profile/work panels. Each record shows number/Draft, job, dates, total, paid, outstanding, document status, separate payment status, and Open/Preview/Download actions. The service-jobs panel offers customer-preselected creation and links to invoice creation from each job.
- Company cards open `/dashboard/companies/[id]`: editable business/billing details, internal notes, contacts, jobs, invoices and audit history. The invoice list queries `Invoice.billingCompanyId`; it does not infer ownership through a contact's current company, name or email. The same invoice ID appears on both profiles. Personal invoices stay out of company billing lists, and moving a contact does not move historical invoices.
- Customer/company/job/invoice lists have search and filters. Existing archived customer selections and persisted job-company links remain editable. A new job from a customer profile prefills that customer's company; this is independent of the invoice billing choice.
- Job and invoice editors protect unsaved changes on editor switching, same-tab links, reload and close. Forms retain failed input and report field/path validation messages. Submission locks prevent rapid duplicate clicks. Draft creation locks the job and reopens an existing draft or issued invoice instead of billing it again. Failed job saves stop invoice creation. The job editor shows existing invoices before creation.
- Issuing is disabled with an explanation and links to settings/recipient fields while required data is missing or edits are unsaved. Billing-settings saves now send an explicit validated payload, avoiding the previous accidental submission of database metadata and null optional strings.
- Work status, issuance and payment state remain separate. Balances use Prisma Decimal and each invoice's own payments. No aggregate sums combine customer and company profile copies. Internal notes/costs are not passed into PDF rendering. Authentication/origin checks remain on APIs; dashboard authentication remains in the shared layout.

## Existing invoice ownership

The additive migration does **not** guess historical company ownership. Existing invoices receive `billingRecipientType = LEGACY`, `billingCompanyId = NULL`, with their customer/job links, recipient snapshots, status, number and PDF bytes preserved. They remain on their customer profiles. The profile displays a legacy-relationship explanation. Existing drafts must select an explicit recipient before issuance.

Issued legacy invoices need a separately reviewed ID-to-company mapping before they can appear on a company billing list. No name/email backfill or bulk historical reassignment is included. This is deliberate because the old model mixed personal and company address data and had no authoritative company billing key.

## Verification completed

| Check | Result |
| --- | --- |
| Repository tests (`npm test`) | Passed; separate DB-enabled runs below |
| Workspace typecheck and lint | Passed |
| Control production build (`npm run build:control`) | Passed; both PDF/issue route traces include the logo and both Unicode font files |
| Release schema gate | Passes the migrated database and exits nonzero on an unmigrated database |
| Migration-chain rehearsal (`test:db:crm`) | Passed on an empty dedicated migration database, including repeat deploy and schema diff |
| Existing-data preservation | Project/message/image data retained; pre-existing issued invoice snapshot, checksum and binary PDF retained through the new migration |
| API/profile workflow (`test:crm:workflow`) | Individual/company drafts; customer/company lists; optional company contact; personal exclusion; contact/company address changes; archived job save; concurrent draft deduplication; repeat billing prevention |
| Issuance/payment security | Unconfirmed settings blocked; issued edits rejected; frozen PDF retained; missing PDF not regenerated; partial payment = paid 40.40/outstanding 150.00; PDF unauthenticated = 401; foreign origin = 403 |
| Browser (`test:browser:invoice`) | Failed save creates no invoice; unsaved editor switch can be cancelled; archived customer retained; estimate-to-line; actual settings UI save; draft/PDF/issue/payment/customer profile; mobile invoice width; no runtime exceptions |
| PDF (`test:pdf:unicode`) | Font embedding and exact multilingual text extraction; long addresses; oversized description split; repeated headers/page numbers; glyph bounds and footer reservation; draft/final labeling |
| Visual checks | Actual PDFs rendered with Poppler and inspected; customer/company desktop and 390px mobile screenshots; no horizontal overflow; visible keyboard focus; primary-button and profile-link contrast improved |

The initial dev-origin block was fixed with Next.js `allowedDevOrigins: ['127.0.0.1']`; this only permits the local development origin ([Next.js documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)). The React best-practices skill was used for the component review. Production authentication and allowed mutation origins were not relaxed.

The historical `20260727160000` migration checks a constraint name across all schemas. Rehearsing the entire migration chain alongside an already migrated `public` schema therefore produced an unrelated missing ProjectImage foreign key. The successful full-chain rehearsal used a separate empty database (`tiladys_crm_test_migrations`); historical migration files were not rewritten. The new migration also applied successfully to the already populated local app database.

## Samples and screenshots

All contain synthetic data. Issued sample PDFs are test documents, not real invoices.

- [Original PDF](samples/crm-workflow/invoice-before.pdf)
- [Individual draft](samples/crm-workflow/individual-draft.pdf)
- [Company issued invoice](samples/crm-workflow/company-issued.pdf)
- [Multilingual draft, multiple pages](samples/crm-workflow/multilingual-draft.pdf)
- [Multilingual issued layout, multiple pages](samples/crm-workflow/multilingual-issued.pdf)
- [Customer before](samples/crm-workflow/customer-before.png)
- [Customer after, desktop](samples/crm-workflow/customer-after-desktop.png) / [mobile](samples/crm-workflow/customer-after-mobile.png)
- [Company after, desktop](samples/crm-workflow/company-after-desktop.png) / [mobile](samples/crm-workflow/company-after-mobile.png)
- [Invoice editor, desktop](samples/crm-workflow/invoice-after-desktop.png) / [mobile](samples/crm-workflow/invoice-after-mobile.png)

## Deployment sequence — not executed against production

1. Verify the intended deployment database and existing migration ledger using the established [schema recovery runbook](schema-recovery.md). Confirm a recoverable backup. Hold automatic promotion/push-triggered deployment until the schema is ready. Quiesce invoice writes during the transition so old code cannot create ambiguous invoices after the new default is installed.
2. With the verified migration connection securely injected as `DATABASE_URL`, run `npm run release:prepare:control`. This runs **migrate deploy → read-only CRM schema check → matching Prisma generation/production build**. It does not deploy or seed. Do not run migrate dev, db push, reset, or seed against production. Stop if any step fails.
3. Confirm migration `20260923140000_invoice_billing_recipient` is recorded successfully. `npm run db:check:crm` checks the required tables/columns and migration ledger; a code build alone does not apply schema changes.
4. Deploy/promote the matching control revision through the existing release process. Verify profile lists, create/save/preview/issue/payment flows and existing issued-PDF checksums before resuming writes. Keep the new schema when rolling app code back; do not drop invoice links or regenerate historical PDFs.
5. Review legacy recipient mappings separately. Business billing/tax/payment settings still need the owner's real confirmed values before real issuance. No synthetic test settings were applied to a real database.

## Re-running isolated checks

Use an explicitly local `CRM_TEST_DATABASE_URL` (port 55434, database `tiladys_crm_test` for API checks or `tiladys_crm_test_migrations` for the clean migration rehearsal). Start control on port 3101 with its `DATABASE_URL` pointing to the same synthetic app database and `CONTROL_URL=http://127.0.0.1:3101`.

```sh
npm run test:db:crm
npm run test:crm:workflow
npm run test:pdf:unicode
npm run test:browser:invoice
npm run typecheck
npm run lint
npm run build:control
```

Browser tests additionally use `INVOICE_BROWSER_DATABASE_URL` and a disposable Chrome CDP instance on port 9335. The API/browser fixtures clean up their own records and restore local billing settings. Do not run these fixtures against shared or production data.
