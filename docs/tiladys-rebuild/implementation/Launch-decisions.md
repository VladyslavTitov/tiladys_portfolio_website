# Launch dependencies and retained decisions

This is a local implementation handoff. It does not authorize deployment, production migrations, publishing records, customer mail, payment entry or invoice issuance.

## External prerequisites

1. **Private storage and workers:** select/configure a production private object provider, signed purpose-bound uploads, CORS, bounded processing, expiry/orphan cleanup, retention, monitoring and matched object/database backup. The functional synthetic photo adapter is deliberately rejected in production. Private job/model file upload/download/removal and full-file archive export remain unavailable. Do not present them as a connected service.
2. **Mail:** verify the existing SMTP configuration against a sink, sender identity, deliverability, outbox reconciliation and failure behavior before enabling real acknowledgements/replies. All local tests used synthetic delivery callbacks or loopback SMTP; no customer message was sent. SMTP acceptance does not establish recipient delivery.
3. **Recovery:** independently verify the chosen production backup provider, retention window, object coverage and an isolated restore. Local synthetic restore evidence does not establish production recovery coverage.
4. **Business and content review:** review genuine project/product media, rights, localized copy/alt, actual prices, tax treatment, seller and bank details, product licenses, external preview/purchase URLs and the four new illustrations. Empty catalogues remain honest until actual owner-reviewed records are published. Test fixtures must never be copied into production.
5. **Release:** review the complete diff and migration SQL, take a verified backup, verify deployment/database binding and Node 24, run authorized release checks, then obtain explicit release authorization. No push or deployment has been performed.

## Deliberately unavailable capabilities

Reviews/moderation, profit/expense reports, bank synchronization, recurring charges, reminder scheduling, MFA/recovery provider setup, website-copy CMS, structured e-invoice export and invoice correction/cancellation are not represented as working integrations. Correction/cancellation needs approved accounting semantics, original-artifact retention, payment reconciliation and a tested reversal ledger; merely changing an issued status would be unsafe. Optional capability screens explain the unavailable state.

## Implementation decisions

- Website locales remain `en`, `de`, `uk`, `ru`, `sk`, `fr`; UI language and document/content language are separate. Control supports English/German labels. Historical stored invoice bytes remain untouched; newly rendered version 3 invoices are German first, then English.
- Contact retains the existing authoritative **5000-character message** and **50-character optional phone** bounds rather than shrinking previously accepted data to the register's proposed 4000/40. Server and form enforce the same values. Original message whitespace, newlines and Unicode are retained; validation only rejects insufficient non-whitespace content.
- EUR and Europe/Berlin remain existing billing policy. Tasks store an intended IANA timezone and an exact UTC instant. Lists and calendar state their UTC date boundaries; repeated local times require explicit occurrence selection, nonexistent times reject.
- Publication is an explicit reviewed action. Project homepage curation is now a separate `homepageFeatured` flag defaulting false; existing publication does not silently opt records into the new homepage. Public media checks current parent/rights/archive state on each request.
- Catalogue strings were preserved across all six locales. Structured rates and units require explicit entry/review; old display text is not guessed into a numeric price. FROM/PERCENTAGE/MONTHLY prices require agreement, and monthly prices also require an ordered period. No recurring billing is created.
- Native gallery/forms/statuses, trusted existing vectors, the genuine portrait and original five-column footer remain real components. Four generated decorative scenes are delivered at their native 1672×941 resolution with responsive WebP derivatives; the requested 2400×1350 masters are not claimed delivered.

Remaining source-level partial controls and verification limits are listed explicitly in Control-coverage.md and Acceptance-results.md. They must not be read as a declaration that all 390 contracts or all 52 acceptance scenarios have passed.
