# Invoice and PDF implementation

Date: 2026-09-22. Local implementation and release preparation only. No Production migration or deployment has been performed.

## Implemented locally

- New authenticated **Invoices** navigation and workbench.
- **Create invoice draft** on every saved service job that has service lines.
- Customer profiles list their draft and issued invoices and payment totals.
- Draft creation snapshots customer billing details, service date, job reference, and customer-facing service lines. Internal costs, private notes, and work photos are not fields on invoice records or PDFs.
- Draft recipient details, dates, descriptions, quantities, agreed prices, and tax treatments remain editable.
- Business billing settings are prefilled only with the owner-provided identity and address. Tax mode, tax identifiers, tax wording, bank details, and payment terms remain owner-entered.
- Draft creation and branded A4 PDF preview work with incomplete tax settings. Draft PDFs visibly say `DRAFT`.
- Issuance is rejected until settings are explicitly confirmed, a tax number or VAT ID is present, recipient/date details are complete, and every line has a compatible confirmed tax treatment.
- Final invoice numbers use the existing locked `NumberSequence` mechanism as `INV-YYYY-NNNN`.
- Issuance locks the invoice row. Repeated or concurrent requests return the one already-issued document instead of allocating another number.
- Issued seller/recipient data, lines, totals, and PDF bytes are frozen. Draft mutation routes reject issued invoices.
- Final PDFs are stored as private PostgreSQL `BYTEA` with SHA-256 checksum and byte length. This is durable database storage, not Vercel temporary filesystem storage. Downloads are authenticated and `private, no-store`.
- Partial/full payments are stored separately with amount/date/method/reference/note. The UI calculates paid and outstanding balances; payment recording does not alter the issued PDF.
- Multilingual Noto Sans fonts are embedded, and long invoice descriptions paginate across A4 pages.

## German E-Rechnung scope

This implementation produces an ordinary PDF invoice only. It does **not** claim XRechnung, ZUGFeRD, EN 16931, GoBD, or Finanzamt compliance. The German Federal Ministry of Finance states that since 1 January 2025 a simple PDF is an “other invoice,” not an E-Rechnung, because an E-Rechnung requires a structured electronically processable format. It also documents transitional rules and exceptions, including treatment of B2C and Kleinunternehmer cases. Current official reference (checked 2026-09-22):

- https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html

The owner/accountant must confirm the applicable tax mode, identifier, statutory wording, recipient type, and whether a structured invoice is required before issuing real invoices.

## Verification completed

- Full migration chain through `20260922170000_invoices` on disposable PostgreSQL 16.
- Legacy project, image-byte, contact-message, customer, job, and private-file baselines preserved.
- Catalogue/job lines copy into invoices with exact `Prisma.Decimal` calculations.
- Six concurrent issue requests produced one number, one issuance activity, and identical stored PDF data.
- Editing the source customer, job line, catalogue, and billing settings after issuance did not change the invoice snapshot, checksum, or bytes.
- A 70-line invoice generated multiple valid PDF pages without clipping into a single page.
- Authenticated browser flow passed: customer → job → draft → PDF → issuance blocked while unconfirmed → settings confirmation → issue → partial payment → customer invoice list.
- Unauthenticated PDF access returned 401; mobile invoice UI had no horizontal overflow or browser exceptions.

## Exact production order

Vercel project `tiladys-control` is linked to GitHub with `main` as the automatic Production branch. The current worktree is on `feature/services-redesign`. Preview has no database environment variables; Production does. Therefore:

1. Review and commit the application together with migrations `20260922150000_service_job_line_items` and `20260922170000_invoices`. Do not merge/push to `main` yet.
2. Reconfirm the exact Production deployment/project and direct Neon target (`main`, database `neondb`, schema `public`) without printing credentials.
3. Create/confirm a fresh recoverable snapshot and record migration ledger plus legacy counts/media-byte totals.
4. Quiesce admin writers for the transition.
5. Apply pending migrations in order with `npm run db:deploy` and the verified direct Production connection. For the workflow repair release this is `20260922230000_unique_draft_per_service_job`, after `20260922150000_service_job_line_items` and `20260922170000_invoices`. Never use reset, seed, `db push`, or `migrate dev`.
6. Verify both ledger entries, new tables/enums/constraints/indexes, and unchanged data baselines.
7. Only then merge/push the matching commit to `main`, allowing the automatic Vercel Production deployment.
8. Verify dashboard, customer/job/invoice/PDF/payment flows, public portfolio/project APIs/pages, and runtime logs before resuming writers.

## Workflow repair release

The repair following deployment `dpl_2yk4TUDvBZQm5qcf7u1KZetcFmEh` fixes strict job PATCH payloads, archived-customer hydration, reviewed conversion of legacy estimates to service lines, save-before-draft behavior, field-specific validation, readable scoped panel colours, and mobile overflow. Migration `20260922230000_unique_draft_per_service_job` adds a partial unique index for one active draft per service job. Before applying it, verify no service job has more than one `DRAFT` invoice; stop rather than deleting or merging records if duplicates exist. Apply this additive migration before deploying the matching application revision.

## Owner configuration still required

In **Dashboard → Invoices → Business billing settings**, enter and confirm:

- actual tax treatment: VAT, Kleinunternehmer, or applicable exemption;
- real tax number and/or VAT ID;
- legally appropriate invoice wording, especially for Kleinunternehmer or exempt treatment;
- optional IBAN, BIC, bank name, account holder, payment terms, and instructions.

Until confirmed, drafts and draft PDFs work, but issuance is deliberately blocked.
