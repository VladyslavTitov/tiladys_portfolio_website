# Review evidence

Use [the regression report](../ui-regression-report.md) for acceptance status, test scope and performance limits.

- `archived-before/`: initial dirty owner source rebuilt on the same production toolchain; matching before images, recorded failures retained.
- `handoff-public/`: frozen final public UI; seven primary routes at 375/768/1440/1920px plus critical 320px states; all 140 DOM cases in `results.json`.
- `final-control/`: dashboard captures at 390/1024/1440px plus critical 320px; 120 DOM cases. The subsequent focus-only correction is verified in `invoice-navigation/`.
- `verified-empty/`: real query results with zero published projects/products; primary empty-state presentation. `empty-catalogue/visibility.json` verifies content and private-default seeding.
- `handoff-all-firefox/`: 66 final cases, raw known CSP diagnostics retained and explained in the report.
- `final-interactions/`, `public-interactions/`, `navigation/`, `invoice-navigation/`: important states, native keyboard checks and data-preservation evidence.
- `media-review/`: the intermediate cropped tablet card and corrected composition, plus baseline gallery axe review.
- `accessibility/`: 46 final WCAG-tagged axe route/width checks.
- `performance/`, `performance-final/`: initial comparable Lighthouse runs and archived initial-source measurements. `handoff-performance/` contains frozen-source after measurements and paired three-sample native runs.
- `long-*`, `supplementary-public-final/`: extra locale/route checks. `snapshot-check/`: repeated captures against the reviewed final public baselines.
- `workflows/`: actual guarded API/auth/business/routing/secret-scan evidence and the synthetic bilingual PDFs. No real mail or financial records.
- `checks/`: command logs. `source-review.json`, `working-tree-delta.patch`, `build-sizes.json`: integrity, exact already-applied incremental changes, emitted asset comparison.

Public filenames begin `public-home-` or `public--<route>-`; dashboard names begin `control-home-` or `control--<route>-`. Match filenames between before/final directories for paired inspection. Synthetic aqua cases in media tests are QA fixtures, not customer claims; use `verified-empty/` to review the truthful no-approved-items state.

Intermediate stages are retained as JSON for investigation; their repeated PNGs are archived in `/tmp/tiladys-v3-checkpoints/intermediate-evidence.tar.gz`. Intermediate failures are not final acceptance results. New intentional baselines require a new stage; existing evidence stages cannot be silently overwritten by the refinement harness.
