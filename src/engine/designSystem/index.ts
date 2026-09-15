export type { DesignSystem, SectorId, LockupId, DecorFamily, TypeScale, TypeRole } from './types'
export { resolveDesignSystem } from './resolve'
export { resolveSector } from './sector'
export { evaluateDesignGates, isKraftLike } from './gates'
export { STYLE_KITS, categoryFor, typeScaleFor, pickLockup, pickDecor } from './kits'
export {
  CONCEPT_LOCKUP_TABLE,
  lockupForConcept,
  goldBarForConcept,
  chromeForConcept,
  shouldPaintSectorFrame,
  shouldPaintModernGrid,
  shouldPaintLockupWindow,
  conceptForbidsPattern,
  preferHeroForConcept,
  kitSuppliesFocalLockup,
  kitLexiconUsedByKit,
} from './conceptKitAlignment'
export {
  layoutFrontLockup,
  smallCapsText,
  volumeMarkup,
  fitLine,
  estimateLineWidth,
  glyphAdvance,
  lineBBox,
  measureLockupCollision,
  measureFrontDecorCollision,
  collectFrontDecorBoxes,
  collectLockupGlyphBoxes,
} from './typeSystem'
export { normalizeVolume, volumeDisplay, volumeBandTop, volumeUsesEstimated } from './volumeFormat'
export type { VolumeUnit, NormalizedVolume } from './volumeFormat'
export type { ArtBox } from './artBox'
export { boxesOverlap, boxGap, axisGap } from './artBox'
