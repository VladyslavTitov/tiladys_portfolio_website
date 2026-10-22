# Production measurement and accessibility — 19 October 2026

Local QA uses the verified synthetic PostgreSQL database, production builds, native Chrome, a cold browser cache, identical routes and three samples per device. Mobile emulates 1.6Mbps download, 150ms latency and 4× CPU slowdown. Server/image-transform caches are warm after the first request; first requests are retained rather than discarded. These samples are not deployed field p75 or an INP measurement.

Phase 3 baseline after layout repair: the homepage hero renders at 354px on a 390px phone and about 549px on desktop. Its `sizes="100vw / 50vw"` declaration still requests a 640px image on the phone (30,744 transferred bytes), 750px at 1440px (37,972 bytes), and 1920px at 2560px (130,010 bytes). This is a measured mismatch with the capped container, not a reason to change providers or caching of private media.

The focused change declares the actual phone gutters and a 557px desktop maximum, preserving high-density srcset choices, priority, intrinsic dimensions and existing artwork. Public/private media publication checks and no-store policies are unchanged. No database query change or new runtime library is justified by these measurements.

Before evidence: `evidence/phase3-before/results.json`. Comparable after results and the automated accessibility findings are recorded below when complete.

| Device | Hero transfer before → after | Total resource transfer, median | LCP median before → after | CLS |
| --- | --- | --- | --- | --- |
| 390px mobile | 30,744 → 14,946 bytes (51% less) | 308,998 → 293,281 bytes | 1084 → 724ms | 0 → 0 |
| 1440px desktop | 37,972 → 30,744 bytes (19% less) | 329,911 → 322,743 bytes | 80 → 76ms | 0 → 0 |
| 2560px desktop | 130,010 → 30,744 bytes (76% less) | 497,570 → 398,368 bytes | 60 → 68ms | 0 → 0 |

After evidence: `evidence/phase3-after/results.json`. The mobile first sample is slower in both groups (2184ms before, 1876ms after); all three samples remain in the evidence. The robust improvement is fewer image bytes at the same rendered size. Small desktop timing differences are noise, not a claim that every device got faster. Median total transfer is measured at the same time after page load; lazy images and browser scheduling affect which below-fold resources have arrived.

The initial axe 4.12.1 runs found small-text contrast failures on 14/22 public and 12/24 dashboard page/viewport combinations. Fixed muted helper labels, action text, status captions and hero eyebrows; original logo and five-column footer geometry remain unchanged. Public rerun: **22/22 with zero reported WCAG-tagged violations**, plus native mobile menu Escape/focus restoration and reduced-motion scrolling. Dashboard final rerun is recorded in the phase checkpoint. Zero automated violations is not a WCAG conformance certificate; screen-reader, complete tab traversal, actual 200% zoom and physical-device/on-screen-keyboard checks remain manual work.

Targets follow [Google's Core Web Vitals guidance](https://web.dev/articles/vitals): LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at field p75. Lab results do not prove these field targets. Accessibility contrast follows [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). The installed axe checker is used only during QA, not bundled into either app. Automated results do not replace keyboard, assistive-technology and physical-device review.
