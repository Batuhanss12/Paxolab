import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { applyVolumeCarton, estimateCartonMm, parseVolumeMl } from './volumeCarton'

describe('volume carton estimate', () => {
  it('parses ml / cl / l and ignores grams', () => {
    expect(parseVolumeMl('50 ml')).toBe(50)
    expect(parseVolumeMl('5 cl')).toBe(50)
    expect(parseVolumeMl('0.1 l')).toBe(100)
    expect(parseVolumeMl('80 g')).toBeNull()
  })

  it('uses the catalog 50 ml perfume carton as the 50 ml estimate', () => {
    expect(estimateCartonMm('50 ml', { sector: 'kozmetik', subProduct: 'parfüm', packagingMode: 'box' })).toEqual({
      L: 70,
      W: 35,
      H: 140,
    })
  })

  it('scales 100 ml from the 50 ml perfume carton and does not invent electronics sizes', () => {
    const hundred = estimateCartonMm('100 ml', { sector: 'parfüm', subProduct: 'edp', packagingMode: 'box' })
    expect(hundred!.L).toBeGreaterThan(70)
    expect(hundred!.H).toBeGreaterThan(140)
    expect(estimateCartonMm('50 ml', { sector: 'elektronik', subProduct: 'kulaklık', packagingMode: 'box' })).toBeNull()
  })

  it('fills empty L×W×H from ml and leaves a typed mill size alone', () => {
    const estimated = applyVolumeCarton({
      ...emptyBrief(),
      sector: 'kozmetik',
      subProduct: 'parfüm',
      packagingMode: 'box',
      volume: '50 ml',
    })
    expect(estimated.dimensionsMm).toEqual({ L: 70, W: 35, H: 140 })
    expect(estimated.dimsFromVolume).toBe(true)
    const locked = applyVolumeCarton({
      ...emptyBrief(),
      sector: 'kozmetik',
      subProduct: 'parfüm',
      packagingMode: 'box',
      volume: '50 ml',
      dimensionsMm: { L: 90, W: 40, H: 160 },
    })
    expect(locked.dimensionsMm).toEqual({ L: 90, W: 40, H: 160 })
    expect(locked.dimsFromVolume).toBeUndefined()
  })
})
