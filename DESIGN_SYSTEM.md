# FORMA design system

Every `generate` consults `resolveDesignSystem(brief, structureId)` before artwork and preflight.

Key: `surfaceMode × sector × styleType → lockup, decor, density, type (mm), legal order, marks`

## Surface

**Box**
- Front: hero lockup only (full frames / foil / crest where the kit allows)
- Sides: spine — product or volume, not a brand billboard
- Back: stacked legal headers (not a blob in a void)
- Top / bottom: category + mark strip, no lockup
- Tucks / dust: paper; luxury may add a 1.2 mm tick
- Glue: `GLUE` only

**Label** (`flat-label` | `wrap-label`)
- Single-face hierarchy; higher min type (2.8 mm)
- One frame max — never tuck-end 4-layer + side ticks + foil bar
- Wrap: seam cue on the face, overlap stays glue
- Legal: one condensed line on-face if it fits

## Sectors

| Sector | Voice | Legal order | Marks | Luxury lockup |
| --- | --- | --- | --- | --- |
| perfume | EDP, flammable | COMPOSITION → FLAMMABLE · CAUTION | PAO / ℮ / recycle / Green Dot | `centered-crest` |
| cream / serum | care, not flammable-default | INCI → DIRECTIONS | PAO set | `soft-oval` |
| food | net weight, origin, allergen | INGREDIENTS / ORIGIN → STORAGE · ALLERGENS | ℮ / PAP21 | `harvest-seal` (olive, not perfume crest) |
| electronics | specs / WEEE | CONTENTS / SPEC → WEEE · SAFETY | WEEE / this-way-up | `metal-plaque` |

## Style kits

- luxury: `centered-crest` · `harvest-seal` · `metal-plaque`
- modern: `left-index` · `tech-grid` (electronics)
- minimal: `air-rule`
- eco: `stamp-center`
- playful: `badge-capsule`
- classic: `serif-cartouche`
- labels: `label-stack` / `label-wrap`

Style grammars stay distinct. Eco is kraft; luxury never borrows eco grain.

## Soft gates (`evaluateDesignGates`)

- Fail: no front brand; perfume carrying cream/serum copy; label using tuck-end grammar
- Warn: empty / lorem legal; luxury palette reading as kraft
- Barcode: still NA if the user did not provide one — never invented

## Code

`src/engine/designSystem/` → `FormaLocalEngine` → `composeArtwork` + `runPreflight`
