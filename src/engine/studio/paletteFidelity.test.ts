/**
 * L2 — the face wears the colours the brief asked for.
 *
 * Measured 2026-09-17: `paletteFromBrief` only ran on the blank-canvas path, so on the normal
 * studio path the brief's colours were never consulted. "siyah · beyaz" came back turquoise and
 * "pembe · mor" came back orange. Two further causes sat underneath:
 *   - the named-colour table had no pink / purple / orange / blue / yellow / red,
 *   - "siyah" mapped to #1a0a0a, a warm black with 44% saturation, so a black brief read as
 *     chromatic and `vivid-mono` derived a hue from it.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { parseBriefColors } from '../artwork/briefPalette'
import { hsl } from './color'

function boxOf(colors: string, sector = 'kozmetik', subProduct = 'şampuan'): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Test',
    productName: 'Ürün',
    sector,
    subProduct,
    packagingMode: 'box',
    styleType: 'modern',
    colors,
    volume: '250 ml',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

function faceOf(brief: DesignBrief) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  return {
    palette: spec.studio!.direction.palette,
    archetype: spec.studio!.direction.archetype,
    temperament: spec.studio!.direction.temperament,
  }
}

/** Shortest hue distance in degrees. */
function hueGap(a: string, b: string): number {
  const d = Math.abs(hsl(a).h - hsl(b).h) % 360
  return d > 180 ? 360 - d : d
}

describe('L2 — the named-colour table covers what briefs actually say', () => {
  it('knows the colours the old 12-entry table was missing', () => {
    for (const word of ['pembe', 'mor', 'turuncu', 'mavi', 'sarı', 'kırmızı', 'gri', 'kahve', 'turkuaz']) {
      expect(parseBriefColors(word), word).not.toHaveLength(0)
    }
  })

  it('treats black as neutral so nothing derives a hue from it', () => {
    const [black] = parseBriefColors('siyah')
    expect(hsl(black).s).toBeLessThan(0.2)
  })

  it('reads both colours of a two-colour brief', () => {
    expect(parseBriefColors('siyah · altın')).toHaveLength(2)
    expect(parseBriefColors('pembe · mor')).toHaveLength(2)
  })
})

describe('L2 — the studio face follows the brief palette', () => {
  it('a black + gold brief paints black and gold', () => {
    const { palette } = faceOf(boxOf('siyah · altın', 'kozmetik', 'parfüm'))
    expect(hsl(palette.ground).l).toBeLessThan(0.2)
    // Gold sits around 45° — the accent must land near it, not on some invented hue.
    expect(hueGap(palette.accent, '#c9a227')).toBeLessThan(40)
  })

  it('a neutral brief never gets an invented colour', () => {
    const { palette, temperament } = faceOf(boxOf('siyah · beyaz'))
    expect(temperament).not.toBe('vivid-mono')
    // Ground and accent both stay neutral: low saturation, or so dark/light that hue cannot read.
    for (const hex of [palette.ground, palette.accent]) {
      const { s, l } = hsl(hex)
      expect(s < 0.25 || l < 0.15 || l > 0.85, `${hex} carries a hue`).toBe(true)
    }
  })

  it('a coloured brief still gets its colour', () => {
    const { palette } = faceOf(boxOf('pembe · mor', 'gıda', 'çikolata'))
    expect(hsl(palette.ground).s).toBeGreaterThan(0.3)
    // Pink/magenta territory, not the orange the sector default used to produce.
    expect(hueGap(palette.ground, '#e59bb0')).toBeLessThan(60)
  })

  it('a visual word still outranks the neutral rule', () => {
    expect(faceOf(boxOf('mermer · altın', 'kozmetik', 'krem')).archetype).toBe('marble-frame')
  })

  it('a silent brief keeps the sector default', () => {
    const silent = faceOf(boxOf('', 'kozmetik', 'krem'))
    expect(silent.archetype).toBe('botanical-card')
  })

  it('the same brief is deterministic', () => {
    expect(faceOf(boxOf('siyah · beyaz')).palette).toEqual(faceOf(boxOf('siyah · beyaz')).palette)
  })
})
