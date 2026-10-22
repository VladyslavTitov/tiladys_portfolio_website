# TiLADYS - Codex master implementation prompt

Version 1.0 - 12 October 2026

Paste this entire document into Codex with the TiLADYS repository open in Visual Studio Code. The companion handoff folder contains the specification, registers and approved visual references. This is an instruction to implement and verify the redesign, not merely produce a plan.

## 1. Outcome and authorized scope

Implement the new TiLADYS public website and private Control dashboard in the existing project. Deliver working application code, responsive interfaces, safe additive migrations, meaningful tests and a reviewable handoff. Keep the existing business records and functional workflows. The new public presentation must make three business areas immediately clear:

1. Websites: paid creation/maintenance, actual completed projects and actual Framer templates.
2. 3D Printing: custom print enquiries, actual completed prints and actual downloadable models.
3. PC Support: local services in Mülheim an der Ruhr and agreed online support.

Build the complete public route set and the core dashboard workflows, including quotes, product management and tasks. Implement the existing CRM, invoices, payments, inbox, portfolio and catalogue through the new design. Optional reviews, reports/expenses, website-copy editing and account/data panels follow the specification's module rules: enabled modules require real persistence and authorization; unconfigured integrations remain explicitly unavailable. Account MFA, automatic reminders, bank synchronization, structured e-invoice export and storage/backup-provider provisioning require their own verified configuration. Do not turn a conditional mockup into a false promise.

Work autonomously through inspection, implementation, fixes and verification. Resolve routine component, layout and code-organization choices yourself. Continue independent work when a business fact or external credential is missing. Report that dependency and disable only the affected operation. Do not stop after an audit, homepage, component library or static dashboard.

This authorizes local code changes and migrations/tests against a verified isolated development database. It does not authorize production database writes, real invoice issuance, real payments, sending mail to customers, publication, remote Git pushes that trigger deployment, changing production secrets/domains, or deployment. Prepare any such release action as a concrete reviewable final step. Use synthetic development records and a mail sink. Do not request routine confirmations already resolved by this prompt.

## 2. Source hierarchy and reference handling

Read the local project instructions, this prompt, and the supplied reference files before editing. Use this order when requirements conflict:

1. Latest explicit owner requirements and this prompt's German-first invoice/live-footer overrides.
2. Verified current business data and existing records.
3. `reference/Analysis.md`, `reference/TiLADYS_Analysis_Specification.pdf`, canonical tokens and control/asset/acceptance registers.
4. Approved public and dashboard visual boards.
5. Sample wording and values embedded in generated mockups or historical marketing material.

The handoff folder is normally placed at `docs/tiladys-rebuild/` inside the repository; discover its actual location once. Do not hardcode the ChatGPT scratch paths or file IDs into application code. Locate missing references by filename in the supplied folder; report a genuinely missing source once, rather than repeatedly retrying a broken path. The prompt is usable without every image: implement its layout and preserve existing assets while marking unresolved visual substitutions.

Read these registers in full, processing them in manageable groups:

- `reference/Control-register.json`: 390 action/field/navigation contracts, including permissions, reads/writes, validation, pending/disabled states, success, failures and linked effects.
- `reference/Asset-register.json`: 51 visual families, distinguishing illustrative scenes, authentic evidence, original vectors and native CSS/data visuals.
- `reference/Acceptance-register.json`: 52 planned cases. They are test requirements, not previously passed results.
- `reference/Design-tokens.json`: canonical dashboard foundation; public typography/spacing and the footer exception are expanded in the analysis.
- `reference/Evidence-summary.json`: historical audit provenance; it does not prove the repository or deployment still has the same state today.
- `reference/Reference-index.json`: image filenames and mappings. Dashboard board IDs are different from canonical implementation page IDs; map by this file and page purpose.

The earlier dashboard kit says English before German and mentions an old Featured flag. Those statements are superseded. Use **German first, English second**, and inspect the current curated-project mechanism before adding any field. The live footer supersedes every generated footer. Generated portraits, clients, testimonials, template names, dates, statistics, prices, tax rates and addresses are placeholders. Never seed them into production or use them as factual public copy.

## 3. Establish the actual baseline before changes

Inspect Git status, current branch/commit, local changes, repository instructions, manifests, lockfile, runtime, both app entry points, shared packages, Prisma schema/migrations, authentication, business APIs, translations, public media, footer, SEO and tests. Preserve unrelated work. Use a separate branch/worktree where useful; do not reset, clean, overwrite or force-checkout a dirty workspace.

The 12 October analysis identified `VladyslavTitov/tiladys_portfolio_website`, with `apps/web`, `apps/control` and `packages/db`, Prisma/Neon and Vercel. Both deployed apps then referenced `feature/services-redesign`, commit `e82bff04aac9915585b10cc853fe31c558a5964b`; `main` at `9a38f91e9ee92745cc19e90f8beb22ef7f934914` was older and lacked substantial CRM/invoice work. Treat these as audit anchors. Inspect the current state and preserve newer valid changes; do not blindly switch or rebuild from the old `main` commit. If the local checkout lacks the deployed functionality, reconcile the correct source before editing financial code. If no repository is available, report that concrete blocker rather than inventing its backend.

The audit found existing Invoice, InvoiceLine, InvoicePayment, Customer, Company, ServiceJob and NumberSequence tables and completed invoice/bilingual migrations in the inspected database. Do not assume the September missing-Invoice-table error is still unresolved. Verify actual application-to-database binding and migration state through non-secret metadata. Never print connection strings or inspect private customer rows merely to establish the schema.

