# TiLADYS public website and Control dashboard

## Verified analysis and proposed implementation specification

Version 2.0 - 12 October 2026 - analysis phase only

This is a specification for review, not the Codex master prompt. No application source, database records, settings, credentials or deployments were changed. No new image assets were generated. Read-only repository, hosting and database inspection was performed. This document distinguishes observed facts from proposed behaviour; the included machine-readable registers expand the individual controls, media and acceptance cases.

## 1. Findings that change the development plan

1. The deployed source is the `feature/services-redesign` branch of `VladyslavTitov/tiladys_portfolio_website`, commit `e82bff04aac9915585b10cc853fe31c558a5964b`. Hosting metadata for both public and control production deployments identifies this commit. `main`, at `9a38f91e9ee92745cc19e90f8beb22ef7f934914`, is substantially older and lacks the CRM/invoice schema. Do not rebuild from main without reconciling the feature branch. [E01, E02]
2. The inspected active default branch of the connected `tiladys-database` project contains Invoice, InvoiceLine, InvoicePayment, Customer, Company, ServiceJob, FileAsset and NumberSequence. The migration history includes completed invoice, recipient and bilingual snapshot migrations. The one-active-draft-per-job unique index exists. The old missing-Invoice-table report is not current for this inspected database. Actual application connection-string identity was not read, so deployment-to-database binding still needs a non-secret environment review. [E03]
3. The PDF renderer explicitly iterates `['en', 'de']`. This conflicts with the latest requirement: **German first, English second**. The code already uses saved bilingual fields, embedded Unicode fonts, page breaking, decimal totals, issuance validation, frozen seller/recipient data and stored issued PDF bytes/checksum. Preserve these foundations. [E04]
4. Contact-photo limits in this deployed source are two files, 1 MiB each and 2 MiB aggregate, with a 4096 dimension and 12 million pixel guard. They conflict with 5 MB each and 15 MB total. Accepting a full 5 MB photo via a Vercel function is incompatible with the documented 4.5 MB function request limit. Direct storage upload with a restricted reservation/finalization protocol is the recommended extension. Merely changing a Next.js body limit does not solve it. [E05, S01]
5. Contact messages and photo attachments are stored together, private; public portfolio reads use an explicit published-only projection. The newer media route rechecks publication on every request, including resizing. Retain these protections. [E06]
6. CRM, service catalogue, customer notes, job line items, invoices and payments exist. Quote, Product, Task, Review, Expense and WebsiteContent tables are absent in the inspected public schema. Their interfaces are proposals, not existing features. No bank reconciliation, external-store sales synchronization, automatic print dispatch or customer portal is verified. [E03]
7. Both hosting projects report Node 24.x and ready production deployments. Metadata reports the execution region `iad1`; the database project is in Frankfurt. The database's reported history window is six hours. Neither region choice nor snapshot history proves a compliant processing arrangement or a complete backup plan. Review processors/transfers and introduce an independently tested recovery policy. [E02, E03]
8. Custom application sessions use random opaque tokens hashed in the database, HttpOnly/SameSite=Strict cookies and production Secure. Credentials are Argon2-based; the static secret phrase is an additional credential, not an independent time-based or possession-based MFA factor. Exact admin-origin validation rejects missing/untrusted origins. The login limiter is an instance-local Map; the newer public contact limiter uses a database counter. Strengthen distributed login abuse protection without replacing functioning authentication. [E07]
9. The live footer is the approved footer. It differs from the mockups: five columns, original wordmark and circuit marks, navy gradient, contact block, social links, legal links and centered copyright. The generated one-row footer is superseded. [E08]
10. The existing SEO layer already has six locale paths, canonicals, hreflang, Open Graph, published-project sitemap entries and slug aliases. Extend it; do not discard it. Existing `uk` is the Ukrainian language code. Never substitute `ua` as hreflang. [E09, S02]

### Evidence categories and limits

**Verified source:** exact files at the pinned deployed commit; source inspection is not an execution test. **Verified metadata:** read-only hosting properties, database table/column/index definitions and migration completion records. **Observed live:** public homepage, About/Contact content, footer appearance and public navigation. **Approved concept:** nine public mockup boards, thirteen dashboard boards, the 17-page dashboard kit and tokens. **Proposed:** all behaviour below not explicitly verified above.

No credentials, private customer rows, invoice content or bank details were exported. No application tests, login, mail delivery or production write flow was exercised. Hosted deployment protection can coexist with application login; it must not be disabled for redesign work. Legal guidance endpoints at BMF and Gesetze-im-Internet repeatedly returned errors during verification; exact business-specific tax exceptions and retention periods remain a launch gate. The official federal e-invoicing service confirms the distinction between structured electronic invoices and ordinary image/PDF documents. [S03]

## 2. Decisions, precedence and scope

Latest explicit user requirements override old generated copy and earlier kit instructions. German-first PDF and the live footer override the old English-first PDF note and every generated footer. Existing factual records override sample names, prices and testimonials. Written requirements and canonical tokens override inconsistent generated labels.

**Core release:** three-area public navigation/content, preserved portfolio, contact inbox, CRM, jobs, invoice improvements, authenticated Control shell, private uploads, catalogue and publication workflows. **Subsequent core additions:** quotes, product listings/external links and task management. **Optional modules:** receipts/expenses, operational reports, review moderation if real review submissions are introduced, configurable website-copy editing, MFA, automated reminders and monitored backup UI. A disabled optional module must say unavailable/not configured; its button cannot pretend to work.

Single business, owner-managed dashboard is the default. No customer login, public invoice portal, multi-tenant SaaS, marketplace checkout, subscription auto-charge or printer-control connection is authorized by the design. Prepare record boundaries for future roles without building speculative infrastructure.

### Items needing confirmation before launch, not before this specification

- Actual business tax treatment, identifiers, approved tax wording, bank/payment details, payment terms and whether structured invoice issuance/receipt is required for each customer type.
- Object-storage provider, budget, regional requirements and permitted model-file formats; proposed first release accepts STL files privately, not G-code/archives.
- Actual available Framer templates, downloadable models, licensing/merchant links and real portfolio/print photos. An empty catalogue is preferable to fake stock.
- Region/processor agreements and retention policy; application-to-Neon binding; recovery credentials/operator and backup retention.

## 3. Information architecture and routes

Use `{locale}` = en, de, uk, ru, sk or fr. Preserve currently deployed paths and aliases. Default/x-default remains en unless a separate business decision changes it; the German invoice order is independent of the website default language.

| Public page | Proposed canonical route | Data and indexing |
| --- | --- | --- |
| Home | /{locale} | Published curated content; index |
| Service overview | /{locale}/services | Preserve old route; three primary areas; index |
| Websites | /{locale}/services/websites | Services + website projects + Framer entries; index |
| 3D Printing | /{locale}/services/3d-printing | Services + actual prints + model entries; index |
| PC Support | /{locale}/services/pc-laptop | Preserve existing path; local/remote services; index |
| Other digital services | /{locale}/services/business-it | Preserve relevant old services; index |
| Portfolio | /{locale}/portfolio | Published projects; index; filters are query state |
| Project detail | /{locale}/portfolio/{slug} | Published only; old aliases redirect directly |
| Framer catalogue | /{locale}/products/framer | Real published templates; index when substantive |
| Model catalogue | /{locale}/products/3d-models | Real published models; index when substantive |
| Product detail | /{locale}/products/{slug} | Real published listing; external purchase default |
| About / Contact | /{locale}/about, /{locale}/contact | Verified public business information; index |
| Legal | /{locale}/impressum, /privacy, /terms | Preserve separate real pages; reviewed copy |
| Legacy prices | /{locale}/prices | Keep or redirect only to an equivalent approved price/service view |
| Missing/unavailable | original requested URL | Proper 404/410 as appropriate; not soft-200 |

Primary desktop navigation: Websites, 3D Printing, PC Support, Portfolio, About, Contact, language selector and Start a project. Logo returns to localized Home. Footer retains Home/Services/Portfolio/About/Contact navigation, making the service overview reachable. No indexable route is created for every temporary filter combination.

| Dashboard label | Preserved/proposed route | Status |
| --- | --- | --- |
| Overview | /dashboard | Existing; extend |
| Inbox | /dashboard/messages | Existing; extend |
| Clients | /dashboard/customers, /dashboard/customers/{id} | Existing; UI rename only |
| Companies | /dashboard/companies, /dashboard/companies/{id} | Preserve actual existing routes if different |
| Jobs | /dashboard/service-jobs, /dashboard/service-jobs/{id} | Existing; extend |
| Quotes | /dashboard/quotes, /dashboard/quotes/{id} | Proposed |
| Invoices | /dashboard/invoices, /dashboard/invoices/{id} | Existing API/editor; detail route proposal |
| Portfolio | /dashboard/projects | Existing; UI rename only |
| Products | /dashboard/products, /dashboard/products/{id} | Proposed |
| Tasks | /dashboard/tasks | Proposed list/calendar |
| Catalogue | /dashboard/prices | Existing; extend structured pricing |
| Settings | /dashboard/settings/{section} | Proposed grouping of existing billing settings and future settings |
| Account/Data/Activity | /dashboard/settings/account, /data, /activity | Proposed UI over appropriate existing records |
| Reviews/Reports | /dashboard/reviews, /dashboard/reports | Optional |
| Sign-in | /login | Preserve current credentials flow |

Private routes, PDFs, files and API payloads are never in public sitemaps. Existing deep links are retained or redirected within the same permission boundary. UI label changes do not require renaming Customer to Client in the database.

## 4. Canonical visual system

### Shared brand and geometry

Navy #071837; cyan #7BE0DF; white #FFFFFF; canvas #F4F7FA; primary text #13243F; secondary text #5C6B82; border #DBE4EE. Success #11734C, warning #8B5100 and error #B42318 are text/icon tones with light tinted backgrounds; states always include words. Proposed font Inter, locally hosted with a system sans fallback. Real vector wordmark/circuit logo remain unchanged.

Spacing scale: 4/8/12/16/24/32/48/64 px. Controls radius 8 px, cards 12 px. Borders 1 px. Standard cards do not need a heavy shadow; menus/drawers may use a restrained navy translucent shadow. Main buttons are cyan with navy text, minimum 44 px height, 16-24 px horizontal padding. Normal controls are 44-48 px high. Focus ring: 2 px dark/cyan high-contrast outline with 2 px offset appropriate to surrounding colour. Essential cyan text on white is avoided because it lacks sufficient contrast.

Public content container proposed max-width 1200 px, desktop side padding 32 px, tablet 24 px, mobile 18 px. Section padding 64-88 px desktop, 40-48 px mobile. Public H1 48-64 px desktop and 32-40 px mobile with 1.05-1.15 line-height; H2 32-40/26-30; body 16-18/16; paragraphs limited to readable line length. Dashboard H1 32, H2 24, body 16, labels 14, captions 12 px. Original dashboard tokens apply to admin typography, not the oversized public hero.

Proposed responsive thresholds: below 768 single-column, 768-1099 adaptive two-column, 1100+ desktop header/sidebar where actual content fits. Do not force a six-link desktop nav at a width that clips it; use the existing menu earlier if needed. Test 320, 360, 390, 768, 1024, 1280 and 1440 px, 200% zoom and long German labels. Existing footer media rules are retained instead of imposing these generic rules on it.

### Shared public components

- Header: compact original wordmark, stable top bar; no giant logo. Sticky positioning may follow the existing implementation; reserve its height. Desktop links show the active route. Mobile menu begins immediately below the logo/menu bar, contains a top-aligned list, language choices and contact CTA, scrolls independently, closes on Escape/navigation, restores focus and avoids scroll bleed.
- Hero: navy backdrop, text left and a purpose-specific visual right. Text is HTML, never baked into image. Main visual contains its focal subject in the right half; crop/stack into a 4:3 image below text on narrow screens. No repeated stock laptop on every page. Details/legal pages use shorter heroes; action-heavy Contact starts its form near the fold.
- Service card: illustration or native icon, H3, concise description, one explicit action. A card may have a single stretched link; do not nest clickable buttons/links inside a second button. Three service cards remain equally weighted on Home.
- Portfolio card: authentic screenshot/photo, category, title, short summary, View project. Image ratio 16:10; no private customer name unless publication is authorized. Drafts never enter the public list.
- Product card: preview, product type, price/availability only when factual, View product/Preview/View on Framer. Digital file badge distinguishes model downloads from printed physical objects. External checkout is labelled.
- Gallery: selected image, thumbnail controls with accessible labels, keyboard arrows, zoom/fullscreen Close; image alt describes actual subject. Lazy-load non-leading images. Missing images use a neutral branded placeholder, not a fabricated completed project.
- FAQ: semantic disclosure controls; aria-expanded, keyboard support, readable answers. Every View all questions link has a real FAQ section/route; remove it when no destination exists.
- Final CTA: navy container, real text and two buttons only if distinct. Contact Me opens Contact; Open contact form opens its form anchor. Both may be retained in the live footer-area CTA as approved.

### Preserve the live footer exactly in character

Live desktop footer comprises Brand, Contact, Links, Connect and Legal columns. Source CSS uses a 1.25fr/1fr/0.78fr/0.95fr/0.86fr grid, clamp(26px,3.4vw,58px) gaps, 58px top and 22px bottom padding. Its backdrop combines a radial blue accent at 92%/38% with a 110-degree gradient #001025 to #041D3E to #00162F. This is the permitted footer exception to the otherwise restrained flat navy style.

Wordmark display is approximately 215x52 px; brand description max-width 250 px, 14 px with 1.65 line-height; column headings 17 px. Retain subdued circuit marks at approximately 78x58 and 118x88, the contact icons, circular social badges, top/bottom divider and centered copyright. Source responsive rules move to four columns near 1260, two at the existing tablet rule and one centered column below 620; mobile footer padding is 46px 22px 22px with 34px gaps. Preserve this progression, fixing overflow/focus only. Do not reproduce the generated one-row footer.

Verified public contact: contact@tiladys.com, +49 163 7235608, Kronenstraße 19, 45479 Mülheim an der Ruhr. Social destinations: Threads @tiladys.de, WhatsApp +491637235608, Telegram @tiladys_support, Instagram @tiladys.de. Use the deployed business/social source instead of older main-branch email/accounts. Change the brand service subtitle to Websites / 3D Printing / PC Support without changing layout. Legal links remain separate. Circuit marks are decorative with empty alt; linked wordmark alt is TiLADYS. [E08]

### Dashboard shell

Desktop sidebar 224 px, navy, compact wordmark and CONTROL label, same order on every page: Overview, Inbox, Clients, Jobs, Quotes & Invoices, Portfolio, Products, Tasks, Settings. Optional Reviews/Reports below More. Highlight current section with cyan/navy high-contrast state. Bottom: View public website, owner initials/avatar and account menu/logout. Real portrait is optional; never use the generated stranger's face.

