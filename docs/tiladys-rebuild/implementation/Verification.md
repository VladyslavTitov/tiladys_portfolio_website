# Verification and limits

All writes, issued PDFs, payments, accounts, enquiries and uploads in these checks are synthetic. The verified database binding is `127.0.0.1:55432/tiladys_rebuild_test`; a separate legacy fixture and separate restore target are used for migration/recovery. No production records were read to obtain screenshots and no customer mail was sent. SMTP was disabled, synthetic callback-based, or loopback-only.

## Executed checks

| Check | Actual result | Evidence |
| --- | --- | --- |
| Node/runtime | Node 24.21.0, npm workspaces; existing framework/identity preserved | Dependency-review.md |
| `npm test` | Passed; the original optional CRM database integration case skipped because CRM_TEST_DATABASE_URL was unset. Dedicated isolated rebuild tests below actually ran | evidence/checks/npm-test.log |
| `npm run typecheck` | Both apps passed | evidence/checks/typecheck.log |
| `npm run lint` | Both apps passed | evidence/checks/lint.log |
| `npm run test:rebuild:unit` | 9 named cases passed | evidence/checks/domain.log |
| `npm run test:rebuild:db` | 10 named cases passed against PostgreSQL 17 | evidence/checks/integration.log |
| `npm run test:bilingual` | 6 named PDF/billing cases passed | evidence/checks/bilingual.log; evidence/pdfs |
| `npm run test:rebuild:api` | 15 actual HTTP workflow groups passed | evidence/api-checks.json; evidence/checks/api.log |
| `npm run build` | Both webpack production builds passed with Node 24 and the actual lockfile | evidence/checks/build-final.log |
| Final `npm run build:control` | Passed after the later Control-only UI/CSS changes | evidence/checks/build-control-final.log |
| Browser public phase | 14 routes × 7 widths = 98 layout cases passed, five footer sections, H1/label/overflow checks; native mobile Escape/focus; six website locales | evidence/browser/public-layout.json; evidence/checks/browser-public.log |
| Browser private phase | Passed: 84 private layout cases, 30 German layout cases, DST/Back/Resume, original Unicode storage, lost photo ACK retry (one PUT/one enquiry), attachment/media privacy, export expiry and reauth denial | evidence/browser/results.json; evidence/checks/browser-private.log |
| Production lab | Passed four layout variants, image loading, accessible-name/heading tree, reduced motion and no captured uncaught exceptions | evidence/lab/results.json; evidence/checks/lab.log |
| Legacy migration | All 23 migrations applied to populated prior schema; original synthetic issued bytes/checksum/version/number/sequence all unchanged | evidence/legacy-migration.json; evidence/checks/legacy-migration.log |
| Database/object restore | Passed: all 38 table fingerprints, all indexes, 23 object-file byte hashes and 23 accepted media references match in separate restore targets; no source overwrite/production backup claim | evidence/recovery-final.json; evidence/checks/recovery.log |
| Known-secret scan | No exact known secret/synthetic credential matches in checked client bundles and implementation documentation | evidence/client-secret-scan.json |
| `git diff --check` | Passed after whitespace fixes | Final local review |

The domain/database checks cover exact decimals, unknown tax, price agreement, print feasibility/inspection, IANA zones/DST, immutable quote acceptance/conversion, payment replay/overpay races, one-number concurrent issuance, Berlin New Year sequence allocation, immutable accepted-quote invoice terms, accepted/unknown/record-failed mail reservations, and three real valid 5MiB PNGs at the 15MiB finalization boundary.

The HTTP suite exercises actual route authorization/origin checks, catalogue stale/archive retention, project draft-first publication and translated media review, project/product one-hop aliases, both-origin public withdrawal, forged attachment parents, issued PDF immutability after client/catalogue/bank changes, missing-original recovery failure, real custom login/session ownership, reviewed enquiry handoff, sanitized completed-job publication draft, formula-safe owner-bound exports, standalone draft replay, stale settings review, shared-email clients, wrong-client invoice relationships and escaped hostile enquiry text.

## Browser method and provenance

Chrome runs natively through CDP against the real local apps/database. Test fixtures are explicitly synthetic and the script refuses any other database binding. Public viewports: 320, 360, 390, 768, 1024, 1280, 1440. Private matrix: 12 routes at those seven widths; German long-label matrix: six routes at 320, 390, 768, 1024, 1440. The public phase was retained separately after passing; subsequent Control-only fixes rerun the private phase with `REBUILD_BROWSER_PHASE=control`. Default invocation executes both phases. Reused public rows are explicitly identified, not presented as fresh private-run measurements.

Turbopack development runs stalled on image resources after emulation changes; webpack development and production image/layout checks completed. Browser navigation now waits for the matching loader lifecycle, avoiding an old-document race. Observed German invoice grid/toolbar overflow and long client-selector sizing were fixed without clipping content or adding a page minimum width. A shared rate-limit collision between simultaneous test suites was resolved by sequential execution and resetting only the guarded synthetic counters before the contact cases. A one-hour synthetic session was renewed after expiry; no application session policy was weakened.

Screenshots and files under evidence are synthetic visual QA, not owner-approved portfolio evidence or a promise that every individual control passed. Gallery navigation, complete keyboard traversal, screen reader announcements, on-screen keyboard/safe-area behavior and all native browser zoom/device combinations need their specific manual review.

## Performance and accessibility scope

The local production-build mobile sample used cold browser cache, 1.6Mbps download, 150ms latency and 4× CPU slowdown: **LCP 1512ms, CLS 0, resource transfer 328716 bytes**. Desktop sample LCP was 180ms. These are single local-loopback samples with synthetic gallery images; transfer counts are observed Resource Timing bytes before a deliberate full-page screenshot loads below-fold media. They are not deployed field p75, INP or a guarantee for future owner media.

Production checks also cover 844×390 landscape and 720px reflow equivalent to a 1440px viewport at 200% zoom. This is not a claim that native browser 200% zoom was manually audited. Reduced-motion emulation and Chrome accessibility-tree names/headings are checked; manual screen-reader verification and a complete WCAG 2.2 AA assessment are outstanding. See A33/A34/A47/A48 in Acceptance-results.md.

## Remaining limits

All 52 acceptance cases have a scoped result. Partial, blocked and conditional cases are retained as such. Real private storage/job/model workers, large file archives, SMTP delivery/reconciliation, production recovery, genuine content/rights and provider/business/legal configuration remain affected release dependencies. Retained older-editor recovery/navigation differences are listed individually in Control-coverage.md. A successful local build or screenshot does not resolve them.

Automatic approval review rejected a bulk npm audit because it would transmit potentially private dependency metadata. The approved public-advisory alternative and focused Sharp 0.35.5 update are documented in Dependency-review.md; no full clean transitive audit is claimed. Temporary approval-review timeouts were retried only as permitted for the same authorized local action; no production action was substituted.
