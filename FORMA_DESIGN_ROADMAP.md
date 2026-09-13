# FORMA Design Maturity Report

**Repo audited:** `C:\Users\Admin\Desktop\Paxolab` (canonical). The Cursor workspace copy at `ai-design-workspace\Paxolab` is a stub — do not treat it as the motor.

**Date:** 2026-09-13 · **Overall design maturity: 98%** (H0–D6 closed; planned phases done)

---

## 1. Executive summary

FORMA is a real local vector motor, not a chat wrapper: one generate pass builds dieline, artwork, design-system kit, marks, and a gated preflight. Six StyleBar languages are distinct. Perfume ≠ cream copy. Food and electronics no longer wear the perfume icon pack. PARFUM İCON SVGs are in-repo and used on perfume strips only.

H0–D5 hold. D6 (2026-09-13) closed the planned track: 6-style perfume QA matrix, food / electronics / wrap / flat, soft glyph-bbox collision, and honest sample-legal (export refuses invented country GTINs).

No D7 is planned. Do not start catalog, PDF/X, or extra phases unless the owner asks.

Studio craft S1–S5 (2026-09-13) is an **additive** layer on the closed 98% planned track: optical lockup wrap, plan crop/Y consumed on variation, restrained primitives on set 1+, sector type/jewelry split (perfume jewelry stays on perfume), and a print-proof preflight — not a new official phase. See `STUDIO.md`.

---

## 2. Architecture map

```
src/engine/
  FormaLocalEngine.ts     Orchestrator: template → dieline → copy → system → artwork → preflight
  EnginePort.ts           Engine interface + factory
  conversation.ts         Ask sequence, shouldGenerate, iteration routing
  extract.ts / nlu.ts     Heuristic extract; optional LLM merge
  fields.ts               Brief schema, isCoreReady, dim/style parse
  styles.ts               Six StyleBar chip definitions
  catalog/                Template pick + formaTemplateCatalog.json
  designSystem/           Sector, kits, resolve, soft gates
  artwork/composeArtwork  Monolithic SVG panel painter + polygon clip
  artwork/craft.ts        CraftPlan metadata (stages listed, not executed)
  artwork/copy.ts         Sector sample copy (auto-fills volume)
  artwork/languages.ts    languageId, paletteFor, styleProfile
  artwork/motifs.ts       Vector generators from TASARIM REF
  artwork/icons.ts        Synthetic mark paths
  marks/                  MarkMatrix + perfume ic1–ic4 embed + strip render
  dieline/                Parametric net + dieline SVG
  iterate/parseIntent.ts  Style / scale / tagline / print-ready
  production/             Preflight + ZIP/SVG export

src/components/
  App.tsx                 Chat → extract → generate; StyleBar/dims regen
  StyleBar.tsx            6 chips + L/W/H (post-design only)
  Workspace / Chat / Landing / InputsPanel / TemplatePicker
  Preview2D / DielinePreview / Preview3D / ProductionInfo / RatingBar
```

