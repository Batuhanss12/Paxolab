/**
 * typeSystem — facade re-exporting the decomposed type system modules.
 * Glyph metrics, lockup layout, and small caps/volume rendering
 * now live in their own modules. This file preserves the public API.
 */
export type { LockupCopy, LockupLayout, CollisionReport } from './lockupLayout'
export {
  fitLine,
  layoutFrontLockup,
  measureLockupCollision,
  measureFrontDecorCollision,
  collectFrontDecorBoxes,
  collectLockupGlyphBoxes,
} from './lockupLayout'
export { clamp, estimateLineWidth, glyphAdvance, lineBBox } from './glyphMetrics'
export { smallCapsRuns, smallCapsText, volumeMarkup } from './smallCaps'
export type { LineBox } from './types'