Verify runtime against the actual project and hosting configuration. The audit reported Node 24.x; older notes said Node 22. Preserve a compatible supported configuration and the existing package manager/lockfile. Do not upgrade Next.js, React, Prisma, auth or every dependency as part of a visual rewrite. Reuse existing validation, components and integrations where sound. Consult current official documentation for the exact installed versions before changing platform-sensitive APIs.

Produce `docs/tiladys-rebuild/implementation/Baseline.md` with observed architecture, deviations from the analysis, missing dependencies and exact available check commands. Run appropriate existing baseline checks and separate pre-existing failures from regressions. Create a phase plan and a persistent completion checklist; then start implementation without waiting for approval of ordinary development decisions.

## 4. Architecture and data boundaries

Keep the public and Control applications separate and reuse the shared database package. Add shared design primitives/types only when useful; do not pull private server modules into public/client bundles. Explicitly separate server-only data access, validated API schemas, business operations, public projections and interactive UI.

The public app can read approved published content and submit bounded enquiries/uploads. It cannot browse CRM, financial records, customer files or private notes. The authenticated Control app manages those records through server-side authorization on every operation. Cross-app navigation is a normal link; do not share privileged cookies with the public app just to simplify UI state.

Use typed entity projections and paginated queries. Do not fetch invoice PDF bytes in list queries or use unrestricted relation includes that accidentally expose private fields. Avoid parallel APIs that duplicate working business logic. Preserve existing endpoints and deep links where possible; any route change has an explicit compatibility redirect within the same permission boundary.

Single business, owner-managed access is the default. Do not build speculative multi-tenant SaaS, open administrator registration, a customer login portal, local marketplace checkout, automatic subscription charging or printer-control integration. Existing Neon managed-auth tables do not authorize replacing the working custom identity system.

## 5. Visual system and reusable interaction components

Reproduce the approved visual direction with real HTML/CSS/components, not a single screenshot or a stretched image of a page. Keep the actual TiLADYS wordmark/circuit SVG geometry and proportions. Use:

| Token | Value |
| --- | --- |
| Navy | `#071837` |
| Cyan | `#7BE0DF` |
| White / dashboard canvas | `#FFFFFF` / `#F4F7FA` |
| Text / muted / border | `#13243F` / `#5C6B82` / `#DBE4EE` |
| Success / warning / error text | `#11734C` / `#8B5100` / `#B42318` |
| Input / card radius | 8px / 12px |
| Dashboard sidebar / desktop padding / mobile padding | 224px / 24px / 16px |
| Spacing | 4, 8, 12, 16, 24, 32, 48; public sections may use 64px |

Use locally hosted Inter when compatible, with a system sans fallback. Public H1 approximately 48-64px desktop and 32-40px mobile; H2 32-40/26-30; body 16-18/16px. Dashboard H1 32, H2 24, body 16, labels 14, captions 12px. Main buttons use cyan with navy text; avoid unreadable cyan text on white. Controls have a proposed 44px minimum touch area, visible contrasting focus and text/icon state indicators. Accessibility target is WCAG 2.2 AA, verified through relevant automated and manual checks.

Public container max-width around 1200px; side padding 32/24/18px by layout. Section padding around 64-88px desktop, 40-48px mobile. Use white content sections, restrained navy heroes/CTAs, consistent grids and generous readable spacing. Avoid excessive glass effects, decorative dashboard photos, heavy shadows and arbitrary accent colours. Use the existing icon family and trusted social vectors consistently.

Build reusable header/footer, buttons, labelled fields, disclosures, service/project/product cards, galleries, tables/cards, status badges, search/filter controls, pagers, tabs, dialogs, drawers, toast/status feedback and upload controls. Read each applicable control contract. Navigation is a semantic link; mutation is a button. Avoid nested interactive targets. A list load failure is not an empty list; disabled actions show a reason. Pending success appears only after persistence.

Cover initial loading, empty, no-results, validation, recoverable failure, upload progress/cancel/retry, session expiry, stale-write conflict, unsaved changes and unavailable integration states. Preserve form input after failure. Restore focus when drawers/dialogs close. Search cancels stale reads and resets pagination. URL filter state preserves browser Back. Do not add a confirmation modal for routine navigation or draft typing; confirm issuance, publication, consequential archive/removal and privileged actions where warranted.

Map 400/422 validation, 401 session, 403 policy/origin, 404 missing, 409 conflict, 413 size, 415 type, 429 rate and dependency failures into factual user feedback. Keep request references non-sensitive. Never show stack traces or blindly retry an uncertain financial/email operation.

## 6. Keep the actual public footer

Reuse the actual live-footer implementation/assets, inspecting its current source and appearance. Retain the five columns: Brand, Contact, Links, Connect and Legal; original wordmark and circuit marks; circular social badges; divider and centered copyright. Update the service subtitle to Websites / 3D Printing / PC Support.

The audited desktop grid was `1.25fr 1fr .78fr .95fr .86fr`, gaps `clamp(26px, 3.4vw, 58px)`, top/bottom padding 58px/22px. Background: radial blue accent at 92%/38% plus a 110-degree navy gradient `#001025`, `#041D3E`, `#00162F`. Approximate wordmark 215x52px; brand paragraph max-width 250px at 14px/1.65; headings 17px; circuit marks 78x58 and 118x88. Keep current responsive progression: four columns near 1260px, two at the existing tablet breakpoint, one centered below about 620px. Preserve the actual source rules unless a tested overflow/accessibility fix is needed.

