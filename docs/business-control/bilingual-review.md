# Bilingual invoices and catalogue workflow — local implementation

Branch: `feature/services-redesign`. No commit, push, deployment, production migration, production settings change, real invoice, or customer message was performed. All database writes used a newly created disposable `postgres:16-alpine` container, `tiladys-bilingual-review`, bound to `127.0.0.1:55434`, database `tiladys_crm_test`. Container creation established ownership and disposability; an existing environment URL was not trusted. Credentials are not part of these deliverables.

## Analysis, baseline, and implementation decisions

The initial working tree already modified the job manager, PDF renderer, Unicode PDF test, and three PDF samples. Their functionality was extended; the three original sample files retain their pre-task bytes. Generated changes to previously clean sample files and TypeScript build metadata were restored.

| Area | Traced implementation | Finding and action |
| --- | --- | --- |
| Customer/company ownership | Dashboard customer/company profile queries; invoice `billingCompanyId`; `/api/admin/invoices` | Explicit ownership already worked. Retained it; personal invoices are not inferred from the customer's company. |
| Jobs and prices | `lib/business-records.ts`, job routes and manager, shared schemas | Decimal server calculations and custom lines existed. Search only inspected one preferred language. Saved price metadata was reread on each save. Shared picker now searches multilingual text; persisted line IDs retain saved catalogue metadata. |
| Invoice drafts | `lib/invoices.ts`, invoice POST/PATCH and manager | Job-to-invoice copying, save-before-issue, locking against issuance, and separate job/invoice edits already worked. Added German text, price-mode and period snapshots. |
| Issuance/payment/archive | `issueInvoice`, number allocator, payment/PDF routes | Row locking, idempotent issuance, checksummed stored PDF bytes, and balances existed and were retained. Issued downloads never regenerate; missing archives remain an error. |
| PDF | `lib/invoice-pdf.ts`, font package and tracing config | Mixed bilingual headings on one document were not complete language sections. Now renders all English pages followed by German pages from the same numbers and snapshot. |
| Private performance | Invoice list/profile queries; service-job page | Archived PDF blobs were fetched then discarded. Omitted from metadata queries. Full catalogue was serialized into job HTML; now fetched only when the picker opens. |
| Public rendering/cache | Web API helper, public prices, portfolio and project loaders | Public prices use 60-second revalidation; project rendering already deduplicates per render. No private data was added to shared caches. Local measurements did not justify region/provider changes. |
| Migration/release | Migration ledger, Prisma schema/client, prebuild and schema check | Existing checks were retained. Rehearsal exposed an old cross-schema foreign-key guard bug; repaired additively. |

Before application changes, the existing test suite, type checks, lint, both builds, Unicode PDFs, and synthetic API workflow were run. Baseline invoice screenshots at 360/390/768/1440 px showed no page-wide overflow. The initial PDF was rendered and inspected: it used mixed-language headings with English line headings, rather than separate complete sections.

The implementation order followed those findings: add snapshots and migration; render separate sections with missing-translation requirements; share the service picker; remove demonstrated unnecessary data transfers; verify migrations, workflows, layouts, and performance. Existing working issuance and payment mechanisms were reused.

## Implemented behavior

- One PDF and one invoice number. Short sample: English page 1, German page 2. Long English content finishes before German begins. German explicitly states there is no additional payment obligation.
- Both sections use the same persisted quantities, dates, prices, tax amounts, totals, recipient, bank identifiers, and payment deadline. No translation service is called.
- Editable German service names, descriptions, custom units, invoice notes, billing instructions, and tax wording. Existing text fields serve as English fields. Catalogue selections copy the existing English/German catalogue text.
- Missing German text is visible in draft PDFs and in actionable issuance requirements. Draft saving remains possible. Issuance rejects missing required translations with HTTP 422 and field references.
- Existing issued documents retain version 1 and their archived bytes. Newly issued documents save version 2 with both text versions and the PDF. Old drafts require review of their English/German text before issuance.
- Retained font-measured wrapping, repeated table headings, multi-page descriptions, reserved footers, A4 layout, and embedded DejaVu Unicode fonts. German pages use German page/draft labels. Fonts and logo remain included by the existing deployment tracing configuration.
- Shared native modal picker: names, category, code, EUR price and mode/unit; multilingual substring search and cleaning/Reinigung aliases; empty/no-result/loading/error/retry states; Arrow keys, Enter, Escape, focus restoration, and touch controls.
- Custom lines are private by default. The picker exposes a separate catalogue-editor action for explicitly publishing a custom service; adding a line never publishes it.
- Starting prices require confirmation; monthly services require ordered dates and do not create recurring billing. Tax remains explicitly unconfirmed until chosen. Decimal calculations remain authoritative on the server.
- Save errors retain edited state; persistence must succeed before showing success. Preview is available beside Save/Download/Issue and requires saving dirty drafts first.

