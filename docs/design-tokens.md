# Implemented visual foundations

The existing navy/cyan identity, vector logos and five-column gradient footer are retained. No new UI framework, font service or image generation was introduced.

## Palette and type

| Token / role | Value |
|---|---|
| Navy / primary ink on cyan | `#071837` |
| Cyan action/accent | `#7be0df` |
| Body ink | `#13243f` |
| Muted essential text | `#5c6b82` / `#52647a` |
| Canvas / subtle surface | `#f4f7fa` |
| Border | `#dbe4ee` |
| Accessible teal links / selected records | `#11737a`, darker `#075c67` where needed |
| Warning text / surface | `#76520a` / existing pale warning surfaces |
| Focus ring | 3px `#11734c`, 3–4px offset |

Existing Inter/system sans stack remains. Public body copy is 16–18px with 1.5–1.65 line height; hero headings clamp 34–54px; section headings 26–36px; card titles 20–24px. Dashboard body is 15px, labels/secondary rows 14px, headings 23–32px. Small status codes are 12–13px and accompanied by text, not color alone. Financial values use tabular numerals and nonbreaking amounts. No forced single-word truncation or `break-all` was introduced.

## Grid and spacing

Public max width is 1200px. Page gutter is 24px above 768px, 18px below; at wide screens the capped container naturally creates larger outer margins. Contained secondary heroes use **separate** inner padding: 48px desktop, 32px tablet, 24px mobile. About/Contact have a 24px top separation (18px mobile). Homepage stays a navy full-width brand hero with copy/media aligned to the same content grid.

Adjacent plain sections use 32px block padding each (64px between content blocks), 24px each mobile (48px between blocks). Deliberate hero, founder and tinted process panels have their own internal padding. Major pairs use 24–28px gaps; standard cards use 24px. Card radius is 16px; media and inner panels use 10–14px. Borders replace heavy card shadows. Footer geometry/content/gradient is retained.

Three service cards use 3 columns when readable, 2 at 600–1000px with normal wrapping, then 1. All media stages share a reserved 16:9 ratio (about 216px high at 384px wide); photo cover and transparent contain treatments share the same edge geometry. Card bodies are flex columns with actions at the bottom. Grouped five-item service grids span the final odd group across both columns; expectation/limitation panels form a full-width paired row. Process lists use 6 / 3 / 2 / 1 columns, with a horizontal number/text row on small phones. Related navigation uses two readable rows/cards, then one column.

Dashboard max main width remains 1600px; sidebar remains 224px. Main padding is 28px wide, 20px tablet, 16px phone. Metrics use four / two / one columns with label/value on separate rows. Search, locale and follow-up count are grouped. Shared workbench lists remain server paginated (25 records) and scroll within a bounded list; mobile record editors retain Back/draft behavior. Invoice/project lists are bounded independently, not allowed to stretch the whole editor page. Explicit section anchors keep forms mounted. Catalogue uses native `details` groups, preserving controlled field values while collapsed.

## Interaction and media

Primary controls retain cyan/navy styling and 44px minimum height; secondary controls use clear borders; tertiary service anchors use underlined teal/light cyan as appropriate. Hover, focus-visible, disabled and pending states are explicit. Reply fields lock during a pending send, selection is blocked during pending actions, and unsaved replies/private enquiry work warn before record switching. No selection-triggered read mutation or send occurs. Destructive actions retain existing confirmation and server policy. Sections are links, not misleading tab widgets; language buttons use pressed/group semantics where appropriate.

Portfolio featured projects rotate only on explicit previous/next actions; grid paging is separate and named. Native FAQ disclosures retain keyboard behavior. Reduced motion remains supported. Loading/error/empty copy is retained; missing media uses an honest reserved frame and failed images fall back without invented case studies. Contact keeps consent/privacy links, existing server validation and a calm upload-unavailable notice. The unsupported security slogan and unverified response-time card are omitted; no new security or response-time promise replaces them.

See [image-audit.md](image-audit.md) for actual source composition, reserved ratios, `sizes` and delivery. Original editorial assets remain untouched. Source layering is `globals.css` → existing `rebuild.css` → organized `refinement.css`; consolidating the owner’s larger legacy style history is a separate maintenance task, not a prerequisite for this repair.