Header 64-72 px, white, global search with query bounded to accessible records, notifications and interface-language selector. Content padding 24 px desktop and 16 px mobile; canvas #F4F7FA. Cards white, 12 px corners and subtle border. Tables include compact labelled headings, paging and explicit row actions. A 420-560 px adjacent detail panel is useful at large width; below approximately 1100 it becomes a dedicated page/full-screen drawer. No content is hidden by the panel.

Phone layout: top logo/menu bar, list-to-detail Back navigation, stacked cards instead of compressed financial tables, sticky action area with safe-area padding and keyboard clearance. Tablet sidebar may collapse to icons with visible tooltips/labels on focus. Kanban drag is optional and always has an accessible Move to status alternative. Do not use a crowded bottom nav in addition to an equally crowded global sidebar menu; choose one primary navigation treatment.

## 5. Public page-by-page specification

### P01 Home

Order: Header; navy two-column hero; three equal service cards; selected real work; two product pathways; quote process; compact founder teaser; existing footer-area contact CTA; live footer. Hero headline states Websites, 3D prints and PC support, location and online/local availability. Main action opens Contact; secondary View services opens the retained service overview. Visual G01 combines a monitor/site preview, restrained PC chassis and black/white practical prints; it is illustrative, not evidence of client work.

Service cards link to existing website/PC routes and new 3D route. Selected work pulls a bounded published-only collection, category-balanced when available; never invent work to fill three columns. Products link to Framer/model catalogues; hide empty product rows or show an honest availability message. Founder teaser uses real compact portrait R01; More about me opens About. Process is native text/icons. No invented counts, trust badges or response-time claims.

### P02 Services overview

Short navy heading, three primary category cards, retained additional digital services and factual catalogue teaser. Customer chooses a topic before navigating; a service-specific Request quote link opens Contact with validated query-state preselection. Preserve /services and legacy /prices intent. Price ranges/from/monthly values must remain clearly labelled and must not be converted directly into agreed invoice amounts.

### P03 Websites

Hero with G02 purpose-specific website/device composition; request link selects Websites; Browse Framer templates moves to the template subsection/catalogue. Three service cards Business websites, Landing pages, Updates & maintenance open descriptive detail anchors or preselected enquiry; each link has a distinct defined destination. Gallery uses real portfolio R02-R08. Templates use actual template captures R09, not invented GreenSpace/Fork/Nova products. Four native process steps and focused FAQ follow. View all projects opens /portfolio?category=web-development. Request a website opens Contact. Website gallery empty state offers Contact without claiming experience it cannot show.

### P04 3D Printing

Hero G03: visibly layered matte black/white PLA organisers and stand, simple proposition and quote CTA. Three service options: Print from your file, Discuss an idea, Small custom batches. All select 3D enquiry with the relevant request mode. Do not promise industrial precision, all materials or every possible mechanical application. Gallery uses genuine completed print photos R10; model cards use actual owned model previews R11. No generated imagery is labelled completed work.

Material row shows G19 and actual current PLA/colour capabilities; new materials remain enquiry-only until confirmed. Process: send idea/file, confirm feasibility/quote, print and handover. Dimensional/quantity helper is text plus an illustrative sketch/caliper photo G20, without inaccurate raster measurements. User can request with no file. Paid digital files go to configured external merchant; physical printing uses the quote flow. Public model uploads remain disabled until the separate file pipeline is verified.

### P05 PC Support

Hero G04 and local/remote mode labels. Describe your issue selects PC topic; Explore services scrolls to service list. Six service tiles: setup/software, troubleshooting, cleaning, SSD/RAM upgrades, backup/data transfer, remote support. Each preselects its service code. Local/remote options open Contact with mode; they do not book an appointment automatically. Device details in enquiry are optional; never ask for account passwords or recovery keys. Remote-help instructions explain that a human agrees a session; no automatic desktop connection. Images G24-G29 are illustrative. FAQ and final CTA use actual availability.

### P06 Portfolio and P07 project detail

Portfolio has short hero G05, category controls, optional search, paged real project grid and product-strip links. Category URLs preserve browser Back and can be shared. Keep older Design/Linux/Digital categories under More or All; existing records retain their codes. Add `3d-printing` without migrating all old items into an unrelated bucket. Mongoose, DonetsFit, DonetsFit Calculator, the dual-boot workstation, ETIT/VPU tour, business card and JobAdys remain whenever still published in the live dataset.

Project detail: localized breadcrumb, category/title, actual main image, gallery thumbnails, public overview/role/process/results, technologies, date where factual, optional real website/GitHub links and related projects. Request similar project preselects service and a public project reference. It does not reveal internal job/client IDs. Draft/archived content returns public-unavailable state; authenticated preview has a separate non-indexable private route. Slug aliases redirect in one hop to the current published slug. Templates/models link to their product pages and remain separate entities.

### P08 product catalogue and P09 product detail

Use distinct Framer and 3D model category routes. Product cards show real previews, type, availability, price/currency only where verified and View product. Detail: actual visual gallery, description, included files/pages, supported software/print information, licensing summary, and clearly labelled external purchase destination. Preview opens a trusted configured demo URL. If unavailable, remove purchase action and show Contact/Notify only if implemented. External links open with noopener/noreferrer, HTTPS validation, no inferred availability or revenue.

No local customer checkout or payment gateway is in core scope. This avoids confusing dashboard manual invoice records with external product purchases. Optional external sale events require authenticated webhook verification and deduplication; never fabricate synchronization from ordinary URLs.

### P10 About

Short hero G06, compact portrait card, founder introduction, principles, factual education, language/communication availability, local/remote cards G21/G22 and contact CTA. Portrait display approximately 240x300 px desktop, max-height 320, restrained crop, no oversized half-page image. Mobile portrait remains small, not full-viewport. Do not publish the generated face. Clearly label in-progress degree; do not imply a completed professional qualification. Website language translations do not prove founder fluency; remove unverified French-speaking claims. Education image G23 is decorative.

### P11 Contact and review submission

Reduce the hero height enough to expose the request form early. Hero G07; left form/right contact and 3D helper on desktop, stacked form-first mobile. Fields: topic, request mode where relevant, name, email, optional phone, message, optional photos. Preserve entered body text exactly, including Cyrillic/newlines/emoji; distinguish interface locale from preferred reply language. Inform customers they may write EN/UK/RU; no enforced language detector. German requests are also accepted. Required legal notice wording must match the reviewed processing basis rather than treating marketing consent as necessary for service enquiries.

Photo policy: source files up to 5 MiB each and aggregate 15 MiB, explained as MB consistently in UI, exact byte constants documented. Proposed max 10 files prevents many tiny files; subject to owner confirmation, not the obsolete two-file rule. Validate both per-file and sum. JPEG/PNG/WebP first release; mobile HEIC should be converted in a supported, tested bounded path or receive a specific error, not freeze. Model files have a separate proposed private STL limit (25 MiB each, 50 MiB aggregate, max 3), disabled until storage/resource review. Empty file list is valid. Sketch/photos may be submitted without a model.

Send request displays progress, retains text after errors, gives a reference after persistence and does not say email arrived if only storage succeeded. Rate limits provide Retry-After; server/storage outage gives an actionable error. Footer contact cards use verified mail/tel/social/maps destinations. No unsolicited message or form was submitted during this analysis.

Review form is optional because no existing Review table/route was verified. If introduced, collect display name, actual review text, optional rating and photos; English is a friendly request, not a validation requirement. Publication permission is separate from a private enquiry. Always moderate; photos private until approved. No auto-generated reviews or claims of verified purchase unless true.

### P12 Legal, unavailable and search states

Keep Impressum, Privacy and Terms as distinct URLs with readable narrow text (max ~760 px), genuine reviewed copy and the live footer. A giant scales-of-justice hero G08 is optional; recommended default is a compact text-only title. Do not publish generated legal headings or now-obsolete external-dispute links without review. No-results pages state current filters and offer Clear filters; server failures are distinct from genuinely empty results. 404 is a short branded page with Home/Services/Contact, valid 404 status and no fake content.

## 6. Dashboard page-by-page specification

Canonical page IDs: D01 Overview; D02 Inbox; D03 Clients/Companies; D04 Jobs; D05 Quotes; D06 Invoice list/editor; D07 Invoice detail/payments; D08 Portfolio; D09 Products; D10 Tasks; D11 Catalogue/estimate; D12 Settings/content; D13 Authentication/account; D14 Data/activity; D15 Reviews; D16 Reports. These same IDs are used in the control register and asset bindings.

Every page below inherits authenticated shell, loading/empty/error states, strict server permission checks and no-store caching. Every form field is labelled; client-side validation aids usability but server validation is authoritative. Controls are enumerated in `Control-register.json` with destination, reads/writes, validation, feedback, confirmations and related effects.

### D01 Overview

Four cards: new enquiries, active jobs, outstanding issued balance and due tasks. Amounts come from authoritative queries; invoices issued are not money received. Clicking a card opens the filtered section. Job table, new enquiries, Today tasks and follow-up payments provide deep links; quick actions open new-client, quote and job forms. No arbitrary percentage changes from nonexistent historical analytics. When tasks/quotes are not installed, hide their actions instead of generating demo counts.

### D02 Inbox

List filters Unread/All/Archived/Spam, bounded search, pagination, original service/language and timestamp. Selecting a message opens detail and explicitly marks read once; a client request cannot set REPLIED. Detail shows original text and authorized photo previews/downloads. UI displays source Contact form; reply locale can be chosen separately. Internal notes are a new private Note relation, not stored over the customer's message.

Create client runs a duplicate suggestion review; Link existing binds only after selection. Create job/quote uses linked client and copies a reviewed brief. Reply by email may retain the existing in-app SMTP action; do not silently switch to mailto or pretend it is a live chat. Composition has explicit Send, SMTP-accepted and failure/unknown states. Replied status follows successful delivery-record handling; preserve existing distinction between delivery failure and sent-but-save-failed. A mail-client link is a separate labelled option. Archive/spam are reversible; no permanent delete as primary action.

### D03 Clients and companies

Search/paged table or mobile cards with number, name/company, type, service summary, open jobs, unpaid balance and last contact. Row opens private profile with Overview/Jobs/Quotes/Invoices/Notes/Files/Activity. Add/Edit uses current Customer/Company schema, separate company record and human contact. Default no client is created merely by receiving an enquiry. Confirm duplicates by context; shared family/company email does not force a unique Customer.email constraint.

Billing data can be incomplete for a lead; invoice issuance requires a valid recipient. Profile actions Create job/quote and Add note link to client; View invoice/download file inherits authorization. Archive preserves financial links. Export requires authenticated owner permission, scoped query, auditable action and CSV formula neutralization. Large export is a private expiring download/job, not an overlarge function response.

### D04 Jobs and service-specific detail

List/Board switches preserve filters. Do not overload current ServiceJobStatus with quote acceptance or print production. Preserve PLANNED, IN_PROGRESS, WAITING_CUSTOMER, COMPLETED, CANCELLED; add a separate operational stage if Enquiry/Quoted/Printing/Ready views are needed. Quote state belongs to Quote, printing stage to PrintSpec/production record. Board cards derive those stages deliberately; mapping is documented in the workflow register.

Website brief: site purpose, pages, languages, content/assets responsibilities, platform, domain/hosting, milestones, agreed scope. Print details: dimensions with units, quantity, material/colour, model asset, version/hash, orientation notes, estimated hours/grams, feasibility, tolerances agreed with client, inspection and handover. PC details: device/model, stated issue, service mode, accessories received, backup decision and appointment. Never store passwords casually in notes.

Checklist/tasks attach to job; files stay private. Add catalogue lines freezes catalogue label/price mode when agreed, distinguishes internal cost from customer price. Create invoice reuses the unique active draft where present; creating another issued invoice for the same job is a deliberate additional billing decision. Mark ready is a production milestone; Complete is a business completion, neither issues an invoice automatically. Create portfolio draft selects public text/photos, strips confidential detail and requires separate publishing.

### D05 Quotes and D06 invoice list/editor

Quotes are new: number, client, optional company/job, line snapshots, validity, exclusions, revision, acceptance evidence and state. Draft may be edited; Sent quote gets a revision record before changed terms are resent. Record acceptance captures date/source/reference; no forged customer signature. Create job/invoice is explicit and idempotent against accepted revision. Expired acceptance requires reviewed renewal.

Invoices reuse current records, catalogue and billing settings. List shows document state (DRAFT/ISSUED/CANCELLED) separately from derived payment state (UNPAID/PARTIAL/PAID) and overdue calculation. Invoice editor fields: recipient type/person/company, billing address, invoice/due/service dates, currency, translated line names/descriptions/units, decimal quantity/rate, tax treatment, service period, notes and payment instructions. Search catalogue supports code/name across relevant translations; selecting a service never silently invoices a 'from' or percentage string.

Save draft validates and retains errors near fields; Preview PDF does not issue or allocate a legal invoice number. Issue invoice shows final review and exact missing requirements, then server locks/validates/freezes/allocates once. All controls and preview UI say German + English, one invoice. Draft company/person toggle clears incompatible company binding and never alters already issued recipient data. Stale browser saves use version/updatedAt conflict detection; the existing row lock already prevents save-versus-issue rewriting.

### D07 Invoice detail, payments and correction

Show the frozen legal document, German-first PDF, original total, payment history and live balance. Download issued PDF returns saved bytes, not a regeneration using new client/catalogue/settings values. Partial payments require positive decimal amount <= current balance and locked transaction; existing code has this check. Add payment idempotency and serializable-conflict retry. Credit/overpayment must become a separate reviewed credit workflow, not silently clamped to zero as if no excess existed.

Issued invoices are read-only. Correction/cancellation UI is proposed and must use approved bookkeeping semantics; retain original identifier/PDF/checksum and link correction document, reason, date, actor and affected balance. Cancellation does not delete payment evidence. Reprint/regeneration of legacy issued PDFs is not automatic. A browser-only Confirm modal is insufficient authorization for server issuance.

### D08 Portfolio editor

Preserve existing Project/ProjectImage/ProjectSlugAlias and translation data. Category includes new 3D code, old categories available. Cover/gallery use actual media, alt in supported locales, ordered images, published preview. Draft saving and public Publish are separate. The feature branch deliberately removed Project.featured; the design's Featured toggle is not currently backed. Prefer a new explicit curated-placement field/collection if homepage selection is wanted, with additive migration and no restoration of stale old flags without review.

