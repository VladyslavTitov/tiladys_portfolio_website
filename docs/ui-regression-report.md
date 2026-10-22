# UI regression report — 19 October 2026

The public site and owner dashboard were refined in the existing application. About/Contact/service heroes now have deliberate inner spacing and media framing; service cards share reserved stages and aligned actions; portfolio controls are manual and grouped; the dashboard has separated metrics, bounded lists, clearer labels, section navigation, and one active inbox composer. The preferred footer, original imagery, routes, business calculations, authorization and frozen invoice contracts are retained.

## Review boundary and checkpoints

Branch `refinement/visual-uiux-v3-20261019` starts at `bcefeee`. The initial tree already contained substantial modified and untracked owner work. Commits `a9f01d5`, `032000e`, and `872d973` checkpoint this pass's new refinement files, tests and documentation. The final checkpoint adds the final tests/report. **Existing dirty owner files were not swept into commits.** Their exact incremental changes are captured in [working-tree-delta.patch](ui-evidence/working-tree-delta.patch), already applied, relative to the initial dirty source archive rather than Git HEAD. Do not apply it a second time.

Source comparison is recorded in [source-review.json](ui-evidence/source-review.json): API handlers, database schema, authentication, invoice/PDF code and original footer/assets remain byte-identical to this task's initial dirty snapshot. No migration, production data change, deployment or push occurred. Synthetic-only fixture seeding now defaults to private drafts; explicit published fixtures remain available only for isolated media tests. Production publication records and production database identity were not inspected. No name blacklist or replacement public data wiring was introduced.

All writes in verification used the guarded PostgreSQL container `tiladys-rebuild-dev-20261013`, loopback `127.0.0.1:55432`, database `tiladys_rebuild_test`, role `tiladys_test`. SMTP was disabled. Synthetic issue/payment tests exercised the real handlers, without real clients, payments or mail. Test accounts/sessions and synthetic records must never be copied to production.

## Visual evidence and coverage

The archived initial dirty source was rebuilt using the same installed Next 16.3.8/React 19 production toolchain for paired comparison. Supplied browser PDFs were unavailable; equivalent routes were reproduced. A black development indicator and PDF page boundaries were not treated as website defects.

| Evidence | Coverage / result |
|---|---|
| [Before](ui-evidence/archived-before/results.json) | 132 route/width cases; 52 layout assertion failures and the pre-existing control favicon 404. Initial application lint/typecheck/tests/build passed. |
| [Public final](ui-evidence/handoff-public/results.json) | 140 Chrome cases: 10 routes × 14 widths; no failures, broken images, unexpected console or request errors. |
| [Dashboard final](ui-evidence/final-control/results.json) | 120 Chrome cases: 12 routes × all 10 requested widths; no failures or unexpected errors. Final disclosure-focus change additionally covered at 390/1440px. |
| [Firefox final](ui-evidence/handoff-all-firefox/results.json) | 66 cases: all 22 routes × 390/768/1440px; no geometry/network failures or unexpected errors. 35 retained CSP diagnostics come from the pre-existing caught Zod JIT probe; CSP was not weakened. |
| Long languages | [DE](ui-evidence/long-de/results.json), [FR](ui-evidence/long-fr/results.json), [SK](ui-evidence/long-sk/results.json), [UK](ui-evidence/long-uk/results.json), [RU](ui-evidence/long-ru/results.json): 150 cases at 320/768/1440px, all pass. |
| [Other public routes](ui-evidence/supplementary-public-final/results.json) | Business IT, privacy, terms, impressum, actual synthetic project/product detail: 18 cases, all pass. |
| [Empty catalogue](ui-evidence/verified-empty/results.json) | 20 cases with zero published records. [Visibility checks](ui-evidence/empty-catalogue/visibility.json) verify real queries and truthful empty states; private-default fixture seed also passed six checks. Original synthetic publication/featured/timestamp state restored afterward. |
| [Interactions](ui-evidence/final-interactions/results.json) | 16 groups: real contact receipt, negative SMTP reply recovery, inbox draft preservation, inert content, quote/project/catalogue locale state, issued/draft disclosure, and equivalent 200% reflow at 512/720px. |
| [Portfolio/gallery](ui-evidence/public-interactions/results.json) | Six groups: manual carousel, chips/dropdown/reset, gallery zoom/Escape/focus, native FAQ key, intentional browser-boundary image failure with reserved honest fallback. |
| [Keyboard/navigation](ui-evidence/navigation/results.json) | Native Tab/Shift+Tab menu trap, scroll lock/Escape, language menu navigation/context/document language, eight footer destinations. |
| [Invoice navigation](ui-evidence/invoice-navigation/results.json) | Missing requirement opens its collapsed draft section and receives focus; issued fields remain locked; payments separate; no mutation requests. |
| Accessibility | [Public](ui-evidence/accessibility/public.json) 22 and [control](ui-evidence/accessibility/control.json) 24 WCAG 2/2.1/2.2 AA tagged axe route/width checks: zero violations. Keyboard and optical review supplement automation; this is not a WCAG certification. |
| [Repeated screenshots](ui-evidence/snapshot-check/results.json) | Eight comparisons against intentionally reviewed final Chrome baselines; 20/255 channel threshold, <=1% changed pixels. All pass. Baselines are not assumed portable across OS/font engines. |

