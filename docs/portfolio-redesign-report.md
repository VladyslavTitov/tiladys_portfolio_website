# Portfolio redesign and filtering report

The public Portfolio now follows **hero → search/five category choices → result count → project grid → existing product links → CTA/footer**. The featured block, its counter, case-study action and previous/next controls are removed. `FeaturedRotation` and its state are gone; there was no remaining autoplay timer in the starting implementation. The existing database/dashboard `homepageFeatured` field and reviewed publication workflow are preserved.

## Changed files

| File | Change |
|---|---|
| `apps/web/components/PortfolioExplorer.tsx` | Removes the carousel/dropdown/Search button; adds debounced URL search, five pressed-state category buttons, result count, localized empty state, mapped category badges, and bounded grid pagination. |
| `apps/web/lib/portfolio-filters.ts` | New public presentation mapping, historical URL aliases and six-language filter/state copy. Internal category IDs are untouched. |
| `apps/web/lib/public-projects-db.ts` | Updates only the Portfolio list query: mapped server-side filtering, one active cover and necessary card fields. Detail/home/sitemap projections stay intact. |
| `apps/web/components/ProjectImage.tsx` | Optional fallback slot used by Portfolio cards; existing callers retain their previous fallback behavior. |
| `apps/web/app/[locale]/portfolio/page.tsx` | Keys the explorer by locale to reset localized input state correctly. Hero, products, CTA and footer remain. |
| `apps/web/app/refinement.css` | Scoped search/filter/count/empty/card styles; retains the previous Contact fixes and existing responsive column rules. |
| `tests/project.test.mjs`, `tests/ui-public-interactions.mjs`, `tests/ui-interactions.mjs` | Adjust existing checks for the new public controls; preserve gallery, FAQ, missing-media and wider workflow checks. The public interaction driver accepts a separate output directory so earlier baselines stay intact. |
| `tests/portfolio-*` | New mapping/query tests, guarded fixture/empty-state helpers, and Playwright layout/interaction/editor/accessibility checks. |

Changes are in the working tree. Earlier owner edits were retained. The [already-applied incremental patch](portfolio-redesign-evidence/portfolio-only.patch) compares this task with its starting dirty tree; it must not be applied again. New files are listed separately above.

## Existing-to-public category mapping

The existing shared payload schema and dashboard editor support nine internal values. The initial isolated database contained `web-development`, `pc-support` and `3d-printing`; additional allowed values were exercised through clearly labelled QA fixtures. No production category records were queried or rewritten.

| Public group | Internal identifiers |
|---|---|
| Websites | `web-development` |
| Service Works | `pc-support`, `design`, `google-business`, `digital-support`, `data-protection`, `other` |
| 3D Printing | `3d-printing` |
| Linux & Servers | `linux-servers` |
| Service Works fallback | Historical `digital-help` and any unknown/future category. Such work also remains visible under All Projects. |

`design` is intentionally treated as general service work rather than assumed to be website work. The old digital filter incorrectly targeted `digital-help` while the current dashboard stores `digital-support`; both now resolve to Service Works. Unknown work is retained rather than discarded or given an invented website/printing classification.

New URLs use `filter=websites`, `filter=services`, `filter=3d-printing`, or `filter=linux-servers`, plus `q` and optional `page`. All Projects omits the category filter. Legacy `web/pc/design/digital/print/linux` filter values and `category=<internal-id>` links resolve to the mapped public group. A legacy internal-category URL therefore shows its broader public group; stored IDs, project slugs and detail URLs do not change. Group labels and search/count/empty copy are translated in English, German, French, Slovak, Ukrainian and Russian.

## Behavior, layout and media

Search updates after **300 ms** or immediately on Enter; there is no separate Search button. Clear search retains the selected group. Category changes preserve the current search, and either change clears pagination. Search matches the requested locale’s public title/summary; SQL remains parameterized and literal `%`, `_` and backslash escaping is preserved. Browser Back/Forward and external query navigation synchronize the input without overwriting newer typing when an earlier request commits. A pending result message avoids presenting an intermediate count as final.

Exactly five filter choices use the existing Lucide icons, 46px minimum height, 10px corners, natural label widths and 10px gaps. The search is 48px high with an accessible 44px clear action. Controls wrap at narrow widths. At the tested breakpoints, the grid has **one column through 430px, two through 768px, then three**. Cards share 24px padding, reserved 16:10 media frames, mapped category labels and bottom-aligned View Project links. Summaries clamp at four lines; full text remains on the detail page. Titles wrap normally.

