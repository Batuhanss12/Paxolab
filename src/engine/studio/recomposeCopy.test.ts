import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { labelFaceForField, recomposeCopy } from './recomposeCopy'

function perfumeLabel(): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Luma',
    productName: 'Noir Eau',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    dimensionsMm: { L: 90, W: 0, H: 70 },
    styleType: 'luxury',
    volume: '50 ml',
  }
}

describe('recomposeCopy', () => {
  beforeEach(() => resetArtMemory())

  it('repaints locked studio faces when brand copy changes', () => {
    const spec = new FormaLocalEngine().generate({
      brief: perfumeLabel(),
      overridePatch: { studio: true },
    })
    const next = recomposeCopy(spec, { brand: 'Vela' })
    expect(next.studio?.direction.archetype).toBe(spec.studio?.direction.archetype)
    expect(next.studio?.direction.background).toBe(spec.studio?.direction.background)
    expect(next.copy.brand).toBe('Vela')
    expect(next.artwork.layers.some((l) => /VELA/i.test(l.markup))).toBe(true)
    expect(next.dieline.structureId).toBe(spec.dieline.structureId)
    expect(next.palette.bg).toBe(spec.palette.bg)
  })

  it('keeps barcode digits inside the back after a live copy edit', () => {
    const spec = new FormaLocalEngine().generate({
      brief: perfumeLabel(),
      overridePatch: { studio: true },
    })
    const next = recomposeCopy(spec, { product: 'Nocturne', tagline: 'Geceye özel' })
    const back = next.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
    expect(back).toMatch(/data-barcode-digits="\d{13}"/)
    expect(back).toMatch(/NOCTURNE/i)
  })

  it('keeps locked direction and exposes data-edit hit targets', () => {
    const spec = new FormaLocalEngine().generate({
      brief: perfumeLabel(),
      overridePatch: { studio: true },
    })
    const next = recomposeCopy(spec, { brand: 'Vela', ingredients: 'Alkol, parfüm yağı' })
    const front = next.artwork.layers.find((l) => l.panelId === next.artwork.frontPanelId)?.markup ?? ''
    const back = next.artwork.layers.find((l) => l.panelId === 'labelBack')?.markup ?? ''
    expect(front).toMatch(/data-edit="brand"/)
    expect(front).toMatch(/data-edit="product"/)
    expect(back).toMatch(/data-edit="ingredients"/)
    expect(back).toMatch(/data-edit="barcode"/)
  })

  it('does not rewrite a partial barcode while the user is still typing', () => {
    const spec = new FormaLocalEngine().generate({
      brief: perfumeLabel(),
      overridePatch: { studio: true },
    })
    const next = recomposeCopy(spec, { barcode: '86912' })
    expect(next.copy.barcode).toBe('86912')
  })

  it('maps canvas fields to the label face the painter actually uses', () => {
    expect(labelFaceForField('cta')).toBe('front')
    expect(labelFaceForField('volume')).toBe('front')
    expect(labelFaceForField('usage')).toBe('back')
    expect(labelFaceForField('address')).toBe('back')
  })
})