SEO title/description/social image editing reuses existing fields. Rename slug preserves one-hop alias; collision rejects with an explanation. Archive/unpublish immediately hides detail/list/media through authoritative status checks; currently published images must not remain indefinitely publicly cached after withdrawal. Remove image affects only chosen record after confirmation and referential checks. Job-origin images are never made public by editing a caption alone.

### D09 Products

Separate Product model, type FRAMER_TEMPLATE/MODEL_3D, Draft/Published/Archived, own slug/aliases/translations, image assets, external preview/purchase URLs, format/license/availability. Exact prices are factual, user-managed and currency explicit. Publishing requires actual product, rights, functioning destination and description. Internal STL originals remain private unless intentionally distributed through an authorized merchant. No arbitrary 'download' endpoint may expose all models. Shared gallery photos can reference media with explicit publication rights; a product is not an issued invoice or finished job.

### D10 Tasks and D11 catalogue/estimate

Tasks new: owner, optional customer/job, title/note, due instant and time zone, priority/status, recurrence/reminder only if installed. Calendar and list share the same records; at DST ambiguity ask which time rather than silently shifting. Mark complete can undo within a reversible history; overdue is derived. Browser reminder icon cannot imply a scheduled notification backend.

Catalogue retains PriceSection/PriceItem.code/translations/active/sortOrder. Add structured numeric prices and pricing modes beside existing display strings, never parse a range as an agreed total. Shared searchable picker spans jobs, quotes and invoices. Inactive services remain in historic snapshots; removing an item archives it by default. Bulk save validates each row, reports partial versus atomic policy explicitly; default transaction for moderate edits.

Print estimate separates grams/kg material, machine hours/rate, labour hours/rate, fixed setup and batch quantity. Cost = grams/1000 x material per kg + print hours x machine rate + labour hours x labour rate + fixed costs. Markup price = cost x (1 + markup/100). Gross-margin target instead uses cost/(1-margin/100), with margin <100%. Show per-batch and per-item; add failure allowance/electricity only if not already in machine rate. Transfer estimate to a quote copies reviewed numbers once, does not issue automatically. Example 100g at EUR20/kg, 2h at EUR1/h, 0.5h at EUR20/h, fixed EUR1 gives EUR15 cost and EUR18 with 20% markup before configured tax.

### D12 Settings, D13 account/auth and D14 data/activity

Business/invoicing settings preserve actual legal identity, tax mode UNCONFIRMED until owner confirms, identifiers and payment data. Validate display/email/IBAN only as format where applicable; do not invent bank details. Changing settings affects future drafts/issuance, not frozen documents. Number formats currently allocate C/JOB/INV plus business year; reserve advanced custom formats until uniqueness/migration is proven. German invoice primary is a fixed requirement, not a casual reversible locale toggle.

Website content editing is new; preserve file-based copy first or add versioned WebsiteContent JSON incrementally. Editor language tabs en/de/uk/ru/sk/fr, preview and separate publish. Portrait uses real photo, focal crop, desktop/mobile preview. Brand SVG is a trusted owner asset with sanitized import; public upload policy does not accept arbitrary SVG. Optional integrations show Not connected and only enable supported, verified actions.

Account retains current login including secret-phrase field until an intentional migration. Show password inputs, visibility control, generic failures, rate lockout and safe Back-to-login on expiry. MFA uses a maintained TOTP/WebAuthn flow if added, recovery codes handled once; static secret phrase is not labelled MFA. Change credential/session revoke requires authenticated recheck and auditable outcome. Do not add email recovery links without an actual secure recovery endpoint and verified SMTP.

Exports are explicit scoped private downloads with expiry, authorization, status and audit. Backup UI distinguishes not configured, last successful external backup, failed, and restore-test status. Restore opens a review/planned maintenance workflow, not a one-click production overwrite. Audit includes actor/action/entity/time/version/reference but no tokens, full message bodies or bank details. Existing neon_auth tables are present alongside custom AdminUser/Session; do not migrate identity to Neon Auth merely because those tables exist.

### D15 Reviews and D16 reports (optional)

Reviews: pending queue, original text/media, explicit publish permission, approve/reject/archive, language tabs only for reviewed translations separate from original, public display-name control. Publishing is a distinct audited transition; quarantine/scanning and photo rights must pass. Reports: issued billed amount, money received, due balance, recorded expenses with periods/currencies distinguished. No fake profit formula from incomparable date bases. Expenses new: actual receipt/date/amount/category/job link; not a tax-deduction certification. No bank-sync or accountant-ready claim until implemented/verified. Negative adjustments require separate records/reasons.

## 7. Interaction contract

The companion `Control-register.json` is the detailed per-control specification. It resolves shared rules into each row so an implementer can inspect one control without guessing. Every row includes page, label, operation, route/entity, reads/writes, actor, validation, disabled/loading states, success, errors/recovery, confirmation, linked effects, visual/accessibility rules and readiness. Navigation uses links; mutations use buttons; GET never mutates financial data or publishes content.

Shared error taxonomy: 400/422 validation; 401 expired/missing session; 403 authorization/origin; 404 unavailable record; 409 stale/conflicting state; 413 source size; 415 file type; 429 rate limit; 503 dependency unavailable. Specific service codes are mapped to friendly field errors. Preserve data on retry; never display an empty dataset for a server failure. Unexpected errors include a non-sensitive request reference, not a stack trace.

Save/publish/send/issue controls disable only while their operation is pending or prerequisites demonstrably absent, explain why, and re-enable on recoverable error. Repeated clicks share an idempotency key. Search filters debounce 200-300ms, cancel obsolete requests, reset cursor on filter change and preserve Back URL state. Table selection is not a destructive action. Confirm only consequential steps (issue, publish, archive/remove, revoke, restore review, export sensitive bulk data); no modal for every read or draft save.

## 8. End-to-end relationships and state transitions

Public submissions have no admin credential. A bounded server creates ContactMessage (the enquiry) plus accepted attachment references in one transaction; immutable original text and locale recorded. Storage failure returns failure; acknowledgement mail failure does not undo persistence or trigger duplicate browser submissions. Inbox links a client via the proposed EnquiryLink or a reviewed customerId relation. Matching suggestions do not auto-merge. A job/quote references its source enquiry and customer; private brief may be copied but original remains unchanged.

Quote Draft -> Sent -> Accepted/Declined/Expired. Sent revision changes create a new revision; acceptance records exact revision. Conversion creates at most one linked job for the same conversion key, while additional jobs are explicit. Job current statuses are preserved; production stage and quote milestone are separate. Completion can offer a publication draft but does not publish or invoice automatically.

Invoice DRAFT -> ISSUED -> CANCELLED only through supported reviewed transition. Payment state is computed from active payment ledger; overdue = issued unpaid balance >0 and due local business date passed. A PAID badge is not a document status. Existing row-level locks, atomic NumberSequence and partial draft index are retained. New idempotency ensures retry after a lost response returns the same payment/conversion rather than creates a second one.

Public Project/Product/Review uses Draft/Pending -> Published -> Archived/unpublished with explicit owner action. Public response contains only approved projection and published media. A private FileAsset never acquires visibility merely because its linked job completed. Publish selection copies a sanitized derivative into public media with rights/consent metadata and audit link to source. Backend/cache invalidation checks are part of publication.

## 9. Database proposal and safe evolution

### Preserve current entities

AdminUser/Session/AuditLog; Customer/Company/CustomerNote/CustomerActivity; ServiceJob/ServiceJobLineItem; PriceSection/PriceItem; BusinessBillingSettings; Invoice/InvoiceLine/InvoicePayment; NumberSequence; Project/ProjectImage/ProjectSlugAlias; FileAsset; ContactMessage/ContactAttachment/ContactRateLimit; VisitorDay. Preserve IDs, stored data, published slugs and frozen invoice bytes. Existing numeric money scales are 12,2 or 14,2; quantities 12,3. Public schema also contains managed neon_auth tables in a separate schema; those are not the active application auth source verified in code.

### Additive proposed entities/fields

| Entity | Fields and relationships | Constraints/indexes |
| --- | --- | --- |
| Quote / QuoteRevision / QuoteLine | customer/company/job optional; number; revision; snapshots; validity; accepted evidence | unique number/revision; indexed customer/status/date; no mutable accepted revision |
| QuoteAcceptance | exact QuoteRevision FK; accepted date; source/reference; recording actor; actual evidence asset optional | one authoritative acceptance per revision; evidence private; correction history append-only |
| Product / ProductAlias | type; slug; translations; license; price/currency; merchant/demo URL; status; media | unique slug/alias; status/type/order index |
| Task | optional job/customer; title; note; due instant; zone; owner; priority/state | due/state and job indexes; FK restrict/archive policy |
| PrintSpec | 1:1 job; dimensions numeric+unit; quantity; material/colour; selected model hash; estimates; feasibility; stage | unique jobId; positive bounds/checks; selected file belongs to job |
| WebsiteBrief / PcBrief | 1:1 job structured service fields; private details | unique jobId; safe schema version |
| EnquiryLink / EnquiryNote | original ContactMessage -> customer/job/quote links; author/time | unique conversion key; indexed source/customer |
| UploadReservation / MediaObject | actor/source form; limits; random key; size/hash; quarantine/accepted state; expiry; derivative metadata | unique key; expiration/status index; claimed once |
| PublicationSelection | source private file -> approved derivative/project/product/review; rights record | public whitelist projection; audit actor/date |
| Review | original text; display name; topic; pending/published state; permission; media | state/date; never publish email/IP |
| Expense | date; amount/currency; category; receipt; optional job; reason | date/category/job indexes; separate reversal record |
| WebsiteContent / Revision | locale/key/JSON schema; revision; published revision | unique key/locale/revision; versioned publish |
| IdempotencyRecord | actor/scope/key/body hash/result identity/status/expiry | unique(actor,scope,key); conflict on key reused with changed payload |
| EmailOutbox / DeliveryAttempt | source action; dedupe key; recipient reference; queued/accepted/failed/unknown | unique action key; retry/status/time index |
| PaymentReversal / InvoiceCorrection | links original record; reason; actor; immutable correction artifact | unique reviewed action; retention rules, not hard delete |

New mutable business entities use stable opaque IDs, createdAt/updatedAt, an explicit revision for stale-write checks and archivedAt where applicable. Immutable revisions, ledger events and delivery attempts retain createdAt/occurredAt and recording actor/source; use append-only correction rather than overwriting history. Single-owner access is enforced server-side; future staff ownership/role policy is an explicit extension, not a silent tenant schema. Financial relationships use restrictive deletion and archival; all dates have defined UTC-instant versus Europe/Berlin business-date semantics.

Customer.email remains indexed, not globally unique. A household/company can share email. Company contact joins may be added when a real need appears; do not duplicate billing snapshots under client names. Avoid polymorphic unvalidated IDs; either explicit FKs or a checked binding model. Public entity projections never use unrestricted `include` for related customer data.

### Numeric and date rules

API accepts decimal strings with one normalized separator; reject ambiguous grouping or exponential/out-of-range forms. Server computes HALF_UP line rounding consistently with current code and verified tax profile. Persist units, price modes, agreed rate and period. Return decimal strings, not JS float arithmetic. Correct totals from saved line snapshots; UI recalculation is preview only. Calendar dates are business-date values, appointments UTC instants plus zone; preserve historic timestamp interpretation and do not bulk convert without mapping. Numbering uses Europe/Berlin year, atomic counter row and unique issued number; no SELECT MAX+1. Monotonic values may include documented gaps; never reuse an issued number.

### Connection, roles and files

Retain Prisma and existing pooled driver; use the provider-recommended direct migration/dump connection and dedicated migration role. Public runtime needs SELECT published content and narrowly defined contact/upload writes, not all CRM privileges. Control runtime gets necessary DML, no DDL/role management. Credentials server-only, separate by environment; never in NEXT_PUBLIC variables. Define grants against actual query paths; public app currently writes contact directly, so a SELECT-only role alone would break it. Use transaction-local context if later RLS is introduced; transaction pooling must not rely on session-wide SET. Application authorization remains necessary.

Existing BYTEA attachments/project images/PDFs can remain while migration is staged. Proposed object storage takes original/large files and derivatives; keep DB metadata/checksum/references. Never store files in an ephemeral deployment filesystem. Private downloads authorize every request and issue short-lived scoped URLs only when safe; object-key secrecy is not authorization. Database and object backup recovery must be consistent.

### Migration and rollback sequence

1. Verify deployed commit, runtime, current schema, migration history and non-secret environment mapping. Capture counts/checksums privately; do not include client data in the handoff.
2. Take a recoverable database backup and corresponding object manifests; verify decryption/access and restore onto an isolated test database. Six hours of provider history is not the independent backup policy.
3. Use an isolated schema-only/sanitized test environment for new modules or a controlled production-like branch with access restrictions. Do not expose customer data in public preview branches.
4. Generate reviewed additive Prisma migrations; add nullable/version fields, new relations and indexes first. Preserve named existing partial indexes/constraints absent from ORM representation.
5. Run deterministic backfills in bounded batches with checkpoints, validated translated fields and explicit unknown states. Do not infer tax data/consent or renumber old invoices.
6. Deploy compatibility readers/writers behind module configuration; test and compare counters/links/bytes. Enable the new interface only after data checks.
7. For public media migration, write derivatives, verify hashes and rights, then switch reads; retain old private bytes until verified retention/purge decision.
8. Roll back app version/feature selection on failure; do not roll back the whole live database over new valid writes. Destructive down-migrations and `migrate reset` are excluded from normal production work. Restore requires a reviewed cutover plan.

## 10. Invoice preservation and German-first extension

### Verified existing mechanics

The feature branch stores seller, recipient, bank/payment, tax and bilingual line fields on Invoice/InvoiceLine, documentVersion, issuedPdf bytes/checksum/size. Issuance uses a transaction and Invoice row FOR UPDATE, checks tax/business confirmation and translations, allocates through an atomic scope/year upsert, generates the PDF and records audit/activity. Draft PATCH locks the same row and rejects non-DRAFT to protect against delayed editing. Payment creation locks and rejects amount >balance inside a Serializable transaction. PDF GET requires currentUser and returns stored issued bytes with private/no-store headers. The database has the partial unique index for one current draft per linked job. [E04, E03]

### Required change, not a fresh invoice rewrite

New renderer begins `de`, then `en`; labels, preview tabs and tests follow that order. Introduce a document/layout version (proposed 3) and explicit language order in new snapshot metadata. German section is the original presentation; English label: English translation of the same invoice. No additional payment is due. Remove the old implication that German is only the second translation. One snapshot feeds both language sections; translations are frozen on issue. Keep equivalent names/address/identifiers/amounts unchanged, including culturally sensitive names. Avoid translating banking identifiers.

