# Security review — 19 October 2026

Scope: current source, local production builds, isolated synthetic database and bounded negative tests. This is not a penetration-test certificate or a claim of complete protection. Review follows [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/), prioritizing [access control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/). No production database permissions, hosting settings or infrastructure were inspected or changed remotely.

## Confirmed fixes

1. **Untrusted forwarding header could bypass the IP login throttle.** The baseline local HTTP test sent 13 invalid synthetic logins using different caller-selected `X-Forwarded-For` values; all reached credential validation (401). Login and account reauthentication now use a validated IP only from an explicitly selected trusted-ingress header. With `AUTH_IP_HEADER` unset, arbitrary forwarded values share the existing conservative unknown bucket; the regression now ends with 429. Per-account limiting, Argon2, lockout policy and opaque sessions are preserved. Session IP metadata uses the same source policy. No authentication replacement or MFA was introduced.
2. **Rejected logout origins returned an unhandled 500.** The guard still denies cross-origin logout, now with explicit 403/private no-store. A valid logout still redirects, deletes its database session and makes reuse return 401. This fixes error handling; the baseline guard already prevented cross-origin logout.

`AUTH_IP_HEADER` is documented in `.env.example`. Set it only when the ingress overwrites the selected header (`x-vercel-forwarded-for`, `x-real-ip`, or `x-forwarded-for`). An allowlisted header name alone does not make an untrusted proxy safe. No production environment variable was set. Until configured, the shared unknown bucket can throttle several direct users together; it deliberately does not grant spoofable per-IP buckets. The account limiter remains independent.

Evidence: `evidence/auth-baseline.json` versus `evidence/auth-after.json`: **16 HTTP checks, all passing after remediation**. `tests/auth-request-source.test.ts` covers unconfigured/unsupported headers, malformed values, IPv4/IPv6, ingress selection and first-hop parsing. It is included in `npm test`. Actual session cookies were checked for Secure, HttpOnly and SameSite=Strict, and actual logout/session revocation was verified.

## Review coverage and limits

| Area | Observed controls / verification | Remaining boundary |
| --- | --- | --- |
| Private authorization | All 40 admin route files reference server-side user checks; representative anonymous API reads return 401/no-store; dashboard redirects; API suite checks parent/file and account ownership | File-level source scan alone does not prove every method/parameter combination |
| Authentication / sessions | Custom Argon2 plus secret phrase, hashed opaque tokens, expiry, secure host cookie, distributed DB counters, exact-origin mutation checks; real login/logout and revoked session tests | Secret phrase is not MFA; no identity or recovery-policy replacement |
| Input / injection / XSS | Shared Zod validation, bounded unauthenticated JSON, parameterized Prisma/tagged SQL, React text escaping and escaped JSON-LD; original Unicode is retained | Rich text is not enabled; no offensive testing of unrelated hosts |
| Contact abuse | DB counters, configured ingress parsing, honeypot/timing/body limits and independent persistence before optional mail; route/unit tests and later browser receipt replay | Real SMTP delivery is intentionally disabled in QA |
| Uploads / private files | Signature/decode/re-encode and pixel/byte limits; expiring purpose-bound reservations; parent-file authorization; SVG is not an accepted upload format; isolated boundary/race tests | Production private storage/worker/cleanup integration remains unconfigured; production large-photo/model operations remain unavailable |
| Caching / headers | Private APIs/PDFs use no-store; media rechecks publication before both originals/resizes; same-origin CSP, nosniff, frame denial, referrer/permissions policies | CSP retains inline-script allowance required by the current rendering setup; no unsupported strict-CSP or HTTPS/HSTS deployment claim |
| Financial integrity | Exact decimal arithmetic, row locks, idempotency, frozen issued PDFs, explicit tax/translation gating; existing synthetic DB/API/PDF suites | No real invoice, payment, business tax detail or historical production artifact was changed |
| Exports / logs | Scoped expiring artifacts, CSV formula neutralization, owner checks and audit events; no credentials printed by QA helper | Production retention/backup arrangements require operator verification |
| Secrets / DB permissions | QA helper refuses unexpected container/port/role and disables SMTP; server-only Prisma access and explicit public projections | Production DB binding and runtime-role grants are not established by these local checks; no claim of verified production least privilege |
| Dependencies | Current primary advisories reviewed; installed versions captured locally in `evidence/dependency-versions.json` | No bulk dependency metadata was transmitted; no full clean transitive-audit claim |

## Current dependency advisories

Installed Next is 16.3.8; Sharp is 0.35.5 throughout the checked resolution tree. The [14 October image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) lists Sharp ≥0.35.5 as its workaround; this checkout already satisfies it. The [Cache Components typed-array advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) and [Server Actions DoS advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) include this Next version in affected ranges and name 16.4.1 as patched. Source inspection found no `use cache`, Cache Components enablement, or `use server` actions. The Server Actions advisory explicitly excludes apps without actions; the typed-array feature precondition is also absent. This is scoped exposure analysis, not a declaration that the old version is universally safe.

Prepare a separate focused Next/eslint-config-next 16.4.1-or-later security update with lockfile review, fresh framework documentation and the same business/browser/build regressions before a release. Do not enable either affected feature on 16.3.8. A framework minor upgrade was not bundled into the layout repair. Production deployment remains outside this task.
