/**
 * Faz 2.8 — kit chrome reads VisualConcept before style costume defaults.
 * Style only modulates density/air/type inside the concept. Mapping is input
 * selection (LockupId / flags), not lockup typography math.
 */
import type { StyleType } from '../../types'
import type { HeroFamily, PatternFamily, VisualConceptBlock } from '../brain/DesignPlan'
import type { LockupId, SectorId } from './types'

/**
 * Concept id → compatible LockupId.
 * Soft-oval the concept maps to soft-oval the lockup; heraldic concepts map to
 * centered-crest, not a conflicting seal/cartouche frame.
 */
export const CONCEPT_LOCKUP_TABLE: Record<string, LockupId> = {
  'earthen-premium': 'harvest-seal',
  'grove-press': 'harvest-seal',
  'harvest-press': 'harvest-seal',
  'grove-kraft': 'stamp-center',
  'harvest-kraft': 'stamp-center',
  'nocturne-crest': 'centered-crest',
  'heraldic-crest': 'centered-crest',
  'heraldic-cartouche': 'serif-cartouche',
  'soft-oval': 'soft-oval',
  'drop-concentrate': 'soft-oval',
  'air-paper': 'air-rule',
  'tech-glyph': 'tech-grid',
  'signal-plaque': 'metal-plaque',
  'index-stripe': 'left-index',
  'capsule-field': 'badge-capsule',
  'kraft-botanical': 'stamp-center',
  'botanical-night': 'stamp-center',
  'restrained-foil': 'centered-crest',
}

export function lockupForConcept(concept: VisualConceptBlock | undefined, fallback: LockupId): LockupId {
  if (!concept) return fallback
  return CONCEPT_LOCKUP_TABLE[concept.id] ?? fallback
}

/** Volume chip, not a frame. Kill only when the concept forbids ornate + heavy chrome. */
export function goldBarForConcept(concept: VisualConceptBlock | undefined, styleGoldBar: boolean): boolean {
  if (!styleGoldBar) return false
  if (!concept) return true
  const avoid = concept.avoid ?? []
  if (concept.id === 'air-paper') return false
  if (avoid.includes('heavy-frame') && avoid.includes('ornate-seal')) return false
  return true
}

export function chromeForConcept(
  concept: VisualConceptBlock | undefined,
  recipeChrome: 'full' | 'quiet',
): 'full' | 'quiet' {
  if (!concept) return recipeChrome
  const avoid = concept.avoid ?? []
  const langs = concept.languages ?? []
  if (concept.id === 'air-paper' || avoid.includes('heavy-frame') || langs.includes('quiet-line')) return 'quiet'
  return recipeChrome
}

export function shouldPaintSectorFrame(
  concept: VisualConceptBlock | undefined,
  style: StyleType,
  sector: SectorId,
): boolean {
  const styleWants =
    style === 'luxury' ||
    style === 'classic' ||
    style === 'eco' ||
    style === 'playful' ||
    (style === 'modern' && sector === 'electronics')
  if (!styleWants) return false
  if (!concept) return true
  const avoid = concept.avoid ?? []
  const langs = concept.languages ?? []
  if (avoid.includes('heavy-frame')) return false
  if (langs.includes('quiet-line') || concept.id === 'air-paper') return false
  if (langs.includes('linear') || concept.id === 'tech-glyph' || concept.id === 'signal-plaque') return false
  if (avoid.includes('generic-corners') && sector === 'electronics') return false
  return true
}

export function shouldPaintModernGrid(concept: VisualConceptBlock | undefined, style: StyleType): boolean {
  if (style !== 'modern') return false
  if (!concept) return true
  if (concept.id === 'air-paper' || (concept.languages ?? []).includes('quiet-line')) return false
  return true
}

export function shouldPaintLockupWindow(
  concept: VisualConceptBlock | undefined,
  chrome: 'full' | 'quiet' | undefined,
  style: StyleType,
  grammar: 'box' | 'label',
): boolean {
  if (chrome !== 'full' || grammar === 'label' || style === 'minimal') return false
  return chromeForConcept(concept, chrome) === 'full'
}

export function conceptForbidsPattern(concept: VisualConceptBlock | undefined): boolean {
  if (!concept) return false
  return concept.id === 'air-paper'
}

const DENSE_PATTERN_FAMILIES: PatternFamily[] = ['contour', 'ornament']

export function densePatternFamiliesBlocked(concept: VisualConceptBlock | undefined): PatternFamily[] {
  if (!concept) return []
  if (concept.id === 'air-paper' || (concept.avoid ?? []).includes('dense-pattern')) return DENSE_PATTERN_FAMILIES
  return []
}

export function preferHeroForConcept(concept: VisualConceptBlock | undefined): HeroFamily | undefined {
  if (!concept) return undefined
  switch (concept.id) {
    case 'nocturne-crest':
    case 'heraldic-crest':
      return 'crest'
    case 'soft-oval':
      return 'oval'
    case 'tech-glyph':
    case 'signal-plaque':
      return 'tech'
    case 'earthen-premium':
    case 'grove-press':
    case 'grove-kraft':
    case 'harvest-press':
      return 'harvest'
    default:
      return undefined
  }
}

export function preferPatternForConcept(concept: VisualConceptBlock | undefined): PatternFamily | undefined {
  if (!concept) return undefined
  if (concept.id === 'air-paper') return 'none'
  return undefined
}

/** Crest lockup/hero already is the focal — motif must not clone it. Oval lockup stays shared language. */
export function kitSuppliesFocalLockup(lockup: LockupId, heroFamily?: HeroFamily): boolean {
  return lockup === 'centered-crest' || heroFamily === 'crest'
}

export function kitLexiconUsedByKit(
  concept: VisualConceptBlock | undefined,
  lockup: LockupId,
  heroFamily?: HeroFamily,
): string[] {
  const tokens: string[] = []
  if (lockup === 'centered-crest' || heroFamily === 'crest') tokens.push('crest')
  if (lockup === 'serif-cartouche' && (concept?.motifLexicon ?? []).includes('cartouche')) tokens.push('cartouche')
  return tokens
}