Historical issued PDF bytes/checksum/order remain untouched by this rollout. New draft previews and newly issued documents use German-first. If an owner needs a revised presentation of a historical issued document, create a separately auditable rendering linked to the same snapshot/version under the reviewed accounting policy; never silently replace original bytes. A changed locale query may change UI labels, not regenerate an issued legal document.

### Translation and pagination

Both DE and EN customer-facing fields must be present before issue; no machine-generated translation is accepted silently. Existing generic `serviceName`/`description` fields are not proof of English because catalogue selection can prefer German; preserve them for compatibility but validate or add explicit EN fields and label the editor. Existing `...De` fields remain. Optional empty notes need no fabricated counterpart. Missing translation blocks issue with a field link; draft preview may show a clear placeholder only in DRAFT.

A short document is two complete language sections on pages 1 and 2. Long German may be pages 1-3, English begins page 4; per-section and global page indicators may be added. Repeat table headings on continuation pages, wrap names/descriptions, paginate a single very long row in bounded chunks, keep totals/payment instructions readable and avoid 6 px microtext. A4 portrait with ~40-48 pt margins, embedded Unicode fonts; verify EUR, umlauts, Cyrillic names and mixed-language long addresses. Raster hero photos are unnecessary in invoices. Use original vector logo or sharp trusted raster derivative.

Validate bank/tax settings through the existing unconfirmed gate. Do not hardcode mockup 19%, 0% or fabricated statements. For a small-business exemption, the correct display wording/rate rows depend on confirmed legal treatment, not a decorative zero-tax dropdown. Address, service period, recipient and due-date requirements are configured and validated against current rules. Current official tax-specific verification was incomplete due source access errors, so legal completeness is not claimed. A normal bilingual PDF is not by itself a structured e-invoice; design a separate exporter/receipt storage capability if applicable. [S03]

## 11. Security model and verification responsibilities

This is a proposed target plus verified code observations, not a certification. The main boundary is public browser -> limited public API -> validated records, versus owner browser -> authenticated private API -> CRM/financial/files. Storage, mail and external merchants are separate trust boundaries. Attacker goals include spam/storage exhaustion, account takeover, identifier-based file/record exposure, forged mutations, malicious image/model inputs, stale/concurrent financial writes and compromised external links.

| Area | Required protection and placement | Evidence/check |
| --- | --- | --- |
| Authentication | Preserve Argon2 credential verification and hashed opaque session tokens; generic failures, distributed IP/account throttling, rotation/expiry/revocation. Do not label static phrase MFA. | Source E07; test expired/revoked token and parallel login limits |
| Authorization | Central per-route owner policy and relation checks for all customer/job/invoice/media IDs; deny by default. Publication reads use explicit projection. Future staff permissions attach to operations, not menu visibility. | Anonymous and unauthorized GET/PATCH/download tests [S04] |
| CSRF | Exact configured origins for cookie-auth mutations; missing/untrusted origin rejection where browser flow guarantees it; explicit CSRF token if architecture requires exceptions. GET side-effect-free. SameSite complements protection. | Existing trusted-origins; forged-origin and missing-origin tests [S05] |
| Session/cookies | HttpOnly, Secure production, host-only Path=/ cookie, appropriate SameSite, bounded idle/absolute lifecycle; no localStorage auth secrets. Public/control origins considered separately. | Current 8-hour session observed; logout/revoke/expiry tests [S06] |
| XSS/content | Escape contact/notes/filenames; allowlisted sanitized rich text only if required. JSON-LD safe serialization, no unsafe inline customer HTML. CSP designed for actual resources; no blanket unsafe-eval fix. | Stored/script payload appears as text; CSP report review |
| SQL/data | Prisma parameterized queries and safe tagged SQL; never interpolate user identifiers; bounded filters, row/field allowlists, decimal constraints. | Existing tagged SQL; SQL-injection/overposting tests |
| Uploads | Reservation bound to purpose/draft; 5 MiB/15 MiB server checks; type signature and image decode/re-encode, pixel/time/memory limits, random keys, quarantine, authorized finalization. | Existing sharp guards retained; malformed/oversized/finalization tests [S07] |
| Model files | Private STL only initially, resource-bounded validation; no automatic machine execution, G-code/archives disabled. Never send confidential designs to public scanners. | Scanner sandbox and file association checks |
| Downloads/PDFs | Auth every private access, relation checks, no-store, nosniff, safe Content-Disposition, short-lived scoped storage access. Public media checks published state. | Cross-message file-ID tests and draft media denial |
| SSRF | Prefer uploaded images; remote URL fetch only from narrow HTTPS allowlist with resolved-address checks, no private/link-local targets, controlled redirects, byte/time limits. | Mock/test controlled local targets denied [S08] |
| Secrets | Server-only per-environment keys/roles; no frontend bypass tokens, broad database credentials or secrets in logs/archive. Build output and source map review. | Secret scan and frontend bundle review |
| Rate limits | Database/managed shared counters with bounded keys/TTL; trusted source IP extraction and global budget; login limiter Map insufficient across replicas. | Distributed instance test; legitimate shared-IP fallback |
| Headers/CORS | Control frame denial, nosniff, referrer/permissions policy, appropriate CSP/HSTS after HTTPS/domain review; exact CORS public origin if needed. CORS is not authorization. | Browser/header check, no wildcard credential CORS |
| Mail/external events | Outbox/idempotency; safe text; no arbitrary SMTP recipients/headers; authenticated webhook signatures and replay window if merchant integration added. | SMTP accept vs delivery vs record failure tests |
| Private cache/logs | Private DTOs no-store; public cache keyed only by published revision; redact secrets/message bodies/PII. Audit critical mutations by owner. | CDN/public response leakage and logging review |
| Database/backups | Least-privilege runtime vs migration roles, TLS verification, restricted management access, encrypted independent backups, known restore operator/test. | Provider policy + restore drill; no claimed backup without evidence |
| Dependencies/build | Pinned lockfile, maintained validation/image/PDF libraries, dependency advisories/CI checks, scoped previews. | Build/tests/advisory review at implementation time |

### Direct-upload protocol for the larger photo policy

Public browser validates source size/count and creates a bounded metadata request. Server issues an expiring reservation allowing only purpose-specific random keys, exact maximums and short TTL, after abuse controls. Bytes go directly to selected storage instead of through the 4.5 MB Vercel function. Original upload is quarantined/private. A bounded processing worker verifies actual stored byte counts, signature, dimensions, pixel count and decode/re-encode limits; derive safe previews. Finalize consumes reservation once, matches claimed files/hashes/purpose, enforces aggregate original-byte cap and atomically links accepted attachments to one enquiry. A failure leaves the message unsent or accepted without photos only after explicit customer choice; orphan reservations expire and are cleaned up. Malware-scan failure is pending/rejected, never 'safe by default'.

Unauthorized callers cannot attach somebody else's reservation, public object key or private client file. Late finalize and repeated requests return known status. Direct upload is not a security bypass: the app verifies post-upload objects independently. Limit storage/processing cost per IP/session/purpose, with fair recovery for shared networks. Do not expose public list/read privileges on private buckets. [S01, S07]

### Privacy, processing and residual risk

Collect only information needed for requests/work, define processing purpose/legal basis, retention and public-publication permission separately. Do not require service enquiry consent to marketing. Explain processors, optional analytics/maps and external purchase links; a static map link avoids third-party embed loading until requested. Preserve original message while displaying it safely. Set legal/business retention policy by record category; financial records are not deleted by a generic GDPR button when retention applies. Private exports/receipts and image EXIF require careful handling. [S09]

Hosting Frankfurt data with US execution metadata means processor/transfer review is needed; geography alone is not a legal conclusion. App authorization failure, compromised owner account, undiscovered parser flaw, external merchant outage and backup gaps remain residual risks. Keep blast radius small, monitor failures and test recovery. Production branch was reported unprotected and IP allowlist empty; this is not proof of compromise. Investigate compatible restrictions without blocking public contact writes or disabling current deployment protection.

## 12. SEO, multilingual content and performance

Preserve /en,/de,/uk,/ru,/sk,/fr route language and set HTML lang correctly. Use self-canonical URLs per actual language, reciprocal hreflang only for available equivalent published pages, and x-default for chosen default. Keep locale switch on equivalent page where possible; if translation unavailable, say so and navigate deliberately, not silently to wrong content. Avoid bulk indexing English fallback under six language tags. Existing generic UI-copy entries must be translated accurately; customer submitted language is independent. [E09, S02]

Sitemap includes 200 canonical public pages, substantive product catalogues/details and published projects; excludes drafts, aliases/redirects, filters, private previews, APIs and dashboard. lastmod reflects content modification, not 'now on every request'. Keep legacy prices/service/project mapping and one-hop slug aliases; use 301/308 for permanent moves when suitable. Publication invalidates the public list/details/sitemap consistently. If database temporarily fails, preserve static pages and identifiable safe published cached results; don't replace a rich site sitemap with misleading brand-new timestamps. [S10]

Each service page has a distinct H1/title/description, factual local context and specific work, not interchangeable generic IT text. Default titles may combine service + TiLADYS + Mülheim where relevant. Use genuine Organization/LocalBusiness information and Service/BreadcrumbList; Product/Offer only for actual available purchasable items and real prices/merchant relationship. No invented AggregateRating or self-serving star promises. Social image 1200x630 with rendered HTML/vector text and approved visual; don't bake a guessed logo in AI imagery. Published portfolio updates preserve SEO/social fields.

Private routes and PDF/file responses use auth plus no-store; add noindex headers/meta as an additional indexing hint. Robots exclusion does not secure private content and can prevent a crawler seeing noindex; do not make private records public to help indexing removal. Never list sensitive identifiers in public robots URLs. [S11]

Performance targets are proposed acceptance budgets, not measured current results: LCP <=2.5 s, INP <=200 ms, CLS <=0.1 at field 75th percentile when enough data exists; laboratory testing complements, not proves field results. Initial above-fold transfer target <=1 MB compressed, hero ~150-250 KB at rendered size where feasible, card ~40-100 KB, responsive srcset/sizes, width/height reserved. Lazy load below-fold media; preload only the actual LCP visual/font. No autoplay heavy hero videos, multiple 4K downloads or PDF fonts on every dashboard route. Virtualize only when counts justify it; use pagination for CRM. [S12]

Object derivatives can be versioned/cacheable if publication can withdraw access promptly; sensitive/status-controlled media should retain authoritative access checks and private/no-store until a safe cache/purge design is verified. Image processing should not run full database-BYTEA decode on every public resized request indefinitely; precomputed bounded variants are a proposed efficiency improvement. Static footer/header icons are original SVG/Lucide, not network image generation.

## 13. Media inventory and regeneration brief

`Asset-register.json` defines every distinct visual family across the approved public and dashboard boards, container usage, composition prompt, lighting/materials, crops, dimensions, formats, alt intent and authenticity status. Backgrounds and functional icons are native CSS/vector definitions, not AI raster assets. Shared imagery is intentionally reused between public category teaser and appropriate dashboard content thumbnail only where the underlying content really matches.

Generated marketing scenes are illustrative; real portfolio screenshots, real product previews, real print evidence and the real founder portrait must be acquired from approved user assets. Some mockups show invented clients/templates/portraits or physically questionable PC internals; those are not shipping assets. The only generated collection in this phase is the written prompt inventory, not images. Next image phase should generate the approved unique marketing scenes once, display them individually in chat and package originals plus crops/formats; real evidence is never generated to fill gaps.

Reusable photographic direction: navy/slate setting, black/white printed objects with plausible FDM layer texture, soft natural/studio light, restrained cyan accent, uncluttered workspace. Leave space for HTML text; no logos, watermark, pseudo-UI lettering or dimensional labels baked into photos. Brand words use original SVG and interface text. Precise measurement diagrams are native vector with validated geometry/labels, not generative pictures.

## 14. Edge cases and acceptance plan

`Acceptance-register.json` lists normal, empty, failure, retry, concurrent and unauthorized scenarios with priority, setup and measurable expected results. P0 means release-blocking confidentiality/financial correctness/data loss; P1 core workflow failure; P2 polish/optional module. This is a prioritized finite risk set, not a claim to predict all situations.

Minimum end-to-end flow on isolated test data: submit EN/UK/RU enquiry with accepted source photos -> inspect private inbox original -> link reviewed customer/company -> accepted quote revision -> service-specific job -> draft -> German-first bilingual issue -> authenticated saved PDF -> partial payment -> optional reviewed portfolio draft -> publish approved derivative -> verify public list/detail/media/sitemap. Also verify existing direct job-to-invoice path remains working, because quotes are an extension not a prerequisite to all invoices.

Use unit checks for decimals/status mapping/validators and PDF layout; integration checks for transaction/idempotency/permissions/private files; browser checks for original text, mobile menus/forms, retries and entire workflows; manually review long German and real-media layouts. Stub mail/merchant responses in tests; no unsolicited production mail or live invoice creation. Load/resource tests use bounded synthetic files in isolated environment. Verify restored backup records/files/checksums after recovery. Acceptance results are planned, not executed in this analysis.

## 15. Phased implementation and review gates

### Phase 0 - reconcile sources and release baseline

Confirm working branch/deployed commit, runtime Node24 consistency and production DB binding. Preserve known tests and migrations. Establish clean isolated test environment, successful backup/restore evidence and baseline public/footer/mobile screenshots. Check relevant legal/tax/content availability and dependency/security status. No production reset. Exit: reproducible baseline and reviewed change inventory.

### Phase 1 - design foundations and compatibility

Implement tokens, shared controls, accessible header/menu, Control shell, live footer preservation and responsive rules in an isolated development branch. Keep real content and old URLs. Add proposed module navigation only as functions become ready. Exit: visual comparison and keyboard/mobile tests with no broken current workflows.

### Phase 2 - contact, data boundaries and larger uploads

Introduce scoped direct-upload pipeline with old small-upload compatibility until verified; metadata-only application requests, private derivatives, reservation cleanup, idempotent contact persistence, original Unicode text and robust inbox/SMTP states. Add enquiry links/private notes and duplicate review. Exit: max-size/failure/abuse/unauthorized cases pass; public write credentials remain least privilege.

### Phase 3 - public three-service presentation and publication

Build approved pages using real projects, 3D category, authentic media and preserved footer. Extend SEO/routes/slug aliases and catalogue projection. Keep unavailable products honest. Exit: published-only content/media, locale metadata, existing projects and responsive tests pass.

### Phase 4 - CRM, print specs, catalogue and jobs

Extend client profiles/current statuses; add service-specific details and tasks with additive migrations, decimal catalogue data, job attachments and estimates. Keep existing customer/job numbers and relationships. Exit: edits/version conflict, archive and quote-estimate-copy checks pass.

### Phase 5 - German-first invoices and quotes

