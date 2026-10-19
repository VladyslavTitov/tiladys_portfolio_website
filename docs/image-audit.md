# Image audit

Sources are unchanged. Dimensions/weights below come from Sharp/filesystem inspection; alpha bounds use pixels with alpha >20/255 and are not an inferred object crop. Photo composition was visually inspected. Final frame measurements are also recorded in `ui-evidence/after/results.json`; network measurements are lab transfers, not source-file weights.

| Source under `apps/web/public` | Use | Intrinsic / source bytes | Composition | Final frame / fit / sizes |
|---|---|---|---|---|
| `illustrations/g01-three-services-1600.webp` | Home hero | 1600×900 / 149,896 | Transparent; subject bounds 75,107–1553,793 | Content stage up to ~557×313, max-height 370; contain; `calc(100vw - 36px)` mobile, 46vw medium, 557px wide; priority |
| `services/tiladys-service-website-creation.png` | Website hero / service cards / related | 1672×941 / 1,663,863 | Opaque full-bleed photo; no baked pale bands. Laptop and phone lie inside safe central crop | Hero 16:10 cover, small symmetric edge crop; card 220px stage; related 80–140px wide, cover. Next optimizer resizes/encodes; source PNG retained |
| `services/tiladys-service-pc-laptop.webp` | PC hero / cards / related | 1440×810 / 53,070 | Opaque full photo, laptop/tools; no baked bands | Same photo family. Center cover; no stretching |
| `services/tiladys-service-business-it-digital.webp` | Related / overview | 1440×960 / 65,850 | Opaque 3:2 photo | Cover by photo family; source retained |
| `illustrations/g03-practical-prints-1600.webp` | 3D hero / card / related | 1600×900 / 206,034 | Transparent; alpha bounds 106,62–1560,849 | Hero 16:11 navy radial stage, contain; card 220px coordinated pale stage, 12px breathing space; no crop |
| `illustrations/g06-about-workbench-1600.webp` | About hero | 1600×900 / 169,702 | Transparent; alpha bounds 0,77–1599,899 | Responsive natural 16:9 within padded navy hero; contain; image no longer artificially capped at 380px square |
| `illustrations/g07-contact-workbench-800.webp` | Contact hero | 800×450 / 61,800 | Transparent; alpha bounds 51,50–763,400 | One responsive image inside PageHero, contain, up to ~440px; no second illustration alongside it |
| `hero/tiladys-hero-objects-transparent.png` | Default PageHero / portfolio | 1254×1254 / 1,109,433 | Transparent square laptop composite | 4:3 stage with contain; correct reserved dimensions; responsive Next delivery; priority hero |
| `about/vladyslav-titov.jpeg` | Founder home / About | 3583×5374 / 8,382,260 | Genuine portrait, face upper center | 200×240 home, 240×300 About desktop; controlled cover at center 30%; `sizes=240px`; lazy below fold, Next optimized |
| `brand/icon.svg` | Preferred wordmark | 445×106 / 33,129 | Vector, wide wordmark | Source ratio retained in header/footer; no generated replacement |
| `brand/logo.svg` | Preferred secondary logo | 196×145 / 37,335 | Vector illustration | Source-proportional contain; retained footer |
| Authorized `/api/public/media/:id` and product media | Published project/product covers | Record-dependent | Real publication projection; local aqua assets are synthetic fixtures only | 16:10 cover/featured; local media endpoint resizes after publication authorization; no persistent public image cache introduced |
| Missing/unpublished media | Portfolio / product empty state | No source | No invented image or client claim | Existing translated empty state; missing cover has reserved ratio and honest accessible fallback |

Service `sizes`: compact `(max-width:768px) calc(100vw - 36px), (max-width:1000px) 46vw, 384px`; hero `(max-width:640px) calc(100vw - 84px), (max-width:900px) 560px, (max-width:1248px) 40vw, 440px`. Related thumbnails are smaller than compact cards; they share optimized cache candidates rather than introducing new source files. This is a remaining opportunity for more granular related-specific sizes if measured material.

Default Next optimizer quality is retained (75); no quality/dependency upgrade, image regeneration, editorial substitution, weakened remote allowlist, or original-file deletion. All important device faces remain visible in paired screenshot review. Subject quality/cropping is a manual optical check; DOM geometry alone is insufficient.
