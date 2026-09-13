import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { buildDieline, outlineUnion } from './buildDieline'

function boxBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    packagingMode: 'box',
    templateId: 'perfume-box',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    ...patch,
  }
}

function isClosedRing(ring: { x: number; y: number }[]): boolean {
  if (ring.length < 3) return false
  const first = ring[0]!
  const last = ring[ring.length - 1]!
  const duplicated = Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6
  // Treated as closed polygon (SVG Z / DXF flag 70=1) even without duplicate vertex
  return duplicated || ring.length >= 3
}

describe('outlineUnion / buildDieline cut rings', () => {
  it('tuck-end cut ring has > 4 points, is closed, and keeps creases', () => {
    const model = buildDieline('tuck-end-box', boxBrief())
    expect(model.cut).toHaveLength(1)
    const ring = model.cut[0]!
    expect(ring.length).toBeGreaterThan(4)
    expect(isClosedRing(ring)).toBe(true)
    expect(model.crease.length).toBeGreaterThan(0)
  })

  it('simple-tray cut ring follows cross silhouette (> 4 points)', () => {
    const model = buildDieline('simple-tray', boxBrief({ dimensionsMm: { L: 80, W: 50, H: 20 } }))
    expect(model.cut[0]!.length).toBeGreaterThan(4)
    expect(model.crease.length).toBe(4)
  })

  it('flat-label keeps separate panel polygons', () => {
    const model = buildDieline('flat-label', boxBrief({ packagingMode: 'label', dimensionsMm: { L: 70, W: 0, H: 90 } }))
    expect(model.cut).toHaveLength(2)
    expect(model.cut[0]).toHaveLength(4)
    expect(model.cut[1]).toHaveLength(4)
  })

  it('wrap-label face+glue union is a clean outer path; back stays separate', () => {
    const model = buildDieline('wrap-label', boxBrief({ packagingMode: 'label', dimensionsMm: { L: 90, W: 0, H: 70 } }))
    expect(model.cut).toHaveLength(2)
    expect(model.cut[0]!.length).toBe(4)
    expect(model.cut[1]).toHaveLength(4)
    expect(model.crease.length).toBe(1)
  })

  it('outlineUnion cancels shared edges of two adjacent rectangles', () => {
    const a = {
      id: 'a',
      role: 'body' as const,
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      polygon: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
    }
    const b = {
      id: 'b',
      role: 'body' as const,
      x: 10,
      y: 0,
      w: 10,
      h: 10,
      polygon: [
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 10, y: 10 },
      ],
    }
    const ring = outlineUnion([a, b])
    expect(ring).toHaveLength(4)
    const xs = ring.map((p) => p.x)
    const ys = ring.map((p) => p.y)
    expect(Math.min(...xs)).toBe(0)
    expect(Math.max(...xs)).toBe(20)
    expect(Math.min(...ys)).toBe(0)
    expect(Math.max(...ys)).toBe(10)
  })
})
