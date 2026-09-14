import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { filterTemplates, pickTemplate } from './catalog'

function brief(patch: Partial<DesignBrief> = {}) {
  return { ...emptyBrief(), ...patch }
}

describe('filterTemplates', () => {
  it('shows the perfume-sector cartons and hides other sectors', () => {
    const cards = filterTemplates(
      brief({ sector: 'kozmetik', subProduct: 'parfüm', packagingMode: 'box' }),
    )
    const ids = cards.map((t) => t.id)
    expect(ids[0]).toBe('fm-cos-tuck-perfume')
    expect(ids).toContain('fm-cos-tuck-cream')
    expect(ids).toContain('fm-cos-tuck-euroslot')
    expect(ids).toContain('fm-box-ecma-a60')
    expect(ids).not.toContain('fm-food-tray-snack')
    expect(ids).not.toContain('fm-elec-tuck-earbuds')
    expect(ids).not.toContain('fm-box-rsc-ship')
  })

  it('sorts the named product first and keeps the rest of the sector', () => {
    const cream = filterTemplates(brief({ sector: 'kozmetik', subProduct: 'krem', packagingMode: 'box' }))
    expect(cream[0]!.id).toBe('fm-cos-tuck-cream')
    expect(cream.some((t) => t.id === 'fm-cos-tuck-perfume')).toBe(true)
    const oil = filterTemplates(brief({ sector: 'gıda', subProduct: 'yağ', packagingMode: 'box' }))
    expect(oil[0]!.id).toBe('fm-food-tuck-oil')
    expect(oil.some((t) => t.id === 'fm-elec-tuck-earbuds')).toBe(false)
  })

  it('treats edp / parfüm as the perfume family, still sector-wide', () => {
    const cards = filterTemplates(brief({ sector: 'parfüm', subProduct: 'edp', packagingMode: 'box' }))
    expect(cards[0]!.id).toBe('fm-cos-tuck-perfume')
    expect(pickTemplate(brief({ sector: 'parfüm', subProduct: 'edp', packagingMode: 'box' })).id).toBe(
      'fm-cos-tuck-perfume',
    )
    expect(cards.some((t) => t.id === 'fm-food-tray-snack')).toBe(false)
  })

  it('does not use packagingMode alone as a match for every sector', () => {
    const elec = filterTemplates(brief({ sector: 'elektronik', subProduct: 'kulaklık', packagingMode: 'box' }))
    expect(elec[0]!.id).toBe('fm-elec-tuck-earbuds')
    expect(elec.every((t) => t.sectors.some((s) => /elektronik|teknoloji|e-ticaret/i.test(s)))).toBe(true)
    expect(elec.some((t) => t.id === 'fm-cos-tuck-perfume')).toBe(false)
  })
})
