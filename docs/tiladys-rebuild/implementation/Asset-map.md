# Asset map: source binding and remaining media work

Implementation inventory updated 14 October 2026 (Europe/Amsterdam). All 51 supplied asset IDs appear exactly once below. This map records actual code/files, native/illustrative/authentic classification, missing/substitution status and policy. Four generated illustration families are now delivered below; publication and owner approval are separate. Original registers remain unchanged.

The archive's reference/public and reference/dashboard PNGs are whole design boards, not production assets. They contain concept/sample content and must not be sliced into fake work/product evidence. The deployed bundle contains two original SVG families, one existing founder JPEG, a transparent hero illustration and three existing service rasters. Four new marketing scenes are delivered with their prompts and measurements; other unique scenes use the explicit substitutions recorded below. Portfolio/product evidence is data-bound; no production private rows were inspected to fill gaps. Synthetic browser fixtures are testing data only.

Existing rasters were visually inspected read-only. The square hero cutout contains branded lettering and depicts laptop/phone/plant/accessories rather than the requested three-service composition; the website raster contains illustrative device UI; the PC raster depicts laptop/cleaning tools. These are illustrations, not client evidence. No exact new-asset equivalence is claimed.

## Shared rights, text and delivery policy

- Trusted brand vectors keep original geometry/viewBox and proportions; generated/logo-like lettering cannot replace those vectors. Functional icons/backgrounds/charts/dimensions stay native UI. Website text and precise measurements stay separate HTML/SVG.
- Illustrations never prove client work, actual premises, certified repairs, owned model geometry, licence, availability or sales. Generated concepts must remain labelled decoration/concept. Real founder/project/product/customer evidence is never regenerated to fill a missing item.
- Public Project/Product requires explicit owner publication and approved associated media. Private originals stay private; every resized public request checks current published state. Job completion/portrait editing does not grant customer-photo rights. Review photos remain unavailable until separate permission/moderation pipeline exists.
- Authentic image alt identifies actual subject/localized project/product; decorative visuals get empty alt or aria-hidden when adjacent text supplies purpose. Existing per-record title fallback is not a replacement for audited specific localized alt. Project editor now supports localized alt and first-image/cover ordering staged through a stale-guarded save; product image uploader records translated alt.
- Master files remain original. Raster target policy is AVIF/WebP with appropriate JPEG fallback, reserved dimensions/srcset/sizes and actual-LCP-only priority, below-fold lazy loading; specific packaged derivatives are recorded per asset; unlisted requested files are not claimed present. Static images currently use Next Image optimization; status-controlled record images use custom bounded width requests/true no-store rather than persistent optimizer cache. Dynamic webp derivatives are not equivalent to a packaged master + mobile-crop family.
- Heroes should keep subject right and left 45% quiet, then protect subject via whole illustration/mobile 4:3 crop; authentic galleries retain essential evidence and zoom. Current static service visuals use contain in most contexts; compact cards may use legacy cover. Existing portrait renders 240×300px (mobile 200×250), object-fit cover; no stored focal-point control or distinct owner-reviewed derivative files.

## Complete inventory

### B01 — Original wordmark

**Status:** bound; invoice container uses circuit mark instead. **Class:** authentic trusted vector. **Actual source:** `apps/web/public/brand/icon.svg and identical apps/control/public/brand/icon.svg`.

Binding: [Header.tsx](../../../apps/web/components/Header.tsx), [Footer.tsx](../../../apps/web/components/Footer.tsx), [Nav.tsx](../../../apps/control/components/Nav.tsx), [page.tsx](../../../apps/control/app/login/page.tsx), [invoice-pdf.ts](../../../apps/control/lib/invoice-pdf.ts).

Original 445:106 wordmark reused in public header/footer and Control sidebar/login. PDF currently uses logo.svg circuit mark, preserving existing renderer; B01 is not the invoice logo binding.

Reference containers: public-header, live-footer, control-sidebar, login, invoice. Required alt: TiLADYS. Rights/meaning constraint: Exact original asset; no pseudo-logo or generated brand lettering..

Requested crop/master: original445:106; Original SVG; trusted derivatives only. Mobile policy: Retain original vector proportions and responsive display size; do not crop the brand mark.. Derivative policy: Reuse the trusted original SVG; preserve its viewBox and geometry.. These are requirements unless actual delivery above confirms them.

### B02 — Circuit logo mark