Chrome public widths: **320, 360, 375, 390, 430, 600, 768, 900, 1000, 1024, 1280, 1440, 1920, 2560**. The dashboard uses every requested width, 320–1920. Public PNGs cover all seven primary routes at 375/768/1440/1920; dashboard PNGs cover all 12 routes at 390/1024/1440 plus critical 320px states. The image-error test intentionally intercepts only browser image requests; application queries/publication policies stay real.

Paired full-page filenames match between `archived-before/` and `handoff-public/` or `final-control/`. Examples: [About before](ui-evidence/archived-before/public--about-375.png) / [after](ui-evidence/handoff-public/public--about-375.png); [Contact before](ui-evidence/archived-before/public--contact-1440.png) / [after](ui-evidence/handoff-public/public--contact-1440.png); [Inbox before](ui-evidence/archived-before/control--messages-390.png) / [after](ui-evidence/final-control/control--messages-390.png). Viewport review is retained in `navigation/`. Optical review caught an intermediate third-card crop at tablet width; the [intermediate](ui-evidence/media-review/tablet-card-intermediate.png) / [corrected](ui-evidence/media-review/tablet-card-final.png) pair explains the final normal wrapping and 16:9 frame. Transparent still-life scale, founder face crop, coherent Contact composition and complete laptop/phone subjects were inspected visually, not inferred solely from DOM passes.

## Acceptance inventory

PASS below means the stated **local routes, fixtures and viewports** passed. Production content is a separate boundary. No row implies universal device coverage.

| ID | Status | Result / evidence |
|---|---|---|
| UI-001 | PASS | Shared content guides within 2px in final wide-screen DOM invariants. |
| UI-002 | PASS | About measured inset >=36px desktop / >=24px mobile; paired optical review. |
| UI-003 | PASS | Hero column nonoverlap, mobile stacking and reserved clipping frames; final Chrome/Firefox plus viewport review. |
| UI-004 | PASS | Equal 16:9 media stages; wide CTA bottoms within 8px; tablet 600/900/1000px regression added. |
| UI-005 | BLOCKED | Local zero-published/private-default seed passes, no fabricated case studies. Production publication cannot be certified without verifying its binding/content; no production mutation was attempted. |
| UI-006 | PASS | Single Contact PageHero/media composition; mobile/desktop screenshots reviewed. |
| UI-007 | PASS | Form boundaries/labels all widths; native error and actual Unicode contact receipt; no SMTP. |
| UI-008 | PASS | Channel copy/action nonoverlap, readable wrapping and mobile stacking. |
| UI-009 | PASS | Redundant Contact-only banner omitted; preferred shared footer retained. |
| UI-010 | PASS | Grouped filters, native search/dropdown/chip/reset and designed zero-results state. |
| UI-011 | PASS | Reserved 16:10 featured frame without double white border; empty/error state truthful. Aqua fixtures remain explicitly synthetic isolated test media. |
| UI-012 | PASS | Autoplay removed; manual previous/next separate from grid paging; keyboard controls. |
| UI-013 | PASS | Original opaque photos inspected; native 16:9 hero stage removes contain bands and preserves subjects. |
| UI-014 | PASS | Final odd feature group spans both columns; even Business IT groups remain regular. |
| UI-015 | PASS | Expectation/limits span full information area with paired desktop/stacked mobile panels. |
| UI-016 | PASS | Two primary service actions; contextual tertiary anchor has deliberate separate hierarchy. |
| UI-017 | PASS | Transparent 3D render contained in proportionate dark stage; optical review. |
| UI-018 | PASS | Related title/summary readable in two-column/stacked rows, thumbnails 80–140px with correct size hints. |
| UI-019 | PASS | Process 6/3/2/1 layout, readable copy; native FAQ Space/expanded state passes. |
| UI-020 | PASS | Footer source unchanged; responsive screenshots, eight internal destination checks and keyboard coverage. |
| UI-021 | PASS | KPI label/value separate measured rows; nowrap tabular money. |
| UI-022 | PASS | Grouped search/locale/count; active navigation; responsive drawer Escape/focus and reflow. |
| UI-023 | PASS | One active reply composer; 25-record server pagination retained; switch/Back/pending protections. |
| UI-024 | PASS | Actual HTML/SQL-like text persisted exactly and rendered inert; no alert/navigation; API and browser checks. |
| UI-025 | PASS | Jobs sections open/scroll; recipient warning/invoice links retained; real synthetic job/task save workflow passes. |
| UI-026 | PASS | Bounded paginated quote list; cancelled switch preserves draft; actual accepted revision and linked job retained. |
| UI-027 | PASS | Bounded invoice list; read-only issued snapshot, separate payment form; requirement focus opens closed sections; real replay-safe payment checks. |
| UI-028 | PASS | One frozen synthetic invoice/PDF; German page 1, English starts page 2; same number/totals and unchanged bytes after payment. |
| UI-029 | PASS | Project sections/locale preserve unsaved values; draft/review/publication/media safeguards tested through actual API. |
| UI-030 | PASS | Products label gaps, explicit review state and private draft media denial; bounded list/locale state preserved. |
| UI-031 | PASS | Paginated compact tasks; text remains escaped; actual save/complete relationship workflow and formula-safe export checks. |
| UI-032 | PASS | Catalogue controlled fields remain mounted in native groups; locale/dirty state retained; save/conflict/price/domain tests pass. |
| UI-033 | PASS | Settings states derive from existing configuration explanations; no fabricated integration or MFA. |
| UI-034 | PASS | 46 axe checks plus keyboard/focus/reduced-motion/reflow coverage; full assistive-technology certification not established. |
| UI-035 | PASS | No body horizontal overflow in stated Chrome/Firefox matrix; intentional bounded list/gallery scroll stays inside its region. |
| UI-036 | PASS | Zero unexpected final request/application errors; one deliberate disabled-SMTP negative response and known caught Firefox CSP probe documented separately; source contracts unchanged. |
| UI-037 | PASS | 150 long-language cases and locale editing/navigation checks pass. |
| UI-038 | PASS | Tested loading, empty, validation, pending, failed reply, success receipt, broken-cover fallback and immutable states; no fake success or invented projects. Reserved frames and measured lab CLS retained. |

