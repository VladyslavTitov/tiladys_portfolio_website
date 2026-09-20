# TiLADYS changes — owner review before release

No deployment or database migration was performed. Changes require a normal review and release; the legal pages remain explicit incomplete drafts with `noindex`. Their routes and footer links remain intact. Draft legal pages are omitted from the sitemap.

## Configuration and rollout

1. Review `packages/db/prisma/migrations/20260920120000_private_contact_attachments/migration.sql`. It adds `ContactAttachment` (private PostgreSQL BYTEA, foreign key to inquiries) and `ContactRateLimit` (shared counters). No existing data or featured field is removed. Generate Prisma locally as usual; apply the migration to the intended database only through the owner's normal release process before deploying these server changes. Build scripts do not apply it. The new contact endpoint and admin message list require these tables even while uploads are disabled.
2. On the web app, configure `CONTACT_RATE_LIMIT_SECRET` with a separately generated private random secret. Do not put it in public variables. Production contact submissions fail closed without it. Set `CONTACT_IP_HEADER` only to a header the trusted ingress overwrites: `x-forwarded-for`, `x-real-ip`, or `x-vercel-forwarded-for`. Confirm the actual proxy behavior; incoming visitor-supplied values must be replaced. If unset/invalid, all requests share an unknown-source bucket. PostgreSQL atomically enforces five attempts per source per fixed ten-minute window across instances. Expired buckets are removed during subsequent requests; no raw IP is stored in these counters. Fixed windows can allow a burst around a boundary. Admin login still has its existing process-local throttle plus database account lockout; do not describe that throttle as global.
3. Keep `CONTACT_UPLOADS_ENABLED` unset/false until the actual host request limit, retention policy, backup deletion and legal copy are confirmed. Set it to `true` on the web app to expose and accept optional inquiry images. This is a server setting, not a `NEXT_PUBLIC_*` variable. No new storage service is required. Text-only forms remain JSON; requests with files use multipart. Limits: two files; JPEG/PNG/WebP; 1 MiB per original/output file, 2 MiB original total; 4096 pixels per side and 12 MP; 2 MiB + 32 KiB total HTTP body. Only still images; decoder validation and signatures are checked, metadata removed, WebP output resized to at most 1920 × 1920 without cropping. All byte limits are checked before decoding; streaming body reads stop at the limit. No customer source file is stored in public assets. Deletion in the admin UI removes an attachment from the active database, not the inquiry or independently retained backups.
4. Confirm `DATABASE_URL`, the control app's `CONTROL_URL`, the web app's `CONTROL_API_URL` / `NEXT_PUBLIC_CONTROL_API_URL`, `NEXT_PUBLIC_SITE_URL`, and the control app's `SITE_URL` refer to the intended deployment. These values were not read or changed. Preserve the existing `AUTH_SECRET`. No production database was queried.
5. Verify SMTP delivery with the owner's test mailbox before release. Existing settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `ADMIN_ALERT_EMAIL`. `SMTP_FROM` may need an owner-side update to an authorized sender matching the new public contact address; changing visible contact information does not authorize spoofing a sender domain. `ADMIN_ALERT_EMAIL` may remain an operational mailbox. Credentials and configured addresses were not read or changed. Replies require TLS and SMTP acceptance before the database marks them replied. An SMTP acceptance is not proof of final inbox delivery. If SMTP succeeds but the database update fails, the UI explicitly warns to check delivery before retrying. No submission auto-reply or new inquiry notification was added.
6. New public media URLs use `?v=2`, bypassing the previous immutable URL in new pages. Publication and image association are checked on every media request; `private, no-store` is sent for original and resized versions. Next Image uses the control endpoint's resizing directly, avoiding Next's persistent optimizer cache for these revocable images. Previously cached bytes under old URLs cannot be recalled by this code: the owner must review/purge any existing CDN caches when unpublishing formerly public images. Draft admin previews now use a separate authenticated, project-scoped endpoint. Customer attachments have only authenticated, message-scoped preview/download/delete endpoints.