**Status:** bound; includes existing PDF use. **Class:** authentic trusted vector. **Actual source:** `apps/web/public/brand/logo.svg and identical apps/control/public/brand/logo.svg`.

Binding: [Footer.tsx](../../../apps/web/components/Footer.tsx), [invoice-pdf.ts](../../../apps/control/lib/invoice-pdf.ts).

Decorative circuit marks retained in footer. Existing PDF renderer rasterizes trusted SVG at 392px with sharp, then embeds at 70×52pt; this is a trusted derivative, not generated branding.

Reference containers: footer-brand, footer-legal. Required alt: Decorative empty alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: original; Original SVG. Mobile policy: Retain original vector proportions and responsive display size; do not crop the brand mark.. Derivative policy: Reuse the trusted original SVG; preserve its viewBox and geometry.. These are requirements unless actual delivery above confirms them.

### BG01 — Public hero and CTA backgrounds

**Status:** bound with legacy gradients still present. **Class:** native CSS. **Actual source:** `native style rules`.

Binding: [rebuild.css](../../../apps/web/app/rebuild.css), [globals.css](../../../apps/web/app/globals.css), [PageHero.tsx](../../../apps/web/components/PageHero.tsx), [ContactCta.tsx](../../../apps/web/components/ContactCta.tsx).

Home navy hero and native headings/buttons exist; other retained page-hero/CTA rules still use legacy blue/navy gradients. No rasterized interface text or giant background asset.

Reference containers: all-public-heroes, contact-CTA. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No generated text or per-page giant background downloads..

Requested crop/master: 16:9; No raster. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

### BG02 — Live footer background

**Status:** bound. **Class:** native CSS. **Actual source:** `live footer gradient at globals.css .site-footer`.

Binding: [Footer.tsx](../../../apps/web/components/Footer.tsx), [globals.css](../../../apps/web/app/globals.css), [rebuild.css](../../../apps/web/app/rebuild.css).

Five-column live footer and radial/110-degree navy gradient retained. Footer visual source is CSS, not reference-board pixels.

Reference containers: all-public-footers. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Latest user-approved footer overrides every generated one-row footer..

Requested crop/master: 16:9; No raster. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

### BG03 — Dashboard surfaces

**Status:** bound. **Class:** native CSS. **Actual source:** `Control canvas/card/sidebar tokens`.

Binding: [rebuild.css](../../../apps/control/app/rebuild.css), [globals.css](../../../apps/control/app/globals.css), [layout.tsx](../../../apps/control/app/dashboard/layout.tsx).

Navy sidebar, pale canvas, white bordered panels and native form/table layouts. No photographic Control wallpaper.

Reference containers: control-canvas, cards, forms, sidebar. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:9; No raster. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

### IC01 — Functional icon set

**Status:** bound. **Class:** native vector icons. **Actual source:** `lucide-react plus existing social SVG components`.

Binding: [SocialLinks.tsx](../../../apps/web/components/SocialLinks.tsx), [ThreeServices.tsx](../../../apps/web/components/ThreeServices.tsx), [Nav.tsx](../../../apps/control/components/Nav.tsx), [control-toolbar.tsx](../../../apps/control/components/control-toolbar.tsx).

Decorative icons aria-hidden beside text, labelled icon-only menu controls. Native functional icon system reused; no generated icon bitmap set.

Reference containers: service-cards, forms, process, footer, control-actions. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Do not generate icons or replace working branded social identifiers with random symbols..

Requested crop/master: 1:1; SVG. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

### G01 — Three-service home hero

**Status:** generated and bound; owner publication review pending. **Class:** illustrative raster with alpha. **Actual source:** `assets/masters/g01-three-services.png`; shipped `apps/web/public/illustrations/g01-three-services-{480,800,1200,1600}.webp`.

Binding: Home and Services overview; laptop, phone, tower/tools and practical black/white prints. Native master 1672×941; four real derivatives, no artificial upscale to the requested 2400×1350. Exact prompts and generator mode are in [Generated-assets.md](Generated-assets.md); measured dimensions, bytes and hashes are in [asset-measurements.json](asset-measurements.json). These scenes are decoration, never completed-work or actual-premises evidence.


Reference containers: P01.hero, P01.service-teasers. Required alt: Illustration of website creation, 3D printing and PC support. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G02 — Website service hero

