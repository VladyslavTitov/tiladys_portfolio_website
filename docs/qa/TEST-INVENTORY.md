# QA test inventory

2026-10-19. Scope: current working tree, two local production apps, isolated synthetic PostgreSQL. Owner source changes and prior Contact/Portfolio edits are preserved. No production URLs are tested.

## Environment and ownership

| Layer | Owner / environment | Coverage and risk |
|---|---|---|
| Public | apps/web, QA 3100 | All six locales; public routes, contact, filter history, publication/media boundaries; P1 |
| Control | apps/control, QA 3101 | Real credential login; every dashboard/API discovered below; financial operations synthetic only; P0/P1 |
| Data | packages/db; verified postgres:17-alpine, 127.0.0.1:55432/tiladys_rebuild_test | Shared schema, server validation and immutable billing; production identity unknown and never used |
| External | SMTP/storage disabled | Local processing and failure paths; real delivery requires isolated SMTP sandbox |
| Tooling | Node 22.23.1, npm 10.9.2, Next 16.3.8, React 19.1.1, Prisma 6.19.3 | Existing Node test runner; temporary Playwright core 1.64.1 / installed Chrome; no app dependency additions |

## Route inventory

PAGE auth is inherited from dashboard/layout.tsx even where the leaf has no guard. API guard markers are source discovery, not execution proof. Dynamic IDs are resolved with synthetic fixture IDs. Export tokens, absent records and preview IDs receive negative-path coverage when no fixture exists.

| App | Route | Methods | Leaf auth marker | Effect |
|---|---|---|---|---|
| web | `/[locale]/about` | PAGE | False | read/render |
| web | `/[locale]/contact` | PAGE | False | read/render |
| web | `/[locale]/impressum` | PAGE | False | read/render |
| web | `/[locale]` | PAGE | False | read/render |
| web | `/[locale]/portfolio/[slug]` | PAGE | False | read/render |
| web | `/[locale]/portfolio` | PAGE | False | read/render |
| web | `/[locale]/prices` | PAGE | False | read/render |
| web | `/[locale]/privacy` | PAGE | False | read/render |
| web | `/[locale]/products/[slug]` | PAGE | False | read/render |
| web | `/[locale]/services/[slug]` | PAGE | False | read/render |
| web | `/[locale]/services` | PAGE | False | read/render |
| web | `/[locale]/terms` | PAGE | False | read/render |
| web | `/api/contact` | POST | False | potential write |
| web | `/api/contact/uploads` | POST | False | potential write |
| web | `/api/public/media/[id]` | GET | False | read/render |
| web | `/api/public/product-media/[id]` | GET | False | read/render |
| control | `/api/admin/account` | GET, POST | True | potential write |
| control | `/api/admin/billing-settings` | GET, PUT | True | potential write |
| control | `/api/admin/catalogue/[id]` | PATCH | True | potential write |
| control | `/api/admin/catalogue` | GET | True | read/render |
| control | `/api/admin/companies/[id]` | PATCH | True | potential write |
| control | `/api/admin/companies` | GET, POST | True | potential write |
| control | `/api/admin/customers/[id]/notes` | POST | True | potential write |
| control | `/api/admin/customers/[id]` | GET, PATCH, DELETE | True | potential write |
| control | `/api/admin/customers` | GET, POST | True | potential write |
| control | `/api/admin/estimate` | POST | True | potential write |
| control | `/api/admin/export/[token]` | GET | True | potential write |
| control | `/api/admin/export` | POST, GET | True | potential write |
| control | `/api/admin/invoices/[id]/issue` | POST | True | potential write |
| control | `/api/admin/invoices/[id]/payments` | POST | True | potential write |
| control | `/api/admin/invoices/[id]/pdf` | GET | True | read/render |
| control | `/api/admin/invoices/[id]` | GET, PATCH | True | potential write |
| control | `/api/admin/invoices` | GET, POST | True | potential write |
| control | `/api/admin/messages/[id]/attachments/[attachmentId]` | GET, DELETE | True | potential write |
| control | `/api/admin/messages/[id]/draft` | POST | True | potential write |
| control | `/api/admin/messages/[id]/link` | GET, POST | True | potential write |
| control | `/api/admin/messages/[id]/reply` | POST | True | potential write |
| control | `/api/admin/messages/[id]/status` | PATCH | True | potential write |
| control | `/api/admin/prices` | POST, PUT | True | potential write |
| control | `/api/admin/products/[id]/images/[imageId]` | GET, DELETE | True | potential write |
| control | `/api/admin/products/[id]/images` | POST | True | potential write |
| control | `/api/admin/products/[id]` | PATCH | True | potential write |
| control | `/api/admin/products` | GET, POST | True | potential write |
| control | `/api/admin/projects/[id]/images/[imageId]` | GET | True | read/render |
| control | `/api/admin/projects/[id]/images` | POST | True | potential write |
| control | `/api/admin/projects/[id]` | PATCH, DELETE | True | potential write |
| control | `/api/admin/projects` | POST | True | potential write |
| control | `/api/admin/quotes/[id]` | GET, PATCH | True | potential write |
| control | `/api/admin/quotes` | GET, POST | True | potential write |
| control | `/api/admin/service-jobs/[id]/brief` | GET, PATCH | True | potential write |
| control | `/api/admin/service-jobs/[id]/portfolio` | POST | True | potential write |
| control | `/api/admin/service-jobs/[id]` | GET, PATCH | True | potential write |
| control | `/api/admin/service-jobs` | GET, POST | True | potential write |
| control | `/api/admin/tasks/[id]/complete` | POST | True | potential write |
| control | `/api/admin/tasks/[id]` | PATCH, GET | True | potential write |
| control | `/api/admin/tasks` | GET, POST | True | potential write |
| control | `/api/auth/login` | POST | False | potential write |
| control | `/api/auth/logout` | POST | False | potential write |
| control | `/api/public/media/[id]` | GET | False | read/render |
| control | `/api/public/prices` | GET | False | read/render |
| control | `/api/public/projects/[slug]` | GET | False | read/render |
| control | `/api/public/projects` | GET | False | read/render |
| control | `/dashboard/companies/[id]` | PAGE | True | potential write |
| control | `/dashboard/companies` | PAGE | True | read/render |
| control | `/dashboard/customers/[id]` | PAGE | True | potential write |
| control | `/dashboard/customers` | PAGE | True | potential write |
| control | `/dashboard/invoices` | PAGE | True | potential write |
| control | `/dashboard/messages` | PAGE | True | potential write |
| control | `/dashboard` | PAGE | True | read/render |
| control | `/dashboard/prices` | PAGE | True | potential write |
| control | `/dashboard/products/[id]/preview` | PAGE | True | read/render |
| control | `/dashboard/products` | PAGE | False | read/render |
| control | `/dashboard/projects/[id]/preview` | PAGE | True | read/render |
| control | `/dashboard/projects` | PAGE | True | potential write |
| control | `/dashboard/quotes/[id]` | PAGE | True | potential write |
| control | `/dashboard/quotes` | PAGE | False | read/render |
| control | `/dashboard/search` | PAGE | True | read/render |
| control | `/dashboard/service-jobs` | PAGE | True | potential write |
| control | `/dashboard/settings/[section]` | PAGE | True | potential write |
| control | `/dashboard/settings` | PAGE | False | read/render |
| control | `/dashboard/tasks` | PAGE | False | read/render |
| control | `/login` | PAGE | False | potential write |
| control | `/` | PAGE | True | read/render |