Change future renderer/layout version and tests while preserving original issued bytes. Keep numbering/row locks/payment checks and one-draft index. Add explicit EN translations, idempotency and correction proposal only after accounting review. Add quote revisions/acceptance/conversions. Exit: long-DE/EN pagination, snapshot immutability, concurrent issue/payment and email-state checks pass.

### Phase 6 - products and optional operational modules

Publish actual Framer/models with verified merchant/license links. Add review moderation, receipts/reports, content editor, backups/MFA/reminders only where backing services exist. Exit: no fake integration buttons/data; publication/private boundaries verified.

### Phase 7 - staged release and monitoring

On protected preview, run existing + new tests/typecheck/lint/build and documented browser/security checks. Review redirects/canonicals/sitemap, footer accuracy, auth sessions, database-role grants, file limits, backups, real contact delivery and DE-first invoice samples. Release approval applies to the concrete deployment change; no deployment is authorized by this analysis. Monitor errors/storage/rate-limits/mail outcomes, preserve rollback plan and recheck first real workflow.

## 16. Source register

Evidence files are pinned to the deployed commit rather than branch names that may move. Repository links are reference sources, not permissions to alter anything.

- E01: repository main and feature branch tree/README/package manifests; https://github.com/VladyslavTitov/tiladys_portfolio_website/tree/e82bff04aac9915585b10cc853fe31c558a5964b
- E02: read-only Vercel metadata for tiladys-public and tiladys-control production; commit e82bff04..., Node24, iad1, existing deployment protection. Tool observation 12 October 2026.
- E03: read-only Neon tiladys-database active main table/schema/index/migration metadata; Invoice/InvoiceLine/InvoicePayment and bilingual migration verified. No private invoice rows read.
- E04: deployed apps/control/lib/invoices.ts, invoice-pdf.ts, invoice-issuance-requirements.ts and invoice issue/PATCH/payment/PDF routes; packages/db/prisma/schema.prisma and unique-draft migration.
- E05: deployed apps/web/lib/contact-upload-limits.ts, contact-images.ts, contact-rate-limit.ts and app/api/contact/route.ts.
- E06: deployed public-projects-db.ts, public media route, authenticated contact-attachment routes and private file metadata.
- E07: deployed security.ts, trusted-origins.ts, rate-limit.ts, login route and mail/reply routes.
- E08: live https://tiladys.com/en footer screenshot observation and deployed Footer.tsx, SocialLinks.tsx, globals.css. Screenshot used only for inspection, not packaged.
- E09: deployed seo.ts, sitemap.ts, ProjectSlugAlias/public loader; live published public routes.
- S01: Vercel Functions limits and upload guidance: https://vercel.com/docs/functions/limitations ; https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- S02: Google localized versions: https://developers.google.com/search/docs/specialty/international/localized-versions
- S03: official federal e-invoice definition: https://e-rechnung-bund.de/e-rechnung/was-ist-eine-e-rechnung ; BMF FAQ and UStDV34a endpoints unavailable during this review, so business-specific tax/retention details remain unverified.
- S04: OWASP authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- S05: OWASP CSRF: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- S06: OWASP session management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- S07: OWASP uploads: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- S08: OWASP SSRF: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- S09: GDPR primary text: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng ; privacy policy application requires business-specific review.
- S10: Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- S11: Google noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- S12: Web Vitals: https://web.dev/articles/vitals
- S13: accessibility target WCAG2.2 AA plus proposed44px touch design: https://www.w3.org/TR/WCAG22/ . Target is a design goal, not a conformity claim.
- S14: Neon Postgres skill guidance reviewed for pooled runtime/direct migrations, branching and safe recovery planning; preserve the actual Prisma version and test its connection configuration. Provider plan-specific restrictions must be reconfirmed before applying changes.

## 17. Delivery boundary

This analysis is ready for review. The later Codex master prompt must be written only after review of this specification, and will reference these registers rather than assuming generated images are executable requirements. Later asset generation follows the approved asset list and authenticity constraints. The public website, Control application and current records remain unchanged.


## Appendix A. Individual control inventory

The complete per-control contracts are in Control-register.json: validation, actor, permission, reads/writes, loading/disabled states, success, failure recovery, confirmation and related effects. This index provides concrete actions.

### PUBLIC-SHELL

| ID | Control | Concrete operation |
| --- | --- | --- |
| C001 | TiLADYS logo | Open the labelled public page or section |
| C002 | Websites | Open the labelled public page or section |
| C003 | 3D Printing | Open the labelled public page or section |
| C004 | PC Support | Open the labelled public page or section |
| C005 | Portfolio | Open the labelled public page or section |
| C006 | About | Open the labelled public page or section |
| C007 | Contact | Open the labelled public page or section |
| C008 | Start a project | Open the labelled public page or section |
| C009 | Language | Open language choices; navigate to available equivalent page |
| C010 | Menu / Close | Toggle top-aligned menu directly under header; Escape closes; restore trigger focus |
| C011 | Skip to content | Move focus to main content |

### FOOTER

| ID | Control | Concrete operation |
| --- | --- | --- |
| C012 | Logo | Open the labelled public page or section |
| C013 | Home | Open the labelled public page or section |
| C014 | Services | Open the labelled public page or section |
| C015 | Portfolio | Open the labelled public page or section |
| C016 | About | Open the labelled public page or section |
| C017 | Contact | Open the labelled public page or section |
| C018 | Email | Open the labelled public page or section |
| C019 | Phone | Open the labelled public page or section |
| C020 | Threads | Open the labelled public page or section |
| C021 | WhatsApp | Open the labelled public page or section |
| C022 | Telegram | Open the labelled public page or section |
| C023 | Instagram | Open the labelled public page or section |
| C024 | Terms of Use | Open the labelled public page or section |
| C025 | Privacy Policy | Open the labelled public page or section |
| C026 | Impressum | Open the labelled public page or section |
| C027 | Contact Me | Open the labelled public page or section |
| C028 | Open Contact Form | Open the labelled public page or section |

### P01

| ID | Control | Concrete operation |
| --- | --- | --- |
| C029 | Get in touch | Open the labelled public page or section |
| C030 | View services | Open the labelled public page or section |
| C031 | Learn more about websites | Open the labelled public page or section |
| C032 | Discover 3D printing | Open the labelled public page or section |
| C033 | Get PC support | Open the labelled public page or section |
| C034 | View portfolio | Open the labelled public page or section |
| C035 | Selected project image / View project | Open the labelled public page or section |
| C036 | Browse templates | Open the labelled public page or section |
| C037 | Explore models | Open the labelled public page or section |
| C038 | More about me | Open the labelled public page or section |

### P02

| ID | Control | Concrete operation |
| --- | --- | --- |
| C039 | Open service category | Open the labelled public page or section |
| C040 | Other digital services | Open the labelled public page or section |
| C041 | Request quote | Open the labelled public page or section |

### P03

| ID | Control | Concrete operation |
| --- | --- | --- |
| C042 | Custom websites / Request a website | Open the labelled public page or section |
| C043 | Browse Framer templates | Open the labelled public page or section |
| C044 | Business websites / Learn more | Open the labelled public page or section |
| C045 | Landing pages / Learn more | Open the labelled public page or section |
| C046 | Updates and maintenance / Learn more | Open the labelled public page or section |
| C047 | View all projects | Open the labelled public page or section |
| C048 | Gallery View project | Open the labelled public page or section |
| C049 | Template preview | Open the labelled public page or section |
| C050 | View on Framer | Open the labelled public page or section |

### P04

| ID | Control | Concrete operation |
| --- | --- | --- |
| C051 | Request a custom print | Open the labelled public page or section |
| C052 | Browse models | Open the labelled public page or section |
| C053 | Print from your file | Open the labelled public page or section |
| C054 | Discuss an idea | Open the labelled public page or section |
| C055 | Small custom batches | Open the labelled public page or section |
| C056 | View more in gallery | Open the labelled public page or section |
| C057 | Print View project | Open the labelled public page or section |
| C058 | View model | Open the labelled public page or section |
| C059 | Other requirements / Ask me | Open the labelled public page or section |

### P05

| ID | Control | Concrete operation |
| --- | --- | --- |
| C060 | Describe your issue | Open the labelled public page or section |
| C061 | Explore services | Open the labelled public page or section |
| C062 | Setup and software | Open the labelled public page or section |
| C063 | Troubleshooting | Open the labelled public page or section |
| C064 | Cleaning | Open the labelled public page or section |
| C065 | SSD and RAM upgrades | Open the labelled public page or section |
| C066 | Backup and data transfer | Open the labelled public page or section |
| C067 | Remote support | Open the labelled public page or section |
| C068 | Book a local appointment | Open the labelled public page or section |

### PUBLIC-SERVICES

| ID | Control | Concrete operation |
| --- | --- | --- |
| C069 | FAQ question | Expand/collapse associated answer; keep heading focus |

### P06

| ID | Control | Concrete operation |
| --- | --- | --- |
| C070 | All / Websites / 3D Printing / PC and IT / More | Filter published projects; retain older category codes |
| C071 | Search projects | Search bounded public title/summary only |
| C072 | Next / Previous page | Move cursor within published results |
| C073 | Project card | Open the labelled public page or section |
| C074 | Framer templates | Open the labelled public page or section |
| C075 | 3D models | Open the labelled public page or section |
| C076 | Have a project in mind | Open the labelled public page or section |

### P07

| ID | Control | Concrete operation |
| --- | --- | --- |
| C077 | Portfolio breadcrumb | Open the labelled public page or section |
| C078 | Visit website | Open the labelled public page or section |
| C079 | View GitHub | Open the labelled public page or section |
| C080 | Request similar project | Open the labelled public page or section |
| C081 | Related project | Open the labelled public page or section |
| C082 | Select gallery thumbnail | Change/view published gallery image; labelled keyboard equivalent |
| C083 | Previous image | Change/view published gallery image; labelled keyboard equivalent |
| C084 | Next image | Change/view published gallery image; labelled keyboard equivalent |
| C085 | Zoom image | Change/view published gallery image; labelled keyboard equivalent |
| C086 | Close image viewer | Change/view published gallery image; labelled keyboard equivalent |

### P08

| ID | Control | Concrete operation |
| --- | --- | --- |
| C087 | Framer / 3D models / category | Filter published available products |
| C088 | Search products | Search public product text |
| C089 | Load more | Load bounded published next page |
| C090 | View product | Open the labelled public page or section |

### P09

| ID | Control | Concrete operation |
| --- | --- | --- |
| C091 | Product breadcrumb | Open the labelled public page or section |
| C092 | Preview | Open the labelled public page or section |
| C093 | View on Framer / View model store | Open the labelled public page or section |
| C094 | Request a print of this model | Open the labelled public page or section |
| C095 | Gallery thumbnail | Select actual product preview |

### P10

| ID | Control | Concrete operation |
| --- | --- | --- |
| C096 | Let us work together / Get in touch | Open the labelled public page or section |
| C097 | Local / online support enquiry | Open the labelled public page or section |

### P11

| ID | Control | Concrete operation |
| --- | --- | --- |
| C098 | Topic | Edit draft value |
| C099 | Request mode | Edit draft value |
| C100 | Name | Edit draft value |
| C101 | Email | Edit draft value |
| C102 | Phone optional | Edit draft value |
| C103 | Message | Edit draft value |
| C104 | Preferred reply language optional | Edit draft value |
| C105 | Privacy notice acknowledgement | Edit draft value |
| C106 | Add photos / Choose files / Drop files | Reserve/upload private source photos with progress; finalize only approved files |
| C107 | Remove selected photo | Remove local selection or unclaimed reservation; adjust source aggregate |
| C108 | Retry failed upload | Retry/resume same reservation with bounded cost and unchanged form |
| C109 | Attach model (conditional) | Upload private STL only after separate pipeline enabled |
| C110 | Send request | Validate/finalize and persist enquiry once; return receipt |
| C111 | Submit another request | Clear only after successful receipt and deliberate action |
| C112 | Send Email | Open the labelled public page or section |
| C113 | Call Now | Open the labelled public page or section |
| C114 | View on map | Open the labelled public page or section |
| C115 | Privacy Policy | Open the labelled public page or section |

### P11-REVIEW

| ID | Control | Concrete operation |
| --- | --- | --- |
| C116 | Display name | Edit draft value |
| C117 | Review text | Edit draft value |
| C118 | Rating optional | Edit draft value |
| C119 | Publication permission | Edit draft value |
| C120 | Add review photos | Same protected source photo pipeline |
| C121 | Submit review | Persist pending moderation record, never public automatically |

### P12

| ID | Control | Concrete operation |
| --- | --- | --- |
| C122 | Legal table of contents | Open the labelled public page or section |
| C123 | Home / Services / Contact on 404 | Open the labelled public page or section |
| C124 | Clear filters | Reset current search/filter without hiding load errors |
| C125 | Retry content | Re-read same published safe data request |

### ADMIN-SHELL

| ID | Control | Concrete operation |
| --- | --- | --- |
| C126 | Overview | Open authorized section; show unavailable future module honestly |
| C127 | Inbox | Open authorized section; show unavailable future module honestly |
| C128 | Clients | Open authorized section; show unavailable future module honestly |
| C129 | Jobs | Open authorized section; show unavailable future module honestly |
| C130 | Quotes and Invoices | Open authorized section; show unavailable future module honestly |
| C131 | Portfolio | Open authorized section; show unavailable future module honestly |
| C132 | Products | Open authorized section; show unavailable future module honestly |
| C133 | Tasks | Open authorized section; show unavailable future module honestly |
| C134 | Settings | Open authorized section; show unavailable future module honestly |
| C135 | Reviews | Open authorized section; show unavailable future module honestly |
| C136 | Reports | Open authorized section; show unavailable future module honestly |
| C137 | Global search | Search allowed customers/jobs/invoices/projects with bounded paged results; type filter |
| C138 | Notifications | Open actual due/failure/unread records, not invented events |
| C139 | Interface language | Change UI language; preserve original enquiry and invoice order |
| C140 | Collapse sidebar / Mobile menu / Close | Toggle labelled navigation; keyboard/focus/scroll treatment |
| C141 | View public website | Open public homepage in separate safe tab |
| C142 | Profile / Account | Open account settings |
| C143 | Log out | Revoke current server session and clear cookie |

### D01

