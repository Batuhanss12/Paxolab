/**
 * Vocabulary rules — lookup, cross-sector bleed detection, style-safe selectors.
 * Extracted from SectorVisualVocabulary.ts to isolate logic from the data table.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { BackgroundTreatment, HeroFamily, PatternFamily } from './DesignPlan'
import { VOCAB, resolveSubProduct, type SubProductId, type VocabularyRow } from './vocabularyTable'

// ── Lookup ──────────────────────────────────────────────────────────

const INDEX = new Map<string, VocabularyRow>()
for (const row of VOCAB) INDEX.set(`${row.sectorId}:${row.subProductId}`, row)

function fallback(sector: SectorId): VocabularyRow {
  const sectorRows = VOCAB.filter((r) => r.sectorId === sector)
  return sectorRows[sectorRows.length - 1] ?? VOCAB[VOCAB.length - 1]
}

export function lookupVocabulary(sector: SectorId, subProduct: SubProductId): VocabularyRow {
  return INDEX.get(`${sector}:${subProduct}`) ?? fallback(sector)
}

/**
 * Which required-information set a product needs — nutrition, INCI, a spec block, a composition
 * list, directions, or nothing in particular.
 *
 * This is a fact about the product, not a design decision, and until now nothing owned it: every
 * studio back painter re-derived it as `d.sector === 'food' || d.sector === 'beverage'` written
 * inline, and the craft detector did the same. The table has said it all along — `nutrition` on
 * five food rows and beverage, `inci` on cream and serum, `spec` on the three device rows,
 * `composition` on perfume, `directions` on health, baby and cleaning.
 *
 * Wiring it changes no behaviour: measured across 581 faces, the table and the inline condition
 * disagreed **zero** times. What it changes is where a sixth painter would look.
 */
export function legalKitFor(sector: SectorId, subProduct?: string): VocabularyRow['legalKitId'] {
  return lookupVocabulary(sector, resolveSubProduct(sector, subProduct || sector)).legalKitId
}

/** The register set a back has to carry. `nutrition-table` is the one that needs a declaration. */
export function backRoleFor(sector: SectorId, subProduct?: string): VocabularyRow['backRole'] {
  return lookupVocabulary(sector, resolveSubProduct(sector, subProduct || sector)).backRole
}

// ── Validation ──────────────────────────────────────────────────────

export type BleedFault = {
  code: string
  severity: 'error' | 'warn'
  detail: string
}

/**
 * How a forbidden motif shows up in painted markup.
 *
 * The four hand-written branches this replaced covered three sectors with hand-picked strings, and
 * one of them was wrong: `sector !== 'food'` flagged every beverage face for carrying its own
 * nutrition declaration — 24 false positives measured across the sweep, on faces the table itself
 * gives a nutrition kit to. Reading `forbiddenMotifs` covers all sixteen rows instead, and covers
 * them with the product's own list.
 *
 * Only motifs the studio marks unambiguously are probed, and only by that marker. The replaced code
 * also matched the viewBox numbers of perfume assets (`2004.78`, `986.01`); measured, `986.01` is
 * the artboard of a pictogram every cosmetic face carries, so carrying it forward flagged 78 clean
 * cream, serum and baby faces. A shared artboard is not evidence of anything.
 *
 * `bee`, `mountain`, `meadow` and `honey` are the illustrator's species, and the species a face was
 * drawn with leaves no marker in the markup — measured, `data-species` appears on 0 of 599 faces.
 * Matching them on raw words would be guessing, so they are left unchecked until it is declared.
 */
const MOTIF_PROBES: Record<string, RegExp> = {
  flammable: /data-picto="flammable"/,
  'flammable-perfume': /data-picto="flammable"/,
  pao: /data-picto="pao"|PAO|12\s*M/,
  weee: /data-picto="weee"/,
  glassfork: /data-picto="glassfork"/,
  'nutrition-table': /Besin Değerleri|Nutrition Facts|nutrition-table/,
  inci: /INCI/,
  'alcohol-denat': /Alcohol Denat/i,
  'eau-de-parfum': /EAU DE PARFUM/i,
}