Use current verified business/social configuration. Audit values were `contact@tiladys.com`, `+49 163 7235608`, `Kronenstraße 19, 45479 Mülheim an der Ruhr`; Threads and Instagram `@tiladys.de`, Telegram `@tiladys_support`, WhatsApp `+491637235608`. Map link: `https://maps.app.goo.gl/ofUTFfRH1XZ8TV4Z6`. Preserve a valid newer owner-confirmed value over this snapshot. Do not revert to old flyer emails or invented accounts. Footer navigation retains Home/Services/Portfolio/About/Contact and real separate legal links. Decorative circuit marks have empty alt text.

## 7. Public sitemap and page construction

Preserve locale codes `en`, `de`, `uk`, `ru`, `sk`, `fr`. Website default remains the verified current default, historically English; German-first invoice order does not change website language. Ukrainian hreflang is `uk`, not `ua`.

| Page | Canonical route pattern | Required behaviour |
| --- | --- | --- |
| P01 Home | `/{locale}` | Three clear business areas and reviewed actual work |
| P02 Services | `/{locale}/services` | Three-area overview; retain additional relevant services |
| P03 Websites | `/{locale}/services/websites` | Services, actual website gallery, Framer previews |
| P04 3D Printing | `/{locale}/services/3d-printing` | Custom requests, actual prints, actual model listings |
| P05 PC Support | `/{locale}/services/pc-laptop` | Local/remote services; preserve existing route |
| Additional digital services | `/{locale}/services/business-it` | Retained Linux/server/design/digital work where relevant |
| P06 Portfolio | `/{locale}/portfolio` | Published projects; category/search/paging |
| P07 Project | `/{locale}/portfolio/{slug}` | Actual media/details; published status checks |
| P08 Catalogues | `/{locale}/products/framer`, `/{locale}/products/3d-models` | Separate real product types |
| P09 Product | `/{locale}/products/{slug}` | Actual previews, license, external demo/purchase links |
| P10 About | `/{locale}/about` | Real founder and compact portrait |
| P11 Contact | `/{locale}/contact` | Working original-text enquiry and protected photos |
| P12 Legal | `/{locale}/impressum`, `/{locale}/privacy`, `/{locale}/terms` | Preserve reviewed separate documents |
| Legacy prices | `/{locale}/prices` | Keep or redirect to an equivalent reviewed view |
| Missing/unavailable | Requested route | Correct status and useful navigation |

Public header: compact original logo, Websites, 3D Printing, PC Support, Portfolio, About, Contact, locale selector and Start a project. Logo opens localized Home. Use the mobile menu before the desktop navigation clips.

P01 sequence: navy text-left/image-right hero; three equally weighted service cards; selected actual work; Framer/model pathways; native quote-process steps; compact founder teaser; contact CTA; live footer. The first screen states the three areas plainly. Do not invent counters, response times, testimonials or trust badges.

P02 retains the existing service overview and older relevant services. Quote links preselect validated topic/service parameters in Contact, without creating private records. Existing price ranges/from/monthly labels remain honest public labels, never automatic agreed invoice prices.

P03 uses the website-specific hero, business/landing/maintenance cards, actual completed website gallery, actual Framer template previews, process, FAQs and enquiry CTA. Browse templates and View all projects have real destinations. Website gallery shows website projects, not every mixed-category item. Unknown template stock is an honest empty state.

P04 uses black/white practical PLA illustration, Print from your file / Discuss an idea / Small batches pathways, actual print gallery, actual downloadable-model previews, real materials/colour capabilities, process and dimensions helper. A file is optional for an idea enquiry. Never promise all materials, certified mechanical parts or industrial tolerances without actual capability. Physical printing follows a quote; model sales follow the configured external merchant. Model uploading stays unavailable until its separate safe pipeline is verified.

P05 shows setup/software, troubleshooting, cleaning, SSD/RAM upgrades, backup/data transfer and remote support. Local/remote selection preselects Contact; it does not automatically book or connect a remote session. Never request passwords/recovery keys in an ordinary public form. Use illustrative service images with technically plausible hardware and safe repair scenes.

P06/P07 preserve all still-published actual portfolio projects, IDs, category codes, media/translations and aliases. Add 3D category without discarding Design, Linux/server, Google Business, backup or other legacy work. Filters are shareable URL state. Detail includes actual title, gallery, overview, role/work/results, tools/date where factual, optional real website/GitHub links, related work and a public project reference in Contact. Do not expose internal client/job IDs. Draft/archived content and its images remain unavailable publicly. Alias renames redirect in one hop.

P08/P09 separate FRAMER_TEMPLATE and MODEL_3D from portfolio evidence. Show truthful availability, price/currency only when confirmed, description, included files/pages, license summary and trustworthy HTTPS preview/purchase links. Label external purchase. Do not invent local checkout, product-sales synchronization or dashboard revenue from a link. Unknown/unavailable products cannot display a working Buy button.

P10 uses the real founder photograph and factual biography/education. Portrait around 240x300px desktop, max-height about 320px; compact on phones. Do not ship a generated stranger, oversized full-screen portrait, guessed birth year, completed degree or unverified language fluency. Website translations and personal speaking ability are distinct.

P11 exposes the request form early, with smaller hero, form-first phone order and desktop contact/helper column. Topic, compatible request mode, name, email, optional phone, message, optional source photos and optional preferred reply language are labelled. Original Unicode/newlines/emoji in English, Ukrainian, Russian or German reach the inbox unchanged. Do not translate, rewrite or reject the body based on language. UI locale is independent of message/reply language. Quote preselection from query parameters is allowlisted and explained.