| ID | Control | Concrete operation |
| --- | --- | --- |
| C144 | New enquiries | Navigate to specific authorized filtered page or creation draft |
| C145 | Active jobs | Navigate to specific authorized filtered page or creation draft |
| C146 | Awaiting payment | Navigate to specific authorized filtered page or creation draft |
| C147 | Tasks due today | Navigate to specific authorized filtered page or creation draft |
| C148 | New client | Navigate to specific authorized filtered page or creation draft |
| C149 | Create quote | Navigate to specific authorized filtered page or creation draft |
| C150 | New job | Navigate to specific authorized filtered page or creation draft |
| C151 | View all jobs | Navigate to specific authorized filtered page or creation draft |
| C152 | View all enquiries | Navigate to specific authorized filtered page or creation draft |
| C153 | Quick access Portfolio | Navigate to specific authorized filtered page or creation draft |
| C154 | Quick access Framer / models | Navigate to specific authorized filtered page or creation draft |
| C155 | Open job / enquiry / invoice row | Navigate to specific authorized filtered page or creation draft |
| C156 | Complete Today task | Persist reversible task completion |

### D02

| ID | Control | Concrete operation |
| --- | --- | --- |
| C157 | All / Unread / Archived / Spam | Filter private inbox |
| C158 | Search messages | Bounded search in authorized original messages |
| C159 | Next / Previous | Page private inbox |
| C160 | Select enquiry | Open detail and explicitly mark unread as read once |
| C161 | Preview / Download attachment | Authorize message-attachment relationship; safe private response |
| C162 | Internal note | Edit draft value |
| C163 | Reply message | Edit draft value |
| C164 | Save note | Persist a private author/time-linked note |
| C165 | Link client | Review suggested duplicate and bind selected existing client |
| C166 | Create client | Open reviewed prefilled client form, then allocate once |
| C167 | Create job | Open linked source brief as a private draft |
| C168 | Create quote | Open linked private quote draft |
| C169 | Send reply | Send using configured SMTP; record accepted/failed/unknown delivery honestly |
| C170 | Archive / Restore enquiry | Reversible state change |
| C171 | Mark spam / Restore | Reversible moderation flag |
| C172 | Reply by email client (optional) | Open mailto; do not mark delivered automatically |

### D03

| ID | Control | Concrete operation |
| --- | --- | --- |
| C173 | All / Individuals / Companies | Filter type projection without destroying underlying Customer/Company |
| C174 | Client search | Bounded number/name/email/company query |
| C175 | Profile Overview / Jobs / Quotes / Invoices / Notes / Files / Activity | Select authorized linked panel |
| C176 | Client status | Filter LEAD/ACTIVE/INACTIVE/ARCHIVED |
| C177 | New client | Open empty client draft |
| C178 | Open client row | Read authorized client profile |
| C179 | Save client / Edit | Validate and persist reviewed fields; allocate only on create |
| C180 | Create job | Open customer-linked job draft |
| C181 | Create quote | Open linked quote draft |
| C182 | Add note / Save note | Persist private author-linked note |
| C183 | Archive / Restore client | Reversible state with financial references preserved |
| C184 | Export clients | Create scoped private sanitized export and audit |
| C185 | Individual / Company type | Edit draft value |
| C186 | Company name / linked company | Edit draft value |
| C187 | First name / Last name / contact name | Edit draft value |
| C188 | Email | Edit draft value |
| C189 | Phone / secondary phone | Edit draft value |
| C190 | Street / Postcode / City / Country | Edit draft value |
| C191 | Preferred language | Edit draft value |
| C192 | Source | Edit draft value |
| C193 | Private notes | Edit draft value |

### D04

| ID | Control | Concrete operation |
| --- | --- | --- |
| C194 | All services / Websites / 3D / PC | Filter existing serviceType |
| C195 | Board / List | Switch same data presentation |
| C196 | Job status / dates / client | Bounded current enum/date query |
| C197 | Detail Details / Tasks / Files / Activity | Open selected job panel |
| C198 | New job | Open job creation draft |
| C199 | Save draft job / Save changes | Validate relation and service-specific fields; detect stale version |
| C200 | Move stage | Change authorized production stage with keyboard alternative |
| C201 | Mark ready | Record production readiness; no auto billing |
| C202 | Complete / Cancel job | Reviewed business transition preserving history |
| C203 | Open quote | Read linked quote revision |
| C204 | Create invoice | Reuse existing active draft or create one explicit linked draft |
| C205 | Add task | Open job-linked task draft |
| C206 | Create portfolio draft | Select publishable copy/media and strip private details |
| C207 | Upload job file | Private scoped file flow |
| C208 | Download job file | Authorize association and private download |
| C209 | Remove file association | Reviewed association removal/retention decision |
| C210 | Linked client / company | Edit draft value |
| C211 | Job title | Edit draft value |
| C212 | Service category | Edit draft value |
| C213 | Due/service date and time | Edit draft value |
| C214 | Status | Edit draft value |
| C215 | Description / private notes / customer-visible notes | Edit draft value |
| C216 | Website brief | Edit draft value |
| C217 | PC device details | Edit draft value |
| C218 | Print dimensions L/W/H and units | Edit draft value |
| C219 | Print quantity / material / colour | Edit draft value |
| C220 | Selected model | Edit draft value |
| C221 | Print estimate hours / grams | Edit draft value |
| C222 | Checklist item | Edit draft value |
| C223 | Catalogue service picker | Edit draft value |
| C224 | Quantity / unit / agreed unit price | Edit draft value |
| C225 | Tax treatment / rate / billing period / price confirmed | Edit draft value |
| C226 | Internal unit cost | Edit draft value |

### D05

| ID | Control | Concrete operation |
| --- | --- | --- |
| C227 | Quotes / Invoices | Switch private resource list |
| C228 | Draft / Sent / Accepted / Declined / Expired | Filter quote status |
| C229 | Search quote / client / date | Bounded private search |
| C230 | New quote | Create linked private draft with fresh conversion key |
| C231 | Save quote draft | Validate snapshots and draft version |
| C232 | Preview quote | Render draft without sending/accepting |
| C233 | Send quote | Final review and tracked SMTP acceptance; freeze sent revision |
| C234 | Record acceptance | Record exact revision/date/source evidence |
| C235 | Record decline / expire | Reviewed status with reason |
| C236 | Revise sent quote | Create new revision preserving old agreed text |
| C237 | Convert accepted quote to job | Idempotently create or return linked job |
| C238 | Create invoice from accepted quote | Reviewed idempotent draft from accepted snapshot |
| C239 | Client / recipient | Edit draft value |
| C240 | Valid until | Edit draft value |
| C241 | Service items / qty / unit / price / tax | Edit draft value |
| C242 | Scope / exclusions / notes EN and DE | Edit draft value |
| C243 | Acceptance source / date / reference | Edit draft value |

### D06

| ID | Control | Concrete operation |
| --- | --- | --- |
| C244 | Invoice search / date | Bounded number/client/date query |
| C245 | Document state | DRAFT/ISSUED/CANCELLED |
| C246 | Payment state / Overdue | Derived UNPAID/PARTIAL/PAID and due positive balance |
| C247 | Create invoice | Open empty/linked draft; allocate legal number only on issue |
| C248 | From accepted quote / job | Return unique active linked draft or create reviewed one |
| C249 | Save draft | Validate translated fields, recipient, lines and version under lock |
| C250 | Preview PDF | Render draft DE first EN second; no number allocation |
| C251 | Issue invoice | Review missing requirements then lock/validate/freeze/allocate exactly once |
| C252 | Customer / job links | Edit draft value |
| C253 | Individual / Company billing recipient | Edit draft value |
| C254 | Recipient name / company / address / email | Edit draft value |
| C255 | Invoice / due / service dates | Edit draft value |
| C256 | Service name EN / DE | Edit draft value |
| C257 | Description EN / DE and unit EN / DE | Edit draft value |
| C258 | Catalogue search | Edit draft value |
| C259 | Line quantity / price / price mode | Edit draft value |
| C260 | Tax treatment | Edit draft value |
| C261 | Notes EN / DE | Edit draft value |
| C262 | German + English PDF (fixed) | Edit draft value |

### D07

| ID | Control | Concrete operation |
| --- | --- | --- |
| C263 | Download PDF / Preview issued PDF | Return authorized stored original bytes; no historical rerender |
| C264 | Record payment | Lock invoice, validate positive amount<=remaining, idempotent record |
| C265 | Save payment | Persist validated manual payment and return true balance |
| C266 | Create correction / Cancel invoice | Reviewed compliant linked correction preserving original snapshot |
| C267 | View payment history / Activity | Read ledger and document transitions |
| C268 | Payment amount | Edit draft value |
| C269 | Payment date | Edit draft value |
| C270 | Payment method / reference / note | Edit draft value |
| C271 | Correction reason | Edit draft value |

### D08

| ID | Control | Concrete operation |
| --- | --- | --- |
| C272 | Project category / status | Filter existing category and DRAFT/PUBLISHED/ARCHIVED |
| C273 | Search / display order | Bounded project search and safe order |
| C274 | EN / DE / UK / RU / SK / FR | Edit chosen localized field, preserve other keys |
| C275 | New project | Open project draft |
| C276 | Edit project | Read authorized editable project |
| C277 | Save draft | Persist validated fields/translations/media selection |
| C278 | Preview public portfolio / project | Authenticated non-indexable preview, actual published route separate |
| C279 | Publish project | Review public text/media/rights then publish and invalidate projections |
| C280 | Archive / Unpublish / Restore draft | Reversible status, immediate public hide and media checks |
| C281 | Add gallery images | Upload approved owner portfolio images with scoped limit |
| C282 | Remove gallery image | Review association removal, preserve unrelated files |
| C283 | Reorder / choose cover | Save explicit media order/cover belonging to project |
| C284 | Create from completed job | Reviewed sanitized draft; no client info automatically |
| C285 | Title / type / summary / description / role / work list | Edit draft value |
| C286 | Slug | Edit draft value |
| C287 | Category | Edit draft value |
| C288 | Status | Edit draft value |
| C289 | Display order / curated homepage selection | Edit draft value |
| C290 | Completion date / tools / website / GitHub | Edit draft value |
| C291 | SEO title / description / social image | Edit draft value |
| C292 | Cover image / localized alt | Edit draft value |

### D09

| ID | Control | Concrete operation |
| --- | --- | --- |
| C293 | All / Framer templates / 3D models | Filter Product type |
| C294 | Product search / state / sort | Bounded published/private listing query |
| C295 | New product | Open draft listing |
| C296 | Save draft product | Validate actual listing/links/license/translation fields |
| C297 | Add product images | Owner-scoped actual preview assets |
| C298 | Preview product | Private non-indexable preview |
| C299 | Publish product | Verify actual availability/license/destination; explicit release |
| C300 | Archive product | Hide listing/purchase action, preserve aliases/history |
| C301 | Open merchant / demo | Open validated URL, no inferred synchronization |
| C302 | Product name / type / slug | Edit draft value |
| C303 | Description / included files / formats | Edit draft value |
| C304 | Price / currency / availability | Edit draft value |
| C305 | License summary | Edit draft value |
| C306 | Preview / external purchase URL | Edit draft value |
| C307 | Visibility and language tabs | Edit draft value |

### D10

| ID | Control | Concrete operation |
| --- | --- | --- |
| C308 | Today / Upcoming / Completed | Filter authoritative due/state |
| C309 | List / Calendar | Render same records |
| C310 | Priority / linked job / date range | Bounded task filters |
| C311 | Add task | Open linked private draft |
| C312 | Save task / Edit | Validate title/due/links/version |
| C313 | Mark complete / Undo | Reversible persisted completion |
| C314 | Set reminder (conditional) | Schedule only when real delivery service exists |
| C315 | Title / note | Edit draft value |
| C316 | Linked client/job | Edit draft value |
| C317 | Due date/time and zone | Edit draft value |
| C318 | Priority / state | Edit draft value |
| C319 | Reminder optional | Edit draft value |

### D11

| ID | Control | Concrete operation |
| --- | --- | --- |
| C320 | Websites / 3D / PC / section | Filter catalogue without rewriting old categories |
| C321 | Search services | Code plus actual localized text |
| C322 | Language tabs | Edit actual translation, keep other locale values |
| C323 | New service / section | Create code-unique draft row |
| C324 | Save service / all changes | Atomic validated moderate bulk update; row errors identified |
| C325 | Duplicate service | New unique code, explicit review |
| C326 | Archive / deactivate service | Retain historic snapshots; hide future picker default |
| C327 | Calculate print estimate | Compute explicit costs/markup or margin; no mutation |
| C328 | Use estimate in draft quote | Copy reviewed amounts once, configured tax separate |
| C329 | Code / category / display order / active | Edit draft value |
| C330 | Name / note / unit / price mode | Edit draft value |
| C331 | Default numeric price / display string | Edit draft value |
| C332 | Filament grams / price per kg | Edit draft value |
| C333 | Print hours / machine rate / labour hours / rate | Edit draft value |
| C334 | Fixed costs / batch quantity / allowance | Edit draft value |
| C335 | Markup % / target margin % | Edit draft value |

### D12

| ID | Control | Concrete operation |
| --- | --- | --- |
| C336 | Business / Invoices / Website / Languages / Uploads / Integrations | Open selected settings section |
| C337 | Save settings | Validate owner-confirmed business defaults; future-document effect only |
| C338 | Upload logo / portrait | Trusted owner asset, preserve original logo; actual face only |
| C339 | Preview desktop / mobile | Render unpublished settings/content without public mutation |
| C340 | Publish website copy | Review schema/translations and public facts |
| C341 | Connect integration (conditional) | Supported scoped service flow only, no fake connected state |
| C342 | Business name / public email / phone / address | Edit draft value |
| C343 | Invoice/client/job numbering | Edit draft value |
| C344 | Currency / timezone / payment terms | Edit draft value |
| C345 | Tax mode / identifier / statements DE and EN | Edit draft value |
| C346 | Bank account holder / IBAN / BIC / bank name | Edit draft value |
| C347 | Payment instructions DE and EN | Edit draft value |
| C348 | Languages | Edit draft value |
| C349 | Upload policy | Edit draft value |
| C350 | About biography / portrait crop | Edit draft value |
| C351 | Integration settings | Edit draft value |

### D13

| ID | Control | Concrete operation |
| --- | --- | --- |
| C352 | Login email / password / existing secret phrase | Edit draft value |
| C353 | Show/hide credential | Edit draft value |
| C354 | Two-factor code (conditional) | Edit draft value |
| C355 | Recovery token (conditional) | Edit draft value |
| C356 | Sign in | Rate-limited Argon2 verification; fresh opaque session |
| C357 | Forgot password (conditional) | Generic response; actual expiring recovery flow only |
| C358 | Change password | Reauthenticate; updated hash and session policy |
| C359 | Set up MFA (conditional) | Verify real TOTP/WebAuthn; recovery-code review |
| C360 | Revoke session | Owner-authorized selected session termination |
| C361 | Session expired / Back to sign in | Return to login; preserve only safe nonfinancial draft policy; recheck next mutation |