**Status:** substitution; new scene missing. **Class:** existing illustration raster. **Actual source:** `apps/web/public/services/tiladys-service-website-creation.png`.

Binding: [services.ts](../../../apps/web/lib/services.ts), [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [ThreeServices.tsx](../../../apps/web/components/ThreeServices.tsx).

Existing 1672×941 laptop/phone website-like placeholder scene is used for Websites. It is illustrative and is not a real portfolio screenshot; intended blank preview insert/composite is not supplied separately.

Reference containers: P03.hero, P01.website-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G03 — 3D printing collection hero

**Status:** generated and bound; owner publication review pending. **Class:** illustrative raster with alpha. **Actual source:** `assets/masters/g03-practical-prints.png`; shipped `apps/web/public/illustrations/g03-practical-prints-{480,800,1200,1600}.webp`.

Binding: 3D service and teaser; organizer, tray, planter and stand with visible print texture. Native master 1672×941; four real derivatives, no artificial upscale to the requested 2400×1350. Exact prompts and generator mode are in [Generated-assets.md](Generated-assets.md); measured dimensions, bytes and hashes are in [asset-measurements.json](asset-measurements.json). These scenes are decoration, never completed-work or actual-premises evidence.


Reference containers: P04.hero, P01.print-card. Required alt: Illustrative black and white PLA objects. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G04 — PC support hero

**Status:** substitution; requested open desktop scene missing. **Class:** existing illustration raster. **Actual source:** `apps/web/public/services/tiladys-service-pc-laptop.webp`.

Binding: [services.ts](../../../apps/web/lib/services.ts), [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx).

Existing 1440×810 laptop/cleaning-tools illustration supplies PC service. It does not depict the requested correctly assembled open desktop PC and is not proof of an actual customer repair.

Reference containers: P05.hero, P01.pc-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No unsafe assembly, loose liquid, impossible connectors or fictitious GPU lettering..

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G05 — Portfolio hero

**Status:** not used; text hero substitution. **Class:** native CSS/text. **Actual source:** `PageHero on Portfolio`.

Binding: [page.tsx](../../../apps/web/app/[locale]/portfolio/page.tsx), [PageHero.tsx](../../../apps/web/components/PageHero.tsx).

Portfolio uses a native text hero. Requested monitor/print still life is absent; real ProjectImage content remains separate.

Reference containers: P06.hero. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G06 — About workbench hero

**Status:** generated and bound; owner publication review pending. **Class:** illustrative raster with alpha. **Actual source:** `assets/masters/g06-about-workbench.png`; shipped `apps/web/public/illustrations/g06-about-workbench-{480,800,1200,1600}.webp`.

Binding: About workbench hero; genuine founder photograph remains separate. Native master 1672×941; four real derivatives, no artificial upscale to the requested 2400×1350. Exact prompts and generator mode are in [Generated-assets.md](Generated-assets.md); measured dimensions, bytes and hashes are in [asset-measurements.json](asset-measurements.json). These scenes are decoration, never completed-work or actual-premises evidence.


Reference containers: P10.hero. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: This is illustrative workspace, not a claim of an actual TiLADYS office..

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G07 — Contact workbench hero

**Status:** generated and bound; owner publication review pending. **Class:** illustrative raster with alpha. **Actual source:** `assets/masters/g07-contact-workbench.png`; shipped `apps/web/public/illustrations/g07-contact-workbench-{480,800,1200,1600}.webp`.

Binding: Contact workbench on desktop; hidden on phones so the form remains early. Native master 1672×941; four real derivatives, no artificial upscale to the requested 2400×1350. Exact prompts and generator mode are in [Generated-assets.md](Generated-assets.md); measured dimensions, bytes and hashes are in [asset-measurements.json](asset-measurements.json). These scenes are decoration, never completed-work or actual-premises evidence.


Reference containers: P11.hero. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No wall poster with baked copy; no fictitious office location or contact information..

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G08 — Optional legal-page illustration

**Status:** optional intentionally omitted. **Class:** native text header. **Actual source:** `LegalPage compact title`.

Binding: [LegalPage.tsx](../../../apps/web/components/LegalPage.tsx).

Text-only legal header follows recommended default. No generated scales, legal text or certification image.

Reference containers: P12.legal-hero. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Optional decorative asset only; no generated legal text, firm insignia or certification..

Requested crop/master: 16:9; 2400x1350 master; responsive 1600/1200/800/480 derivatives. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G09 — Compartment desk organizer concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.gallery, P07.example, D08.example, D09.example. Required alt: Concept illustration of a black printed desk organizer. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G10 — Faceted white planter concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.gallery, P06.example, D09.example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G11 — White phone stand concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.gallery, P09.example, D06.example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G12 — Black phone stand concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P01.print-teaser, D06.example, D09.example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G13 — Cable clip concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.gallery, P04.model-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G14 — Electronics enclosure concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.gallery, P07.example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No claim this is an actual certified safety enclosure or electrical product..

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G15 — Hex-pattern pen cup concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P04.model-card, P01.print-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G16 — Decorative gear concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P01.model-teaser, P07.related. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustrative decorative object, not validated functional engineering geometry..

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G17 — Generic miniature boat concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P01.hero, P07.related, P09.example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Respect model rights; no assumption that benchmark model licences permit resale or redistribution..

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G18 — Porous decorative sphere concept

**Status:** missing / unbound. **Class:** proposed illustration only. **Actual source:** `No separate file or code binding found`.

Binding: [ServiceVisual.tsx](../../../apps/web/components/services/ServiceVisual.tsx), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx).