## Verification evidence

All verification used synthetic records. Routine page measurements used 1 customer, 1 company, 1 job, 1 invoice, 1 project, and 145 catalogue entries. Workflow tests create and remove additional records. Migration tests create isolated schemas and remove them afterward.

| Check | Result |
| --- | --- |
| `npm test` | Passed; database-specific tests are additionally run with an explicit test URL below. |
| `npm run typecheck`, `npm run lint` | Passed, no lint warnings in final run. |
| `npm run test:bilingual` | Six behavioral PDF/validation tests passed. |
| `npm run test:db:crm` with local test URL | Four tests passed, including full migration rehearsal, historical PDF preservation, projects/media, customers/companies/jobs/payments, decimal totals, and concurrent issuance. |
| `npm run test:release:schema` | Passed. |
| Schema-gated control production build | Passed with `RELEASE_SCHEMA_CHECK=1` against disposable target. |
| Public production build | Passed against local control API. |
| `npm run test:crm:workflow` | Passed: personal/company ownership, concurrent draft reuse, missing-translation blocking, frozen issuance, partial payments, archive/auth/origin boundaries. |
| `npm run test:browser:invoice` | Passed: job entry, both catalogue pickers, keyboard selection/dismissal/focus, bilingual entry, save/reload, simulated save failure/retry, preview/download, issue and payments. |
| `tests/bilingual-layouts.mjs` | Public home/services/portfolio/project, customer/company and job pages passed overflow/content checks at 360, 390, 768 and 1440 px. |
| Invoice/picker mobile | All four widths checked; reduced 420 px viewport checks remaining space with mobile keyboard. This is emulation, not a physical keyboard/device test. |
| Public price edit visibility | Local API and rendered service page reflected a temporary synthetic price edit; original price restored. This run observed the update in 200 ms, not a worst-case TTL measurement. |

PDF tests extract text with Poppler, verify Unicode/font embedding, language order, identical totals, missing-translation markers, page bounds and footers. English/German short pages and mobile/desktop screenshots were visually inspected. Long samples have extraction/bounding-box coverage; not every page received manual visual inspection.

Artifacts:

- [Short Unicode draft, two pages](samples/bilingual-review/unicode.pdf)
- [Issued bilingual example](samples/bilingual-review/workflow/company-issued.pdf)
- [Long issued example](samples/bilingual-review/multilingual-issued.pdf)
- [Long draft example](samples/bilingual-review/multilingual-draft.pdf)
- [360 px picker](samples/bilingual-review/browser/picker-360.png)
- [Desktop invoice](samples/bilingual-review/browser/invoice-1440.png)
- [360 px customer](samples/bilingual-review/browser/customer-360.png)
- [360 px company](samples/bilingual-review/browser/company-360.png)
- [Layout assertions](samples/bilingual-review/browser/layout-results.json)
- [Save timing samples](samples/bilingual-review/browser/save-timings.json)
- [Verified font/logo build packaging](samples/bilingual-review/font-packaging.json)
- [Measurements and raw repetitions](samples/bilingual-review/performance.json)
- [Verification logs](samples/bilingual-review/logs/)

## Performance measurements and limits

Local production builds, Node 22.23.1, PostgreSQL 16 over loopback. Page measurements use one first request and seven sequential warm requests, timing through response body completion. A first request is not necessarily process/cache cold. Browser visual checks are separate from HTTP timings.

The controlled, interleaved A/B query comparison uses exactly the same 50 synthetic issued rows, ten repetitions per query, alternating order. Each archive is 67,680 bytes. Omitting archive bytes avoids **3,384,000 bytes** per list fetch. Median query latency: **50.03 ms → 8.68 ms**. This is a database-fetch measurement, not a claimed whole-page speedup.