The repository has Vercel-compatible code but no confirmed deployment/provider record. Vercel documents a 4.5 MB request/response limit (https://vercel.com/docs/functions/limitations#request-body-size). The chosen contact ceiling is below that; it is not evidence of the actual deployed hosting or proxy limit. The control app's existing 2 MB server-action setting does not govern these route handlers. Verify any additional ingress limits before enabling uploads.

## Remaining owner facts

- Exact registered operator name, legal form, any required representative, register/VAT/professional/supervisory details.
- Actual hosting, database, SMTP and external image providers; processing locations, recipients/transfers, and host-level logging/integrations.
- Applicable legal bases, rights information, supervisory authority, inquiry/reply/attachment retention, and session/audit/backup retention and deletion.
- Actual service contract formation and any required consumer, payment, cancellation, warranty or liability terms. No policy was invented.
- Confirm ownership of `https://www.threads.net/@tiladys.de`. The integration is prepared in `apps/web/lib/business.ts` and remains hidden while `threadsAccountConfirmed` is false because the account was inaccessible for verification.

## Images and dependencies

The Downloads inputs were absent. Matching owner-provided PNGs existed in `apps/web/public`; they were inspected, copied to `/tmp/tiladys-images-4p3iMe`, converted there, inspected again and removed from public after confirming the backup matched. A persistent second copy of all four original PNGs is preserved outside the repository at `/home/tiladys/Documents/Websites/Tiladys/TiLADYS-generated-originals/`; the `/tmp` staging directory is temporary. Existing unrelated assets were retained.

- `apps/web/public/hero/tiladys-hero.webp`: 1942 × 809, 51,172 bytes.
- `apps/web/public/services/tiladys-service-pc-laptop.webp`: 1440 × 810, 53,070 bytes.
- `apps/web/public/services/tiladys-service-website-creation.webp`: 1440 × 960, 62,044 bytes.
- `apps/web/public/services/tiladys-service-business-it-digital.webp`: 1440 × 960, 65,850 bytes.

Sharp 0.34.5 was already installed/resolved through Next. Both apps now declare that existing version directly because they call its runtime API. No package was downloaded, upgraded or installed. System fonts remain unchanged; no external provider or animation library was added.

## Verification and measurements (20 September 2026)

The initial sandbox could not resolve the production site. A read-only retry outside the sandbox reached it (HTTP 200). PageSpeed Insights returned HTTP 429 (`rateLimitExceeded`); no Lighthouse CLI/package was installed. The installed Chrome 151 was used with an isolated temporary profile. These are single, 15-second browser lab observations of the **unchanged live site**, not Lighthouse scores or real-user field data. They are not an after-deployment comparison of this change.

Mobile: 390 × 844, 4× CPU slowdown, 1.6 Mbit/s download, 150 ms latency. Desktop: 1440 × 1000, no CPU slowdown, 10 Mbit/s download, 40 ms latency. Browser cache disabled; network/CDN conditions are uncontrolled. LCP can change after the observation window. Performance scores, TBT and field Core Web Vitals were unavailable.

| URL | Mobile LCP (s) | Mobile CLS | Desktop LCP (s) | Desktop CLS |
|---|---:|---:|---:|---:|
| https://tiladys.com/en | 1.492 | 0.0000 | 0.548 | 0.0000 |
| https://tiladys.com/en/services | 4.228 | 0.0000 | 0.616 | 0.0000 |
| https://tiladys.com/en/portfolio | 2.440 | 0.0000 | 1.484 | 0.0225 |
| https://tiladys.com/en/about | 1.276 | 0.0000 | 0.528 | 0.0000 |
| https://tiladys.com/en/contact | 1.244 | 0.0000 | 0.452 | 0.0000 |

Raw metrics: `/tmp/tiladys-production-metrics.json`. Local visual checks use synthetic portfolio fixtures and a loopback-only database URL; no customer form submission or production database query was made.

Local checks: lint and typecheck passed; `npm test` passed, with the three TypeScript suites also executed directly (7 contact/security, 5 image-validation and 3 public-output/reply-delivery tests), alongside 27 existing repository checks. Mobile/desktop screenshots of home, services, portfolio, About and contact showed no horizontal overflow or broken images; manual navigation and 15-second rotation, hover/focus/hidden-tab/manual pause, reduced motion, single fallback and empty filters passed. All 36 checks across six locales for About, contact, services and legal routes passed; the synthetic published project appeared in the sitemap and draft legal routes did not. Unauthenticated GETs to private attachment preview/download and draft project preview returned 401 with no-store.

The new database migration was not applied anywhere; attachment database insertion/deletion and publication changes were not exercised against a live database. No real SMTP delivery was attempted. SMTP failure/order behavior and public DTO exclusion were tested with synthetic functions/records. Synthetic DELETE probes were not executed after automatic review blocked them; deletion authorization and message scoping were reviewed in source. A final deployment should verify those database-backed paths in an isolated test database.

Versioned local image URLs and explicit Next image local patterns prevent reuse of old optimized artwork. Two small existing admin lint issues were fixed (price-form parameter typing and pending-image object-URL preview using a DOM ref). Generated Next declarations and TypeScript build caches are excluded from the final source diff.

Final production build: `npm run build` passed for both applications after all code changes, using loopback-only database/API overrides for the build process. No deployment settings were changed.

## Changed files

- `IMPLEMENTATION-NOTES.md`
- `apps/control/app/api/admin/messages/[id]/attachments/[attachmentId]/route.ts`
- `apps/control/app/api/admin/messages/[id]/reply/route.ts`
- `apps/control/app/api/admin/projects/[id]/images/[imageId]/route.ts`
- `apps/control/app/api/admin/projects/[id]/images/route.ts`
- `apps/control/app/api/admin/projects/[id]/route.ts`
- `apps/control/app/api/admin/projects/route.ts`
- `apps/control/app/api/auth/login/route.ts`
- `apps/control/app/api/public/media/[id]/route.ts`
- `apps/control/app/api/public/projects/[slug]/route.ts`
- `apps/control/app/api/public/projects/route.ts`
- `apps/control/app/dashboard/messages/attachments.tsx`
- `apps/control/app/dashboard/messages/message-list.tsx`
- `apps/control/app/dashboard/messages/page.tsx`
- `apps/control/app/dashboard/messages/reply-form.tsx`
- `apps/control/app/dashboard/prices/price-form.tsx`
- `apps/control/app/dashboard/projects/page.tsx`
- `apps/control/app/dashboard/projects/project-manager.tsx`
- `apps/control/lib/mail.ts`
- `apps/control/lib/public-projects.ts`
- `apps/control/lib/reply-delivery.ts`
- `apps/control/package.json`
- `apps/web/app/[locale]/about/page.tsx`
- `apps/web/app/[locale]/contact/page.tsx`
- `apps/web/app/[locale]/impressum/page.tsx`
- `apps/web/app/[locale]/page.tsx`
- `apps/web/app/[locale]/portfolio/[slug]/page.tsx`
- `apps/web/app/[locale]/privacy/page.tsx`
- `apps/web/app/[locale]/services/[slug]/page.tsx`
- `apps/web/app/[locale]/services/page.tsx`
- `apps/web/app/[locale]/terms/page.tsx`
- `apps/web/app/api/contact/route.ts`
- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/app/sitemap.ts`
- `apps/web/components/ContactForm.tsx`
- `apps/web/components/Footer.tsx`
- `apps/web/components/Header.tsx`
- `apps/web/components/LegalPage.tsx`
- `apps/web/components/LegalPlaceholder.tsx`
- `apps/web/components/PageHero.tsx`
- `apps/web/components/PortfolioExplorer.tsx`
- `apps/web/components/ProjectImage.tsx`
- `apps/web/components/services/ServiceVisual.tsx`
- `apps/web/components/services/ServicesOverview.tsx`
- `apps/web/content/about.json`
- `apps/web/content/interface.json`
- `apps/web/content/legal.json`
- `apps/web/lib/business.ts`
- `apps/web/lib/contact-images.ts`
- `apps/web/lib/contact-rate-limit.ts`
- `apps/web/lib/contact-upload-limits.ts`
- `apps/web/lib/i18n.ts`
- `apps/web/lib/page-copy.ts`
- `apps/web/lib/services.ts`
- `apps/web/next.config.ts`
- `apps/web/package.json`
- `apps/web/public/hero/tiladys-hero.webp`
- `apps/web/public/services/tiladys-service-business-it-digital.webp`
- `apps/web/public/services/tiladys-service-pc-laptop.webp`
- `apps/web/public/services/tiladys-service-website-creation.webp`
- `apps/web/tsconfig.json`
- `package-lock.json`
- `package.json`
- `packages/db/prisma/migrations/20260920120000_private_contact_attachments/migration.sql`
- `packages/db/prisma/schema.prisma`
- `packages/db/src/index.ts`
- `tests/contact-images.test.ts`
- `tests/contact-security.test.ts`
- `tests/project.test.mjs`
- `tests/public-safety.test.ts`