## Data entities

AdminUser, Session, Project, ProjectImage, PriceSection, PriceItem, NumberSequence, Company, Customer, CustomerNote, CustomerActivity, ServiceJob, BusinessBillingSettings, Invoice, InvoiceLine, InvoicePayment, ServiceJobLineItem, FileAsset, ContactMessage, VisitorDay, AuditLog, ContactAttachment, ContactRateLimit, ProjectSlugAlias, Quote, QuoteRevision, Product, ProductImage, ProductAlias, Task, EnquiryNote, IdempotencyRecord, UploadReservation, MediaObject, EmailOutbox, DeliveryAttempt, ExportArtifact

## Current capabilities and test selection

Public supports EN/DE/UK/RU/SK/FR. Control interface supports only English/German (`components/control-language.tsx`); other admin interface languages are NOT APPLICABLE, while multilingual project/customer/message content remains supported.

The owner-admin model has no tenant/least-privileged role hierarchy; all authenticated admins have the same business access. Relationship checks remain relevant (attachment parent, client/job/invoice association). A second admin is not a separate tenant.

MFA, bank synchronization, automatic reminders, structured e-invoices, reviews, expenses and website-copy modules are not configured/enabled. Model uploads are disabled. Production photo storage requires configuration. These capabilities are NOT APPLICABLE as working integrations; capability labels and denied paths remain testable. Provider backups are unverified.

No repository CI workflow was discovered. Release checklist includes proposed independent local/CI gates; this task does not provision infrastructure.

Public concrete service IDs: pc-laptop, websites, business-it, 3d-printing. The other nine historical service IDs redirect to these current services. Legacy service aliases are redirects. Product listing routes are resolved through products/[slug], not separate page files. Prices redirects to services.

Portfolio mapping: All Projects; Websites=web-development; 3D Printing=3d-printing; Linux & Servers=linux-servers; Service Works=all other/unknown internal IDs. Carousel removal is intentional; legacy phase1 carousel assertions are superseded, not a new regression.

## Planned gates

1. Preserve source checkpoint and baseline lint/types/default tests/build before any fixes.
2. Real-login auth, public route/SEO/link coverage, all private exported methods unauthenticated, business/API and guarded DB suites.
3. Actual bilingual PDF bytes including multipage and concurrent issuance; safe invoice and payment replays.
4. Playwright geometry at 320/375/390/430/768/1024/1280/1440/1920/2560; axe, keyboard and equivalent reflow/low heights.
5. Repeated production Lighthouse and targeted filter timing; security source review and bounded payloads.
6. Restore fixture publication/settings state, revoke QA sessions, source integrity comparison; commit QA-only scripts and reports.

Each evidence JSON/log records actual executed results. Coverage beyond those executions stays reviewed/blocked rather than PASS.