### D14

| ID | Control | Concrete operation |
| --- | --- | --- |
| C362 | Export clients/jobs/invoices CSV | Scoped private export, neutralize formula injection and audit |
| C363 | Export uploaded files | Authorized aggregate archive with safe paths; protected expiry |
| C364 | Download export | Authorize current owner and expiry; no public URL |
| C365 | Configure backup (conditional) | Actual backup policy/provider setup; no false success |
| C366 | Review restore | Display source/time/environment and plan; no autonomous overwrite |
| C367 | Account / Data / Activity | Select authorized settings panel |
| C368 | Activity date / action / entity | Bounded audit filters |

### D15

| ID | Control | Concrete operation |
| --- | --- | --- |
| C369 | Approve and publish review | Check consent/media/actual text; explicit moderation |
| C370 | Keep pending | Persist pending review without publication |
| C371 | Archive / reject review | Reversible moderation with reason |
| C372 | Open website content page | Read corresponding editor, not auto publish |
| C373 | Pending / Published / Archived | Filter Review state |
| C374 | Select review | Read original text/media permission |
| C375 | Content language / page | Open chosen versioned content editor |

### D16

| ID | Control | Concrete operation |
| --- | --- | --- |
| C376 | Add expense / Save expense | Validate actual decimal amount/receipt/category and source |
| C377 | Attach receipt | Private scoped upload; safe type/size |
| C378 | Add payment | Open linked invoice payment action, not fake bank-sync |
| C379 | Export report | Scoped operational-period private export |
| C380 | Report date range / service / currency | Select coherent source period/category/currency |
| C381 | Payments / Expenses | Read selected operational ledger |
| C382 | Expense description / date / amount / currency | Edit draft value |
| C383 | Category / linked job / receipt | Edit draft value |

### SHARED-STATES

| ID | Control | Concrete operation |
| --- | --- | --- |
| C384 | Retry | Retry same bounded read/action only after known failure |
| C385 | Clear search | Reset filter query and cursor |
| C386 | Close drawer / Back | Return to list and restore originating focus |
| C387 | Save / Discard / Stay on page | Resolve unsaved draft explicitly |
| C388 | Cancel confirmation | Close without mutation |
| C389 | Confirm archive | Reversible authorized archival, never irreversible data purge |
| C390 | Upload cancel / retry | Bounded same reservation cleanup/retry |


## Appendix B. Unique asset prompts and acquisition briefs

Asset-register.json also contains lighting, materials, negative space, reuse restrictions and delivery policies. Shared illustration direction is navy/slate, restrained cyan, black/white PLA, physically plausible geometry and real lighting. Keep copy and measurements in native HTML/SVG.

### B01 - Original wordmark

Source: original-vector. Containers: public-header, live-footer, control-sidebar, login, invoice.

Acquire original /brand/icon.svg from deployed repo. Preserve vector geometry, white shape/cyan dot and proportions; do not ask imagegen to recreate logo. Exact original asset; no pseudo-logo or generated brand lettering.

Master: Original SVG; trusted derivatives only; ratio original445:106. Mobile: Retain original vector proportions and responsive display size; do not crop the brand mark..

Alt: TiLADYS.

### B02 - Circuit logo mark

Source: original-vector. Containers: footer-brand, footer-legal.

Acquire original /brand/logo.svg. Use decorative 78x58 and 118x88 displays matching live footer; invoice use only when requested. 

Master: Original SVG; ratio original. Mobile: Retain original vector proportions and responsive display size; do not crop the brand mark..

Alt: Decorative empty alt.

### BG01 - Public hero and CTA backgrounds

Source: native-css. Containers: all-public-heroes, contact-CTA.

Native CSS navy #071837 with restrained tone. Real text/buttons overlay; solid/controlled subtle background; avoid raster replacement. No generated text or per-page giant background downloads.

Master: No raster; ratio 16:9. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### BG02 - Live footer background

Source: native-css. Containers: all-public-footers.

Retain native radial and linear gradient from deployed globals.css. Radial blue accent 92%/38%; linear 110deg #001025,#041d3e,#00162f; preserve native layout. Latest user-approved footer overrides every generated one-row footer.

Master: No raster; ratio 16:9. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### BG03 - Dashboard surfaces

Source: native-css. Containers: control-canvas, cards, forms, sidebar.

Native CSS canvas #F4F7FA, white cards, navy sidebar, border #DBE4EE. Spacing/radius tokens; no desktop wallpaper or photographic admin background. 

Master: No raster; ratio 16:9. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### IC01 - Functional icon set

Source: native-vector. Containers: service-cards, forms, process, footer, control-actions.

Reuse Lucide icons and original existing social SVG. Consistent 18-24px line icons; decorative icon hidden when text names action; accessible label for icon-only controls. Do not generate icons or replace working branded social identifiers with random symbols.

Master: SVG; ratio 1:1. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G01 - Three-service home hero

Source: generate-illustration. Containers: P01.hero, P01.service-teasers.

Photorealistic professional TiLADYS marketing illustration, a tidy widescreen monitor, a restrained correctly assembled black PC tower and practical black/white PLA prints. Eye-level three-quarter desktop view, subjects grouped in right 55%; monitor behind organizer and generic small printed boat, tower right; no excessive RGB, plants only small visual balance Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: realistic visible fine FDM layers, matte charcoal chassis, subtle brushed desk, blank clean monitor for actual preview insertion. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Illustration of website creation, 3D printing and PC support.

### G02 - Website service hero

Source: generate-illustration. Containers: P03.hero, P01.website-card.

Photorealistic professional TiLADYS marketing illustration, a slim laptop or desktop monitor beside a phone showing blank neutral screen areas for real site-preview insertion. Three-quarter view, larger display back-left within right-side group, phone front-right; careful perspective and natural device proportions Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte black/glass device frames, neutral blue screen placeholder, discreet desk. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G03 - 3D printing collection hero

Source: generate-illustration. Containers: P04.hero, P01.print-card.

Photorealistic professional TiLADYS marketing illustration, a matte black compartment desk organizer, white tray, faceted white planter and white angled phone stand. Product group on navy tabletop, organizer rear-left, planter rear-right, stand front-right, tray foreground; authentic small-printer scale Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: plausible PLA FDM layers, matte black/white, no injection-moulded gloss. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Illustrative black and white PLA objects.

### G04 - PC support hero

Source: generate-illustration. Containers: P05.hero, P01.pc-card.

Photorealistic professional TiLADYS marketing illustration, a realistic black desktop computer with open side, installed fan cooler/RAM/GPU and neatly routed cables. Tower at right on wood/slate workbench, modest tools laid foreground; visible correctly attached hardware, no invented circuit architecture Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: steel mesh, real motherboard topology, restrained blue fan light, matte bench. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. No unsafe assembly, loose liquid, impossible connectors or fictitious GPU lettering.

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G05 - Portfolio hero

Source: generate-illustration. Containers: P06.hero.

Photorealistic professional TiLADYS marketing illustration, a monitor with a blank preview insert, simple white printed pen cup/boat and small plant. Calm right-weighted composition with large negative space left; symbolically digital and physical work, not client proof Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: fine-layer PLA, matte monitor, navy desk. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G06 - About workbench hero

Source: generate-illustration. Containers: P10.hero.

Photorealistic professional TiLADYS marketing illustration, a modest desk with task lamp, closed laptop, pen cup and two white printed objects. Eye-level warm workplace, grouped at right; lamp bends over laptop; small plant/pegboard optional, left remains navy Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: black lamp, wood/slate surface, ordinary paper and layered PLA. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. This is illustrative workspace, not a claim of an actual TiLADYS office.

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G07 - Contact workbench hero

Source: generate-illustration. Containers: P11.hero.

Photorealistic professional TiLADYS marketing illustration, an inviting clear desk with closed laptop, pen holder and small plant. Right-grouped calm workspace with chair edge, no readable slogan on wall; left blank for HTML contact headline Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: muted wood, navy wall, matte hardware. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. No wall poster with baked copy; no fictitious office location or contact information.

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G08 - Optional legal-page illustration

Source: generate-illustration. Containers: P12.legal-hero.

Photorealistic professional TiLADYS marketing illustration, subtle brass balance scale and neutral books on a navy surface. Small restrained right-side still life, no symbols implying legal certification; optional, default legal header is text-only Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: brushed brass, blank-cover books. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Optional decorative asset only; no generated legal text, firm insignia or certification.

Master: 2400x1350 master; responsive 1600/1200/800/480 derivatives; ratio 16:9. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G09 - Compartment desk organizer concept

Source: generate-illustration. Containers: P04.gallery, P07.example, D08.example, D09.example.

Photorealistic professional TiLADYS marketing illustration, a black PLA desk organizer with several open rectangular compartments holding ordinary pens/scissors. Centered three-quarter product photo on quiet desk, whole object visible, no hands; edge structure plausibly printable Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte black layered PLA, clean but not falsely perfect surfaces. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Concept illustration of a black printed desk organizer.

### G10 - Faceted white planter concept

Source: generate-illustration. Containers: P04.gallery, P06.example, D09.example.

Photorealistic professional TiLADYS marketing illustration, a white faceted planter with small green plant. Centered three-quarter composition, neutral wood/slate table, soft background, crop contains full planter lip/base Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: white layered PLA, clear planar facets, soil hidden naturally. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G11 - White phone stand concept

Source: generate-illustration. Containers: P04.gallery, P09.example, D06.example.

Photorealistic professional TiLADYS marketing illustration, a minimal white angled PLA phone stand supporting a plain black phone. Three-quarter side view shows base and front lip, realistic centre of gravity, blank phone screen Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte white fine layers, black glass phone. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G12 - Black phone stand concept

Source: generate-illustration. Containers: P01.print-teaser, D06.example, D09.example.

Photorealistic professional TiLADYS marketing illustration, a black ribbed minimalist phone stand without or with a plain phone. Centered front three-quarter product view; whole base/support visible; simple feasible geometry Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: charcoal PLA with modest ridges, no glossy impossible fins. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G13 - Cable clip concept

Source: generate-illustration. Containers: P04.gallery, P04.model-card.

Photorealistic professional TiLADYS marketing illustration, small black and white PLA clips securing an ordinary cable. Macro three-quarter desk photo, clip openings mechanically plausible; separate clean single-object variant for model card Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: layered PLA, real cable bend and shadows. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G14 - Electronics enclosure concept

Source: generate-illustration. Containers: P04.gallery, P07.example.

Photorealistic professional TiLADYS marketing illustration, a compact white PLA rectangular electronics enclosure with ventilation slots and screw holes. Three-quarter clean tabletop view, enclosure whole and proportionate; optional lid shown slightly separated Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte layered PLA, plausible wall thickness/slots. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. No claim this is an actual certified safety enclosure or electrical product.

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G15 - Hex-pattern pen cup concept

Source: generate-illustration. Containers: P04.model-card, P01.print-card.

Photorealistic professional TiLADYS marketing illustration, a white cylindrical PLA pen cup with honeycomb surface pattern. Clean product-only three-quarter crop, intact printable cell walls and flat base; optional pens separate Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: visible FDM layers and realistic wall geometry. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G16 - Decorative gear concept

Source: generate-illustration. Containers: P01.model-teaser, P07.related.

Photorealistic professional TiLADYS marketing illustration, a small matte gray or black PLA decorative gear. Centered three-quarter view, plausible consistent tooth pattern; not presented as a precision drive component Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: layered PLA, subtle shadows. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Illustrative decorative object, not validated functional engineering geometry.

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G17 - Generic miniature boat concept

Source: generate-illustration. Containers: P01.hero, P07.related, P09.example.

Photorealistic professional TiLADYS marketing illustration, an original simple white PLA miniature toy boat with modest cabin. Three-quarter product angle, fine visible layers and ordinary scale; use original generic design rather than a copied branded benchmark model Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte white PLA, layered deck and hull. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Respect model rights; no assumption that benchmark model licences permit resale or redistribution.

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G18 - Porous decorative sphere concept

Source: generate-illustration. Containers: P10.hero.

Photorealistic professional TiLADYS marketing illustration, a white PLA open-pattern decorative sphere. Small desk-scale rounded object with structurally coherent connected walls; soft shadows, no complex scientific interpretation Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: white layered PLA, natural openings. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G19 - Black and white PLA spools

Source: generate-illustration. Containers: P04.materials.

Photorealistic professional TiLADYS marketing illustration, two ordinary unbranded black and white PLA spools. Side-by-side balanced product crop, spool hubs and filament winding plausible; adequate room for separate text labels Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: plastic spools and layered filament winding. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2100x1400; ratio 3:2. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Black and white filament spools.

### G20 - Sketch and caliper helper photo

Source: generate-illustration. Containers: P11.3d-helper, D04.print-helper.

Photorealistic professional TiLADYS marketing illustration, an unlabelled hand sketch of a simple printable object beside a digital caliper and small neutral print. Top-down or 30-degree overhead view, paper right, object left, caliper lays safely in foreground; no precise dimensions baked in Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: paper pencil lines, metal caliper, PLA. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Exact dimensional diagrams/labels are native SVG overlays separately verified; imagegen must not supply measurements.

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G21 - Local support workspace illustration

Source: generate-illustration. Containers: P05.local-card, P10.local-card.

Photorealistic professional TiLADYS marketing illustration, a clean modest PC workbench with monitor, chair and basic tools. Wide straightforward desk view, no office signage/address; calm daylight, visually practical Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: ordinary wood, black devices, neat tools. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Illustration, not a photograph of the actual premises.

Master: 2400x1500; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G22 - Remote support illustration

Source: generate-illustration. Containers: P05.remote-card, P10.remote-card.

Photorealistic professional TiLADYS marketing illustration, a laptop with neutral monitor-link icon placeholder beside a headset. Three-quarter simple worktable view, no remote-access software logos or private data, scene light enough for thumbnail Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte laptop, fabric headset, wood/slate. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2400x1500; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G23 - Education decorative still life

Source: generate-illustration. Containers: P10.education.

Photorealistic professional TiLADYS marketing illustration, ordinary unbranded engineering/electronics notebooks and books near a small plant. Close desk crop, stacked plain spines, notebook and pencil; educational context without readable degree claims Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: paper/bookcloth, muted wood. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. No fake university diploma, readable book title or certification.

Master: 2400x1500; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G24 - Setup/software service thumbnail

Source: generate-illustration. Containers: P05.setup-card.

Photorealistic professional TiLADYS marketing illustration, a clean laptop with a neutral blank blue desktop screen. Three-quarter device shot, screen ready for actual licensed software capture inserted later, no invented OS logos Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: black glass/metal and neutral desk. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G25 - Troubleshooting thumbnail

Source: generate-illustration. Containers: P05.troubleshooting-card.