Ordinary covers use cover fitting. Printing-category previews use contain with a coordinated pale background to protect transparent still-life subjects; there is no per-image fit metadata in the existing schema. Missing/failed Portfolio images use an intentional navy/cyan TiLADYS fallback with localized accessible text. Originals are unchanged. Next responsive sizing is retained, all grid covers remain lazy, and the unchanged hero remains prioritized. Revocable media still goes through the publication-checking endpoint with private/no-store headers; no persistent public optimizer cache was introduced for it.

The existing Framer/3D model pathways, shared CTA, hero artwork and preferred footer remain. No extra animation or UI library was added. [Source integrity](portfolio-redesign-evidence/source-integrity.json) confirms the inspected dashboard, API, schema/shared contracts, hero/footer, Contact page and package manifests are unchanged from the starting snapshot.

## Verification

All browser and database mutations used only the guard-verified PostgreSQL test container on `127.0.0.1:55432`, database `tiladys_rebuild_test`; SMTP was disabled. Synthetic project titles clearly identify QA use. Existing test records were not deleted or cosmetically rewritten.

| Check | Result / evidence |
|---|---|
| Before screenshots | [Eight widths](portfolio-redesign-evidence/before/results.json): 320, 375, 430, 768, 1024, 1280, 1440, 1920px; original production build, identical fixtures. |
| Final layout | [48 Playwright cases](portfolio-redesign-evidence/after/results.json): all eight widths × all six languages; no carousel/dropdown, exactly five choices, correct columns, reserved media, aligned actions, no broken images/overlap/body overflow or unexpected console/HTTP errors. |
| Live browsing | Seven groups in the same Playwright report: real mapped groups, automatic combined search, clear, no-match state, paging/reset, Back/Forward, rapid input/category changes, missing covers and working detail navigation. |
| Real query coverage | [36 query groups](portfolio-redesign-evidence/query-checks.json), plus legacy URL and invalid-page checks: actual counts against published eligible rows, all mapped/fallback groups, at most 12 records/one cover, localized search, literal wildcard characters and inert SQL-like text. |
| Mapping unit tests | Three tests cover all stored categories, historical/unknown categories, URL aliases and exact five-group translations. |
| Public visibility | Actual draft/archived detail URLs and resized media return 404; private media retains no-store. Reviewed publication and withdrawal additionally tested below. |
| Dashboard editing | [Four groups](portfolio-redesign-evidence/editor-checks.json): actual localized title edits, private draft save, home-featured flag persistence, rejection without review, native confirmation/reviewed publishing, valid unchanged detail URL, and subsequent withdrawal. All writes target one task-owned fixture. |
| Zero published projects | [Two real empty-state checks](portfolio-redesign-evidence/empty-checks.json), 375/1440px. Hero, five choices, Projects: 0, truthful empty state and footer remain. Publication statuses and timestamps restored in finally. |
| Accessibility | [12 WCAG-tagged axe cases](portfolio-redesign-evidence/accessibility.json), all six languages at 320/1440px: zero violations. Native keyboard search, retained input focus, Clear search activation/focus return and category focus also pass. This is scoped testing, not full WCAG certification. |
| Other pages | Home/About/Contact at 375/1440px remain usable; all seven prior Contact buttons remain 150×44px. Hero/footer and Contact source hashes are unchanged. |
| Existing regressions | `npm test`, direct portfolio SEO/public-route tests, web lint, root TypeScript checks and public production build passed. Default test setup retains the existing URL-dependent CRM skip; actual Portfolio DB tests did run. Logs: [checks](portfolio-redesign-evidence/checks/). |
| Existing public interactions | [Six groups](portfolio-redesign-evidence/existing-public-interactions/results.json): updated current driver verifies mapped controls, existing gallery zoom/Escape/focus, FAQ keyboard behavior and intentional browser-boundary media failure. Its fresh evidence is stored separately from prior baselines. |

Paired full-page screenshots exist as `before/portfolio-<width>.png` and `after/portfolio-<width>.png` at all eight widths. Focused inspection crops come from those unchanged full-page captures. Desktop and mobile filter/grid composition was reviewed visually in addition to the geometry checks.