No individual concept asset exists in shipped public files. Native 3D hero is a generic substitute only. Real portfolio/product projections never label this absent generated concept as completed work or owned product.

Reference containers: P10.hero. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G19 — Black and white PLA spools

**Status:** missing / text substitution. **Class:** native text instead of proposed illustration. **Actual source:** `3D materials section`.

Binding: [page.tsx](../../../apps/web/app/[locale]/services/[slug]/page.tsx).

Materials/capability copy is native text; no individual black/white spool bitmap.

Reference containers: P04.materials. Required alt: Black and white filament spools. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 3:2; 2100x1400. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G20 — Sketch and caliper helper photo

**Status:** missing / native form substitution. **Class:** native labels instead of proposed illustration. **Actual source:** `Contact and Print JobBrief inputs`.

Binding: [ContactForm.tsx](../../../apps/web/components/ContactForm.tsx), [job-brief-editor.tsx](../../../apps/control/components/job-brief-editor.tsx).

No caliper/sketch helper photo or precise dimensional diagram. Free-text dimensionsMm is not a validated drawing.

Reference containers: P11.3d-helper, D04.print-helper. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Exact dimensional diagrams/labels are native SVG overlays separately verified; imagegen must not supply measurements..

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G21 — Local support workspace illustration

**Status:** missing / enquiry link substitution. **Class:** native text/actions. **Actual source:** `PC local/remote links`.

Binding: [page.tsx](../../../apps/web/app/[locale]/services/[slug]/page.tsx), [page.tsx](../../../apps/web/app/[locale]/about/page.tsx).

PC page has local/remote enquiry choices, but no separate workspace/headset image. About does not render the distinct requested local/online cards.

Reference containers: P05.local-card, P10.local-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration, not a photograph of the actual premises..

Requested crop/master: 16:10; 2400x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G22 — Remote support illustration

**Status:** missing / enquiry link substitution. **Class:** native text/actions. **Actual source:** `PC local/remote links`.

Binding: [page.tsx](../../../apps/web/app/[locale]/services/[slug]/page.tsx), [page.tsx](../../../apps/web/app/[locale]/about/page.tsx).

PC page has local/remote enquiry choices, but no separate workspace/headset image. About does not render the distinct requested local/online cards.

Reference containers: P05.remote-card, P10.remote-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:10; 2400x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G23 — Education decorative still life

**Status:** missing / native factual text substitution. **Class:** native text. **Actual source:** `About education list`.

Binding: [page.tsx](../../../apps/web/app/[locale]/about/page.tsx).

No decorative engineering-book image. Education remains factual structured copy; no fake diploma.

Reference containers: P10.education. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No fake university diploma, readable book title or certification..

Requested crop/master: 16:10; 2400x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G24 — Setup/software service thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.setup-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G25 — Troubleshooting thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.troubleshooting-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G26 — Cleaning thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.cleaning-card, D04.pc-example. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Do not depict dangerous powered repairs, inappropriate liquid or impossible hand/tool geometry..

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G27 — SSD/RAM upgrade thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.upgrade-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G28 — Backup/data thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.backup-card. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No personal filenames or fake encryption certification..

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G29 — Remote service thumbnail