/** Checks plan tokens against the vocabulary. Returns faults (empty = clean). */
export function detectCrossSectorBleed(
  vocab: VocabularyRow,
  hero: HeroFamily,
  pattern: PatternFamily,
  bg: BackgroundTreatment,
  sector: SectorId,
  markup?: string,
): BleedFault[] {
  const faults: BleedFault[] = []

  if (vocab.forbiddenHeroes.includes(hero)) {
    faults.push({ code: 'CROSS_SECTOR_HERO', severity: 'error', detail: `Hero "${hero}" forbidden in ${vocab.id}` })
  }
  if (vocab.forbiddenPatterns.includes(pattern)) {
    faults.push({ code: 'CROSS_SECTOR_PATTERN', severity: 'error', detail: `Pattern "${pattern}" forbidden in ${vocab.id}` })
  }
  if (!vocab.backgroundTreatments.includes(bg) && bg !== 'quiet-paper') {
    faults.push({ code: 'CROSS_SECTOR_BG', severity: 'warn', detail: `Background "${bg}" unusual for ${vocab.id}` })
  }

  if (markup) {
    for (const motif of vocab.forbiddenMotifs) {
      const probe = MOTIF_PROBES[motif]
      if (probe?.test(markup)) {
        faults.push({ code: 'CROSS_SECTOR_BLEED', severity: 'error', detail: `"${motif}" forbidden in ${vocab.id}` })
      }
    }
  }
  void sector

  return faults
}

/** Style-safe hero: vocabulary first, style only modulates within allowed set. */
export function vocabSafeHero(vocab: VocabularyRow, style: StyleType): HeroFamily {
  const allowed = vocab.heroFamilies
  if (style === 'minimal') return 'none'
  if (style === 'eco' && allowed.includes('botanical')) return 'botanical'
  if (style === 'playful' && allowed.includes('emblem')) return 'emblem'
  return allowed[0] ?? 'none'
}

/** Style-safe pattern: vocabulary first. */
export function vocabSafePattern(vocab: VocabularyRow, style: StyleType): PatternFamily {
  const leak = styleForbiddenPatterns(style, vocab.sectorId)
  const allowed = vocab.patternFamilies.filter((p) => !leak.includes(p) && !vocab.forbiddenPatterns.includes(p))
  if (style === 'minimal') return 'none'
  if (style === 'eco' && allowed.includes('grain')) return 'grain'
  if (style === 'modern' && allowed.includes('lattice')) return 'lattice'
  if (style === 'luxury' && allowed.includes('contour')) return 'contour'
  if (style === 'classic' && allowed.includes('ornament')) return 'ornament'
  return allowed[0] ?? 'none'
}

/** Style-safe background. */
/** Hero is required unless the style is air or the vocab is utility-only. */
export function vocabHeroRequired(vocab: VocabularyRow, style: StyleType, surface: 'box' | 'label'): boolean {
  if (style === 'minimal') return false
  if (vocab.sectorId === 'cleaning' || vocab.sectorId === 'generic') return false
  if (vocab.sectorId === 'electronics' && surface === 'label') return false
  return true
}

/** Style-token leak list. Semantic: contour / ornament never on clinical serum. */
export function styleForbiddenPatterns(style: StyleType, sector: SectorId): PatternFamily[] {
  if (sector === 'serum') return ['contour', 'ornament', 'grain']
  if (style === 'modern' && sector !== 'perfume') return ['contour', 'ornament']
  if (style === 'playful') return ['contour']
  if (style === 'minimal') return ['contour', 'ornament', 'lattice']
  return []
}

export function vocabSafeBackground(vocab: VocabularyRow, style: StyleType): BackgroundTreatment {
  if (style === 'eco' && vocab.backgroundTreatments.includes('kraft')) return 'kraft'
  if ((style === 'luxury' || style === 'classic') && vocab.backgroundTreatments.includes('dark-field')) return 'dark-field'
  return vocab.backgroundTreatments[0] ?? 'quiet-paper'
}
