/**
 * Panel renderers — modular panel-specific artwork rendering.
 * Each panel type (front, back, side, top, labelBack) has its own module.
 */
export { renderFrontPanel } from './frontPanel'
export { renderBackPanel } from './backPanel'
export { renderSidePanel } from './sidePanel'
export { renderTopPanel } from './topPanel'
export { labelBackArt } from './labelBack'
export { glueOnly, flapGround, frames, sectorFrame, labelDecor, lockupRule, lockoutClip, modernStripe } from './shared'
export { goldBar, capsuleVolume, stampVolume, outlineVolume } from './volume'
export { foodNutritionTable, foodClaimStrip, ingredientBadges } from './foodElements'
export { legalHead, legalBlock, marksBar } from './legalBlocks'
