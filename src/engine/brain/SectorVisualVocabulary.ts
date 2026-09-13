/**
 * SectorVisualVocabulary — facade re-exporting the decomposed vocabulary modules.
 * The anti-mix bible: every sector×subProduct row defines what the painter MAY use.
 * Style only modulates within the vocabulary; it must never drag
 * perfume noir paint onto food or pastoral honey onto electronics.
 *
 * Data table now lives in vocabularyTable.ts.
 * Lookup + rules + style-safe selectors live in vocabularyRules.ts.
 * This file preserves the public API.
 */
export type { SubProductId, VocabularyRow } from './vocabularyTable'
export { resolveSubProduct, VOCAB } from './vocabularyTable'
export type { BleedFault } from './vocabularyRules'
export {
  detectCrossSectorBleed,
  lookupVocabulary,
  styleForbiddenPatterns,
  vocabHeroRequired,
  vocabSafeBackground,
  vocabSafeHero,
  vocabSafePattern,
} from './vocabularyRules'
