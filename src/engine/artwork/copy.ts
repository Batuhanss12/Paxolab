/**
 * copy — facade re-exporting the decomposed copy modules.
 * Helpers live in copyHelpers.ts.
 * Sample copy lives in sampleCopy.ts.
 * Back fill lives in backFill.ts.
 * This file preserves the public API.
 */
export type { BackFillBlock } from './copyHelpers'
export { resolveProductLine, frontSpecLine, monogram, categoryLine } from './copyHelpers'
export { sampleCopy, defaultIngredientClaims } from './sampleCopy'
export { backFill } from './backFill'