Preserve existing legal copy pending review; do not generate definitive tax/legal documents or revive obsolete links blindly. Legal pages have narrow readable text and live footer. Use proper 404/410 where justified, not soft-200 success pages. Zero matches, no data and server outage are separate states.

## 8. Private dashboard pages

All pages inherit real authentication, private data policies, responsive shell and complete states. Sidebar order: Overview, Inbox, Clients, Jobs, Quotes & Invoices, Portfolio, Products, Tasks, Settings. Catalogue is accessible through a clear settings/tool entry. Optional Reviews/Reports appear only under the module policy. Account/logout/public-site access remain available. Search/notifications show actual authorized records and real events, never decorative demo data.

| Canonical page | Route / purpose | Visual board mapping |
| --- | --- | --- |
| D01 Overview | `/dashboard` | D01 Overview |
| D02 Inbox | `/dashboard/messages` | D02 Inbox |
| D03 Clients/Companies | `/dashboard/customers`, company/profile routes | D03 Clients; D09 Forms |
| D04 Jobs | `/dashboard/service-jobs` and details | D06 Jobs; D09 Forms |
| D05 Quotes | `/dashboard/quotes` and details | D08 Quotes/Payments |
| D06 Invoice list/editor | `/dashboard/invoices` | D04 Invoices |
| D07 Invoice detail/payments | `/dashboard/invoices/{id}` or preserved equivalent | D08 Quotes/Payments |
| D08 Portfolio | `/dashboard/projects` | D05 Portfolio |
| D09 Products | `/dashboard/products` | D07 Products |
| D10 Tasks | `/dashboard/tasks` | D10 Tasks/Catalogue |
| D11 Catalogue/estimate | `/dashboard/prices` | D10 Tasks/Catalogue |
| D12 Settings/content | `/dashboard/settings/{section}` | D11 Settings/Account |
| D13 Auth/account | `/login`, account settings | D11 Settings/Account |
| D14 Data/activity | Private data/activity settings | D11 Settings/Account |
| D15 Reviews | Optional moderation route | D13 Reports/Reviews |
| D16 Reports/expenses | Optional operational reports route | D13 Reports/Reviews |

Board D12 supplies responsive/component examples for every page. Board identifiers above are filenames from the original design kit, not database names or canonical page IDs.

D01 uses queried new enquiries, active jobs, outstanding issued balance and due tasks; cards link to filtered lists. Show real job/enquiry/task follow-up, quick-create forms and honest empty states. Issued amount and money received are different metrics.

D02 has read/unread/archive/spam filters, bounded search and pagination. Detail displays original text, timestamp/topic/language and authorized attachments. Selecting/marking read must not imply replied. Support reviewed Create client / Link existing / Create job / Create quote, private notes and the existing real email-reply flow. Sending, SMTP acceptance, delivery failure and accepted-but-recording-failed are distinct. Do not switch silently to mailto or blindly resend. Enquiry persists even if acknowledgement mail fails.

D03 preserves Customer/Company records and numbering. Profiles show jobs, quotes, invoices, notes, private files and activity. Customer email is not globally unique: households/company contacts may share it. Duplicate suggestions require human selection; submission alone never auto-creates/merges a client. A lead may lack billing address; issuance cannot. Archive retains financial links. Company/customer relationships and billing recipient types are validated server-side.

D04 has list/board views, filters, forms, service-specific briefs, checklist/tasks, private files, agreed line snapshots, due dates and activity. Preserve existing job statuses PLANNED, IN_PROGRESS, WAITING_CUSTOMER, COMPLETED, CANCELLED; quote and print-production stages are separate. Website brief covers scope/pages/languages/platform/content responsibilities. PrintSpec covers dimensions/units, quantity, actual material/colour, model hash/version, feasibility, estimates and inspection. PC brief covers device/issue/mode/accessories/backup decision. Keep internal notes/costs separate from customer-facing content. Complete does not issue an invoice or publish work.

D05 implements real persisted quote drafts/lines/revisions/acceptance. State: Draft, Sent, Accepted, Declined, Expired. Freeze the sent revision; changed terms create a new revision. Acceptance records exact revision/date/source/evidence, never a forged signature. Expired/older revisions require renewal/review. Converting an accepted revision to a job or reviewed invoice draft is explicit and idempotent.

D06/D07 implement the invoice rules below. Separate document state DRAFT/ISSUED/CANCELLED from derived UNPAID/PARTIAL/PAID and overdue. Build searchable catalogue selection, reviewed bilingual editor, preview, issuance review, frozen detail/PDF, payment history and real partial-payment entry. Legal correction/cancellation remains unavailable until supported semantics are verified; then preserve/link original artifacts and history.

D08 preserves Project/ProjectImage/ProjectSlugAlias, translations, order and current SEO. Draft save, private preview, Publish and Archive are distinct. Cover/gallery rights and alt are reviewed; publication invalidates public projections/media/sitemap. A completed-job import creates a sanitized draft only. The audit found Project.featured had been removed: inspect current schema and add a reviewed curated selection only if needed, rather than resurrecting stale state.

D09 implements persisted product drafts, translated description, truthful price/availability, previews, licensing and external URLs; publish/archive is explicit. Real files and listings must match previews. No fake order/revenue integration.

D10 uses persisted linked tasks, Today/Upcoming/Completed, priorities, due date/time/zone and list/calendar. Completion is reversible and auditable. Handle ambiguous/nonexistent daylight-saving times deliberately. Do not claim a browser-only timer will send reliable reminders.

