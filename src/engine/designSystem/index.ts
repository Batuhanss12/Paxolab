export type { DesignSystem, SectorId, LockupId, DecorFamily, TypeScale, TypeRole } from './types'
export { resolveDesignSystem } from './resolve'
export { resolveSector } from './sector'
export { evaluateDesignGates, isKraftLike } from './gates'
export { STYLE_KITS, categoryFor, typeScaleFor } from './kits'
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
} from './typeSystem'
export { normalizeVolume, volumeDisplay } from './volumeFormat'
export type { VolumeUnit, NormalizedVolume } from './volumeFormat'
export type { ArtBox } from './artBox'
export { boxesOverlap, boxGap } from './artBox'
