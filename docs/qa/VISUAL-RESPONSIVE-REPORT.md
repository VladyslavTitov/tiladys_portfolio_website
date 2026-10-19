# Visual and responsive report

2026-10-19. Installed Chrome + Playwright core 1.64.1, device scale 1, reduced motion for visual checks, fixed locale/timezone and decoded local fonts/images. Production build and isolated QA records. Normal Lighthouse runs retained actual loading/lazy behavior.

## Executed matrix

- **376 PASS render/geometry cases**: 16 concrete public route families × 10 widths, 12 Control roots × 10 widths, another 80 public locale cases and 16 low-height/reflow cases.
- Required widths: **320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560px**. Public routes included home, About, Contact, Portfolio, service index/all four current services, both catalogues, legal pages and real synthetic project/product details. Other five locales received the same 16 routes at 1440px; Contact and Portfolio had their dedicated six-locale/all-width matrix.
- An additional **48 EN/DE Control module/viewport cases passed** after the fix, including interface-picker URL preservation and notification counts checked against actual isolated DB state (`evidence/dashboard-extra.json`).
- **56 axe scans PASS, zero WCAG-tagged violations**, public + Control at 320/1440px. Incomplete/manual-review items are retained in JSON, not treated as accessibility proof.
- **60 Contact cases / 420 buttons PASS**. Every button was 150×44px, radius8, border1, icon16, gap8, consistent padding/font/weight, one line, common right edge, no information overlap. Destinations, target and rel stayed unchanged. Existing long translated labels can visually ellipsize while the full accessible text/title remains; English labels fit without truncation.
- **60 Portfolio cases + 7 functional groups PASS**: five pressed-state filters, no old carousel/dropdown, 3/2/1 grid at desktop/tablet/phone, 16:10 media, bounded 12 cards, aligned actions, real filtering/search/history/paging, private detail/media denial and useful missing-cover fallback.
- No horizontal page overflow, broken decoded images, overlapping Contact actions or duplicate Inbox composers in the verified matrix. The full matrix retains measured boxes, KPI label/value separation and heading levels; it does not mathematically prove every arbitrary text pair cannot overlap.

Source evidence: `evidence/browser-verified/results.json`, `evidence/browser-verified/links.json`, `evidence/contact/after/results.json`, `evidence/portfolio/after/results.json`. The page guard fix later changed only server error navigation; CSS/content/image layout stayed byte-identical. Forty-six final production guard checks verified the rebuilt Control rendering.

## Before/after references

Fresh Contact baseline and verification captures are under `evidence/contact/before/` and `evidence/contact/after/`: `page-<width>.png` and `cards-<width>.png` for all ten widths. **All ten full-page pairs have identical SHA-256 hashes**: no cosmetic change or invented visual improvement is claimed in this QA task.

Settled full-page screenshots: `evidence/browser-verified/public--contact-375.png`, `public--portfolio-375.png`, `public--portfolio-1440.png`, `public--about-1440.png`; every Control root at 375/1440px uses `control--<route>-<width>.png`. Reviewed synthetic publication screenshot: `evidence/portfolio/editor-reviewed.png`. Real empty screenshots: `evidence/portfolio/empty-375.png` and `empty-1440.png`. Outage: `evidence/failures/database-outage.png`. Sandbox reply: `evidence/smtp-reviewed-reply.png`.

The initial 376-case run is deliberately retained in `evidence/browser/results.json`: it measured hidden streamed Portfolio DOM before insertion (zero-size image boxes), sampled image source swaps before decode and logged transient Chrome network suspension. No CSS was changed to hide those results. Explicit visible-result/decoded-image readiness produced the verified 376/376 matrix with no browser/network errors. An authenticated-context trace from the first harness was discarded; retained traces use fresh anonymous contexts only. This correction does not dismiss the independent real load-time CLS finding in the performance report.

## Keyboard and screen-reader-oriented review

Native keyboard checks passed: mobile menu Enter opens, Escape closes and returns trigger focus; Portfolio typing preserves search focus through the debounce, Tab reaches named Clear search, Enter clears and returns input focus. The existing 16-group interaction suite also checked native form validation, FAQ disclosure, unsaved Inbox/quote/task state, explicit publication review and invoice disclosure/read-only state.

Inspected the mobile Portfolio/Inbox captures: title and body text remained readable, filter controls wrapped naturally, inert hostile-looking message text rendered as text, and the form/list hierarchy remained visible. Automated accessible-name/label/role/live-region and contrast checks were included by axe. This is a screen-reader-oriented semantic/keyboard review, **not an actual NVDA/JAWS/VoiceOver session or WCAG 2.2 AA certification**.

Low heights: 320×250, 844×390, 1280×360. Reflow equivalents include 1440→720 CSS px (200%) and 1280→320 (400%). These are viewport reflow tests, not actual operating-system browser zoom. Physical assistive devices, touch behavior and other browser engines remain outside this new Playwright run; historical Firefox evidence is not relabeled as current execution.

## Remaining visual/performance issue

P2: Portfolio loading can move the CTA during a streamed transition; one of three desktop Lighthouse runs recorded CLS0.312 even though settled geometry passed. See `PERFORMANCE-REPORT.md`. No skeleton/CSS patch was silently made or screenshot baseline updated to conceal it.