## Business, security and build regressions

[Actual API checks](ui-evidence/workflows/api-checks.json): 15 groups, including unauthorized/private media denial, missing-origin mutations, stale catalogue save, reviewed publication/withdrawal, invoice issue/save concurrency, immutable stored PDFs, quote/job conversion, session ownership, safe exports and inert enquiry text. [Authentication](ui-evidence/workflows/auth-after.json): 16 HTTP checks including real login/logout/revocation and throttling. [Business workflow](ui-evidence/workflows/business-workflow.json): five groups cover company → client → quote acceptance → job/task → one invoice → replay-safe payment. Draft/issued PDFs are retained in `workflows/`; both issued language pages were rendered and inspected. [Routing](ui-evidence/workflows/routes.json) covers all six locales, canonical/hreflang/sitemap/redirect/404 behavior. [Scoped client scan](ui-evidence/workflows/client-secret-scan.json) found zero exact known credential leaks across 240 built client artifacts; it is not a universal secrets/PII audit.

Lint, typecheck, public/control production builds, default tests, bilingual/PDF, release schema, domain and guarded database tests passed. The default suite retains one explicit CRM test skip when its dedicated database URL is absent; the separately guarded database/API/business suites actually ran. Logs are under `ui-evidence/checks/`. Initial lint/typecheck/build also passed: this pass repairs visual failures rather than claiming pre-existing business failures were fixed.

The prior [security review](safe-execution/Security-review.md) remains the scope record. Its authentication fixes predate this visual pass; this pass preserves them. It documents authorization, rate limiting, contact, upload/privacy, session and financial controls and a separate framework-advisory follow-up. No auth replacement, MFA, infrastructure change or security dependency upgrade was bundled here. Real SMTP success and production storage/permissions remain operator verification items; disabled-SMTP failure recovery was verified.

## Production performance measurements

| Route | Mobile LCP ms before → final | Mobile score before → final | Desktop LCP ms before → final | Final CLS |
|---|---:|---:|---:|---:|
| Home | 2411 → 2438 | 97 → 97 | 577 → 571 | 0.000 / 0.000 |
| Services | 2945 → 2639 | 94 → 96 | 677 → 655 | 0.000 / 0.000 |
| Portfolio | 1964 → 2185 | 99 → 98 | 604 → 575 | 0.000 / 0.000 |
| Contact | 2108 → 2448 | 99 → 97 | 624 → 568 | 0.000 / 0.000 |
| Dashboard | 1660 → 1659 | 99 → 99 | 491 → 488 | 0.000 / 0.000 |
| Invoices | 1809 → 1809 | 99 → 99 | 532 → 501 | 0.000 / 0.000 |

