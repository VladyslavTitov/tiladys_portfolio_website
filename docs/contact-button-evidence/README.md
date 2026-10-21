# Contact button alignment verification

The existing card map in `apps/web/app/[locale]/contact/page.tsx` and shared `.contact-channel__action` rules in `apps/web/app/refinement.css` are reused. No new UI component library or application dependency was added.

The previous `fit-content` width, wrapping label style and content-sized desktop action column produced different widths. The shared rule now fixes border-box width/min/max to **150px**, height/min/max to **44px**, radius **8px**, border **1px**, padding **8px 5px**, icon **16px**, gap **8px**, and a common **14px / 700** font. Grid alignment puts every action at the same right edge. At narrow widths the action sits below the details; no special mobile width was needed. Card padding stays 20px and card gaps stay 15px.

English labels remain complete and on one line. Some longer existing translations use visual ellipsis inside the same frame; the original label stays in the DOM/accessibility name and native title tooltip. Font sizes are never reduced per button. Contact details continue to wrap normally.

## Playwright results

Playwright Core **1.64.1** was installed only in `/tmp/tiladys-contact-playwright`, using the installed Chrome against production Next builds and the existing guarded synthetic database. SMTP was disabled; no action link was activated and no form was submitted. The before build is the saved exact pre-change source, not a reconstructed CSS mock.

| Width | Before width range | Before height range | After, all seven |
|---:|---:|---:|---|
| 375 | 110.95–163.98px | 45.00–45.00px | 150×44px PASS |
| 430 | 110.95–163.98px | 45.00–45.00px | 150×44px PASS |
| 768 | 110.95–160.00px | 45.00–57.19px | 150×44px PASS |
| 1280 | 110.95–160.00px | 45.00–57.19px | 150×44px PASS |
| 1440 | 110.95–160.00px | 45.00–57.19px | 150×44px PASS |
| 1920 | 110.95–160.00px | 45.00–57.19px | 150×44px PASS |

After: **36 locale/width cases, 252 buttons, zero failures, browser errors or HTTP errors**. English covers all requested viewports; German, French, Slovak, Ukrainian and Russian additionally pass the same matrix. Programmatic checks cover dimensions, a shared right edge, actual one-line text geometry, complete English labels, 16px icons/8px gaps, centered icon/text groups, card padding/gaps, contact-copy nonoverlap, frame styles and body overflow. Each link’s exact `href`, `target` and `rel` is compared with the captured original at the same width.

[Before measurements](before/results.json) · [After measurements](after/results.json) · [Playwright test](../../tests/contact-buttons.playwright.mjs)

## Paired screenshots

The component clips capture from document origin so sticky navigation does not obscure the first card. Full-page captures retain all page content.

| Width | Cards before | Cards after | Full page before / after |
|---:|---|---|---|
| 375 | [Before](before/cards-375.png) | [After](after/cards-375.png) | [Before](before/page-375.png) / [After](after/page-375.png) |
| 430 | [Before](before/cards-430.png) | [After](after/cards-430.png) | [Before](before/page-430.png) / [After](after/page-430.png) |
| 768 | [Before](before/cards-768.png) | [After](after/cards-768.png) | [Before](before/page-768.png) / [After](after/page-768.png) |
| 1280 | [Before](before/cards-1280.png) | [After](after/cards-1280.png) | [Before](before/page-1280.png) / [After](after/page-1280.png) |
| 1440 | [Before](before/cards-1440.png) | [After](after/cards-1440.png) | [Before](before/page-1440.png) / [After](after/page-1440.png) |
| 1920 | [Before](before/cards-1920.png) | [After](after/cards-1920.png) | [Before](before/page-1920.png) / [After](after/page-1920.png) |

Mobile 375px and desktop 1440px component captures were inspected visually in addition to the automated assertions. Public production build, web lint/typecheck, test-script syntax and source whitespace checks passed; logs are in `checks/`. The broader existing business suite was not rerun for this UI-only change. Backend, schema, business contact definitions and link handlers were not edited.

## Reproduction and scope

```sh
# Tooling stays outside application dependencies.
npm install --prefix /tmp/tiladys-contact-playwright --ignore-scripts --no-audit --no-fund playwright-core@1.64.1
# Start the guarded saved-before build at 3110 and final production build at 3100.
CONTACT_TEST_PORT=3110 node tests/contact-buttons.playwright.mjs before
node tests/contact-buttons.playwright.mjs after
```

Capture stages refuse to overwrite existing evidence. Preserve/archive the previous stage before rerunning. Intermediate failed/incomplete captures and pre-change source copies are retained only under `/tmp/tiladys-contact-buttons/`; the repository evidence directory contains the final paired captures and successful results.

[contact-only.patch](contact-only.patch) contains this task’s already-applied source delta relative to its starting dirty working tree. Do not apply it again. Earlier owner edits were preserved. Task-owned servers 3100/3110 are stopped after verification; existing owner development servers 3000/3001 and the pre-existing synthetic database remain running. No deployment or production data operation was performed.