D11 preserves existing catalogue codes/translations/display prices. Add structured price modes/decimal rates incrementally. Search by code and localized name. FROM/PERCENTAGE/MONTHLY entries require reviewed agreed price/period before billing. The print estimator separates grams/kg material cost, machine time, labour, fixed/batch costs and allowance. Distinguish markup from margin; label input units and preview estimates. Example synthetic check: EUR15 cost with 20% markup gives EUR18; 20% margin gives EUR18.75. Do not automatically issue the estimate.

D12 edits validated owner-confirmed business defaults, bilingual billing settings, actual portrait/brand, languages and upload policy. Settings affect future drafts/snapshots, not issued documents. Versioned website-content editing has preview/publish separately and schema-validated safe content. Do not expose secrets in fields, API responses or integration status.

D13 preserves functioning credentials/session/recovery policy. Do not introduce public admin sign-up. Password/session operations require appropriate reauthentication/revocation. Show optional MFA/recovery only with a maintained working implementation; the existing static phrase is not MFA. D14 provides scoped authorized exports, safe CSV, activity and truthful recovery status. Never call backup successful without evidence of a real recoverable backup.

D15, when enabled, uses a separate Review model and pending moderation. Preserve original text; publishing requires actual permission/approved photos and safe public projection. An English reminder is friendly copy, not a language validation rule. Reviews do not replace contact enquiries. D16, when enabled, derives operational reports from persisted invoices/payments/expenses with date bases/currencies separated; private receipts and reversal history are retained. Do not label these certified tax reports or calculate invented profit.

## 9. German-first invoice preservation

Treat financial code as a preservation task with targeted extension. Inspect the current renderer, issuance validation, schema, stored snapshots, row locks, numbering, payments and download endpoints before changing them.

1. One bilingual PDF represents one invoice, one identifier and one payment request. Generate the complete **German section first**, then the complete English section starting on a fresh page. Short invoices use German page 1 and English page 2. Long German may span several pages; English starts only after German is complete. Do not force every language into one clipped page.
2. Both sections use the same frozen seller/recipient, service dates, quantities, prices, configured tax treatment, totals, banking/payment data and deadline. Preserve names/addresses/IDs/bank details exactly. Label English as the translation of the same invoice, with no additional payment due.
3. Translate headings, actual service names/descriptions/units, payment instructions and confirmed tax wording. Existing generic serviceName/description may already contain German; do not assume generic means English. Preserve compatibility but add/validate explicit language fields as necessary. Missing required translations block issuance with actionable field errors. Do not silently machine-translate legal/customer-facing text on issue.
4. Use a new non-conflicting document/layout version for new previews/issued documents. Existing issued PDF bytes, checksum, order, number and snapshots remain untouched. Downloads return the stored original. If bytes are missing, return a specific recovery state; do not rebuild from mutable current data. A locale query changes UI, not a historical invoice artifact.
5. Draft preview is not issuance and does not allocate a legal invoice number. Issuance locks/validates the draft, allocates through atomic scope/year sequence, freezes snapshot/PDF and records activity once. Preserve one-active-draft-per-job partial uniqueness. Retain locks protecting draft save versus issue. Add stale-revision conflict handling and idempotency without weakening current protections.
6. Compute and persist totals server-side using exact decimal arithmetic and consistent current HALF_UP rounding/precision. Transport decimal strings; do not use JavaScript floats for authoritative money. Preserve agreed price mode, service period and tax treatment. Numbers use the actual business-year policy, historically Europe/Berlin; no MAX+1 and no reuse of an issued identifier.
7. Record positive manual payments under a locked/rechecked invoice balance with idempotency. Existing code rejects overpayment; preserve that until a separately reviewed credit workflow exists. Handle concurrent conflicts and response-loss retries. A payment-state badge is derived, not a mutable document-state shortcut.
8. Issued records are immutable. Correction/cancellation/payment reversal uses reviewed linked append-only records/reasons and retains original PDFs/payment evidence. Do not hard-delete or alter historical totals to make a badge look correct.
9. Real tax status, identifiers, banking/payment details, terms and legal wording are owner-confirmed configuration. Keep UNCONFIRMED gating until confirmed. Never copy mockup 19%/0% or invent a tax exemption. Ordinary PDF is not automatically a structured electronic invoice. Research current primary legal guidance and applicable customer/business case before enabling structured issuance/receipt or definitive correction rules; do not claim legal completeness from this design.
10. Render A4 with embedded Unicode fonts, readable margins, wrapping, repeated continuation headings and bounded long-row pagination. Verify EUR, umlauts, Cyrillic names, long addresses and long German text visually. Never shrink totals to microtext or add decorative hero imagery to the invoice.

## 10. Public-to-private workflow, uploads and mail

Implement and verify this chain using explicit links and state transitions:

ContactMessage + accepted private attachments -> inbox -> reviewed client link/create -> quote/revision -> accepted quote -> linked job -> reviewed invoice draft -> issued snapshot/PDF -> payments/balance. Completed job -> reviewed sanitized portfolio draft -> explicit public publication. Product publication is separate from job completion. Optional review -> private pending queue -> moderated approved public projection.

Use scoped idempotency keys plus payload hash and stored result identity for contact submission, conversion, issuance/payment and send actions where applicable. Same key/same request returns the known result; changed payload is a conflict. Preserve exact original enquiry body and explicit source/reference. Matching email or opening a message is not permission to merge, publish, invoice or mark paid.