Final Lighthouse accessibility score is 100 for all 12 route/mode audits; all desktop performance scores are 100. [Raw final reports](ui-evidence/handoff-performance/results.json). Initial baseline samples for Home/Services/Portfolio/Contact are in `performance/`; the later identical-source baseline for Dashboard/Invoices is in `performance-final/`. The earlier dashboard baseline was 2117ms versus 1660ms on its repeat: this variation illustrates why a single simulated score is not causal proof of a speedup.

**Remaining lab target miss:** Services mobile LCP is 2639ms (>2500ms), improved from 2945ms but still above the target. Portfolio/Contact have slower single mobile samples than their initial measurements. No field INP or p75 CWV was collected.

| Native home median, three samples | LCP ms before → final | Transfer B before → final | Transfer change |
|---|---:|---:|---:|
| mobile-4g | 720 → 796 | 293,282 → 262,240 | -10.6% |
| desktop | 64 → 60 | 322,753 → 304,535 | -5.6% |
| wide-desktop | 76 → 64 | 398,368 → 304,533 | -23.6% |

Native CLS is 0 in all 18 samples. Native mobile median LCP worsened by about 11%; transfer savings therefore do not justify an across-the-board speed claim. Hero transfer bytes are unchanged in these DPR=1 native samples (14,946 B mobile / 30,744 B wide). Prior repair hero savings are not attributed to this pass.

Production builds, same installed Chrome/OS and synthetic records. Lighthouse 13.4.1 is installed only under `/tmp`, not as an application dependency. Mobile/desktop audits are simulated lab samples; raw reports and method details are retained. Final after measurements are compared to the rebuilt initial source, not an earlier task's optimization. Native CDP measurements use three cold-cache samples per variant (mobile: 4× CPU, 150ms latency, 1.6Mbps; desktop/wide: unthrottled). Measurements run sequentially without other test/build workloads. Small lab deltas are noisy and do not establish field p75 or INP.

[Emitted asset comparison](ui-evidence/build-sizes.json), per-file gzip across all emitted assets: public JS 351,131 → 350,869 B, CSS 14,047 → 15,739 B; control JS 400,446 → 402,353 B, CSS 6,793 → 8,478 B. This is static asset inventory, not what every route downloads. No runtime library/font service was added. Source image weights, delivery settings and optimized transfers are in [image-audit.md](image-audit.md). Originals are unchanged.

## Remaining limits and handoff

- **Production publication verification is BLOCKED/outside this local pass.** Verify the production binding and approved portfolio/product records before release. Empty-state/private fixture tests establish behavior, not the contents of an uninspected remote database.
- **Field Core Web Vitals / INP: NOT AUTOMATABLE here.** No field dataset exists in this workspace. Lab results and any remaining simulated LCP miss are reported above; no blanket speedup or universal CWV claim is made.
- Axe/keyboard/optical checks cover stated routes and states, not every screen reader, device, data volume or translation. Large production datasets and successful external mail delivery require their own environment.
- Framework advisory follow-up and production storage/database least-privilege verification remain in the prior security report. This visual task makes no production security certification.
- Styles deliberately layer after existing owner CSS. Consolidating the larger legacy styles is a separate maintenance task. Review the complete pre-existing owner rebuild and this pass's incremental patch together before release.
- Intermediate evidence is archived under `/tmp/tiladys-v3-checkpoints/`; meaningful before/final/state screenshots remain in the repository. No old golden image was silently replaced. The test driver rejects an existing evidence stage; choose a new `UI_STAGE` for intentional changes.

Reproduce after preparing the guarded synthetic fixture environment and starting production apps at 3100/3101 (archived initial builds at 3110/3111 for comparisons):

```sh
npm run lint
npm run typecheck
npm test
UI_STAGE=review-unique UI_INVARIANTS=1 node tests/ui-refinement.mjs
UI_STAGE=review-unique UI_WIDTHS=390,768,1440 UI_INVARIANTS=1 node tests/ui-refinement.mjs --firefox
node tests/ui-screenshot-regression.mjs
node scripts/safe-execution.mjs node tests/ui-interactions.mjs
ACCESSIBILITY=1 LAYOUT_STAGE=review-axe LAYOUT_WIDTHS=390,1440 node tests/safe-layouts.mjs after
```

Media/filter tests require explicitly published **synthetic-only** fixtures (`--published-media`); default seeding is private. Keep credentials in the helper's mode-0600 `/tmp` fixture file, never in tracked files. Final teardown revokes task-owned fixture sessions, removes temporary credentials, stops only task-owned QA servers/browsers, and leaves the pre-existing database container running. No production deployment was performed.
