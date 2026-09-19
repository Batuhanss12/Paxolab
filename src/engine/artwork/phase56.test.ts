import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { resetArtMemory } from '../brain'
import { emptyBrief } from '../fields'
import { defaultIngredientClaims, sampleCopy } from './copy'
import { resolveSectorCopy } from './sectorCopyConfig'

function brief(patch: Partial<DesignBrief>): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'LUMINA',
    packagingMode: 'box',
    ...patch,
  }
}

describe('Phase 5 style differentiation', () => {
  beforeEach(() => resetArtMemory())

  it('splits cream tagline and claims across eco / playful / modern', () => {
    const eco = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'eco' }))
    const play = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'playful' }))
    const modern = sampleCopy(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'modern' }))
    expect(eco.tagline).toBe('Doğadan yavaş.')
    expect(play.tagline).toBe('Parla. Uyu. Tekrar.')
    expect(modern.tagline).toBe('Klinik onarım.')
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'eco' }))).toBe(
      'SHEA + CENTELLA',
    )
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'playful' }))).toBe(
      'SHEA + VITAMIN E',
    )
    expect(defaultIngredientClaims(brief({ sector: 'kozmetik', subProduct: 'krem', styleType: 'modern' }))).toBe(
      'CERAMIDE + NIACINAMIDE',
    )
  })

})

describe('Phase 6 food nutrition back', () => {
  beforeEach(() => resetArtMemory())

  it('overrides bakery voice off honey / jam / tea / chocolate', () => {
    const honey = resolveSectorCopy('food', 'bal çiçek', 'tr')
    const jam = resolveSectorCopy('food', 'reçel vişne', 'tr')
    const tea = resolveSectorCopy('food', 'çay adaçayı', 'tr')
    const choco = resolveSectorCopy('food', 'çikolata cacao', 'tr')
    const biscuit = resolveSectorCopy('food', 'kurabiye biscuit', 'tr')
    expect(honey.ingredients).not.toMatch(/Buğday unu/)
    expect(jam.ingredients).not.toMatch(/Buğday unu/)
    expect(tea.ingredients).not.toMatch(/Buğday unu/)
    expect(choco.ingredients).not.toMatch(/Buğday unu/)
    expect(honey.tagline).not.toMatch(/Fırından/)
    expect(jam.tagline).toBe('Bahçeden kavanoza.')
    expect(biscuit.ingredients).toMatch(/Buğday unu/)
  })

})
