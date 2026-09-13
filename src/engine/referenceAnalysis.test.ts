import { describe, expect, it } from 'vitest'
import { dominantColors } from './referenceAnalysis'

describe('reference palette analysis', () => {
  it('returns dominant opaque colors and ignores transparent pixels', () => {
    const pixels = new Uint8ClampedArray([
      180, 40, 40, 255,
      182, 42, 42, 255,
      30, 80, 160, 255,
      20, 20, 20, 0,
    ])

    expect(dominantColors(pixels, 2)).toEqual(['#b52929', '#1e50a0'])
  })
})
