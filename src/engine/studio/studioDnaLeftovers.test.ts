import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { categoryBesideProduct, samePackLine } from './copyBank'
import { assembleStudioHints } from './directionTalk'
import { fitSize, textWidth } from './text'
import { STUDIO_FACE_GOLDEN, generateStudioFace, hashStudioFace } from './studioGolden'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { TEMPERAMENT_OPTIONS } from './temperament'

function coffee(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    productName: 'Mocha',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '250 g',
    ...extra,
  }
}

function perfume(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'REBULL NOIR',
    productName: extra.productName ?? '',
    sector: 'parfüm',
    subProduct: 'eau de parfum',
    packagingMode: 'box',
    templateId: 'fm-cos-tuck-perfume',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    styleType: 'luxury',
    colors: '#0b0b0b #c9a45c',
    volume: '100 ml',
    ...extra,
  }
}

function generate(brief: DesignBrief, overridePatch: Record<string, unknown> = {}) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true, ...overridePatch },
  })
}

function faceHash(spec: ReturnType<FormaLocalEngine['generate']>): string {
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return hashStudioFace(layer)
}

describe('DNA leftovers 1–5', () => {
  it('locked family vary changes temperament, not the S4 family', () => {
    const base = generate(coffee({ studioFamily: 'marble' }))
    const next = generate(
      { ...base.brief, directionVariation: 1 },
      { variationIndex: 1 },
    )
    expect(next.studio?.direction.archetype).toBe('marble-frame')
    expect(next.brief.studioFamily).toBe('marble')
    expect(next.studio?.direction.temperament).not.toBe(base.studio?.direction.temperament)
    expect(faceHash(next)).not.toBe(faceHash(base))
  })

  it('variationIndex 0 coffee golden stays put', () => {
    const job = STUDIO_GALLERY_JOBS.find((row) => row.slug === '05-kahve-kutu')!
    const face = generateStudioFace(job)
    expect(face.hash).toBe(STUDIO_FACE_GOLDEN['05-kahve-kutu']!.hash)
  })

  it('unlocked vary walks a wider ranked window than top-3 wrap', () => {
    const soup: DesignBrief = {
      ...emptyBrief(),
      brandName: 'ACME',
      productName: 'Domates',
      sector: 'gıda',
      subProduct: 'sos',
      packagingMode: 'box',
      templateId: 'fm-box-tuck-universal',
      dimensionsMm: { L: 80, W: 50, H: 160 },
      styleType: 'modern',
      volume: '400 g',
    }
    const families = [0, 1, 2, 3].map((i) => generate(soup, { variationIndex: i }).studio?.direction.archetype)
    expect(new Set(families).size).toBeGreaterThan(1)
  })

  it('offer lists 2–3 unique families; selected is the painted face', () => {
    const spec = generate(coffee())
    const offer = spec.studio?.offer
    expect(offer?.candidates.length).toBeGreaterThanOrEqual(2)
    expect(offer?.candidates.length).toBeLessThanOrEqual(3)
    expect(new Set(offer?.candidates.map((row) => row.family)).size).toBe(offer?.candidates.length)
    expect(offer?.candidates.find((row) => row.selected)?.archetype).toBe(spec.studio?.direction.archetype)
  })

  it('FACE_EM treats wide glyphs as wider than narrow ones; short brands keep max size', () => {
    expect(textWidth('WWW', 10, 'sans-heavy')).toBeGreaterThan(textWidth('III', 10, 'sans-heavy'))
    expect(textWidth('MAISON AURELIA NOIR', 10, 'serif')).toBeGreaterThan(textWidth('NOX', 10, 'serif'))
    expect(fitSize('NOX', 40, 5.2, 2.2, 'sans-heavy')).toBe(5.2)
    const long = fitSize('MAISON AURELIA NOIR COLLECTION', 40, 8, 2.2, 'sans-heavy')
    expect(long).toBeLessThan(8)
    expect(long).toBeGreaterThanOrEqual(2.2)
  })

  it('empty perfume product does not paint category twice; chips skip the bank cliché', () => {
    expect(samePackLine('eau de parfum', 'EAU DE PARFUM')).toBe(true)
    expect(categoryBesideProduct('EAU DE PARFUM', 'EAU DE PARFUM')).toBe('')
    const spec = generate(perfume({ productName: '' }))
    expect(spec.studio?.direction.categoryLine).toBe('EAU DE PARFUM')
    expect(spec.studio?.direction.chips[0]).not.toMatch(/EAU DE PARFUM/i)
    const front = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
    const hits = front.match(/EAU DE PARFUM/g) ?? []
    expect(hits.length).toBeLessThanOrEqual(1)
  })

  it('user slogan does not keep the sector chip as EAU DE PARFUM', () => {
    const spec = generate(perfume({ productName: 'Sauvage', copyOverrides: 'Geceye özel iz.' }))
    expect(spec.studio?.direction.copySource).toBe('user')
    expect(spec.studio?.direction.chips[0]).not.toMatch(/EAU DE PARFUM/i)
    expect(spec.studio?.direction.chips).toContain('Geceye özel iz.')
  })

  it('studioTemperament hint last-wins over the sector guess', () => {
    const hints = assembleStudioHints(coffee({ studioFamily: 'marble', studioTemperament: 'light-luxe' }), 'box')
    const last = [...hints].reverse().find((row) => row.temperament)
    expect(last?.temperament).toBe('light-luxe')
    expect(last?.source).toBe('user')
    const spec = generate(coffee({ studioFamily: 'marble', studioTemperament: 'light-luxe' }))
    expect(spec.studio?.direction.temperament).toBe('light-luxe')
    expect(TEMPERAMENT_OPTIONS.map((row) => row.id)).toContain('clean-clinical')
  })

  it('StyleBar temperament holds through a locked-family vary', () => {
    const spec = generate(
      coffee({ studioFamily: 'marble', studioTemperament: 'clean-clinical', directionVariation: 1 }),
      { variationIndex: 1, direction: { temperament: 'clean-clinical', source: 'user' } },
    )
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
    expect(spec.studio?.direction.temperament).toBe('clean-clinical')
  })

  it('box artwork keeps data-edit hits for the dieline canvas', () => {
    const spec = generate(coffee())
    expect(spec.kind).toBe('packaging')
    const front = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
    expect(front).toMatch(/data-edit="brand"/)
    expect(front).toMatch(/data-edit="product"/)
  })

  it('empty perfume product stays empty on copy so the canvas is not a category cliché', () => {
    const spec = generate(perfume({ productName: '' }))
    expect(spec.copy.product).toBe('')
  })

  it('back legal body is larger and a step heavier without changing wrap face', () => {
    const spec = generate(coffee())
    const back = spec.artwork.layers.find((row) => row.panelId === 'back')?.markup ?? ''
    expect(back).toMatch(/data-art="legal-column"/)
    const usage = back.match(/<g data-edit="usage">([\s\S]*?)<\/g>/)?.[1] ?? ''
    expect(usage).toMatch(/font-weight="600"/)
    expect(usage).not.toMatch(/opacity="0.92"/)
    const bodySize = Number(usage.match(/font-weight="600" font-size="([0-9.]+)"/)?.[1] ?? 0)
    expect(bodySize).toBeGreaterThanOrEqual(1.7)
    expect(back).toMatch(/data-edit="warnings"/)
  })

  it('back pictograms use PARFUM İCON assets at the same slot size, not on food', () => {
    const serum = generate({
      ...emptyBrief(),
      brandName: 'Rebull',
      productName: 'Noir',
      sector: 'kozmetik',
      subProduct: 'serum',
      packagingMode: 'box',
      templateId: 'fm-cos-tuck-serum',
      dimensionsMm: { L: 70, W: 35, H: 120 },
      styleType: 'minimal',
      colors: 'siyah',
      volume: '30 ml',
    })
    const serumBack = serum.artwork.layers.find((row) => row.panelId === 'back')?.markup ?? ''
    expect(serumBack).toMatch(/data-art="pictograms"/)
    expect(serumBack).toMatch(/viewBox="0 0 986\.01/)
    expect(serumBack).not.toMatch(/viewBox="0 0 2004\.78/)
    const marks = serum.preflight.items.find((row) => row.id === 'ds-marks')
    expect(marks?.status).toBe('pass')

    const scent = generate(perfume({ productName: 'Sauvage' }))
    const perfumeBack = scent.artwork.layers.find((row) => row.panelId === 'back')?.markup ?? ''
    expect(perfumeBack).toMatch(/viewBox="0 0 2004\.78/)
    expect(perfumeBack).toMatch(/viewBox="0 0 1004\.2/)
    expect(perfumeBack).toMatch(/viewBox="0 0 986\.01/)
    expect(perfumeBack).toMatch(/viewBox="0 0 1433\.45/)

    const food = generate(coffee())
    const foodBack = food.artwork.layers.find((row) => row.panelId === 'back')?.markup ?? ''
    expect(foodBack).not.toMatch(/viewBox="0 0 2004\.78/)
    expect(foodBack).not.toMatch(/viewBox="0 0 986\.01/)
  })
})
