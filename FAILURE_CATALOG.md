# FORMA Failure Catalog — Reference Analysis

**Date:** 2026-09-13 · **Analyst:** Design System Audit against user-provided references

## Positive reference bars (from attachments)

| # | Image | Category | What makes it senior |
|---|---|---|---|
| 1 | AnadoluVit | Food/feed label | Hero silhouette, mineral analysis table, claim badges (Mineral/Protein/Enerji/Vitamin), weight option grid, warm yellow palette, bold brand lockup |
| 2 | Hair Segmenté | Cosmetics (modern) | Clear hierarchy brand→product→claim badges (BIOTIN+COLLAGEN), structured INCI back, clean sans typography, mono+warm palette |
| 3 | Woo.originals | Cosmetics (playful/eco) | Rich botanical hero illustration, gradient background per variant, ingredient claim strip, KULLANIM + UYARI + İÇİNDEKİLER structured back |
| 4 | Lusion | Cosmetics (classic) | Serif brand with decorative hair motif, heritage lockup, claim box (keratin/protein/aminoacids), structured back, dual color variants |
| 5 | Yagutshine | Cosmetics (4 variants) | FOUR VISUALLY DISTINCT label styles from same brand: warm leaf, B&W zebra, pastel organic, red botanical — each has own hero treatment, all share mark/legal consistency |
| 6 | Anadolu Bal | Food/honey box (GOLD BAR) | Mountain landscape hero, bee motif, gold ornament borders, claim circles (doğal/katkısız/arı/anadolu), full Besin Değerleri table, warm serif, product story panel, barcode zone |
| 7 | Persona | Perfume box (POSITIVE BAR) | Dark geometric topo, clear lockup (EDT/volume), back legal block, mark strip (icons), clean tuck-end panel roles |
| 8 | Onion hair oil | Cosmetics box | Product hero area, brand badge, structured panel roles, consistent marks |

## Current FORMA failures vs these bars

### F1 · Style collapse (P0)
**All 6 styles share too much visual DNA.** The eco and modern chip change the palette but the front painting is still dominated by luxury grammar (triple frame, contour field, same hero/pattern structure). Compare Yagutshine image #5: four truly distinct visual treatments from the same brand.

**FORMA eco** = luxury with kraft palette → should be: botanical field hero, fiber grain texture, leaf stamp, NO luxury triple-frame.
**FORMA playful** = luxury minus ornament → should be: rounded capsule shapes, bright gradient accent, wave/confetti pattern, visible energy.
**FORMA modern** = luxury minus serif → should be: sharp grid column, asymmetric type, tech accent bar, cool contrast.
**FORMA minimal** = blank → should be: intentional air with ONE accent rule, large brand, generous whitespace, subtle paper texture.
**FORMA classic** = luxury with cartouche → should be: heritage double-frame, serif lockup, ornament rail, muted gold, controlled density.

### F2 · Food back panel is generic legal blocks, not nutrition table (P0)
Anadolu Bal (#6) shows: Besin Değerleri table with kJ/kcal, rows (Enerji/Yağ/Karbonhidrat/Şeker/Protein/Tuz), İçindekiler section, Saklama Koşulları, Menşe Ülke, Net Miktar. AnadoluVit (#1) shows analytic minerals table.
**FORMA food back** currently paints generic `HARVEST · TRACE` / `STORE` legal blocks — same structure as perfume. Missing: nutrition table, storage conditions, proper ingredient listing.

### F3 · Front claim strip is minimal (P1)
Anadolu Bal (#6) has 4 claim circles with icon + text (%100 DOĞAL, KATKI MADDESİ İÇERMEZ, DOĞAL ARI ÜRÜNÜ, ANADOLU KAYNAKLI). FORMA just added 3 bare text circles (DOĞAL/KATKISIZ/%100) — needs icon-like motif inside + descriptive text below.

### F4 · Eco/playful backgrounds are palette swaps, not distinct treatments (P1)
Woo.originals (#3) shows full-bleed botanical illustration field. Yagutshine (#5) shows four unique background systems. FORMA eco gets `ecoGrain()` (tiny dots) which is visually thin — needs a richer botanical or fiber fill.

### F5 · Modern lacks grid presence (P1)
Segmenté (#2) has a clean but PRESENT grid structure — brand↔product↔badges↔volume. FORMA modern has a 3px left stripe and sparse lattice — should have a stronger structural accent.

### F6 · Perfume is the strongest style (OK)
Persona (#7) structure matches FORMA luxury perfume: dark field, topo pattern, clear lockup, mark strip on back. FORMA's luxury perfume is close to this bar. Status: **HOLD** — do not regress.

### F7 · Cosmetics labels lack ingredient badges (P2 — defer)
Segmenté has BIOTIN+COLLAGEN circle badges. Lusion has keratin/protein/aminoacids box. FORMA labels currently don't have ingredient claim badges on front. **Defer:** requires new brief fields (ingredient claims) that don't exist yet.

## Priority triage

| ID | Severity | Action |
|---|---|---|
| F1 | P0 | Style-specific background + decor differentiation in painters |
| F2 | P0 | Food back panel nutrition table section |
| F3 | P1 | Richer claim circles with icon motif + description |
| F4 | P1 | Eco botanical field, playful wave/capsule background |
| F5 | P1 | Modern grid accent bar + structural layout |
| F6 | OK | Perfume luxury holds — no regression |
| F7 | P2 | Ingredient badges on labels (defer: needs brief fields) |
