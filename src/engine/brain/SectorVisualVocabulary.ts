/**
 * SectorVisualVocabulary — the anti-mix bible.
 * Every sector×subProduct row defines what the painter MAY use.
 * Style only modulates within the vocabulary; it must never drag
 * perfume noir paint onto food or pastoral honey onto electronics.
 */
import type { StyleType } from '../../types'
import type { SectorId } from '../designSystem/types'
import { keywordRegex, SECTORS } from '../designSystem/sectorConfig'
import type { BackgroundTreatment, HeroFamily, PatternFamily, PrimitiveId } from './DesignPlan'

// ── Sub-product resolution ──────────────────────────────────────────

export type SubProductId =
  | 'parfum' | 'cologne' | 'serum' | 'cream'
  | 'honey' | 'oil' | 'snack' | 'bakery' | 'beverage' | 'food-generic'
  | 'audio' | 'cable' | 'elec-generic'
  | 'beverage' | 'health' | 'baby'
  | 'gift' | 'cleaning' | 'generic'

export function resolveSubProduct(sector: SectorId, blob: string): SubProductId {
  const def = SECTORS.find((s) => s.id === sector)
  if (!def) return 'generic' as SubProductId
  for (const sub of def.subProducts) {
    if (keywordRegex(sub.keywords).test(blob)) return sub.id as SubProductId
  }
  return def.defaultSubProduct as SubProductId
}

// ── Vocabulary row ──────────────────────────────────────────────────

export type VocabularyRow = {
  id: string
  sectorId: SectorId
  subProductId: SubProductId
  /** Palette archetype families — painter picks first match for the StyleBar chip. */
  paletteFamilies: ('dark-gold' | 'warm-cream' | 'kraft-natural' | 'cool-neutral' | 'paper-clean' | 'bright-pop')[]
  heroFamilies: HeroFamily[]
  patternFamilies: PatternFamily[]
  backgroundTreatments: BackgroundTreatment[]
  /** Max ornament level: 0 = none, 1 = frames only, 2 = frames+corners, 3 = full jewelry. */
  ornamentLevel: 0 | 1 | 2 | 3
  /** Allowed primitive atoms for illustration system. */
  primitives: PrimitiveId[]
  /** Claim strip on front (food NET/DOĞAL, cosmetics PAO). */
  claimStrip: boolean
  /** Legal kit id that picks the correct back panel layout. */
  legalKitId: 'composition' | 'nutrition' | 'inci' | 'spec' | 'directions' | 'generic'
  /** Typography voice. */
  typographyVoice: 'editorial' | 'warm-serif' | 'clean-sans' | 'tech-mono' | 'mixed'
  /** Motif / hero / pattern families that are FORBIDDEN for this vocabulary. */
  forbiddenHeroes: HeroFamily[]
  forbiddenPatterns: PatternFamily[]
  forbiddenMotifs: string[]
  /** Panel role defaults. */
  frontRole: 'lockup-hero' | 'lockup-claim' | 'lockup-spec'
  backRole: 'legal-stack' | 'nutrition-table' | 'spec-compliance'
}

// ── Vocabulary table ────────────────────────────────────────────────

