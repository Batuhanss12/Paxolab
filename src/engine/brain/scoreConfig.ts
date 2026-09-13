export const DESIGN_SCORE_BASE = {
  hierarchy: 70,
  density: 70,
  honesty: 80,
  densityFront: 82,
  lockupClearance: 72,
  sectorBlind: 78,
  sideIntentionality: 70,
} as const

export const CRITIQUE_THRESHOLDS = {
  densityFront: 50,
  lockupClearance: 45,
  hierarchyStrength: 50,
  sectorBlind: 40,
  sideIntentionality: 35,
  repetitionPenalty: 55,
} as const

export const VISUAL_CRAFT_WEIGHTS = {
  hero: 0.18,
  composition: 0.14,
  hierarchy: 0.14,
  informationDesign: 0.12,
  decoration: 0.1,
  typography: 0.1,
  sectorFit: 0.1,
  productFit: 0.06,
  originality: 0.06,
} as const

export function weightedCraftScore(scores: Record<keyof typeof VISUAL_CRAFT_WEIGHTS, number>): number {
  return Math.round(
    Object.entries(VISUAL_CRAFT_WEIGHTS).reduce(
      (total, [key, weight]) => total + scores[key as keyof typeof VISUAL_CRAFT_WEIGHTS] * weight,
      0,
    ),
  )
}