**Status:** missing / native service card substitution. **Class:** native text/actions. **Actual source:** `ServiceExtras PC cards`.

Binding: [ServiceExtras.tsx](../../../apps/web/components/services/ServiceExtras.tsx).

PC service tile has localized heading and real service-detail enquiry link, but no unique thumbnail. Existing generic PC hero is not a separate per-service photo.

Reference containers: P05.remote-card-small. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Illustration only; never label as a completed client project or actual owned product.

Requested crop/master: 16:10; 2000x1250. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G30 — Generic website-preview device carrier

**Status:** missing / unused carrier. **Class:** proposed illustration carrier only. **Actual source:** `No carrier file/composite; published project media stays authentic`.

Binding: [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx).

No blank device carrier/composited screenshot family. Missing actual work media now yields neutral Image unavailable rather than illustrative website evidence.

Reference containers: P03.gallery-concepts, P01.selected-work-placeholder. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Real gallery uses actual screenshots; this is illustration carrier only..

Requested crop/master: 16:10; 2400x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### G31 — Template preview carrier

**Status:** missing / actual product projection substitution. **Class:** proposed carrier replaced by authentic record media. **Actual source:** `ProductImage record-bound media only`.

Binding: [page.tsx](../../../apps/web/app/[locale]/products/[slug]/page.tsx), [public-products.ts](../../../apps/web/lib/public-products.ts).

No generated paired template frames. Real product previews only when owner-provided and published; empty catalogue is truthful and no template titles/prices are invented.

Reference containers: P03.templates, P08, P09, D09. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Do not invent Framer products or availability; no fake purchase price..

Requested crop/master: 16:10; 2400x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R01 — Founder portrait

**Status:** bound existing photo; owner identity/rights not re-certified. **Class:** authentic existing photograph. **Actual source:** `apps/web/public/about/vladyslav-titov.jpeg`.

Binding: [FounderPortrait.tsx](../../../apps/web/components/FounderPortrait.tsx), [page.tsx](../../../apps/web/app/[locale]/page.tsx), [page.tsx](../../../apps/web/app/[locale]/about/page.tsx), [rebuild.css](../../../apps/web/app/rebuild.css).

Existing 3583×5374 JPEG (8,382,260 bytes) supplies real compact portrait. Component uses actual name as alt and neutral fallback; no generated face. Control account/content-editor portrait containers are not implemented.

Reference containers: P01.founder-teaser, P10.portrait, D13.account, D12.content-editor. Required alt: Vladyslav Titov, founder of TiLADYS. Rights/meaning constraint: Never replace with the generated stranger shown in some mockups..

Requested crop/master: 4:5; Original photo plus 960x1200 max webmaster. Mobile policy: Use the same 4:5 head-and-shoulders portrait crop at compact display size; retain face, identity and focal point. Never use a generic 4:3 hero crop.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R02 — Mongoose Signs website

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R03 — DonetsFit website

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R04 — DonetsFit Calculator

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R05 — Dual-boot workstation

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R06 — ETIT/VPU virtual tour

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R07 — TiLADYS business card

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R08 — JobAdys

**Status:** record-bound; exact current project acquisition unverified. **Class:** authentic project-media requirement. **Actual source:** `Published Project / ProjectImage records; no bundled named project file`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [SelectedWork.tsx](../../../apps/web/components/SelectedWork.tsx), [PortfolioExplorer.tsx](../../../apps/web/components/PortfolioExplorer.tsx), [page.tsx](../../../apps/web/app/[locale]/portfolio/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/media/[id]/route.ts), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

Loader retains original project records/slugs/categories; active images now filter archivedAt and localized alt/cover order is owner-editable. This read-only audit did not read production customer/project image rows or prove this named project is currently published. Synthetic browser fixtures prove layout only and never establish real evidence acquisition.

Reference containers: P01.selected-work, P03.gallery (website projects only), P06.grid, P07.detail, D08.project-editor. Required alt: Localized actual project title and subject. Rights/meaning constraint: Generated cafe/physio/plant-shop examples do not replace these verified project names..

Requested crop/master: source plus 16:10; Source-dependent; target 1600-wide detail. Mobile policy: Use reviewed 16:10 thumbnails with the actual page/photo focal point; detail view retains complete original or accessible zoom. Do not crop essential evidence.. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R09 — Real Framer templates