Photo requirement: source files up to **5MiB each and 15MiB combined**, with client/server/storage checks using the same byte constants and clear UI copy. The reference proposes max 10 photos as a configurable safeguard, not the old two-file/1MiB policy. Supported initial safe formats: JPEG/PNG/WebP. Handle HEIC through a tested bounded conversion path or explain support/rejection without freezing. Keep the source-byte limit distinct from decoder pixel/time/memory guards; re-encoding does not make an oversized source acceptable.

Vercel's documented function payload limit was verified as 4.5MB on 12 October 2026: `https://vercel.com/docs/functions/limitations`. Recheck it for the actual deployment before implementation. Do not try to carry a full 5MiB photo or 15MiB multipart payload through a normal app function and call it fixed by increasing a framework body limit.

Implement a configured private direct-upload/reservation/finalization pipeline:

1. Bounded metadata request after shared abuse limits; server creates purpose-bound expiring reservation with random keys and exact size/count limits.
2. Upload bytes directly to the configured private quarantine storage with narrowly scoped temporary permission; no arbitrary object-key selection/public listing.
3. Bounded processing verifies stored bytes, signature, dimensions/pixels and actual decode/re-encode; produces safe derivatives. Processing cannot read unbounded remote URLs or execute models.
4. Finalize verifies actor/form capability, purpose, expiry, actual accepted objects/hashes, aggregate source bytes and claim status. Consume once and atomically bind to the ContactMessage/review/job as applicable. Race/retry cannot claim somebody else's file or attach twice.
5. Progress, cancel/retry and late-finalization states are factual. Quarantine/pending/scanner failure is not approved. Clean up orphan reservations through real bounded scheduled work when configured. Keep original form input; submitting without failed photos requires the user's explicit choice.
6. Private previews/downloads authorize parent-file relationship on every request; no public bucket access and no public URL as a substitute for authorization. Use no-store and safe filename/content-type headers; short-lived download URLs must be scoped and protected.

If no approved storage/worker configuration exists, implement the adapter, local/test pipeline, schemas and UI states, document exact required settings, and keep oversized production upload disabled with an honest message. Do not silently reduce the requested limits or invent a connected storage provider.

Model files have a separate proposed private STL policy: 25MiB per file, 50MiB total, max 3, with bounded model validation and separately verified resource budget. Treat these defaults as provisional pending capability/storage review. No archives/G-code and no automatic printer execution. Don't send confidential designs to public scanning services.

Persist the enquiry before optional acknowledgement email; acknowledgement failure cannot undo the enquiry or prompt duplicate submission. Preserve the existing SMTP reply flow. Track outbox/attempt deduplication and accepted/failed/unknown outcomes; SMTP acceptance is not proof of inbox delivery. Only test with a configured mail sink or explicitly authorized test recipient, never real customers during development.

## 11. Database, migrations and recovery

Preserve existing AdminUser/Session/AuditLog, Customer/Company/notes/activity, ServiceJob/lines, PriceSection/PriceItem, BillingSettings, Invoice/lines/payments, NumberSequence, Project/images/aliases, FileAsset, ContactMessage/attachments/rate counters and relevant visitor data. Preserve exact IDs, slugs, translations, timestamps, private file references, invoice numbering and frozen bytes.

Use the analysis's additive entity proposals only where the actual schema has no equivalent: Quote/Revision/Line/Acceptance, Product/Alias, Task, PrintSpec, WebsiteBrief/PcBrief, EnquiryLink/Note, UploadReservation/MediaObject, PublicationSelection, IdempotencyRecord and EmailOutbox/DeliveryAttempt. Optional modules may add Review, Expense, WebsiteContent/Revision and supported correction/reversal entities. Document any simpler equivalent model and its invariants; do not create every named table mechanically when existing structures already solve it.

New mutable records have stable IDs, createdAt/updatedAt, stale-write revision and archival where appropriate. Immutable events/snapshots have recorded actor/source and occurred/created timestamps. Use explicit foreign keys and validated relation consistency. Accepted quote binds exact revision; model belongs to selected job; invoice job belongs to selected client; gallery asset belongs to its published entity. Financial dependencies use restrictive deletion/archival. Do not enforce globally unique client email. Do not create duplicate sequence counters.

Before executing migrations, prove the target is an isolated development environment and check connection identity privately. Generate/review additive migrations and test them there. Preserve actual partial indexes and constraints even when ORM schema representation is incomplete. Add nullable/version fields first, backfill deterministically in bounded restartable batches, then enforce safe constraints. Never infer consent/tax data, replace history or renumber records. Do not use production `migrate reset`, destructive schema pushes or down-migrations as a routine fix.

Use compatible pooled runtime/direct migration connections and least-privilege roles. Public runtime needs published reads and narrowly defined enquiry/upload writes; SELECT-only would break direct contact persistence. Control runtime gets required DML, not DDL/role management. Use server-only secrets, environment separation, TLS validation and provider-appropriate access restrictions. If RLS is introduced, test it under transaction pooling with transaction-local context; it complements application authorization.

Large files may move to private object storage with metadata/hash/derivatives in DB; existing BYTEA media/PDFs need not be rewritten wholesale. Never use ephemeral deployment disk as durable storage. Public exposure requires explicit reviewed derivative/selection and rights metadata, not a change to a private file's caption. Verify DB/object recovery consistency and retention before deleting legacy bytes.

Prepare recovery/rollback instructions with real backup requirements and an isolated restore test. A six-hour provider-history window is not an independent backup policy. Do not configure or claim production backups without actual evidence. Roll back the app/feature selection while preserving new valid writes; wholesale database restore is a separately reviewed cutover. Production migration remains a release action requiring the concrete plan, tests and recovery evidence.

## 12. Security implementation and negative tests

