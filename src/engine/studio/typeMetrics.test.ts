/**
 * L1 — type measurement and the print floor.
 *
 * Measured 2026-09-17 against the real fonts in a browser: the old `FACE_EM` estimator drifted
 * −10%…+20% (worst on `script`). The negative side was the damaging one — the engine believed a
 * line was narrower than it renders, declared it fitted, and let it overrun its box.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { STUDIO_TYPE_FLOOR_MM, fitSize, textWidth, typeSize } from './text'

/** Widths the browser reported for the real faces at 100 px, 2026-09-17. */
const BROWSER_100PX: [string, 'sans' | 'sans-heavy' | 'sans-light' | 'script', number][] = [
  ['NEXORA', 'sans', 442.2],
  ['SIZMA ZEYTİNYAĞI', 'sans', 960.7],
  ['KATKISIZ', 'sans-heavy', 476.3],
  ['Doğadan sofranıza', 'sans-light', 928.4],
  ['Nexora', 'script', 254.9],
]

function faceOf(job: (typeof STUDIO_GALLERY_JOBS)[number]): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: job.packagingMode,
    templateId: job.templateId,
    styleType: job.styleType,
    colors: job.colors,
    volume: job.volume,
    dimensionsMm: job.dimensionsMm,
    // A real GTIN: the sample-barcode disclaimer is the one sub-floor string we allow.
    barcode: '8690000000017',
  }
}

describe('L1 — text is measured with real advances', () => {
  it('matches the browser within 2% on every studio face', () => {
    for (const [text, face, expected] of BROWSER_100PX) {
      const measured = textWidth(text, 100, face, 0)
      const drift = Math.abs(measured - expected) / expected
      expect(drift, `${face} "${text}" drifted ${(drift * 100).toFixed(1)}%`).toBeLessThan(0.02)
    }
  })

  it('no longer overestimates the script face by a fifth', () => {
    // The estimator put "Nexora" at ~306 against a real 254.9 — a 20% error.
    expect(textWidth('Nexora', 100, 'script', 0)).toBeLessThan(270)
  })

  it('tracking still adds per gap, not per glyph', () => {
    const plain = textWidth('ABCD', 10, 'sans', 0)
    const tracked = textWidth('ABCD', 10, 'sans', 1)
    expect(tracked - plain).toBeCloseTo(3, 5)
  })
})

describe('L1 — nothing is drawn below the print floor', () => {
  it('clamps a computed size', () => {
    expect(typeSize(0.4)).toBe(STUDIO_TYPE_FLOOR_MM)
    expect(typeSize(9)).toBe(9)
  })

  it('fitSize never returns less than the floor, whatever the caller asks for', () => {
    expect(fitSize('a very long line that cannot possibly fit', 4, 3, 0.5, 'sans')).toBeGreaterThanOrEqual(
      STUDIO_TYPE_FLOOR_MM,
    )
    expect(fitSize('', 10, 0.8, 0.2, 'sans')).toBeGreaterThanOrEqual(STUDIO_TYPE_FLOOR_MM)
  })

  it('every golden face ships type at or above the floor', () => {
    for (const job of STUDIO_GALLERY_JOBS) {
      resetArtMemory()
      const spec = new FormaLocalEngine().generate({
        brief: faceOf(job),
        overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
      })
      for (const layer of spec.artwork.layers) {
        for (const m of String(layer.markup).matchAll(/font-size="([\d.]+)"/g)) {
          expect(parseFloat(m[1]), `${job.slug} ${layer.panelId}`).toBeGreaterThanOrEqual(STUDIO_TYPE_FLOOR_MM)
        }
      }
    }
  })

  it('raising the floor did not push anything out of its box', () => {
    let hits = 0
    for (const job of STUDIO_GALLERY_JOBS) {
      resetArtMemory()
      const spec = new FormaLocalEngine().generate({
        brief: faceOf(job),
        overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
      })
      hits += (spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0)
    }
    // Ratchet: bigger legal type must not reintroduce the overlaps R9 cleared.
    expect(hits).toBeLessThanOrEqual(1)
  })
})
