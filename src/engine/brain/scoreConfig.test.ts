import { describe, expect, it } from 'vitest'
import { CRITIQUE_THRESHOLDS, VISUAL_CRAFT_WEIGHTS, weightedCraftScore } from './scoreConfig'

describe('score configuration', () => {
  it('keeps visual craft weights normalized', () => {
    const total = Object.values(VISUAL_CRAFT_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    expect(total).toBeCloseTo(1, 8)
  })

  it('returns the same score when all axes are equal', () => {
    expect(
      weightedCraftScore({
        hero: 72,
        composition: 72,
        hierarchy: 72,
        informationDesign: 72,
        decoration: 72,
        typography: 72,
        sectorFit: 72,
        productFit: 72,
        originality: 72,
      }),
    ).toBe(72)
  })

  it('uses bounded critique thresholds', () => {
    for (const threshold of Object.values(CRITIQUE_THRESHOLDS)) {
      expect(threshold).toBeGreaterThan(0)
      expect(threshold).toBeLessThan(100)
    }
  })
})