Preserve the working custom Argon2/opaque-session flow. Store token hashes, use HttpOnly/Secure production/appropriate SameSite host-only cookies, real expiry/revocation and exact trusted origins. Improve instance-local login limiting to distributed bounded counters and account/IP-aware controls. Do not weaken deployment protection, bypass policy or session checks for preview screenshots.

Every private read/write/download/export checks current user and entity relationship server-side. Deny by default; hiding navigation is not authorization. GET does not mutate financial/publication state. Protect cookie-auth mutations against CSRF with exact origin policy and additional token where the architecture requires it. CORS is not authentication; don't use wildcard credential origins.

Escape stored message/note/name/filename content and safe-serialize JSON-LD. Rich text is sanitized through an explicit allowlist only if actually needed. Use parameterized Prisma/tagged SQL and allowlisted filters/fields; prevent overposting. Design CSP, frame protection, nosniff, referrer/permissions policy and HTTPS/HSTS for actual resources, without unsafe-eval or blanket policy relaxation to make errors disappear.

Uploads use random keys, type-signature/decoder checks, quarantine, bounded work and verified finalization. Trusted original brand SVG is distinct from untrusted uploaded SVG; do not serve arbitrary executable active content. Remote fetch, if genuinely needed, has narrow HTTPS allowlist, resolved private/link-local address rejection, bounded redirects/bytes/time and SSRF tests. Private customer files never become public due to predictable IDs or guessed resize endpoints.

Sensitive DTOs/files/PDFs use no-store; status-controlled public media checks publication and has a verified withdrawal/cache-purge policy. Redact credentials, message bodies and sensitive identifiers from logs. Critical business mutations produce audit events without leaking content. CSV exports neutralize formulas; archives have safe paths and bounded private expiring access.

Collect only necessary enquiry/business data. Publication permission is separate from private processing and marketing. Optional analytics/maps do not silently introduce third-party tracking; prefer a deliberate map link. Retention is per record category, including applicable financial preservation; no generic Delete-all button purges legal records. Processor/transfer, actual tax/retention and e-invoice obligations remain verified launch decisions, not generated legal claims.

Scan source changes, browser bundles and exported artifacts for unintended secrets/PII. Test unauthorized access, forged origins, altered file IDs/parent associations, malicious text/filenames, upload resource abuse, publication withdrawal, duplicate actions and stale/concurrent financial operations. Do not run offensive tests against unrelated hosts or production customer data.

## 13. Responsive behaviour, SEO, media and performance

Test 320, 360, 390, 768, 1024, 1280 and 1440px, landscape, long German labels, 200% zoom, keyboard and reduced motion. Mobile menu content starts immediately below the logo/menu bar, not the bottom of the screen. It scrolls safely, closes on Escape/navigation and restores focus. Text never sits behind images; no global min-width workaround or hidden overflowing content.

Dashboard phone screens use list-to-detail Back navigation, stacked cards/labelled data and full-screen drawers when needed. Sticky actions respect safe areas and on-screen keyboard. Tablet sidebar may collapse with accessible labels/tooltips; desktop detail panels have bounded width and cannot obscure lists. Drag-and-drop has keyboard/status-menu equivalent. Keep the actual footer's responsive rules.

Preserve and extend self-canonicals, correct HTML lang, reciprocal hreflang for actual available translations, x-default, Open Graph/social metadata and one-hop slug aliases. Locale switching preserves the equivalent page where available. Never index six copies of English fallback as translated content. Sitemap contains canonical 200 public published pages/products/projects with truthful lastmod; excludes aliases, filters, drafts, private previews, Control, APIs and files. Keep correct redirects for old service/price/project URLs.

Give each service a distinct factual H1/title/description and appropriate local context. Use accurate Organization/LocalBusiness, Service and BreadcrumbList; Product/Offer only for real products/prices/merchant relationships. No invented AggregateRating or SEO star guarantees. Private auth/no-store are primary protection; noindex is supplemental and robots is not security. Do not make private files public to satisfy a crawler.

Follow all applicable asset briefs. Reuse the exact original logo, safe current media, real founder photo, actual projects/prints and actual owned/licensed product renders. Approved UI-board imagery is illustrative. Do not crop out a board's pseudo-client screenshot and call it a completed project, generate a founder replacement or recreate a downloadable mesh from a pretty picture. Mark missing factual assets honestly and preserve existing approved ones.

Keep backgrounds native CSS, functional icons trusted SVG, copy HTML and precise dimensions/charts native verified data/SVG. Do not bake interface labels/logo/measurements into AI photos. Prepare an asset implementation map with source, container, rights, crop/alt and derivatives. If an approved illustrative asset is missing and no image tool is available, use a deliberate branded placeholder/native composition and record it; no claim of generation. Do not generate an entire new collection as an unrelated task.

Use responsive AVIF/WebP/JPEG as appropriate, reserved dimensions/srcset/sizes, high priority only for real LCP image and lazy below-fold assets. Do not ship full 4K masters on every page. Target the report's budgets, adapting only with measured evidence: initial above-fold compressed transfer about <=1MB; feasible hero about 150-250KB; cards about 40-100KB. Target field 75th-percentile LCP <=2.5s, INP <=200ms, CLS <=0.1; report laboratory results separately from unavailable field evidence. Avoid unnecessary client bundles, unbounded list queries, repeated full-image decode and indiscriminate font/image preloading.

## 14. Execution phases and checkpoints

Maintain `implementation/Progress.md` and continue until all independent authorized work is finished. Record phase completion against routes, controls, assets and acceptance cases; context loss is not a reason to restart or forget constraints.