**Status:** record-bound; real listings/previews not acquired by audit. **Class:** authentic product screenshots requirement. **Actual source:** `Product / ProductImage published records`.

Binding: [public-products.ts](../../../apps/web/lib/public-products.ts), [page.tsx](../../../apps/web/app/[locale]/products/[slug]/page.tsx), [route.ts](../../../apps/web/app/api/public/product-media/[id]/route.ts), [product-manager.tsx](../../../apps/control/app/dashboard/products/product-manager.tsx).

Requires actual owned Framer media/title/license/price/demo/merchant. No bundled individual real template screenshots or confirmed stock; website page links catalogue rather than displaying a fabricated template row.

Reference containers: P03.template-card, P08.catalogue, P09.detail, D09.product-editor. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Studio/Nova/Fork mockup names not assumed real products..

Requested crop/master: 16:10 plus mobile; 1600-2400-wide originals. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R10 — Real completed print photos

**Status:** record-bound; completed-print evidence not acquired by audit. **Class:** authentic real-print photographs requirement. **Actual source:** `Published 3d-printing Project/ProjectImage; private job files remain unavailable`.

Binding: [public-projects-db.ts](../../../apps/web/lib/public-projects-db.ts), [page.tsx](../../../apps/web/app/[locale]/services/[slug]/page.tsx), [job-portfolio-draft.tsx](../../../apps/control/components/job-portfolio-draft.tsx), [project-manager.tsx](../../../apps/control/app/dashboard/projects/project-manager.tsx).

3D selected-work reads only actual published category. Completed-job handoff copies reviewed text only, no private image. No local real print-photo set or verified acquisition; an empty result stays empty. Project image removal now retains original bytes privately via archivedAt and active-gallery projection.

Reference containers: P04.gallery, P06.grid, P07.print-detail, D08, D04.job-files. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: No generated geometry sold as completed client work; check model licence and customer permission..

Requested crop/master: 4:3; Original plus 1600-wide. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R11 — Real downloadable model previews

**Status:** record-bound; actual mesh/render relationship unverified. **Class:** authentic actual-model render requirement. **Actual source:** `MODEL_3D Product/ProductImage records`.

Binding: [public-products.ts](../../../apps/web/lib/public-products.ts), [page.tsx](../../../apps/web/app/[locale]/products/[slug]/page.tsx), [product-manager.tsx](../../../apps/control/app/dashboard/products/product-manager.tsx).

No actual owned STL files/render outputs packaged. Owner upload preview is required; attractive imagery alone cannot prove matching downloadable geometry. Public model files/distribution pipeline is not enabled.

Reference containers: P04.model-card, P08, P09, D09. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: A pretty generated product does not prove the downloadable mesh matches..

Requested crop/master: 4:3; 2000x1500. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### R12 — Customer enquiry/review attachments

**Status:** private attachment flow bound; production new uploads blocked. **Class:** authentic customer-upload evidence. **Actual source:** `Existing ContactAttachment plus synthetic UploadReservation/MediaObject pipeline`.

Binding: [upload-reservations.ts](../../../apps/web/lib/upload-reservations.ts), [contact-images.ts](../../../apps/web/lib/contact-images.ts), [route.ts](../../../apps/web/app/api/contact/route.ts), [attachments.tsx](../../../apps/control/app/dashboard/messages/attachments.tsx), [route.ts](../../../apps/control/app/api/admin/messages/[id]/attachments/[attachmentId]/route.ts).

Existing private inbox attachment authorization retained. New 5MiB direct storage adapter is development-only; production photos unavailable. Optional Review table/public photo moderation is disabled; no private customer media is made public or regenerated.

Reference containers: D02.private-inbox, D15.review, P11.optional-approved-review. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Never regenerate customer evidence or publish private inbox attachments..

Requested crop/master: source; Bounded original; safe image variants. Mobile policy: Keep critical object inside central 65%; do not crop screen/hand/contact point; use separate 4:3 crop or stack whole illustration below text. Derivative policy: AVIF/WebP with JPEG fallback as appropriate; dimensions/srcset/sizes; hero priority only if LCP; cards lazy below fold; master not shipped directly. These are requirements unless actual delivery above confirms them.

### N01 — Profile placeholder and empty states

**Status:** native fallback/empty states bound; no avatar image. **Class:** native vector/CSS/text. **Actual source:** `Lucide fallback, record empty messages and owner greeting`.