- [Desktop before](portfolio-redesign-evidence/before/filter-grid-1440.png) / [after](portfolio-redesign-evidence/after/filter-grid-1440.png)
- [Mobile before](portfolio-redesign-evidence/before/filter-grid-375.png) / [after](portfolio-redesign-evidence/after/filter-grid-375.png)
- [Real empty state, mobile](portfolio-redesign-evidence/empty-375.png) / [desktop](portfolio-redesign-evidence/empty-1440.png)
- [Branded missing-cover state](portfolio-redesign-evidence/after/branded-missing-cover.png)

Aqua images in some comparison cards are the **unchanged original isolated QA media records**, not a newly designed empty placeholder or an assertion of real customer work. New fixtures reuse original artwork solely inside the synthetic test environment. The public query does not use title/name blacklists or fabricate cases.

## Performance and data integrity

[Build/payload comparison](portfolio-redesign-evidence/build-and-payload.json), identical local fixtures and production toolchain:

| Measurement | Before | After |
|---|---:|---:|
| Decoded Portfolio HTML document | 94,009 B | 82,924 B (11.8% lower) |
| Whole-app emitted JS, per-file gzip | 350,869 B | 351,859 B (+990 B / 0.28%) |
| Maximum browsing records | 12 | 12 |
| Images projected per card | All active images | One active cover |
| List query operations on a nonempty page | Count, all-category groupBy, IDs, full records | Count, IDs, slim records |

Carousel markup/duplicate featured cover rendering are removed, and the public list no longer serializes case-study descriptions, SEO/social fields, work items or unused gallery metadata. Detail and home queries are unchanged. No runtime dependency, new font service, schema/index migration or authenticated-content cache was added. The new filtering/localized state logic slightly increases emitted JS; the HTML reduction must not be presented as an across-the-board JavaScript reduction or a measured field speedup. These are decoded-document and emitted-asset measurements, not compressed network savings or p75 CWV. Field LCP/INP and production-scale query execution plans were not measured.

After testing, all 26 new QA projects are retained as **private drafts**, the test session is revoked, and temporary credentials are removed. Cleanup verified that every initial record’s publication status, home-featured flag and timestamp is unchanged. No real project, customer, invoice, payment, email or production database was modified. No deployment was performed. Owner development servers remain running; only the task-owned previews are stopped at handoff.

## Remaining limits and reproduction

Production binding/content was not inspected. Public eligibility continues to mean PUBLISHED plus nonempty localized title/summary; the unchanged dashboard/API requires explicit review and active media before publication. This verifies code and isolated behavior, not the contents or review history of a remote production database. Direct authorized database writes can bypass an application review flow, as isolated fixtures deliberately do. No review column or schema migration was invented.

The production QA server logged “The destination stream closed early” when browser navigation canceled a streamed response; the same diagnostic was observed in the before preview. Browser checks recorded no corresponding page exception or unexpected HTTP response. No framework change was bundled to suppress that diagnostic.

Unknown categories have the documented Service Works fallback. A future genuinely different business category needs an explicit presentation decision. Existing dashboard help text still mentions the old carousel; it was left unchanged because the requested scope is the public page and dashboard behavior/data must be preserved.

Playwright Core 1.64.1 is reused from `/tmp/tiladys-contact-playwright`; it is not an application dependency. Test helpers refuse any database other than the verified synthetic address. Reproduce with fresh evidence stages and guarded production previews:

```sh
node --import tsx tests/portfolio-filters.test.ts
node scripts/safe-execution.mjs node --import tsx tests/portfolio-fixtures.mts setup
node scripts/safe-execution.mjs node --import tsx tests/portfolio-query.integration.mts
node tests/portfolio-redesign.playwright.mjs after
node tests/portfolio-editor.playwright.mjs
node tests/portfolio-accessibility.playwright.mjs
node scripts/safe-execution.mjs node --import tsx tests/portfolio-empty.integration.mts
node scripts/safe-execution.mjs node --import tsx tests/portfolio-fixtures.mts cleanup
```

Before/after capture stages refuse to overwrite prior results. Preserve/archive those stages before an intentional new run. The original-source checkpoint and incomplete diagnostic attempts are retained under `/tmp/tiladys-portfolio-redesign/`; final evidence is under `docs/portfolio-redesign-evidence/`. Source/data contracts remain the existing application’s contracts.