| Phase | Implement | Required checkpoint |
| --- | --- | --- |
| 0 Baseline | Inspect actual source/config/schema; isolate test data; map deviations | Written baseline, available checks, safe environment proof |
| 1 Foundations | Tokens/components/shells/live footer/menu/real brand | Responsive component checks; current auth still works |
| 2 Data boundaries | Additive schemas, direct-upload adapter/pipeline, original-text inbox, safe mail outcomes | Isolated migration, file/parent/access/idempotency tests |
| 3 Public site | Full routes, three areas, portfolio/products/About/Contact/legal/SEO | Native page layouts, published-only reads, redirects/locale checks |
| 4 Operations | Clients/companies, jobs/briefs/tasks, catalogue/estimate, sanitized draft creation | Real CRUD and relation/state verification |
| 5 Billing | Quote revisions/conversion, German-first preview/issuance, payments/corrections gating | Decimal/concurrency/immutability/PDF checks |
| 6 Full kit | Product publishing, configured optional review/report/content/account/data screens | No fake buttons, data or provider status; honest unavailable states |
| 7 Verification | End-to-end, accessibility/performance/security, builds, migration/restore/release plan | Passing applicable checks and specific external launch blockers |

Phase order may adapt to actual dependencies, but financial/private boundaries cannot be deferred until after public exposure. A genuine external blocker affects its module, not the entire redesign. Work on independent modules while keeping the dependent operation explicitly blocked. Do not mark conditional integrations passed because the button opens a modal.

## 15. Verification and definition of done

Use the existing test tools where practical. Add meaningful domain/integration/browser tests for changed high-risk behaviour, rather than test files that only mirror JSX or static labels. Use actual application APIs/database in isolated integration tests for permissions, transactions and relationship constraints. UI mocks alone do not prove financial correctness or persistence. Browser screenshots use synthetic data and exclude real customer/payment information.

Run appropriate tests, type checking, linting and production builds for both apps and changed shared packages. Address failures introduced by the work. Document unrelated baseline failures honestly. Review current dependency advisories for changed sensitive libraries without opportunistic bulk upgrades. If a check cannot run, state command, reason and affected conclusion; never report it as passed.

Apply all 52 acceptance cases where the associated module is enabled, recording case ID, method, actual result and evidence. At minimum verify:

- English/Ukrainian/Russian/German original-text enquiry, accepted photos, receipt, private inbox and exact attachment-parent checks.
- 5MiB/15MiB boundaries, invalid type/signature/pixels, HEIC handling, weak-network retry, reservation reuse/races/expiry and cross-purpose theft.
- Client duplicate review, shared email, linked job/quote, immutable accepted revision and conversion replay.
- Short German-page-1/English-page-2 PDF; long German continuations before English; Unicode and long row/address pagination.
- Unknown tax/missing translations block issue; one invoice/number/PDF under concurrent issuance/retry; stale save cannot alter an issued document.
- Decimal rounding, concurrent partial payments, response-loss idempotency, no overpayment and unchanged original PDF after client/catalogue/settings edits.
- Synthetic legacy issued artifact bytes/checksum remain identical across renderer rollout; missing original PDF never regenerates from current mutable data.
- Draft/private media denial, reviewed publication, unpublish withdrawal, public projection sanitization and one-hop aliases.
- Exact-origin/auth/session/access negative tests, CSV safety, secret leakage checks, no-store behaviour and distributed rate limits.
- Every enabled route/control has real behaviour or an explained unavailable prerequisite; failure, no-data and loading states remain distinct.
- Mobile menu alignment, visible text, footer at desktop/tablet/phone/zoom, keyboard/focus/drawers and realistic media performance.
- Isolated migration from the appropriate old schema, constraint preservation, data integrity and recoverable database/object restore when backup configuration exists.

Record laboratory performance/automated accessibility separately from manual checks and field data. A placeholder screenshot, mocked network or skipped test cannot prove the associated business flow. Core confidentiality, financial/data integrity and core-flow acceptance failures are release blockers. Unknown legal/business/provider settings are launch blockers for the affected action even when the implementation compiles.

## 16. Required final handoff

Deliver the code and concise review summary with:

1. What changed and how the three-area public website and dashboard workflows now behave.
2. Route/control coverage matrix keyed to the canonical page IDs and all relevant control IDs: implemented, verified, conditional/unconfigured, or blocked, with reasons. No silent omissions.
3. Asset map: real evidence versus illustration, container bindings, rights/alt/crops and missing genuine assets.
4. Database migration/backfill instructions, preserved invariants, non-secret environment-variable names, isolated test setup, retention/recovery/rollback and production release steps.
5. Actual checks and results, acceptance-case coverage, visual QA screenshots using synthetic records, and limitations. Demonstrate German-first pagination and unchanged historical PDF artifacts.
6. Exact local install/dev/build/test commands derived from this repository; list configuration needed for external storage/mail/integrations without exposing values.
7. A concrete preview/release review package and specific remaining owner decisions. Do not deploy or send customer mail from this task.

Use documentation under `docs/tiladys-rebuild/implementation/` for baseline, coverage, verification, migration/recovery and launch decisions. Keep source references outside shipped public assets and avoid bundling the large design boards into application JavaScript.

The result is complete when the authorized public redesign and core dashboard—including new quotes/products/tasks—are implemented, existing records/workflows are preserved, all applicable required checks pass, and external/conditional launch dependencies are explicit. Start now: inspect, reconcile, implement, verify, fix and deliver. Do not end with only another plan.
