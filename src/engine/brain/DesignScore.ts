/**
 * DesignScore — facade re-exporting the decomposed scoring modules.
 * Post-render scorecard and visual craft scoring now live in their own modules.
 * This file preserves the public API.
 */
export type { DesignScorecard } from './scoreDesignCard'
export type { VisualCraftScorecard } from './scoreVisualCraft'
export { scoreDesign } from './scoreDesignCard'
export { scoreVisualCraft } from './scoreVisualCraft'