Photorealistic professional TiLADYS marketing illustration, a laptop with a simple neutral diagnostic blue screen placeholder. Device close-up, no gibberish error text; illustrate problem-solving visually without making screen content evidence Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: ordinary laptop glass and matte frame. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G26 - Cleaning thumbnail

Source: generate-illustration. Containers: P05.cleaning-card, D04.pc-example.

Photorealistic professional TiLADYS marketing illustration, a careful hand using a soft brush around an unpowered open PC fan. Close three-quarter hardware shot, realistic fingers and contact position; components plausible; no powered wet cleaning Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: brush bristles, metal heatsink, matte plastic. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Do not depict dangerous powered repairs, inappropriate liquid or impossible hand/tool geometry.

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G27 - SSD/RAM upgrade thumbnail

Source: generate-illustration. Containers: P05.upgrade-card.

Photorealistic professional TiLADYS marketing illustration, a compatible-looking RAM module and SSD near a PC motherboard. Clean macro with correctly oriented slots, no made-up vendor lettering; do not imply compatibility with every device Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: PCB, copper contacts, matte heat spreader. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G28 - Backup/data thumbnail

Source: generate-illustration. Containers: P05.backup-card.

Photorealistic professional TiLADYS marketing illustration, an external drive beside a laptop with blank safe screen. Simple desk close-up, cable physically connected plausibly, room for native data-transfer icon overlay Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: brushed drive case, black cable, glass screen. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. No personal filenames or fake encryption certification.

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G29 - Remote service thumbnail

Source: generate-illustration. Containers: P05.remote-card-small.

Photorealistic professional TiLADYS marketing illustration, a laptop showing an unlabelled monitor-link visual and headset. Quiet straight-on three-quarter crop, native icon may be added separately instead of baked in Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matte hardware/soft desk. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. 

Master: 2000x1250; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G30 - Generic website-preview device carrier

Source: generate-illustration. Containers: P03.gallery-concepts, P01.selected-work-placeholder.

Photorealistic professional TiLADYS marketing illustration, a neutral laptop/tablet displaying a blank bright rectangle. Three-quarter screen perspective with generous inset, suitable for later authentic screenshot composite; no website company names Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: matteblackframe,softneutral desk. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Real gallery uses actual screenshots; this is illustration carrier only.

Master: 2400x1500; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### G31 - Template preview carrier

Source: generate-illustration. Containers: P03.templates, P08, P09, D09.

Photorealistic professional TiLADYS marketing illustration, desktop and mobile neutral device frames with blank preview inserts. Clean front-ish paired frames, desktop behind mobile right; use actual owned template screens later Soft studio/daylight from upper left; gentle fill, controlled shadows; no neon glow. Materials: black frame/clean glass, light neutral backdrop. Brand palette navy #071837, restrained cyan #7be0df, white and charcoal. Clean composition, consistent colour grading, realistic scale and perspective. No logos, watermarks, baked interface copy or dimensional labels. Do not invent Framer products or availability; no fake purchase price.

Master: 2400x1500; ratio 16:10. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### R01 - Founder portrait

Source: real-user-photo. Containers: P01.founder-teaser, P10.portrait, D13.account, D12.content-editor.

Acquire a real approved photograph of Vladyslav Titov. Small 240x300 desktop crop, natural head/shoulders, focal point stored; 480x600 or 960x1200 derivative; preserve actual identity. Never replace with the generated stranger shown in some mockups.

Master: Original photo plus 960x1200 max webmaster; ratio 4:5. Mobile: Use the same 4:5 head-and-shoulders portrait crop at compact display size; retain face, identity and focal point. Never use a generic 4:3 hero crop.

Alt: Vladyslav Titov, founder of TiLADYS.

### R02 - Mongoose Signs website

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R03 - DonetsFit website

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R04 - DonetsFit Calculator

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R05 - Dual-boot workstation

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R06 - ETIT/VPU virtual tour

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R07 - TiLADYS business card

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R08 - JobAdys

Source: actual-portfolio-media. Containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor.

Acquire actual approved project screenshots/photos from current published Project media. Keep screen/photo intact, produce 16:10 thumbnail and original detail gallery; no customer-private data; redact only with reviewed derivatives. Generated cafe/physio/plant-shop examples do not replace these verified project names.

Master: Source-dependent; target 1600-wide detail; ratio source plus 16:10. Mobile: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.

Alt: Localized actual project title and subject.

### R09 - Real Framer templates

Source: actual-product-media. Containers: P03.template-card, P08.catalogue, P09.detail, D09.product-editor.

Acquire screenshots and preview URLs for each actual owned published Framer template. Desktop/mobile/page previews, ordered images and thumbnail; title/price/licence confirmed separately. Studio/Nova/Fork mockup names not assumed real products.

Master: 1600-2400-wide originals; ratio 16:10 plus mobile. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### R10 - Real completed print photos

Source: real-print-photo. Containers: P04.gallery, P06.grid, P07.print-detail, D08, D04.job-files.

Acquire genuine photos of the user's completed black/white prints. Same consistent desk lighting where possible; before/during/after metadata kept private; approved public derivative selected explicitly. No generated geometry sold as completed client work; check model licence and customer permission.

Master: Original plus 1600-wide; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### R11 - Real downloadable model previews

Source: actual-model-render. Containers: P04.model-card, P08, P09, D09.

Render the actual owned/licensed STL or other supported model in CAD/rendering software. Consistent camera/background; show actual shape and scale where verified; native SVG dimensions separately. A pretty generated product does not prove the downloadable mesh matches.

Master: 2000x1500; ratio 4:3. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### R12 - Customer enquiry/review attachments

Source: customer-upload. Containers: D02.private-inbox, D15.review, P11.optional-approved-review.

Original customer files preserved privately with safe derivatives. Private preview authorization; review photos public only after moderation/permission; labels/filenames treated as text. Never regenerate customer evidence or publish private inbox attachments.

Master: Bounded original; safe image variants; ratio source. Mobile: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text.

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### N01 - Profile placeholder and empty states

Source: native-vector-css. Containers: D01.profile, D13.account, all-empty-states.

Native initials VT circle, simple icon and explanatory HTML text. Neutral circle tint, no mocked face; labelled icon and empty-state CTA. The generated profile faces are discarded.

Master: SVG/CSS; ratio 1:1. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.

### N02 - Charts, sketches, measurements and PDF previews

Source: native-data-visual. Containers: D11.estimator, D16.reports, P11.dimension-helper, D06.pdf-preview.

Render actual data with native UI/SVG; PDF thumbnail from actual DE-first snapshot. No AI chart numbers; precise unit labels; German page first, English second; chart legend and table fallback. Do not copy tax rates, amounts or fake Swiss addresses from mockups.

Master: Responsive SVG / actual PDF; ratio 16:9. Mobile: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls..

Alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt.


## Appendix C. Acceptance matrix

All results are planned, not executed during this analysis. Use isolated synthetic records, mocked mail and controlled upload fixtures. P0 means security/financial/data-integrity release blocker; P1 means core-flow release blocker; P2 means feature and quality verification.

| ID | Priority / area | Scenario | Expected result |
| --- | --- | --- | --- |
| A01 | P0 / Confidentiality | Anonymous requests a client, job, invoice, PDF or private file endpoint | 401/403 or login; no private data in response, cache or search index. |
| A02 | P0 / Files | Substitute an attachment ID from a different enquiry | Reject 404/403 after checking the parent relationship; no unrelated bytes. |
| A03 | P0 / Publication | Request draft or archived project media, including resize URLs | Public 404; neither original nor derivative is served. |
| A04 | P0 / CSRF | Submit a cookie-authenticated mutation from an untrusted or missing Origin | Reject under the exact origin policy; no mutation. |
| A05 | P0 / Issuance | Two concurrent issue requests followed by a retry after response loss | One invoice number, immutable PDF and issuance event. |
| A06 | P0 / Draft lock | Save a draft concurrently with issuance | Issued data and bytes remain unchanged; late save returns conflict. |
| A07 | P0 / Payments | Concurrent partial payments together exceed the remaining balance | Only permissible amount commits; conflicting request fails, no hidden negative balance. |
| A08 | P0 / Payments | Retry the same payment after response loss | Return the same payment using idempotency; no duplicate ledger entry. |
| A09 | P0 / Snapshots | Edit client, catalogue and bank settings after invoice issuance | Issued PDF, checksum, number and totals stay unchanged. |
| A10 | P0 / Invoice DE-first | Preview and issue a short bilingual invoice | Complete German page 1 and English page 2; same invoice identifier and amounts. |
| A11 | P0 / Invoice pagination | Use long German text and one exceptionally long invoice line | Readable continuation pages; English begins on a new page after the complete German section. |
| A12 | P0 / Legacy invoices | Deploy the German-first renderer with historical issued PDFs | Previously stored PDFs remain byte-identical; no automatic regeneration. |
| A13 | P0 / Tax gate | Issue with unconfirmed tax settings or missing required translations | 422 with actionable fields; draft preserved and no tax assumptions. |
| A14 | P0 / Uploads | Upload a spoofed image signature or excessive pixel dimensions | Reject or quarantine before use; bounded CPU, memory and decoder work. |
| A15 | P0 / Uploadfinalization | Finalize another actor's reservation or an oversized stored object | Reject; no attachment or client association created. |
| A16 | P0 / SQL/XSS | Put SQL and HTML payloads in messages, names, filters and filenames | Render escaped text; no SQL execution or script; safe download filename. |
| A17 | P0 / Restore | Restore an isolated database and matching object backup | Recover expected synthetic records, files and hashes without production overwrite. |
| A18 | P1 / Unicode | Submit English, Ukrainian and Russian messages with newlines and emoji | Store and display the original exactly; reply language remains independent. |
| A19 | P1 / Photos | Upload three 5MiB photos, one 5MiB+1-byte file and a 15MiB+1-byte total | Accept exact boundaries; reject excess; metadata request stays within platform limits. |
| A20 | P1 / Mobilephotos | Select HEIC, a corrupt image and a large phone photo on weak network | Clear conversion/rejection path, bounded processing and preserved form. |
| A21 | P1 / Contactidempotency | Double-click Send and lose the acknowledgement response | One enquiry per idempotency key; retry returns the original receipt. |
| A22 | P1 / Mail | Persist an enquiry but fail to send the acknowledgement email | Retain enquiry and return saved status; no duplicate-producing browser failure. |
| A23 | P1 / Reply | SMTP accepts a reply but recording its result fails | Show accepted/uncertain state and reconcile; no blind resend. |
| A24 | P1 / Duplicateclient | Use the same email for a household or several company contacts | Offer duplicate review; no automatic merge or globally unique email failure. |
| A25 | P1 / Expiry | Expire a session while editing a private draft | No unauthorized mutation; recover safely, reauthenticate and recheck version. |
| A26 | P1 / Staleedit | Edit the same draft in two browser tabs | Reject stale save with revision conflict; no silent last-writer overwrite. |
| A27 | P1 / Numbers | Create clients, jobs and invoices concurrently at Berlin New Year | Unique numbers and correct business year using atomic sequences. |
| A28 | P1 / Catalogue | Select FROM, PERCENTAGE or MONTHLY catalogue pricing | Explicit agreed amount and valid period; never invoice a raw display string. |
| A29 | P1 / Quote | Accept an old or expired quote revision and retry conversion | Reject or renew after review; bind exact accepted revision and convert once. |
| A30 | P1 / Relations | Attach an invoice to a job belonging to another client | Reject the invalid relationship; no financial cross-link. |
| A31 | P1 / SEO | Rename a published project slug several times | All old aliases redirect directly to the canonical route; no draft leak. |
| A32 | P1 / Languages | Use a missing translation or a legacy ua language alias | Canonical Ukrainian remains uk; no false hreflang or indexable fallback duplication. |
| A33 | P1 / Footer | Inspect the footer on desktop, tablet, phone and at 200% zoom | Retain live footer identity, verified links and readable layout without overlap. |
| A34 | P1 / Menu | Open, scroll and close the phone menu using keyboard and navigation | Correct focus, visible content below header, no scroll bleed or hidden controls. |
| A35 | P1 / Stateerrors | Compare an empty list with a database outage | Distinct honest states; failure does not masquerade as lost client records. |
| A36 | P1 / Models | Upload invalid STL, enormous mesh, archive or G-code | Reject or privately quarantine per separate model policy; never execute on a printer. |
| A37 | P1 / Backuppolicy | Let provider restore history expire without an independent backup | Do not claim protection; require real backup and isolated restore evidence. |
| A38 | P1 / Runtime | Build both applications with deployed Node 24 and the actual lockfile | Required existing/new checks and builds pass with compatible settings. |
| A39 | P1 / Publication | Create a portfolio draft from a completed job containing private notes | Exclude confidential data; publish only explicitly approved media derivatives. |
| A40 | P1 / Bounds | Exercise rate limits across replicas and behind a shared public IP | Shared counters work with bounded limits and understandable retry guidance. |
| A41 | P2 / Externalstore | Open an unavailable template preview or purchase listing | Honest unavailable state; no invented stock, sales or synchronization. |
| A42 | P2 / TasksDST | Schedule an appointment in an ambiguous or nonexistent local DST time | Explicit timezone resolution; list and calendar agree. |
| A43 | P2 / Review | Moderate a review with private photos and malicious text | Check publication permission; safely render original; never publish private email. |
| A44 | P2 / Reports | Report invoices issued in a different period from their payments, with mixed currencies | Keep period bases and currency totals separate; no invented profit. |
| A45 | P2 / Exports | Export CSV containing formula payloads and a large file archive | Neutralize formulas; use bounded private expiring downloads and safe archive paths. |
| A46 | P2 / Estimate | Compare 20% markup with 20% margin and convert grams to kilograms | EUR15 cost gives EUR18 with markup or EUR18.75 with margin; clearly labelled. |
| A47 | P2 / Accessibility | Use keyboard, screen reader, zoom and reduced-motion preferences | Operable controls, visible focus, announced states and no reflow overlap. |
| A48 | P2 / Performance | Load realistic public media on a phone | Measure LCP, INP and CLS; use responsive derivatives with reserved aspect ratios. |
| A49 | P1 / Identity | Observe Neon managed-auth tables while custom login is active | Do not migrate identity or enable public admin registration without a separate decision. |
| A50 | P0 / Secrets | Inspect browser bundles, exports and diagnostic logs | No database URL, auth secret, SMTP password, bypass token or unintended private data. |
| A51 | P0 / Cancel/correction | Request invoice cancellation when payments already exist | Preserve original artifact and payment history; reviewed correction and balance treatment. |
| A52 | P1 / IssuedPDFmissing | Download an issued invoice whose original PDF bytes are missing | Specific conflict/operator recovery state; never rebuild from mutable current data. |
