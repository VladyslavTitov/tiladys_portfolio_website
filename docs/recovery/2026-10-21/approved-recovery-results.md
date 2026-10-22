# Approved public rollback and token cleanup — completed

**21 October 2026, Europe/Amsterdam. The live public Portfolio is restored.** The public-only rollback completed at **18:41:10**; the unintended bypass token was revoked and its access denial confirmed by **18:44:06**. No application build, Production database write, schema migration, configured environment update or Control deployment change was performed. No administrator was created.

**Read-only reconfirmation at 18:54:58:** the approved Production deployment remains READY, live Portfolio returns 200, the unintended token remains absent, protected Preview access still redirects to Vercel authentication, and Control/protection/configured environment metadata is unchanged. The repeated instruction did not cause another rollback or token mutation. [Reconfirmation evidence](evidence/approved-recovery/duplicate-request-readonly-confirmation.json).

## Final deployment status

| Item | Verified result |
| --- | --- |
| Live public domain | `https://tiladys.com` |
| Live public deployment | **`dpl_5B38LjUBUFpAGnfS3whyHVG9qmJx` — READY, Production** |
| Commit | `e82bff04aac9915585b10cc853fe31c558a5964b` |
| Immutable deployment URL | `https://tiladys-public-21zujdkfm-tiladys.vercel.app` — remains protected |
| Public project / team | `prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv` / `team_xIA4aFDewxF4sHVLtMnss2me` |
| Control Production | Unchanged: `dpl_29sUx2PbwBzRu3UUNbmBZE6aoBVn`, commit `e82bff0`, READY |
| Production database | Unchanged: `blue-recipe-81197878`, `br-lucky-recipe-a23iw073`, endpoint `ep-frosty-hall-a2rder07`, `neondb.public`, PostgreSQL 17.11 |
| Production migration history | All original 13 entries, exact checksums and ledger rows unchanged |