Job HTML: **166,139 → 27,821 bytes** (83% smaller). Catalogue loading is deferred, not eliminated: opening the picker fetched 176,471 bytes for the 145-item multilingual catalogue; median local endpoint time 27.8 ms. Queries fetch at most 200 items per page, and the picker follows cursors before client-side searching. Large catalogues would warrant server-side indexed search, measured separately.

| Route/action | Initial warm median, ms | Later warm median, ms |
| --- | ---: | ---: |
| Dashboard | 17.82 | 28.59 |
| Customer profile | 22.58 | 36.82 |
| Company profile | 14.91 | 27.97 |
| Service jobs | 29.02 | 26.20 |
| Invoices | 15.97 | 26.65 |
| PDF | 111.35 | 154.78 |
| Public home | Not retained | 40.96 |
| Public services | Not retained | 35.21 |
| Public portfolio | Not retained | 30.78 |
| Public project | Not retained | 36.02 |

**These endpoint columns are not a controlled speedup comparison:** the machine/session restarted between them, and the new PDF contains two language sections. Regressions are reported rather than hidden. Initial public measurements were run, but their temporary logs did not survive the restart; no before/after public improvement is claimed. Immutable font/logo byte caching removes repeated resource I/O; it does not establish a PDF latency win. Seven persisted UI saves took 103.59–110.68 ms (median 107.34 ms), including browser protocol and 100 ms success polling overhead; these are not raw server timings and have no retained baseline. No production region latency, provider costs, high-concurrency load, Lighthouse, or real-device measurement was performed.

## Changed files and migrations

Application changes are concentrated in the shared picker/private catalogue endpoint, job and invoice managers/routes, PDF and issuance/snapshot helpers, invoice metadata queries, and control CSS. `packages/shared/src/index.ts` validates new fields; Prisma defines their storage. Tests and synthetic evidence are under `tests/` and this report's sample directory. Public application source, authentication, payment processing, and deployed settings were not changed.

1. `20260927150000_bilingual_invoice_snapshots`: nullable German/period fields, invoice-line price-mode/confirmation snapshots, and document version (existing rows default to 1). No historical document text or bytes are backfilled or rewritten.
2. `20260927151000_project_image_schema_guard`: repair scoped by the current `ProjectImage` table OID. The old migration checked only constraint name across schemas; the new migration supplies the missing FK only when this table lacks it. It is a no-op where the FK already exists. Orphan media rows would correctly fail this constraint addition and must be investigated, not deleted automatically.

## Rollout prerequisites and recovery

This is preparation only; deployment and production migrations remain unauthorized.

1. Review both new SQL migrations and the code. Take a verified backup and confirm the exact intended deployment database, schema, and migration history. Check for orphan project images. Rehearse on a disposable copy of representative deployment data; this task used synthetic data only.
2. Apply reviewed migrations **as an explicit release operation**: with the verified target securely injected, run `npm run db:deploy`. Do not put it in ordinary build/preview hooks. Do not run seed/reset/db-push in production.
3. Run `npm run release:prepare:control`: matching Prisma generation, read-only ledger/column/enum checks, then control build. It does **not** apply migrations. Preview databases need the same migrations before their builds. The final local build exercised this guard.
4. Release the matching control application only after the check succeeds; verify deployed font/logo tracing and a disposable authorized smoke-test workflow. Public deployment is not required for these control changes. Review translations on existing drafts and billing settings before issuing.
5. Check the health/schema guard and private invoice download behavior after release. Never regenerate an old issued PDF to resolve missing archived bytes.

The schema additions are compatible with the previous application's reads and existing issued bytes. A rollback can retain these additive columns. However, the old editor replaces draft lines without bilingual fields: **do not allow an old application instance to edit version-2 drafts during rollback or mixed-version rollout**. Disable draft writes or roll forward with a fix; restore from a verified backup only under a separately reviewed recovery plan. Keep applied migrations intact and do not roll them back destructively.

Remaining limits: existing profile relations and customer/company selection lists are not fully paginated; the synthetic dataset does not establish their large-account performance. Public cache invalidation remains the existing time-based policy, not immediate cross-application invalidation. Custom catalogue publication uses the separate existing editor. Browser emulation does not prove physical mobile keyboard behavior. Translation completeness is structural; humans must review linguistic/legal wording. Production compatibility and performance still require the target-specific release rehearsal above.
