# Performance report

2026-10-19. Production webpack builds; Node 22.23.1, Next 16.3.8, installed Chrome and Lighthouse 13.4.1. Local synthetic PostgreSQL; published QA projects deliberately exercise pagination and covers. The browser cache was cleared for each run; server/DB caches stayed warm. There were three samples per route/device (36 total), simulated Lighthouse mobile/desktop throttling. No field telemetry exists here: no p75 Core Web Vitals or field INP claim.

## Repeated lab measurements

| Route | Device | Score median (range) | LCP median ms (range) | CLS median (max) | TBT median ms |
|---|---|---|---|---|---|
| home | mobile | 96 (93–96) | 1969 (1454–2316) | 0.000 (0.000) | 245 |
| home | desktop | 100 (100–100) | 657 (614–693) | 0.000 (0.000) | 23 |
| services | mobile | 79 (79–86) | 3332 (2584–3436) | 0.000 (0.000) | 483 |
| services | desktop | 99 (98–100) | 785 (745–793) | 0.000 (0.000) | 93 |
| portfolio | mobile | 94 (90–95) | 2208 (1617–2861) | 0.000 (0.000) | 250 |
| portfolio | desktop | 100 (84–100) | 672 (653–710) | 0.000 (0.312) | 45 |
| contact | mobile | 89 (84–89) | 2685 (2666–2698) | 0.000 (0.000) | 340 |
| contact | desktop | 100 (100–100) | 601 (598–603) | 0.000 (0.000) | 36 |
| inbox | mobile | 92 (90–94) | 2397 (1741–2400) | 0.000 (0.000) | 289 |
| inbox | desktop | 100 (100–100) | 535 (534–538) | 0.000 (0.000) | 40 |
| invoices | mobile | 92 (89–93) | 1827 (1456–1832) | 0.000 (0.000) | 342 |
| invoices | desktop | 100 (100–100) | 574 (480–579) | 0.000 (0.000) | 46 |

Raw results: `evidence/performance/<route>-<mode>-<1..3>.json`; aggregate `evidence/performance/results.json`; commands/output in `evidence/checks/performance.log`. These are local loopback lab results, not a release claim for production users.

## Confirmed budget misses and next work

- **P2: Services mobile LCP 3332ms median (2584–3436ms)** exceeds the 2500ms lab target. All three runs missed it; mobile main-thread work is also substantial. Contact mobile LCP 2685ms median (2666–2698ms) missed the same target in all three runs. Inspect the shared hero request priority and browser main-thread work before considering client-boundary changes. Do not lower quality blindly or change unrelated business code.
- **P2: Portfolio desktop CLS max 0.312 in one of three runs**, median 0. The raw `layout-shifts`/`cls-culprits-insight` points to `.page-cta-wrap` moving when streamed Portfolio content replaces its short loading fallback. The page is usable after settling; a settled screenshot/geometry pass does not cancel this load-time finding. Follow up with a stable loading reservation or evaluated server data-boundary change, then repeat populated, empty and outage cases plus three lab samples. This issue was recorded, not hidden by visual readiness.
- Portfolio mobile LCP median 2208ms met the target, but one sample reached 2861ms. Track the spread. All other measured CLS samples were zero. No app optimization was made during this QA; no fabricated before/after speedup is reported.
- Baseline captures preceded the page-only redirect fix. That fix changes server page error control flow, not public CSS, image assets, client boundaries, billing or APIs. The rebuilt Control passed final routing/auth checks. The 36-sample baseline was not relabeled as a new optimized build.

## Targeted warm latency

Five observations per operation, separately from Lighthouse. Category/search measurements include Playwright action overhead; search includes the existing 300ms debounce. Back/forward may reuse browser/router caches. API time includes full loopback response consumption, not isolated SQL query time.

| Operation | Median ms | Min–max ms |
|---|---|---|
| `category` | 107.2 | 75.8–263.6 |
| `debounced-search` | 375.5 | 373.8–416.6 |
| `back` | 22.4 | 21.0–31.3 |
| `forward` | 26.7 | 25.9–48.5 |
| `/api/admin/customers?lookup=1` | 21.7 | 18.7–72.9 |
| `/api/admin/quotes` | 27.7 | 24.2–31.9 |
| `/api/admin/tasks` | 15.7 | 14.4–16.6 |

Case-insensitive Needle/needle search returned the same single fixture. Query integration proves bounded LIMIT 12, one cover/project, count/paging and parameterized literal wildcard/injection handling. Accent folding is not implemented/claimed; no N+1/slow-query telemetry beyond inspected query shape was inferred.

## Assets and budgets

All emitted JS/CSS chunks (not per-route initial JS):
- web: 1,196,510 raw bytes; 368,473 gzip bytes.
- control: 1,321,202 raw bytes; 410,591 gzip bytes.

Use these measured values as a baseline: investigate increases above 10% in same-fixture median load/interaction/asset measurements, while retaining absolute LCP <=2500ms and CLS <=0.1 lab targets. TBT is a diagnostic, not INP. Set real field budgets only after representative RUM data. The current synthetic list sizes and warm local DB do not model production WAN load or a large production dataset.

No third-party merchant, bank, storage or real SMTP-provider latency was measured. Turbopack cold compile timings in development logs are separate from these production timings.
