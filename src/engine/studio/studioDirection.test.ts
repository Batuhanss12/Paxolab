import { describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { hintsFromBrief, resolveDirection, studioPalette } from './direction'
import { paletteFor } from '../artwork/languages'

describe('studio direction — TASARIM REF families', () => {
  it('pins coffee to the Elite Brew marble system', () => {
    const brief = { ...emptyBrief(), brandName: 'Elite Brew', sector: 'gıda', subProduct: 'kahve', packagingMode: 'box' as const, styleType: 'luxury' as const }
    const hints = hintsFromBrief(brief, 'food', 'box')
    expect(hints.archetype).toBe('marble-frame')
    expect(hints.background).toBe('marble')
    const palette = paletteFor(brief, 'luxury', true)
    const direction = resolveDirection({
      brief,
      sector: 'food',
      style: 'luxury',
      surface: 'box',
      faceW: 80,
      faceH: 180,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'Elite Brew', product: '', tagline: '', volume: '250 g' },
      hints: [hints],
    })
    expect(direction.archetype).toBe('marble-frame')
    expect(direction.background).toBe('marble')
    expect(studioPalette(palette, direction.temperament).ground).toBeTruthy()
  })

  it('pins cosmetics care to the woo.originals botanical card', () => {
    const brief = { ...emptyBrief(), brandName: 'woo.originals', sector: 'kozmetik', subProduct: 'şampuan', packagingMode: 'label' as const }
    expect(hintsFromBrief(brief, 'cream', 'label').archetype).toBe('card-on-art')
  })

  it('conversation generate paints the studio path, not the harvest kit', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Elite Brew',
        sector: 'gıda',
        subProduct: 'kahve',
        packagingMode: 'box',
        templateId: 'coffee-box',
        dimensionsMm: { L: 80, W: 50, H: 180 },
        styleType: 'luxury',
      },
      overridePatch: { studio: true },
    })
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
    expect(spec.studio?.direction.categoryLine).toBe('KAHVE')
    expect(spec.studio?.direction.chips[0]).toMatch(/COFFEE|KAHVE/i)
    expect(spec.studio?.direction.taglineLine).not.toMatch(/masada duran|gurme gıda/i)
    const markup = spec.artwork.layers.map((l) => l.markup).join('\n')
    expect(markup).not.toMatch(/GURME GIDA/)
    expect(markup).not.toMatch(/Masada duran/i)
    expect(spec.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
    expect(spec.copy.brand).toBe('Elite Brew')
    expect(spec.copy.brand).not.toMatch(/elektro/i)
  })
})
