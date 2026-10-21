# Canonical route and module coverage

IDs below follow the Analysis/control register, not the differently numbered dashboard boards. Every individual control has a separate row in [Control-coverage.md](Control-coverage.md). “Implemented” describes source behavior; actual executed assertions and limitations are in [Acceptance-results.md](Acceptance-results.md).

| Canonical ID | Route/module | Control IDs | Delivery and limits |
| --- | --- | --- | --- |
| Public shell | All `/{locale}` pages | C001–C011 | Three equal service areas, six locales, actual translation availability, query/hash preservation, mobile menu, focus/skip link |
| Footer | All public pages | C012–C028 | Original five-column source/brand/social/circuit geometry and contact configuration preserved |
| P01 | `/{locale}` | C029–C038 | Three areas, owner-curated published work, product pathways, compact genuine founder |
| P02 | `/{locale}/services` | C039–C041 | Three primary areas plus retained services |
| P03 | `/{locale}/services/websites` | C042–C050 | Website services, actual work, real published translated template cards and external actions |
| P04 | `/{locale}/services/3d-printing` | C051–C059 | File/idea/batch enquiry modes, dimensions/material guidance, actual work/models; model upload unavailable |
| P05 | `/{locale}/services/pc-laptop` | C060–C068 | Local/remote support, real service examples and anchor, regional context |
| Additional services | Existing business-it/Linux/design/digital and price routes | C069 | Existing service IDs/legacy redirect behavior retained |
| P06 | `/{locale}/portfolio` | C070–C076 | Parameterized paged search/category filters, explicit 3D, real published records and distinct empty/error states |
| P07 | `/{locale}/portfolio/[slug]` | C077–C086 | Published translated detail, gallery/dialog/zoom, related work, one-hop aliases |
| P08 | `/{locale}/products/framer`, `/products/3d-models` | C087–C090 | Real translated rights-reviewed records, search/page state, honest empty/unavailable states |
| P09 | `/{locale}/products/[slug]` | C091–C095 | Included files/license, confirmed price only, validated actual demo/merchant action, model enquiry source |
| P10 | `/{locale}/about` | C096–C097 | Actual founder, separate illustrative scene, local/online support actions |
| P11 | `/{locale}/contact` | C098–C115 | Original Unicode enquiry, allowlisted context, receipt/idempotency, bounded local direct-photo flow. Production photo provider/worker is blocked |
| P11 review | Review submission | C116–C121 | Optional capability unavailable; no fake public review or customer evidence |
| P12 | Legal routes, branded 404/error | C122–C125 | Existing legal text retained, compact TOC, usable navigation and honest failures |
| Admin shell | `/dashboard`, `/dashboard/search` | C126–C143 | Existing opaque-session auth, navigation/collapse, bounded global search, real notifications, EN/DE UI |
| D01 | `/dashboard` | C144–C156 | Actual counts/filtered follow-ups, decimal per-currency balances, quick draft actions, guarded task completion |
| D02 | `/dashboard/messages` | C157–C172 | Original text, read/archive/spam review, parent-bound attachments, reviewed client/job/quote handoff, durable mail outcomes. Real SMTP release verification remains external |
| D03 | `/dashboard/customers`, `/companies`, their details | C173–C193 | Existing CRM preserved, server-filtered client list, stale guards, profile section links, shared email permitted, bounded client lookup. Private file operations unavailable |
| D04 | `/dashboard/service-jobs` | C194–C226 | Shared filtered board/list records, service-specific brief, explicit print feasibility/inspection, linked quotes/tasks/activity and sanitized public draft. Private job/model file workflow blocked |
| D05 | `/dashboard/quotes`, `/quotes/[id]` | C227–C243 | Revisioned drafts, reviewed sharing record, frozen recipient/terms, exact acceptance evidence, expiry/reasons, one linked job/invoice draft. Sharing does not pretend to send mail |
| D06 | `/dashboard/invoices` | C244–C262 | Existing finance preserved; SQL-backed filters, standalone/job/accepted-quote drafts, stale invoice/settings review guards, fixed German→English PDF |
| D07 | Invoice detail/payments within invoices | C263–C271 | Stored original PDF, decimal locked/idempotent payments, history/activity. Correction/cancellation unavailable pending approved ledger semantics |
| D08 | `/dashboard/projects`, `/projects/[id]/preview` | C272–C292 | Draft-first upload, translated metadata, rights/publication review, private retention, both-origin withdrawal, ordering and explicit homepage curation |
| D09 | `/dashboard/products`, `/products/[id]/preview` | C293–C307 | Real CRUD, translated content/license, review/publish guards, private parent-bound uploads, safe external URLs, aliases/filter/order |
| D10 | `/dashboard/tasks` | C308–C319 | Persisted CRUD/revision, client/job relation, priority/date views, bounded calendar, IANA timezone/UTC and explicit DST occurrence, phone Back/Resume |
| D11 | `/dashboard/prices` | C320–C335 | Six-locale display text retained, archive/version guards, explicit structured rates/translated units and decimal print estimator; no automatic recurring charges |
| D12 | `/dashboard/settings`, invoice business settings | C336–C351 | Real billing settings and disclosed capability states; full website-copy/provider/integration editors remain unavailable rather than fabricated |
| D13 | `/login`, `/dashboard/settings/account` | C352–C361 | Existing password+secret flow, shared login counters, reauthenticated password/session operations and safe session DTO. MFA/recovery provider unavailable |
| D14 | `/dashboard/settings/data` | C362–C368 | Real audit filters/links, uncertainty follow-up, owner/session-bound expiring formula-safe CSV; large file archive and production restore unavailable |
| D15 | Optional reviews | C369–C375 | Explicitly unavailable; consent/moderation/storage not configured |
| D16 | Optional reports/expenses | C376–C383 | Explicitly unavailable; no invented profit, expenses or mixed-currency totals |
| Shared states | Across editors and public pages | C384–C390 | New workbenches have loading/error/empty/conflict/retry and retained drafts. Remaining older-editor interaction differences are recorded as partial controls |

Private APIs require the current session server-side; cookie-authenticated mutations enforce exact Origin. Public application projections exclude CRM/finance/private notes. Publication status and image parent/archive checks apply at serving time. Nothing in this matrix is production deployment approval.