const VOCAB: VocabularyRow[] = [
  // ── COSMETICS / PERFUME ──
  {
    id: 'perfume:parfum',
    sectorId: 'perfume', subProductId: 'parfum',
    paletteFamilies: ['dark-gold', 'cool-neutral'],
    heroFamilies: ['crest', 'seal'],
    patternFamilies: ['contour', 'ornament'],
    backgroundTreatments: ['dark-field', 'vignette'],
    ornamentLevel: 3,
    primitives: ['rule', 'diamond'],
    claimStrip: false,
    legalKitId: 'composition',
    typographyVoice: 'editorial',
    forbiddenHeroes: ['harvest', 'botanical'],
    forbiddenPatterns: ['grain'],
    forbiddenMotifs: ['bee', 'mountain', 'meadow', 'honey', 'nutrition-table', 'glassfork', 'weee'],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
  {
    id: 'perfume:cologne',
    sectorId: 'perfume', subProductId: 'cologne',
    paletteFamilies: ['cool-neutral', 'dark-gold'],
    heroFamilies: ['crest', 'seal'],
    patternFamilies: ['contour', 'stripe'],
    backgroundTreatments: ['dark-field', 'quiet-paper'],
    ornamentLevel: 2,
    primitives: ['rule'],
    claimStrip: false,
    legalKitId: 'composition',
    typographyVoice: 'editorial',
    forbiddenHeroes: ['harvest', 'botanical'],
    forbiddenPatterns: ['grain', 'capsule'],
    forbiddenMotifs: ['bee', 'mountain', 'nutrition-table', 'glassfork'],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
  // ── SKINCARE ──
  {
    id: 'cream:cream',
    sectorId: 'cream', subProductId: 'cream',
    paletteFamilies: ['paper-clean', 'warm-cream'],
    heroFamilies: ['oval', 'botanical', 'seal', 'emblem', 'monstera', 'palm', 'organic-wave', 'zebra'],
    patternFamilies: ['contour', 'grain', 'none'],
    backgroundTreatments: ['quiet-paper', 'dark-field'],
    ornamentLevel: 1,
    primitives: ['rule', 'dot'],
    claimStrip: false,
    legalKitId: 'inci',
    typographyVoice: 'clean-sans',
    forbiddenHeroes: ['harvest', 'tech'],
    forbiddenPatterns: ['capsule'],
    forbiddenMotifs: ['bee', 'mountain', 'flammable', 'weee', 'nutrition-table'],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
  {
    id: 'serum:serum',
    sectorId: 'serum', subProductId: 'serum',
    paletteFamilies: ['paper-clean', 'cool-neutral'],
    heroFamilies: ['botanical', 'oval', 'emblem', 'monstera', 'palm', 'organic-wave', 'zebra'],
    patternFamilies: ['none', 'stripe'],
    backgroundTreatments: ['quiet-paper'],
    ornamentLevel: 0,
    primitives: ['dot'],
    claimStrip: false,
    legalKitId: 'inci',
    typographyVoice: 'clean-sans',
    forbiddenHeroes: ['harvest', 'tech', 'crest'],
    forbiddenPatterns: ['capsule', 'lattice', 'contour', 'ornament'],
    forbiddenMotifs: ['bee', 'mountain', 'flammable', 'weee'],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
  // ── FOOD ──
  {
    id: 'food:honey',
    sectorId: 'food', subProductId: 'honey',
    paletteFamilies: ['warm-cream', 'kraft-natural'],
    heroFamilies: ['harvest', 'botanical', 'seal'],
    patternFamilies: ['ornament', 'grain', 'contour', 'weave'],
    backgroundTreatments: ['kraft', 'quiet-paper', 'dark-field'],
    ornamentLevel: 3,
    primitives: ['grain', 'leaf', 'diamond'],
    claimStrip: true,
    legalKitId: 'nutrition',
    typographyVoice: 'warm-serif',
    forbiddenHeroes: ['crest', 'tech'],
    forbiddenPatterns: ['lattice'],
    forbiddenMotifs: ['flammable', 'pao', 'alcohol-denat', 'eau-de-parfum', 'inci'],
    frontRole: 'lockup-claim',
    backRole: 'nutrition-table',
  },
  {
    id: 'food:oil',
    sectorId: 'food', subProductId: 'oil',
    paletteFamilies: ['warm-cream', 'dark-gold', 'kraft-natural'],
    heroFamilies: ['harvest', 'seal'],
    patternFamilies: ['ornament', 'contour', 'grain', 'weave'],
    backgroundTreatments: ['dark-field', 'kraft', 'quiet-paper'],
    ornamentLevel: 2,
    primitives: ['grain', 'leaf'],
    claimStrip: true,
    legalKitId: 'nutrition',
    typographyVoice: 'warm-serif',
    forbiddenHeroes: ['crest', 'tech'],
    forbiddenPatterns: ['lattice'],
    forbiddenMotifs: ['flammable', 'pao', 'alcohol-denat', 'eau-de-parfum'],
    frontRole: 'lockup-claim',
    backRole: 'nutrition-table',
  },
  {
    id: 'food:snack',
    sectorId: 'food', subProductId: 'snack',
    paletteFamilies: ['bright-pop', 'warm-cream'],
    heroFamilies: ['harvest', 'emblem'],
    patternFamilies: ['capsule', 'grain', 'none'],
    backgroundTreatments: ['quiet-paper', 'kraft'],
    ornamentLevel: 1,
    primitives: ['grain', 'dot'],
    claimStrip: true,
    legalKitId: 'nutrition',
    typographyVoice: 'mixed',
    forbiddenHeroes: ['crest', 'tech'],
    forbiddenPatterns: ['lattice', 'contour'],
    forbiddenMotifs: ['flammable', 'pao', 'alcohol-denat', 'eau-de-parfum'],
    frontRole: 'lockup-claim',
    backRole: 'nutrition-table',
  },
  {
    id: 'food:generic',
    sectorId: 'food', subProductId: 'food-generic',
    paletteFamilies: ['warm-cream', 'kraft-natural'],
    heroFamilies: ['harvest', 'botanical'],
    patternFamilies: ['ornament', 'grain', 'none'],
    backgroundTreatments: ['kraft', 'quiet-paper'],
    ornamentLevel: 2,
    primitives: ['grain', 'leaf'],
    claimStrip: true,
    legalKitId: 'nutrition',
    typographyVoice: 'warm-serif',
    forbiddenHeroes: ['crest', 'tech'],
    forbiddenPatterns: ['lattice'],
    forbiddenMotifs: ['flammable', 'pao', 'alcohol-denat', 'eau-de-parfum'],
    frontRole: 'lockup-claim',
    backRole: 'nutrition-table',
  },
  // ── ELECTRONICS ──
  {
    id: 'electronics:audio',
    sectorId: 'electronics', subProductId: 'audio',
    paletteFamilies: ['cool-neutral', 'dark-gold'],
    heroFamilies: ['tech', 'none'],
    patternFamilies: ['lattice', 'stripe', 'hexagon', 'dotgrid', 'none'],
    backgroundTreatments: ['quiet-paper', 'dark-field'],
    ornamentLevel: 0,
    primitives: ['dot', 'rule'],
    claimStrip: false,
    legalKitId: 'spec',
    typographyVoice: 'tech-mono',
    forbiddenHeroes: ['harvest', 'botanical', 'crest', 'seal'],
    forbiddenPatterns: ['grain', 'ornament', 'contour'],
    forbiddenMotifs: ['bee', 'mountain', 'honey', 'flammable', 'pao', 'nutrition-table', 'glassfork'],
    frontRole: 'lockup-spec',
    backRole: 'spec-compliance',
  },
  {
    id: 'electronics:cable',
    sectorId: 'electronics', subProductId: 'cable',
    paletteFamilies: ['cool-neutral', 'paper-clean'],
    heroFamilies: ['tech', 'none'],
    patternFamilies: ['lattice', 'stripe', 'hexagon', 'dotgrid', 'none'],
    backgroundTreatments: ['quiet-paper'],
    ornamentLevel: 0,
    primitives: ['dot'],
    claimStrip: false,
    legalKitId: 'spec',
    typographyVoice: 'tech-mono',
    forbiddenHeroes: ['harvest', 'botanical', 'crest', 'seal'],
    forbiddenPatterns: ['grain', 'ornament', 'contour'],
    forbiddenMotifs: ['bee', 'mountain', 'honey', 'flammable', 'pao', 'nutrition-table'],
    frontRole: 'lockup-spec',
    backRole: 'spec-compliance',
  },
  {
    id: 'electronics:generic',
    sectorId: 'electronics', subProductId: 'elec-generic',
    paletteFamilies: ['cool-neutral'],
    heroFamilies: ['tech', 'none'],
    patternFamilies: ['lattice', 'stripe', 'hexagon', 'dotgrid', 'none'],
    backgroundTreatments: ['quiet-paper', 'dark-field'],
    ornamentLevel: 0,
    primitives: ['dot', 'rule'],
    claimStrip: false,
    legalKitId: 'spec',
    typographyVoice: 'tech-mono',
    forbiddenHeroes: ['harvest', 'botanical', 'crest', 'seal'],
    forbiddenPatterns: ['grain', 'ornament', 'contour'],
    forbiddenMotifs: ['bee', 'mountain', 'honey', 'flammable', 'pao', 'nutrition-table'],
    frontRole: 'lockup-spec',
    backRole: 'spec-compliance',
  },
  {
    id: 'beverage:beverage',
    sectorId: 'beverage', subProductId: 'beverage',
    paletteFamilies: ['bright-pop', 'kraft-natural', 'cool-neutral'],
    heroFamilies: ['botanical', 'emblem', 'organic-wave', 'none'],
    patternFamilies: ['grain', 'stripe', 'weave', 'none'],
    backgroundTreatments: ['dual-tone', 'quiet-paper', 'kraft'],
    ornamentLevel: 1,
    primitives: ['wave', 'leaf', 'dot'],
    claimStrip: true,
    legalKitId: 'nutrition',
    typographyVoice: 'mixed',
    forbiddenHeroes: ['tech', 'crest'],
    forbiddenPatterns: ['ornament', 'lattice'],
    forbiddenMotifs: ['flammable', 'pao', 'weee'],
    frontRole: 'lockup-claim',
    backRole: 'nutrition-table',
  },
  {
    id: 'health:health',
    sectorId: 'health', subProductId: 'health',
    paletteFamilies: ['paper-clean', 'cool-neutral'],
    heroFamilies: ['oval', 'emblem', 'none'],
    patternFamilies: ['stripe', 'capsule', 'none'],
    backgroundTreatments: ['quiet-paper', 'dual-tone'],
    ornamentLevel: 0,
    primitives: ['rule', 'dot'],
    claimStrip: true,
    legalKitId: 'directions',
    typographyVoice: 'clean-sans',
    forbiddenHeroes: ['harvest', 'crest', 'seal'],
    forbiddenPatterns: ['ornament', 'contour', 'grain'],
    forbiddenMotifs: ['bee', 'flammable', 'nutrition-table'],
    frontRole: 'lockup-spec',
    backRole: 'legal-stack',
  },
  {
    id: 'baby:baby',
    sectorId: 'baby', subProductId: 'baby',
    paletteFamilies: ['warm-cream', 'paper-clean', 'bright-pop'],
    heroFamilies: ['organic-wave', 'emblem', 'oval', 'none'],
    patternFamilies: ['capsule', 'stripe', 'none'],
    backgroundTreatments: ['quiet-paper', 'dual-tone'],
    ornamentLevel: 1,
    primitives: ['wave', 'dot'],
    claimStrip: true,
    legalKitId: 'directions',
    typographyVoice: 'mixed',
    forbiddenHeroes: ['tech', 'crest', 'harvest'],
    forbiddenPatterns: ['ornament', 'contour', 'lattice'],
    forbiddenMotifs: ['flammable', 'weee'],
    frontRole: 'lockup-claim',
    backRole: 'legal-stack',
  },
  // ── CLEANING ──
  {
    id: 'cleaning:cleaning',
    sectorId: 'cleaning', subProductId: 'cleaning',
    paletteFamilies: ['paper-clean', 'cool-neutral'],
    heroFamilies: ['none', 'emblem'],
    patternFamilies: ['stripe', 'none'],
    backgroundTreatments: ['quiet-paper'],
    ornamentLevel: 0,
    primitives: ['dot'],
    claimStrip: false,
    legalKitId: 'directions',
    typographyVoice: 'clean-sans',
    forbiddenHeroes: ['crest', 'harvest', 'tech'],
    forbiddenPatterns: ['contour', 'grain', 'ornament'],
    forbiddenMotifs: ['bee', 'mountain', 'nutrition-table', 'pao', 'flammable-perfume'],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
  // ── GENERIC ──
  {
    id: 'generic:generic',
    sectorId: 'generic', subProductId: 'generic',
    paletteFamilies: ['paper-clean', 'cool-neutral'],
    heroFamilies: ['none', 'seal'],
    patternFamilies: ['none', 'stripe'],
    backgroundTreatments: ['quiet-paper'],
    ornamentLevel: 1,
    primitives: ['rule'],
    claimStrip: false,
    legalKitId: 'generic',
    typographyVoice: 'clean-sans',
    forbiddenHeroes: [],
    forbiddenPatterns: [],
    forbiddenMotifs: [],
    frontRole: 'lockup-hero',
    backRole: 'legal-stack',
  },
]

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
