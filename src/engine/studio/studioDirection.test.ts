import { describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { hintsFromBrief, resolveDirection, studioPalette } from './direction'
import { paletteFor } from '../artwork/languages'
import { withStudioExportFonts } from './text'
import { resetArtMemory } from '../brain/DesignMemory'


/**
 * These once asserted that the sector's reference archetype was what every generation returned.
 * That is no longer the contract: the owner asked for maximum range, so the mood walks the ranked
 * archetypes and a sector guess is a strong preference rather than a lock. What must still hold is
 * that the *knowledge* survives — the sector still names its reference, that reference still ranks
 * at the top, and it is still reachable. A preference nothing can ever reach is not a preference.
 */
const MOODS = ['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful'] as const

function archetypesAcrossMoods(brief: Record<string, unknown>): Set<string> {
  const out = new Set<string>()
  for (const styleType of MOODS) {
    resetArtMemory()
    // The stamped family is dropped the way the app drops it when the mood changes: it records what
    // was painted last, and leaving it in pins every mood onto that one archetype.
    const spec = new FormaLocalEngine().generate({
      brief: { ...brief, styleType, studioFamily: undefined } as never,
      overridePatch: { studio: true, variationIndex: 0 },
    })
    if (spec.studio) out.add(spec.studio.direction.archetype)
  }
  return out
}


/** Same idea at the unit level: which archetypes the sector's hint can still reach. */
function resolveAcrossMoods(input: Parameters<typeof resolveDirection>[0]): Set<string> {
  const out = new Set<string>()
  for (const style of MOODS) out.add(resolveDirection({ ...input, style }).archetype)
  return out
}

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
    // The sector still names its reference and the reference is still reachable. A plain equality
    // would be asserting the old lock: the mood is now allowed to walk past a sector guess.
    expect(direction.archetype).toBeTruthy()
    expect([...resolveAcrossMoods({
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
    })], 'line-scene unreachable for serum').toContain('line-scene')
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
    // The sector still names its reference and it is still reachable; a plain equality would be
    // asserting the lock that was deliberately removed.
    expect(direction.archetype).toBeTruthy()
    expect([...resolveAcrossMoods({
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
    })], 'line-scene unreachable for baby care').toContain('line-scene')
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
    expect(direction.archetype).toBeTruthy()
    expect([...resolveAcrossMoods({
      brief,
      sector: 'cleaning',
      style: 'modern',
      surface: 'box',
      faceW: 90,
      faceH: 160,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'FERAH', product: 'Konsantre', tagline: '', volume: '1 L' },
      hints: [hintsFromBrief(brief, 'cleaning', 'box')],
    })], 'wave-panel unreachable for cleaning').toContain('wave-panel')
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
    // Reachable, not forced: the mood moves the composition now, so pinning one archetype here
    // would assert the lock that was deliberately removed. What must survive is that the sector's
    // own reference is still one of the answers the engine can give.
    expect(spec.studio?.direction.archetype).toBeTruthy()
    expect([...archetypesAcrossMoods(spec.brief)], 'line-scene unreachable').toContain('line-scene')
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
    // Reachable, not forced: the mood moves the composition now, so pinning one archetype here
    // would assert the lock that was deliberately removed. What must survive is that the sector's
    // own reference is still one of the answers the engine can give.
    expect(spec.studio?.direction.archetype).toBeTruthy()
    expect([...archetypesAcrossMoods(spec.brief)], 'line-scene unreachable').toContain('line-scene')
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
    // Reachable, not forced: the mood moves the composition now, so pinning one archetype here
    // would assert the lock that was deliberately removed. What must survive is that the sector's
    // own reference is still one of the answers the engine can give.
    expect(spec.studio?.direction.archetype).toBeTruthy()
    expect([...archetypesAcrossMoods(spec.brief)], 'wave-panel unreachable').toContain('wave-panel')
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
    // What matters here is the companion relationship, not which face the box started on: the mood
    // is allowed to move that now. So the box's family is read rather than asserted, and the claim
    // is that the label follows it.
    const boxFamily = box.brief.studioFamily
    expect(boxFamily, 'the box must stamp a family for the label to follow').toBeTruthy()

    const label = engine.generate({
      brief: {
        ...box.brief,
        packagingMode: 'label',
        templateId: 'fm-label-universal',
        dimensionsMm: { L: 110, W: 0, H: 90 },
      },
      overridePatch: { studio: true },
    })
    expect(label.brief.studioFamily, 'the label left the box family').toBe(boxFamily)
    expect(label.studio?.direction.archetype, 'the label must still paint a face').toBeTruthy()
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

  it('brief visual words override the sector pin — electronics + marble is marble, not diagonal', () => {
    const brief = {
      ...emptyBrief(),
      brandName: 'Nox',
      sector: 'elektronik',
      subProduct: 'kulaklık',
      packagingMode: 'box' as const,
      styleType: 'luxury' as const,
      colors: 'mermer · altın',
    }
    const hints = hintsFromBrief(brief, 'electronics', 'box')
    expect(hints.archetype).toBe('marble-frame')
    expect(hints.archetype).not.toBe('diagonal-tech')
    expect(hints.background).toBe('marble')
    const palette = paletteFor(brief, 'luxury', true)
    const direction = resolveDirection({
      brief,
      sector: 'electronics',
      style: 'luxury',
      surface: 'box',
      faceW: 90,
      faceH: 160,
      palette,
      locale: 'tr',
      variationIndex: 0,
      copy: { brand: 'Nox', product: '', tagline: '', volume: '' },
      hints: [hints],
    })
    expect(direction.archetype).toBe('marble-frame')
    expect(direction.background).toBe('marble')
  })

  it('perfume + klinik brief uses line-scene instead of the dark-landscape cliché', () => {
    const brief = {
      ...emptyBrief(),
      brandName: 'Luma',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box' as const,
      colors: 'beyaz klinik',
    }
    expect(hintsFromBrief(brief, 'perfume', 'box').archetype).toBe('line-scene')
  })
})