Vercel's project target and the explicit `tiladys.com` alias lookup both identify the approved deployment. The rollback reused the existing build. It did not promote a Preview or deploy additional application changes. Vercel's rollback workflow disables automatic Production alias assignment; no subsequent promotion or re-enabling operation was performed. See [Vercel rollback behavior](https://vercel.com/docs/deployments/rollback-production-deployment).

## Preconditions reverified before rollback

The independently verified public CLI context was used; the repository's Control project link was left untouched. The exact approved deployment was still READY, target Production, project public, commit `e82bff0`. The public domain still pointed to the previously diagnosed `141b2ed` deployment before execution. Control Production still pointed to `e82bff0`.

Both public database entries still matched the earlier IDs, scopes, timestamps, endpoint, database and schema. The current Production catalog matched the earlier first-13 baseline for tables, columns/types/defaults/nullability, enum values/order, constraints and indexes. Every migration name/checksum was checked. A fresh full Prisma datamodel comparison against `e82bff0` was empty. Seven published projects, 27 published images and the prior business/media fingerprints were unchanged.

The approved candidate's nine main public routes, seven details, 27 images, Contact validation and navigation were tested at its immutable URL immediately before rollback. The schema, **all 25 table fingerprints**, migration ledger, target readiness, current Production pointers and environment metadata were then checked again before the command. Every precondition passed. The exact-target rollback command succeeded once; it was not retried.

Evidence: [preconditions and before-state](evidence/approved-recovery/rollback-preconditions.json), [candidate HTTP/browser checks](evidence/approved-recovery/candidate-reverification.json), [rollback command result](evidence/approved-recovery/rollback-result.json), [CLI confirmation](evidence/approved-recovery/rollback-command.log).

## Live public URLs and results

| Tested URL | Result |
| --- | --- |
| [Home](https://tiladys.com/en) | 200, expected page heading and navigation |
| [Portfolio](https://tiladys.com/en/portfolio) | 200, **7 published cards**, unavailable message absent, card images decoded |
| [Services](https://tiladys.com/en/services) | 200, service and pricing presentation renders |
| [About](https://tiladys.com/en/about) | 200 |
| [Contact](https://tiladys.com/en/contact) | 200, form and required fields render; empty submission blocked |
| [Prices](https://tiladys.com/en/prices) | Expected redirect to `/en/services`, final 200 |
| [Privacy](https://tiladys.com/en/privacy) | 200 |
| [Terms](https://tiladys.com/en/terms) | 200 |
| [Impressum](https://tiladys.com/en/impressum) | 200 |

The root [public URL](https://tiladys.com/) reaches `/en` successfully. The three service-detail routes also return 200, render prices, and prefill the corresponding Contact service correctly: [PC/laptop](https://tiladys.com/en/services/pc-laptop), [Websites](https://tiladys.com/en/services/websites), and [Business IT](https://tiladys.com/en/services/business-it). Their `/en/contact?service=…` destinations were checked without submitting an enquiry.

A fresh read of the actual public-price projection succeeded for **12 active sections and 145 active items**. The overview's displayed starting prices match the corresponding database records: **15 €**, **75 €/month**, and **79 €**. The Prices redirect therefore reaches a working pricing presentation.

All seven actual published detail pages returned 200 with their expected project titles:

- [Mongoose Signs & Advertising](https://tiladys.com/en/portfolio/mongoose-signs)
- [DonetsFit](https://tiladys.com/en/portfolio/donetsfit)
- [DonetsFit Calculator](https://tiladys.com/en/portfolio/calc-donetsfit)
- [Fedora KDE + Windows 11 Dual-Boot Workstation](https://tiladys.com/en/portfolio/fedora-windows-dual-boot-workstation)
- [ETIT.info — Virtual Tour of VPU No. 7](https://tiladys.com/en/portfolio/etit-vpu7-virtual-tour)
- [TiLADYS Business Card](https://tiladys.com/en/portfolio/tiladys-business-card)
- [JobAdys](https://tiladys.com/en/portfolio/jobadys)

All **27** actual published `/api/public/media/{id}?w=120` URLs returned 200 with nonempty image responses. The seven Portfolio cover images were verified after scrolling them into view to exercise lazy loading. Exact image URLs and results are in [live verification evidence](evidence/approved-recovery/live-public-verification.json); the [live Portfolio screenshot](evidence/approved-recovery/browser/live-portfolio.png) is retained.

All three actual draft project URLs still return **404 on the live domain**. No archived Production fixture was created.

Contact's name/email/message/consent requirements and browser validation were checked. The actual API rejects unsupported content types with **415** and untrusted origins with **403**, before touching the database. **No real enquiry was submitted, and persistence/email delivery were not exercised.** This preserves all existing enquiries and avoids sending test messages. There is no claim of a completed submission/delivery test.

The restored release has its older six filter tabs and no search, as disclosed in the approved rollback proposal. The newer five-group/search interface requires a separately approved compatible forward release. No fabricated projects or sample data were introduced.

The bounded post-rollback runtime-log scan inspected **50 request records**, including the expected Contact validation rejections, and found **zero error/5xx requests**. [Log summary](evidence/approved-recovery/post-rollback-log-summary.json).

## Data and configuration preservation

Before/after full-row aggregate fingerprints match for **all 25 Production tables**, including the migration ledger, enquiries, authentication tables, image bytes and financial records. Schema and migration-history comparisons also match exactly. This is change-detection evidence, not a new backup or restore operation.

Preserved data includes 10 projects (7 published, 3 drafts), 27 images, 4 ContactMessage records, 2 customers, 1 company, 2 service jobs, 2 invoices, 3 invoice lines and numbering records. Production has zero InvoicePayment rows and no Quote tables; neither payment nor quote data was invented. No reset, seed, rewrite or financial backfill occurred.

All **31 public** and **46 Control** configured environment entries retain their IDs, names, scopes and update timestamps. Production Control deployment/authentication, its existing bypass token and protection settings remain unchanged. No unrelated PR was merged, and no source push occurred.

Evidence: [post-rollback deployment/schema/data state](evidence/approved-recovery/post-rollback-state.json), [targeted pricing/navigation/privacy checks](evidence/approved-recovery/final-public-checks.json), [final audit](evidence/approved-recovery/completion-audit.json).

## Exact unintended token — revoked

The revoked credential was uniquely matched to the incident record:

| Property | Identity |
| --- | --- |
| Project | Public only: `prj_JWa4iXqzV70GdY3TKDDL2Q5poRRv` |
| Scope | `automation-bypass`; `isEnvVar: true` |
| Created | 21 October 2026, **17:30:09 Europe/Amsterdam** (`1792596609679`) |
| Creator | `f6pdOqPjSnenl2MfjOJPhYf3` |
| SHA-256 fingerprint | `af9814811b9b54d859a8d6e32e2dae6cf6372f4530ef3876b296147f8ce90e90` |

The token value was never printed or placed in command arguments, files or reports. The revocation request passed it through private stdin and explicitly set `regenerate: false`. Only this token was removed; no replacement was created.

The dependency audit found no exact token reference in tracked files, no application or CI use of bypass headers/environment variables, no project hook/cron reference, and no indicated dependency among the connected integration configuration and relevant explicit environment metadata checked. Sensitive URL entries cannot be read back, and unmanaged external secret stores cannot be exhaustively inspected. The earlier evidence establishes that this credential was generated solely by the incident inspection; no legitimate dependency was found in accessible sources. [Dependency audit](evidence/approved-recovery/unintended-token-audit.json).

Deployment protection was checked against the existing Ready public Preview `dpl_4tCNWpYmKntCA5ycLtLVcQm4F8ui` at `https://tiladys-public-bb3d7e016-tiladys.vercel.app/en/contact`:

- Before revocation, anonymous access was blocked; the exact incident token allowed the Contact page.
- After revocation, **both that same token and anonymous requests return 302 to Vercel authentication**.
- The token is absent from project metadata, with **zero remaining public automation tokens**.
- The pre-existing Control token's fingerprint is unchanged. Subsequent Preview-origin checks still reached Control's application validation using that token.
- SSO/protection settings and all configured environment entries are unchanged. The public custom domain continues to return a working Portfolio.

[Revocation confirmation and protection checks](evidence/approved-recovery/token-revocation-result.json). No `vercel curl` call was used to regenerate access after revocation. Revocation invalidated this automatically exposed credential; no configured environment entry was edited.

## Preview origin correction prepared; administrator still deferred

The recovery branch alias currently points to an existing Ready Preview, **`dpl_F5AN2yCPU9pjEEXzXzzjXM7z1e1i`**, commit `ca04d4403566d9917c11725979ea5d9783c0afea`, immutable URL `https://tiladys-control-e72rm02i0-tiladys.vercel.app`. This was already deployed through the repository workflow; this recovery did not deploy it.

Fresh invalid-body probes returned:

| Origin | Result |
| --- | --- |
| Immutable deployment origin | **400 Invalid**: origin accepted, input validation rejects `{}` before rate limiting or account access |
| `https://tiladys-control-git-recovery-vercel-neon-schema-fb31b4-tiladys.vercel.app` | **403 Invalid origin** |

The cause remains exact-origin configuration: `VERCEL_URL` permits the immutable hostname. The only configured Preview `CONTROL_URL` is scoped to `feature/services-redesign`, so it does not apply to this recovery branch. No effective `CONTROL_ALLOWED_ORIGINS` entry permits the recovery alias.

The minimal prepared correction is:

```text
Project: tiladys-control
Key: CONTROL_ALLOWED_ORIGINS
Value: https://tiladys-control-git-recovery-vercel-neon-schema-fb31b4-tiladys.vercel.app
Target: preview
Git branch: recovery/vercel-neon-schema-20261021
```

The exact setting is [prepared as reviewable JSON](evidence/approved-recovery/preview-origin-proposed-setting.json). **It has not been applied.** Tests against the existing origin-check implementation show that this one entry accepts the alias and retains immutable-host acceptance, while rejecting missing origins, unrelated sites and hostname-suffix attacks. Existing trusted-origin and request-source regression tests passed, **2/2 with no skips**. No wildcard, trusted client header, CSRF bypass, Production auth setting or cookie change is proposed.

Preview's full release guard passes with all 23 migrations. It still has **0 administrators and 0 sessions**. No account creation or update occurred. [Current Preview findings](evidence/approved-recovery/preview-origin-investigation.json).

Remaining steps, when separately authorized:

1. Receive the intended Preview administrator email. Obtain explicit approval for that one account; enter fresh Preview-only password/phrase through the masked terminal workflow, never chat or Production credentials.
2. Approve applying the exact branch-scoped origin setting and rebuilding that Preview, or use the accepted immutable URL. Reverify the intended target and wait for READY before hosted tests.
3. Recheck zero accounts and the exact Preview connection, then use the existing Argon2id setup-admin workflow through the guarded launcher. Stop if an account already exists or provisioning has an uncertain result.
4. Verify successful hosted login, Secure/HttpOnly/SameSite=Strict cookie issuance, session expiry/logout, origin rejection, rate limiting and protected APIs. Production authentication remains outside this work.

## Verification notes

The recovery helper initially treated omitted metadata properties differently from `undefined` properties, sampled lazy images before scrolling, and expected lowercase “from” rather than the deployed “From” label. Those evidence-script assertions were corrected. Completed hosted checks supersede the retained stopped-attempt logs; these were not application fixes or additional deployments.
