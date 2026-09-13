/**
 * Vocabulary rules — lookup, cross-sector bleed detection, style-safe selectors.
 * Extracted from SectorVisualVocabulary.ts to isolate logic from the data table.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import type { BackgroundTreatment, HeroFamily, PatternFamily } from './DesignPlan'
import { VOCAB, type SubProductId, type VocabularyRow } from './vocabularyTable'

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

// ── Validation ──────────────────────────────────────────────────────

export type BleedFault = {
  code: string
  severity: 'error' | 'warn'
  detail: string
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
    if (sector !== 'perfume' && /EAU DE PARFUM|Alcohol Denat/.test(markup)) {
      faults.push({ code: 'CROSS_SECTOR_BLEED', severity: 'error', detail: 'Perfume copy on non-perfume face' })
    }
    if (sector !== 'food' && /Besin Değerleri|nutrition-table|glassfork/.test(markup)) {
      faults.push({ code: 'CROSS_SECTOR_BLEED', severity: 'error', detail: 'Food copy on non-food face' })
    }
    if (sector === 'food' && /flammable|2004\.78|986\.01|EAU DE PARFUM/.test(markup)) {
      faults.push({ code: 'CROSS_SECTOR_BLEED', severity: 'error', detail: 'Perfume marks/assets on food face' })
    }
    if (sector === 'electronics' && /EAU DE PARFUM|12\s*M|PAO|flammable/.test(markup)) {
      faults.push({ code: 'CROSS_SECTOR_BLEED', severity: 'error', detail: 'Perfume/cosmetic marks on electronics' })
    }
  }

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
