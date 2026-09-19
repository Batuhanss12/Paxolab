/**
 * A panel whose cut is a rotated rectangle is painted in its own frame, not in its bounding box.
 *
 * `polygonBox` builds a prism's wall as `[P0, P1, P1+n·h, P0+n·h]` with `n` perpendicular to
 * `P0→P1` — a true rectangle sitting at whatever heading that wall has on the net. Describing it by
 * its axis-aligned bounding box told the painter it had a 148.92 × 137.94 canvas when the wall is
 * 90 × 120: only 53% of what it filled was inside the cut, and the panel clip silently ate the
 * rest. Measured on the triangular gift box, 23 of 51 placed elements crossed the knife, the worst
 * by 34.45 mm — the F-42 question, open for five phases.
 *
 * Nothing prints outside the die either way, because `panelClipDefinition` clips to the real
 * polygon. The damage was content destroyed by that clip.
 */
import { describe, expect, it } from 'vitest'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import type { DesignBrief } from '../../types'
import { rotatedRectFrame } from './forxaAdapter'

type Pt = { x: number; y: number }

function inside(poly: Pt[], p: Pt): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!
    const b = poly[j]!
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}

function giftBox() {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: 'Vera',
    productName: 'Hediye Seti',
    sector: 'gıda',
    subProduct: 'çikolata',
    packagingMode: 'box',
    templateId: 'fm-gift-tri-box',
    styleType: 'luxury',
    volume: '250 gr',
    dimensionsMm: { L: 90, W: 90, H: 120 },
    barcode: '8690000000017',
  }
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('the frame is read from the cut', () => {
  it('a rotated rectangle reports its own edges, not its bounding box', () => {
    // A 90 × 120 wall at 120°: the bounding box of that is 148.92 × 137.94.
    const s = Math.sin((120 * Math.PI) / 180)
    const c = Math.cos((120 * Math.PI) / 180)
    const P0 = { x: 10, y: 10 }
    const P1 = { x: P0.x + 90 * c, y: P0.y + 90 * s }
    // Perpendicular, the way `rotate(120°)` sends local +y.
    const n = { x: -s, y: c }
    const poly = [P0, P1, { x: P1.x + 120 * n.x, y: P1.y + 120 * n.y }, { x: P0.x + 120 * n.x, y: P0.y + 120 * n.y }]
    const frame = rotatedRectFrame(poly)
    expect(frame).not.toBeNull()
    expect(frame!.w).toBeCloseTo(90, 6)
    expect(frame!.h).toBeCloseTo(120, 6)
    expect(frame!.deg).toBeCloseTo(120, 6)
  })

  it('and anything that is not a rotated rectangle keeps the bounding box', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 40 },
      { x: 0, y: 40 },
    ]
    // Axis-aligned: the bounding box already is the frame.
    expect(rotatedRectFrame(square)).toBeNull()
    const trapezoid = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 40, y: 40 },
      { x: 10, y: 40 },
    ]
    expect(rotatedRectFrame(trapezoid)).toBeNull()
    expect(rotatedRectFrame([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeNull()
  })
})

describe('the triangular gift box paints inside its own walls', () => {
  const spec = giftBox()

  it('each wall is measured by its side and height', () => {
    for (const id of ['wall-0', 'wall-1', 'wall-2']) {
      const panel = spec.dieline.panels.find((p) => p.id === id)
      expect(panel, id).toBeDefined()
      expect(panel!.w, `${id} genişlik`).toBeCloseTo(90, 1)
      expect(panel!.h, `${id} yükseklik`).toBeCloseTo(120, 1)
    }
  })

  it('and the painted layer really carries the rotation', () => {
    /*
     * The frame maths being right is not the same as the renderer using it. `composeStudioArtwork`
     * wraps each panel in `translate(x y) rotate(deg)`; without the rotate the face is laid down
     * axis-aligned from the same origin and walks straight out of the wall.
     */
    for (const id of ['wall-1', 'wall-2']) {
      const panel = spec.dieline.panels.find((p) => p.id === id)!
      const frame = rotatedRectFrame(panel.polygon!)
      expect(frame, `${id} döndürülmüş olmalı`).not.toBeNull()
      const layer = spec.artwork.layers.find((l) => l.panelId === id)
      expect(layer, id).toBeDefined()
      expect(layer!.markup, `${id} dönüşü`).toMatch(/rotate\(/)
    }
    // An axis-aligned panel must not pick up a rotation it does not need.
    const flat = spec.artwork.layers.find((l) => l.panelId === 'base')
    if (flat) expect(flat.markup).not.toMatch(/transform="translate\([^"]*rotate/)
  })

  it('and nothing the painter places lands outside the cut', () => {
    /*
     * Panel-local to sheet with the transform `composeStudioArtwork.wrap` emits: translate to the
     * frame origin, then rotate. Before the frame was aligned this reported 23 boxes out and 34 mm
     * of overhang; reverting the alignment puts it back to 143 mm.
     */
    let worstOut = 0
    for (const report of spec.studio!.panels) {
      const panel = spec.dieline.panels.find((p) => p.id === report.panelId)
      const poly = panel?.polygon
      if (!panel || !poly?.length) continue
      const frame = rotatedRectFrame(poly)
      const th = ((frame?.deg ?? 0) * Math.PI) / 180
      const cos = Math.cos(th)
      const sin = Math.sin(th)
      const map = (lx: number, ly: number): Pt => ({
        x: panel.x + lx * cos - ly * sin,
        y: panel.y + lx * sin + ly * cos,
      })
      for (const b of report.placed) {
        if (b.kind === 'ground') continue
        const corners = [map(b.x, b.y), map(b.x + b.w, b.y), map(b.x + b.w, b.y + b.h), map(b.x, b.y + b.h)]
        for (const p of corners) if (!inside(poly, p)) worstOut += 1
      }
    }
    expect(worstOut, 'kesim dışı köşe').toBe(0)
  })
})
