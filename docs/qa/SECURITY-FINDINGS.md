# Security findings

2026-10-19. Authorized scope: loopback QA apps, verified isolated PostgreSQL and marked synthetic records. No production scans, real recipients, payments or publication. Guidance: [OWASP ASVS 5.0](https://github.com/OWASP/ASVS/releases/tag/v5.0.0) and [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/). This is scoped verification, not certification or proof of complete security.

## Confirmed fix: page authentication error handling (P2, development)

The isolated Turbopack reproduction returned HTTP 307 but serialized `UNAUTHORIZED` and source snippets for 8 of 12 logged-out dashboard roots. All 12 valid-session roots worked. This is a development error-handling defect, not an observed authorization bypass; synthetic canaries were absent from the tested redirect bodies. `evidence/dev-before-checks.json` and `checks/dev-checks-verified.log` retain the failure.

A new `apps/control/lib/page-user.ts` validates through the unchanged `currentUser()` and uses Next's `redirect('/login')` for page navigation. Fifteen server-rendered pages now call it before reading data; page/layout concurrency no longer produces a generic error. API `requireUser()` and explicit 401 handling remain untouched. Valid users receive the same user record; login, session creation, cookie flags, expiry, origin enforcement, roles and billing are unchanged. `evidence/page-redirect-only.patch` records the exact already-applied delta against the owner's initial working files. Forty-six expanded development checks passed, including client/company/quote detail, project/product previews, search and account/data settings. The rebuilt production app also passed46/46 expanded checks (`evidence/production-after-checks.json`).

## Verified controls

- `evidence/http.json`: 232 executed checks. Every discovered exported private API method denied anonymous access with 401/no-store; all discovered dashboard paths redirected missing/stale sessions to login without a raw UNAUTHORIZED body. A real login issued HttpOnly/Secure/SameSite=Strict credentials; actual database expiry denied page/API access; cross-origin login/logout/tasks rejected.
- `evidence/existing/api-checks.json`: 15 authenticated workflow groups include message attachment/project image parent binding, invoice/customer/job relationship checks, session ownership and cross-admin export denial, escaped HTML/SQL-looking enquiry text, publication review, one-hop aliases and media withdrawal, stale write conflicts, immutable issued artifacts and idempotent financial operations.
- `evidence/checks/database.log`: 10 guarded integration groups include bounded decoded uploads, capability expiry/purpose/claim races, exact size boundaries, payment overpayment races, invoice single-allocation and outbox uncertain/record-failure reservations. Tests used only local synthetic storage paths and records.
- Production CSP excludes unsafe-eval, denies framing and restricts connections to self. Private responses/PDFs use no-store. Neither robots nor hidden UI is treated as authorization.
- Exact known client-secret scan: 203 built artifacts, no matches. This does not prove universal secret absence; final evidence/trace scan covered886 QA artifacts/current tracked files with zero exact known credential values (`evidence/artifact-secrets.json`).

## Dependency exposure: reviewed, not exploited

Installed versions and lockfile license declarations are in `evidence/dependencies.json`. These are local inventory, not a complete transitive vulnerability or legal audit.

| Finding | Evidence / current applicability | Action |
|---|---|---|
| Framework advisories remain a release risk | Next 16.3.8 is in the affected range of the [Cache Components typed-array RCE advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr). Source review found no enabled Cache Components or `use cache` function. The maintainer still recommends immediate upgrade even without similar functions. | Prioritize a focused Next/eslint-config-next 16.4.1 or later supported patched update, lockfile review and full regressions before release. No exploit was attempted; feature absence is an applicability inference, not a safe-version claim. |
| Image optimization upstream SVG RCE | The [maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) provides Sharp >=0.35.5 as workaround. Installed override/resolution is 0.35.5. | Workaround present locally; verify the deployed dependency tree and still upgrade Next. Production was not inspected. |
| Server Actions CPU denial of service | The [maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) affects this Next version when actions exist. No `use server` actions were discovered; current UI uses route handlers. | Do not enable affected features on this version. Patch framework separately. |
| Remote optimizer SSRF precondition | The [maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4) excludes applications without remotePatterns. Public configuration has an empty allowlist; direct local/private/untrusted optimizer requests are checked by the bounded security suite. | No remote URL fetcher was discovered in the application business libraries. External product links are browser destinations, not proof of server SSRF protections. DNS rebinding/redirect chains were not exercised. |

## Limits and remaining risks

- **BLOCKED — npm audit:** automatic approval review rejected the registry metadata transfer (dependency names/versions). Explicit approval was requested; no alternative registry or indirect upload was used. Local versions/license declarations and public primary advisories were reviewed instead. No claim of a clean transitive audit.
- **BLOCKED — ZAP:** neither executable nor the official container image was installed. No image was downloaded or scan claimed. The [official baseline scan](https://www.zaproxy.org/docs/docker/baseline-scan/) spiders and reports passive findings; this task's header and bounded regression checks are not a ZAP result. A later run must restrict scope to QA loopback and omit authenticated mutations.
- The schema has owner-admin access, no tenant/least-privilege role hierarchy. Two admins are not separate tenants. Session/export ownership and relationship checks were tested; tenant isolation cannot be claimed.
- Session cookies are host-wide, not port-isolated. Public/Control on the same loopback host share the cookie namespace. Test sessions are synthetic; production host separation, TLS/HSTS, proxy overwrite policy, DB role grants, backups and recovery were not verified remotely.
- CSP retains unsafe-inline. Tightening it needs a separate nonce/hash rendering review. Secret phrase is not MFA; MFA/recovery are explicitly unconfigured.
- A real reviewed UI reply reached a loopback STARTTLS sink, persisted REPLIED and replayed without another send; the sink also rejected a non-example.test recipient over TLS. This is local sandbox delivery, not a real provider. Production object storage, direct upload worker, malware processing, signed-provider URLs, payment/bank providers and structured e-invoices are absent/unconfigured. Their production integration and failure modes remain blocked/not applicable.
- Built artifacts/current tracked files can be scanned for known values; full git history entropy scanning, source-map publication, actual production PII/log retention and supply-chain attestations remain unverified.
- No authentication, billing/tax rules, schema or infrastructure policy was changed to make a test pass. Prior forwarding-header/logout fixes predate this QA task and are not attributed to it.

## Reproduced non-vulnerability warning

Turbopack emitted `Warning: unexpected export *` for CommonJS `@prisma/client` through the shared DB re-export. Six public Portfolio locales and all valid tested Control routes loaded. Production webpack builds succeeded without this warning. Preserve explicit reproduction logs; warning alone is not proof of a Prisma runtime outage. An export/module-format cleanup was not bundled into the page guard fix.
