import { describe, expect, it } from 'vitest'
import { analyzePixels, dominantColors } from './referenceAnalysis'

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

describe('analyzePixels rich analysis', () => {
  it('detects minimal layout on near-empty canvas', () => {
    // 8×8 white canvas — minimal
    const pixels = new Uint8ClampedArray(8 * 8 * 4)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 250
      pixels[i + 1] = 250
      pixels[i + 2] = 250
      pixels[i + 3] = 255
    }
    const analysis = analyzePixels(pixels, 8, 8)
    expect(analysis.layout).toBe('minimal')
    expect(analysis.brightness).toBeGreaterThan(0.7)
  })

  it('detects dense layout on colorful canvas', () => {
    // 8×8 colorful canvas — dense
    const pixels = new Uint8ClampedArray(8 * 8 * 4)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 200
      pixels[i + 1] = 50
      pixels[i + 2] = 50
      pixels[i + 3] = 255
    }
    const analysis = analyzePixels(pixels, 8, 8)
    expect(analysis.density).toBeGreaterThan(0.5)
    expect(analysis.saturation).toBeGreaterThan(0.3)
  })

  it('produces colors array from pixels', () => {
    const pixels = new Uint8ClampedArray([
      180, 40, 40, 255,
      182, 42, 42, 255,
      180, 40, 40, 255,
      30, 80, 160, 255,
    ])
    const analysis = analyzePixels(pixels, 2, 2)
    expect(analysis.colors.length).toBeGreaterThan(0)
    expect(analysis.colors[0]).toMatch(/^#[0-9a-f]{6}$/)
  })
})
