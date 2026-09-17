import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { hashStudioFace, generateStudioFace, STUDIO_FACE_GOLDEN } from './studioGolden'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function layer(spec: ReturnType<FormaLocalEngine['generate']>, id: string) {
  return spec.artwork.layers.find((row) => row.panelId === id)?.markup ?? ''
}

describe('studio craft — flap / top anatomy (STAGE D4)', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
  })
  afterEach(() => {
    resetDecisionLogs()
  })

  it('snap-lock top-tuck and bottom-lock carry brand + volume, not a blank field', () => {
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
    const tuck = layer(spec, 'top-tuck')
    const lock = layer(spec, 'bottom-lock')
    expect(tuck).toMatch(/data-role="flap"/)
    expect(tuck).toContain('data-art="flap"')
    expect(tuck).toMatch(/FERAH/)
    expect(tuck).toMatch(/data-art="net-quantity"/)
    expect(lock).toMatch(/data-role="flap"/)
    expect(lock).toContain('data-art="flap"')
    expect(lock).toMatch(/FERAH/)
    expect(lock).toMatch(/data-art="net-quantity"/)
    // The front's background is no longer fixed by the sector — the mood moves the composition —
    // and this test is about what the flaps carry, not which face the front landed on.
    expect(layer(spec, 'front')).toMatch(/data-bg="/)
  })

  it('reverse-tuck flaps paint brand + volume', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'DNA PHARMA',
        productName: 'Sea Protection',
        sector: 'sağlık',
        subProduct: 'takviye',
        packagingMode: 'box',
        templateId: 'fm-box-reverse-tuck',
        dimensionsMm: { L: 70, W: 40, H: 110 },
        styleType: 'minimal',
        volume: '60 kapsül',
      },
      overridePatch: { studio: true },
    })
    const top = layer(spec, 'top-tuck')
    const bottom = layer(spec, 'bottom-tuck')
    expect(top).toMatch(/data-role="flap"/)
    expect(top).toMatch(/DNA PHARMA/)
    expect(top).toMatch(/data-art="net-quantity"/)
    expect(bottom).toMatch(/data-role="flap"/)
    expect(bottom).toMatch(/DNA PHARMA/)
  })

  it('sleeve has no flap panels; sides stay studio spines', () => {
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'ELITE BREW',
        productName: 'Mocha Frappe',
        sector: 'gıda',
        subProduct: 'kahve',
        packagingMode: 'box',
        templateId: 'fm-box-sleeve',
        dimensionsMm: { L: 80, W: 50, H: 180 },
        styleType: 'luxury',
        volume: '250 g',
      },
      overridePatch: { studio: true },
    })
    expect(spec.artwork.layers.some((row) => /tuck|lock|dust/i.test(row.panelId))).toBe(false)
    expect(layer(spec, 'left')).toMatch(/data-role="side"/)
    expect(layer(spec, 'front')).toMatch(/data-bg="marble"/)
  })

  it('does not change the 18 front-face golden hashes', () => {
    const coffee = STUDIO_GALLERY_JOBS.find((job) => job.slug === '05-kahve-kutu')!
    const face = generateStudioFace(coffee)
    expect(face.hash).toBe(STUDIO_FACE_GOLDEN[coffee.slug].hash)
    expect(hashStudioFace(face.markup)).toBe(face.hash)
  })
})
