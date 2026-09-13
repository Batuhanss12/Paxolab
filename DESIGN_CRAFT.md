# FORMA design craft

`composeArtwork` follows a staged packaging-designer workflow via `buildCraftPlan`.

| Stage | What it decides |
| --- | --- |
| 1. Brief | sector, subProduct, surface (box \| label), style, L/W/H, brand / product / ml |
| 2. Strategy | focal lockup, hierarchy, density, ink system |
| 3. Structure | box panel roles (front / side / back / tuck) **or** a single label face |
| 4. Type | Display / Product / Meta / Legal in mm + tracking + volume case |
| 5. Decor | grounds, frames, patterns, seals — style × sector, vector only |
| 6. Verbal | auto-brief blocks in legal order |
| 7. Marks | `MarkMatrix` strip + TR warnings (not a fixed 4-icon pack) |
| 8. Proof | polygon clip, collision soft-check, sample-legal honesty |

## Box vs label

**Box** — front is the only hero lockup. Sides are spines (product / volume), not brand billboards. Back stacks legal headers with a mark strip. Tucks stay paper.

**Label** — one hierarchy, fewer type sizes, min ~2.8 mm. Wrap respects SEAM. No tuck-end 4-layer grammar. Marks scale down; bulky perfume strips drop on small faces.

## Vector motifs (from TASARIM REF — not pasted)

| Ref cue | Encoded as |
| --- | --- |
| Elite Brew marble / gold swirl | `contourGoldField` — flowing gold contour lines |
| Elite Brew open L-corners | `lBrackets` |
| CF diagonal foil plane | `diagonalFoil` (food / electronics luxury) |
| CF / Yagutshine lattices | `geoLattice` (modern) |
| Woo botanical silhouettes | `leafStampField` (eco) |
| Todbie claim pills | `claimCapsules` (playful) |
| CF / Yagutshine edition index | `seriesMark` (`Nº 01` / `02`) + spine pair |
| Glisso legal rhythm | `legalColumnChrome` — numbered plate + baseline ticks on back stacks |
| Dynoclean / wrap register | `waveRibbon` wired through `wrapContinuity` (top pair + foot wave to SEAM) |
| Classic double-line | `ornamentalRail` + cartouche + `lockupWindow` |
| Elite Brew / luxury spine | `spineLuxuryField` — foil rail + head/foot contour only (not leftover front field) |

Reference JPGs are never embedded in production SVG. Decor frames the lockup (`lockupWindow`) and stays out of the type band.

## Type ramps

`typeScaleFor(style, grammar)` — Display / Product / Meta / Legal (mm), tracking per role, optical center, rule gap. Volume on luxury / classic is **drawn small-caps** (lining figures + smaller capitals) — never `font-variant`. `layoutFrontLockup` reserves the type rectangle, fits tracking so display does not collide with foil/air rules, and `composeArtwork` paints from that layout.
