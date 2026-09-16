import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { PERFUME_CYLINDER_PX, recommendBottleShape } from './bottleShape'

describe('recommendBottleShape', () => {
  it('picks a cylinder for perfume wrap and a square jar otherwise', () => {
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        sector: 'kozmetik',
        subProduct: 'parfüm',
        templateId: 'fm-cos-label-bottle',
      }),
    ).toBe('cylinder')
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        sector: 'gıda',
        subProduct: 'reçel',
        templateId: 'fm-food-label-jar',
      }),
    ).toBe('square')
  })

  it('uses a 50–100 ml spray proportion, not a thin wrap tube', () => {
    const diameter = PERFUME_CYLINDER_PX.radius * 2
    expect(diameter / PERFUME_CYLINDER_PX.bodyH).toBeGreaterThan(0.7)
    expect(PERFUME_CYLINDER_PX.bodyH / diameter).toBeLessThan(1.5)
  })

  it('honours an explicit bottleShape', () => {
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        subProduct: 'parfüm',
        bottleShape: 'square',
      }),
    ).toBe('square')
  })
})