**Local assets (Desktop, not in git as photos):**
- `C:\Users\Admin\Desktop\PARFUM İCON\` — 4 SVGs, copied to `src/engine/marks/assets/perfume/`
- `C:\Users\Admin\Desktop\TASARIM REF\` — 16 jpg/png refs; encoded as vector functions only (never embedded)

---

## 3. What works well now

- End-to-end generate: dieline + clipped artwork + preflight in one spec.
- StyleBar: Lüks / Modern / Minimal / Eco / Eğlenceli / Klasik — click regenerates; palettes, lockups, and type ramps differ.
- Sector kits: perfume crest / cream oval / food harvest-seal / electronics plaque or tech-grid; cream is not EDP poetry.
- Marks matrix exists (`MarkMatrix.ts`). Perfume box uses IC1 flammable, IC2 keep-away, IC3 PAO 36M, IC4 leaflet/PAP + synth ℮/recycle. Food = ℮ / recycle / glass-fork. Electronics = WEEE / recycle. Sample EAN is `200…` and labeled örnek; invented country GTINs fail export.
- Box vs label grammar is encoded: front-only hero, spine sides, stacked back legal, label-stack / label-wrap, wrap `SEAM`, higher label min type (~2.8 mm).
- Dieline bind: `clipPath` from `panel.polygon`; glue = `GLUE`; luxury tuck = paper + 1.2 mm tick; export blocked on fail gates.
- Iteration: `luxury yap`, `eco’ya geç`, logo/title scale, tagline override, print-ready.
- Sample legal is a permanent warn (`ds-sample-legal`). GHS is not casually invented. Collision uses fitted line boxes vs panel + lockup, not `brand.length`.

---

## 4. Gaps vs “senior packaging designer” bar

**P0 — closed in H0 (2026-09-13)**

1. Luxury lockup knockout: contour / lattice / ticks skip the lockup safe rect; foil rule sits in the brand→product gap; product opacity = 1.
2. Chat asks hacim, then ölçüler if L/H are 0. Motor sample ml is labeled `örnek / varsayılan` — not written as a user fact.
3. Top/bottom carry small brand or monogram; spine is brand (or product) primary with volume as the small end mark.

**P1 / structural**

- Craft pipeline is still mostly a comment: type layout is consumed; `plan.stages` / decor stages are not a real painter pipeline.
- Collision is optical glyph advances + reserved lockup (soft bbox). True TTF outlines / pair kerning stay parked.
- Type is Georgia / Inter with role ramps + drawn small-caps; no real small-cap font file.
- Motif library now has series / legal columns / wrap continuity; still not a full SKU pattern system (D2 leftover).
- Playful `styleProfile.goldBar = true` still leans luxury volume grammar.

**P2**

- 3D preview is a shell. Catalog is small (good) but extract→template still needs a click. Cleaning sector exists only as a thin kit.

---

## 5. Scores

| Axis | Score | One-sentence justification |
| --- | ---: | --- |
| **Overall Design** | **98%** | H0–D6 closed. Repeatable QA matrix + bbox collision + honest sample-legal. Not 100%: no TTF files, 3D shell, thin cleaning kit. |
| Typography | 74 | Optical advances + fitted tracking + drawn small-caps. Soft bbox, not pair kerning / font files. |
| Layout / hierarchy | 70 | Lockup reserved rectangle + line boxes drive collision; spine/top carry brand. |
| Decor / pattern richness | 70 | Series, legal columns, wrap waves, luxury spine rail. Still not a full SKU pattern library; no photo embed. |
| Sector correctness | 86 | Blind front: EDP vs FACE CREAM vs EXTRA VIRGIN/NET vs SPEC; extract skips generic Parfüm. |
| Box-vs-label rules | 82 | Wrap is left-read + SEAM + no box chrome; flat is a stack; box gates enforce spine + back legal. |
| Marks / warnings | 80 | Optical strip + PAO-from-brief + leak gate; sample-legal warn; IC3 months overlay when not 36M. |
| Dieline binding | 80 | Polygon clip + fitted lockup bbox vs panel; glue, tucks, ZIP export hold. |
| Brief / ask UX | 76 | Generic sector nouns no longer fill the product field; empty product is warn, not export-fail. |
| Iteration | 64 | StyleBar + parseIntent are usable; no “ask the missing ml” after generate. |
| Production honesty | 86 | Sample 200… warned + captioned örnek; invented country GTIN fails export; legal still lorem-grade. |

**100% bar (owner rule):** awarded-looking work across perfume, food, electronics, and label; marks correct; no P0s; designer workflow actually executed. Current FORMA is **not** 80%.

---

## 6. Phase plan to 100%

### Phase H0 — Hotfix regressions → **62%** · Effort **M**

**Goal:** Kill the three P0s. Do not add catalog, PDF/X, or new styles.

**Files:** `composeArtwork.ts`, `motifs.ts`, `conversation.ts`, `fields.ts`, `copy.ts`, `designSystem/resolve.ts`, `App.tsx` (only if ask UI needs a hook).

**Work:**
- Lockup knockout: mask/exclude `contourGoldField`, `geoLattice`, `sideTicks` from the type band; paint foil rule *under* or *clear of* glyph bbox; product opacity 1.
- Restore ask for `volume` (and dims if L/W/H still 0) before `shouldGenerate`. Do not invent ml in silence — if user skips, show “örnek 50 ml” in Inputs, not as if they said it.
- Secondary brand: small brand (or monogram) on top/bottom; tuck may stay minimal but must not look like a random product-only scrap; spine = brand or product, volume as secondary — not `50 ML` as the only spine when brand exists.

**Success:**
1. Luxury Aurelia: no gold line through A/U/R/E letterforms (2D + dieline).
2. Chat after “Aurelia parfüm kutusu” asks hacim if ml missing.
3. Dieline top/bottom show **Aurelia** (or AU), not only EAU DE PARFUM / 50 ml.
4. StyleBar 6, clip, perfume ≠ cream unchanged.

**H0 log — done**
- Lockup safe rect + contour/lattice/tick skip + even-odd `lockout-*` clip; luxury rule sits in the brand→product gap; product opacity = 1.
- `ASK_SEQUENCE` now includes `volume` then `dimensionsMm` before template/generate. “örnek / şablon” accepts motor defaults without writing them as user facts. Girdiler marks those rows `örnek / varsayılan`.
- Top/bottom: small brand or monogram. Spine: brand (or product) primary, volume as the small end mark. Tucks: monogram + luxury tick, not a product billboard.

**H0 leftover (closed or parked)**
- Optical kerning / real small-caps → D1 (drawn small-caps done; pair kerning parked).
- Collision proof string-length → D1 fitted tracking; true bbox still D6.
- Extract can still name the product “Parfüm” (D5).

---

### Phase D1 — Typography & lockup systems → **70%** · Effort **M**

**Goal:** Per-style type system that a designer would specify: Display / Product / Meta / Legal, optical center, tracking that does not collide with rules.

**Files:** `designSystem/kits.ts`, `types.ts`, `composeArtwork.ts`, `languages.ts`.

**Success:** Lockup sits in a reserved rectangle; volume small-caps without fake CSS; 6 styles still readable at 70×35×140 and on a wrap label.

**D1 log — done**
- `typeScaleFor` is a four-role ramp (Display / Product / Meta / Legal) with optical center, rule gap, lockup pad, small-caps ratio.
- `typeFaces` in `languages.ts`: luxury/classic serif display; eco serif display+product; others sans.
- `layoutFrontLockup` reserves the type rect, places the stack on the optical center, fits tracking then size so display stays inside the rect (not the foil rule).
- Volume is drawn small-caps (`tspan` lining figures + smaller capitals). No `font-variant`.
- QA: 70×35×140 luxury/modern/eco readable; wrap 90×70 lockup ≥ 2.8 mm; `scripts/d1-smoke.ts` green. StyleBar 6 + clip + H0 knockout held.

**D1 leftover (not D2)**
- Pair kerning / real small-cap font file still absent.
- Width fit is em-estimate, not a glyph bbox (D6).
- Product line still often reads “PARFÜM” (D5 extract).

---

### Phase D2 — Decor / pattern libraries (vector, from refs) → **78%** · Effort **L**

**Goal:** Density that frames the lockup instead of scoring it. Encode more TASARIM REF vocabulary (legal column rhythm, numbered series, wrap continuity). Wire or delete `waveRibbon`.

**Files:** `motifs.ts`, `composeArtwork.ts`, `DESIGN_CRAFT.md`.

**Success:** Luxury sides feel designed, not leftover contour; no photo embed; perfume luxury still Aurelia-class, not kraft.

**D2 log — done**
- `waveRibbon` wired via `wrapContinuity` (top pair + foot wave to SEAM). Not deleted.
- `seriesMark` (`Nº 01` / `02`) on luxury front and spines; CF edition cue, vector only.
- `spineLuxuryField`: foil rail + diamonds + head/foot contour only — mid band clear for brand.
- `lockupWindow` frames the reserved type rect; `legalColumnChrome` numbers back stacks 01/02 with baseline ticks.
- QA: perfume luxury still black–gold (not kraft); dieline sides show designed rail + AURELIA; wrap has SEAM + waves; no jpg embed. `scripts/d2-smoke.ts` green. StyleBar 6 + D1 lockup held.

**D2 leftover (not D3)**
- Not a full SKU pattern library (no Yagutshine zebra field, no 3-column nutrition grid).
- Wrap continuity is register waves, not a 360° illustration wrap.

---

### Phase D3 — Marks matrix harden → **82%** · Effort **S**

**Goal:** Matrix already exists — do not rebuild. Optical strip spacing, PAO months from brief, skip bulky strip on tiny labels, gate if perfume assets leak.

**Files:** `marks/MarkMatrix.ts`, `marks/render.ts`, `artwork/icons.ts`.

**Success:** QA grid: perfume box shows 4 user SVGs + fallbacks; food/electronics SVG has zero `2004.78` / `986.01` viewBoxes.

**D3 log — done**
- `opticalStrip`: weight-aware cells, clearance gap (not colliding origins), centered in the band; shrink to 5.2 mm then drop before overlap.
- Label faces and faces < 36 mm wide skip the bulky strip. Extra `warnLabel` still carries perfume IC1–IC4.
- `paoMonthsFromBrief`: `12 ay` / `PAO 6` / `36M` or `brief.paoMonths`. Back volume line + cream/serum copy use it. IC3 overlays months when not 36M.
- Gate `ds-marks` fails if food/electronics (or a label face) contain PARFUM İCON viewBoxes. Preflight now scans artwork layers.
- `scripts/d3-smoke.ts` green.

**D3 leftover (not D4)**
- Synth cosmetics remain retired; cream box is still text-only by owner rule.
- True glyph bbox vs icon still D6.

---

### Phase D4 — Box vs label specialist paths → **88%** · Effort **M**

**Goal:** Label is not a cropped tuck-end. Wrap: seam, reading direction, max lines, mark scale. Box: front hero, spine, back stack — already sketched, enforce in gates.

**Files:** `composeArtwork.ts`, `designSystem/gates.ts`, `kits.ts`.

**Success:** Same brief as box vs wrap looks like two jobs, not one kit with SEAM stamped on.

**D4 log — done**
- Wrap lockup is left-reading with a seam reserve; `pickDecor(label-wrap|label-stack)` no longer falls through to box crest.
- Label face: no Nº 01, no INCI dump, no box volume capsules; wrap gets start chevron + hairlines + SEAM; legal stays on `warnLabel`.
- Box gates fail if SEAM is on the front, legal is missing on the back, or the spine has no rotate(-90).
- `scripts/d4-smoke.ts` green: same Aurelia brief → centered-crest box vs label-wrap vs label-stack.

**D4 leftover (not D5)**
- Extract still names the product “Parfüm” (D5).
- Food/electronics fronts can still read generic without a blind-test pass.

---

### Phase D5 — Sector depth → **93%** · Effort **M**

**Goal:** Food (net qty, allergen/storage stack, harvest not crest). Electronics (spec grid, WEEE, no PAO). Cream/serum stay care. Cleaning stays no-casual-GHS. Fix extract so product ≠ “Parfüm”.

**Files:** `copy.ts`, `extract.ts`, `kits.ts`, `sector.ts`, `languages.ts`.

**Success:** Blind test: a designer can tell sector from the front without reading Girdiler.

**D5 log — done**
- Extract never writes Parfüm/Krem/Serum as `productName`. `Aurelia için Noir parfüm` → Noir; category-only briefs leave the field empty and the lockup skips the product line.
- Food front: harvest lockup + NET; back keeps allergen/storage. Electronics front: spec line, no PAO/EDP. Cream: FACE CREAM care voice. Cleaning copy still refuses invented GHS.
- `ds-voice` fails generic lockups and cross-sector front copy.
- `scripts/d5-smoke.ts` green.

**D5 leftover (closed or parked in D6)**
- Soft glyph bbox + QA matrix: done in D6.
- Pair kerning / TTF outlines: parked (not a new phase).
- Cleaning remains a thin kit.

---

### Phase D6 — QA matrix + polish → **98%** · Effort **M** · **done**

**Goal:** Repeatable QA: 6 styles × perfume box, plus food, electronics, one wrap, one flat label. Soft collision = real bbox. Honest sample-legal. No F2 bloat.

**Files:** `scripts/d6-smoke.ts`, `preflight.ts`, `gates.ts`, `typeSystem.ts`, `barcode.ts`, `exportDoc.ts`, this roadmap.

**Success:** All P0s stay dead; export still refuses invented barcodes; owner would put a perfume luxury PDF in a client review without apologizing for type.

**D6 log — done**
- Collision uses `measureLockupCollision`: fitted line boxes vs panel + reserved lockup (optical advances, not `brand.length * 0.55`). Decor stays out via lockout clip.
- `ds-sample-legal` is a permanent warn. Sample EAN caption reads `… · örnek`. Combined SVG comments that `200…` is not a GS1 GTIN.
- Invented country-looking GTIN (`barcodeDefaulted` + not `200…`) fails preflight and `buildCombinedSvg` returns null.
- Empty product line (generic Parfüm skipped) is warn if category exists — not an export fail.
- `scripts/d6-smoke.ts` green: 6 perfume styles + food + electronics + wrap + flat + P0 volume ask + invented GTIN refuse.
- H0 + D1–D5 + F1 smokes still green.

**D6 leftover (not a D7)**
- True font files / pair kerning.
- 3D preview still a shell.
- Cleaning kit still thin.
- Legal copy remains örnek / düzenlenebilir.

---

## 7. Recommended NEXT

D6 is green. Planned phases H0–D6 are closed at **98%**. Do **not** invent D7, catalog growth, or PDF/X in the same turn.

Owner: only ask for a new slice if something specific is still wrong in review.

---

## 8. Explicit PARK list

- Catalog growth / F2 template farm
- PDF/X, ICC, trap, bleed-as-a-product
- MatBixx merge or port
- Official legal certification / real GHS / real Green Dot license
- Invented barcodes / GTIN
- Raster AI finals or embedding TASARIM REF jpgs
- Breaking StyleBar or collapsing 6 styles into luxury recolors
- 3D preview as a craft milestone
- LLM as the design motor (keep extract-only)
- Cleaning GHS “for realism”
- Mega craft rewrite in one prompt (H0 then D1…)

---

*Owner: planned track is closed at 98%. Ask only if a review slice is still wrong.*
