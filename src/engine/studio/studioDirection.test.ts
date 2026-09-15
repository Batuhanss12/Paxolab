import { describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { hintsFromBrief, resolveDirection, studioPalette } from './direction'
import { paletteFor } from '../artwork/languages'
import { withStudioExportFonts } from './text'

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

  it('pins serum to the DNA Pharma line-scene, not botanical-card', () => {
    const brief = { ...emptyBrief(), brandName: 'LUMA', sector: 'kozmetik', subProduct: 'serum', productName: 'Glow Serum', packagingMode: 'box' as const, styleType: 'minimal' as const }
    expect(hintsFromBrief(brief, 'serum', 'box').archetype).toBe('line-scene')
    expect(hintsFromBrief(brief, 'serum', 'label').archetype).toBe('line-scene')
    const palette = paletteFor(brief, 'minimal', true)
    const direction = resolveDirection({
      brief,
      sector: 'serum',
      style: 'minimal',
      surface: 'box',
      faceW: 45,
      faceH: 120,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'LUMA', product: 'Glow Serum', tagline: '', volume: '30 ml' },
      hints: [hintsFromBrief(brief, 'serum', 'box')],
    })
    expect(direction.archetype).toBe('line-scene')
    expect(direction.background).toBe('line-scene')
    expect(direction.temperament).toBe('clean-clinical')
  })

  it('pins baby care (bakım) to line-scene instead of the botanical card', () => {
    const brief = { ...emptyBrief(), brandName: 'MİA', sector: 'bebek', subProduct: 'bakım', productName: 'Soft Care', packagingMode: 'box' as const, styleType: 'playful' as const }
    expect(hintsFromBrief(brief, 'baby', 'box').archetype).toBe('line-scene')
    const palette = paletteFor(brief, 'playful', true)
    const direction = resolveDirection({
      brief,
      sector: 'baby',
      style: 'playful',
      surface: 'box',
      faceW: 75,
      faceH: 95,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'MİA', product: 'Soft Care', tagline: '', volume: '200 ml' },
      hints: [hintsFromBrief(brief, 'baby', 'box')],
    })
    expect(direction.archetype).toBe('line-scene')
    expect(direction.archetype).not.toBe('botanical-card')
  })

  it('pins cleaning to the FERAH wave-panel', () => {
    const brief = { ...emptyBrief(), brandName: 'FERAH', sector: 'temizlik', subProduct: 'deterjan', productName: 'Konsantre', packagingMode: 'box' as const, styleType: 'eco' as const }
    expect(hintsFromBrief(brief, 'cleaning', 'box').archetype).toBe('wave-panel')
    expect(hintsFromBrief(brief, 'cleaning', 'label').archetype).toBe('wave-panel')
    const palette = paletteFor(brief, 'eco', true)
    const direction = resolveDirection({
      brief,
      sector: 'cleaning',
      style: 'eco',
      surface: 'box',
      faceW: 90,
      faceH: 160,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'FERAH', product: 'Konsantre', tagline: '', volume: '1 L' },
      hints: [hintsFromBrief(brief, 'cleaning', 'box')],
    })
    expect(direction.archetype).toBe('wave-panel')
    expect(direction.background).toBe('wave')
  })

  it('leaves coffee, perfume, and electronics DNA untouched', () => {
    expect(hintsFromBrief({ ...emptyBrief(), sector: 'gıda', subProduct: 'kahve' }, 'food', 'box').archetype).toBe('marble-frame')
    expect(hintsFromBrief({ ...emptyBrief(), sector: 'parfüm', subProduct: 'eau de parfum' }, 'perfume', 'box').archetype).toBe('dark-landscape')
    expect(hintsFromBrief({ ...emptyBrief(), sector: 'parfüm', subProduct: 'eau de parfum' }, 'perfume', 'label').archetype).toBe('ink-panel')
    expect(hintsFromBrief({ ...emptyBrief(), sector: 'elektronik', subProduct: 'kulaklık' }, 'electronics', 'box').archetype).toBe('diagonal-tech')
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
    const markup = spec.artwork.layers.map((l) => l.markup).join('\n')
    expect(markup).toMatch(/data-bg="marble"/)
    expect(markup).toMatch(/data-texture="dust"/)
    expect(spec.studio?.direction.categoryLine).toBe('KAHVE')
    expect(spec.studio?.direction.chips[0]).toMatch(/COFFEE|KAHVE/i)
    expect(spec.studio?.direction.taglineLine).not.toMatch(/masada duran|gurme gıda/i)
    expect(markup).not.toMatch(/GURME GIDA/)
    expect(markup).not.toMatch(/Masada duran/i)
    expect(spec.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
    expect(markup).toMatch(/studio-fonts/)
    expect(markup).toMatch(/Cormorant/)
    expect(markup).toMatch(/Montserrat/)
    const exported = withStudioExportFonts(markup)
    expect(exported).toMatch(/studio-fonts-subset/)
    expect(exported).toMatch(/unicode-range/)
    expect(exported).not.toMatch(/@import url/)
    expect(spec.critique?.needsRepair).toBe(false)
    expect(spec.designCritique?.some((row) => row.evidence.source === 'critiquePlan' && row.evidence.topic === 'lockupClearance')).toBe(false)
    expect(spec.copy.brand).toBe('Elite Brew')
    expect(spec.copy.brand).not.toMatch(/elektro/i)
  })

  it('conversation generate paints serum as line-scene, not botanical-card', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'LUMA',
        productName: 'Glow Serum',
        sector: 'kozmetik',
        subProduct: 'serum',
        packagingMode: 'box',
        templateId: 'fm-cos-tuck-serum',
        dimensionsMm: { L: 45, W: 45, H: 120 },
        styleType: 'minimal',
        volume: '30 ml',
      },
      overridePatch: { studio: true },
    })
    expect(spec.studio?.direction.archetype).toBe('line-scene')
    expect(spec.studio?.direction.archetype).not.toBe('botanical-card')
    const markup = spec.artwork.layers.map((l) => l.markup).join('\n')
    expect(markup).toMatch(/data-bg="line-scene"/)
    expect(markup).not.toMatch(/data-bg="botanical"/)
  })

  it('conversation generate paints baby bakım as line-scene', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'MİA',
        productName: 'Soft Care',
        sector: 'bebek',
        subProduct: 'bakım',
        packagingMode: 'box',
        templateId: 'fm-box-tuck-universal',
        dimensionsMm: { L: 75, W: 40, H: 95 },
        styleType: 'playful',
        volume: '200 ml',
      },
      overridePatch: { studio: true },
    })
    expect(spec.studio?.direction.archetype).toBe('line-scene')
    expect(spec.studio?.direction.archetype).not.toBe('botanical-card')
    const markup = spec.artwork.layers.map((l) => l.markup).join('\n')
    expect(markup).toMatch(/data-bg="line-scene"/)
  })

  it('conversation generate paints cleaning as wave-panel', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'FERAH',
        productName: 'Konsantre',
        sector: 'temizlik',
        subProduct: 'deterjan',
        packagingMode: 'box',
        templateId: 'fm-box-snap-lock',
        dimensionsMm: { L: 90, W: 50, H: 160 },
        styleType: 'eco',
        volume: '1 L',
      },
      overridePatch: { studio: true },
    })
    expect(spec.studio?.direction.archetype).toBe('wave-panel')
    expect(spec.studio?.direction.archetype).not.toBe('botanical-card')
    const markup = spec.artwork.layers.map((l) => l.markup).join('\n')
    expect(markup).toMatch(/data-bg="wave"/)
  })

  it('stamps a studio family on the box and keeps the sibling archetype on the label', () => {
    const engine = new FormaLocalEngine()
    const box = engine.generate({
      brief: {
        ...emptyBrief(),
        brandName: 'woo.originals',
        productName: 'Restorative Shampoo',
        sector: 'kozmetik',
        subProduct: 'şampuan',
        packagingMode: 'box',
        templateId: 'fm-box-tuck-universal',
        dimensionsMm: { L: 80, W: 50, H: 140 },
        styleType: 'playful',
        volume: '500 ml',
      },
      overridePatch: { studio: true },
    })
    expect(box.studio?.direction.archetype).toBe('botanical-card')
    expect(box.brief.studioFamily).toBe('botanical')

    const label = engine.generate({
      brief: {
        ...box.brief,
        packagingMode: 'label',
        templateId: 'fm-label-universal',
        dimensionsMm: { L: 110, W: 0, H: 90 },
      },
      overridePatch: { studio: true },
    })
    expect(label.studio?.direction.archetype).toBe('card-on-art')
    expect(label.brief.studioFamily).toBe('botanical')
  })

  it('companion label stays on the box family even if the brief looks like another sector', () => {
    const engine = new FormaLocalEngine()
    const box = engine.generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Elite Brew',
        sector: 'gıda',
        subProduct: 'kahve',
        packagingMode: 'box',
        templateId: 'coffee-box',
        dimensionsMm: { L: 80, W: 50, H: 180 },
        styleType: 'luxury',
        volume: '250 g',
      },
      overridePatch: { studio: true },
    })
    expect(box.brief.studioFamily).toBe('marble')
    const label = engine.generate({
      brief: {
        ...box.brief,
        packagingMode: 'label',
        templateId: 'fm-label-universal',
        subProduct: 'şampuan',
        dimensionsMm: { L: 70, W: 0, H: 120 },
      },
      overridePatch: { studio: true },
    })
    expect(label.studio?.direction.archetype).toBe('marble-frame')
    expect(label.studio?.direction.archetype).not.toBe('card-on-art')
  })
})