Binding: [FounderPortrait.tsx](../../../apps/web/components/FounderPortrait.tsx), [ProjectImage.tsx](../../../apps/web/components/ProjectImage.tsx), [record-workbench.tsx](../../../apps/control/components/record-workbench.tsx), [page.tsx](../../../apps/control/app/dashboard/page.tsx).

Neutral native fallbacks and empty-state text exist; owner greeting uses display name. No generated stranger/profile avatar; exact VT circle placeholder is not rendered everywhere.

Reference containers: D01.profile, D13.account, all-empty-states. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: The generated profile faces are discarded..

Requested crop/master: 1:1; SVG/CSS. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

### N02 — Charts, sketches, measurements and PDF previews

**Status:** native estimates/PDF bound; chart/sketch/report portions absent. **Class:** native data visual. **Actual source:** `PrintEstimator decimal output and actual invoice PDF endpoint`.

Binding: [print-estimator.tsx](../../../apps/control/components/print-estimator.tsx), [print-estimate.ts](../../../apps/control/lib/print-estimate.ts), [invoice-pdf.ts](../../../apps/control/lib/invoice-pdf.ts), [invoice-manager.tsx](../../../apps/control/app/dashboard/invoices/invoice-manager.tsx), [route.ts](../../../apps/control/app/api/admin/invoices/[id]/pdf/route.ts).

Real computed estimate values and genuine DE-first PDF preview are used. Optional reports disabled; no invented chart, AI tax data or dimensional diagram. PDF shown as actual document/new tab rather than fabricated raster thumbnail.

Reference containers: D11.estimator, D16.reports, P11.dimension-helper, D06.pdf-preview. Required alt: Decorative alt empty when adjacent text supplies purpose; actual work/product images have specific localized descriptive alt. Rights/meaning constraint: Do not copy tax rates, amounts or fake Swiss addresses from mockups..

Requested crop/master: 16:9; Responsive SVG / actual PDF. Mobile policy: Not applicable: use responsive native CSS, SVG or data layout; do not rasterize text or controls.. Derivative policy: Native CSS/SVG or data-driven UI; avoid raster backgrounds and generated interface text.. These are requirements unless actual delivery above confirms them.

## Source measurements and integrity

The following local assets exist; dimensions/bytes were read without editing or exposing private record media. Next Image optimization is a runtime delivery mechanism; these numbers describe originals, not measured client transfers. No performance budget is marked passed here.

| File | Dimensions / format | Source bytes | SHA256 |
| --- | --- | --- | --- |
| `apps/web/public/about/vladyslav-titov.jpeg` | 3583×5374, RGB, JPEG | 8382260 | `d4e835481a0074129908c515a8d1e57c24c79fe5c1642deea6c0639fd90bb9b8` |
| `apps/web/public/hero/tiladys-hero-objects-transparent.png` | 1254×1254, RGBA, PNG | 1109433 | `2f4fbd3c5bca53ebfe9419be58045fd1ba371337a9584fb1eba79be380a1efde` |
| `apps/web/public/services/tiladys-service-business-it-digital.webp` | 1440×960, RGB, WEBP | 65850 | `32f9e24f3c74d05ec9f744706273f47dbe2123cb1054d647bc006d2bf894268e` |
| `apps/web/public/services/tiladys-service-pc-laptop.webp` | 1440×810, RGB, WEBP | 53070 | `e0e159f104ab59fd5b1079c5fef2e560d2c6f7f42bd059a427c9200abd8df718` |
| `apps/web/public/services/tiladys-service-website-creation.png` | 1672×941, RGB, PNG | 1663863 | `5c021da5681701b52e5f581d39683d60665e783169e26a985ca00619acc7a5b7` |

`apps/web/public/brand/icon.svg` and `apps/control/public/brand/icon.svg` bytes identical: **True**; SHA256 `555aacc150293ea12a0a3e9e6557fdfd769a57ce572ce3ff926db3ae044617d8`.

`apps/web/public/brand/logo.svg` and `apps/control/public/brand/logo.svg` bytes identical: **True**; SHA256 `ced88a52ad65be62203d2cbb6e4191f2312b2802ab585d605331487c59c0140b`.

Asset-register.json retained SHA256 `a336113d679b98c8f46f56eb72b9d035f2344c4748148d9310525d99c498f4b2`. Exactly 51 unique section IDs checked.
