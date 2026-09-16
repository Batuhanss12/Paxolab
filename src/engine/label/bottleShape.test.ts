import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { recommendBottleShape } from './bottleShape'

describe('recommendBottleShape', () => {
  it('keeps the square bottle for perfume and jar labels', () => {
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        sector: 'kozmetik',
        subProduct: 'parfüm',
        templateId: 'fm-cos-label-bottle',
      }),
    ).toBe('square')
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        sector: 'gıda',
        subProduct: 'reçel',
        templateId: 'fm-food-label-jar',
      }),
    ).toBe('square')
  })

  it('ignores an explicit cylinder request', () => {
    expect(
      recommendBottleShape({
        ...emptyBrief(),
        subProduct: 'parfüm',
        bottleShape: 'cylinder',
      }),
    ).toBe('square')
  })
})
