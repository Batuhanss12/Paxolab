/**
 * The preview shows the design and nothing else.
 *
 * Reported by the owner twice, and the second report is why this file changed shape.
 *
 * First: changing the style or the mood visibly recoloured the area *around* the artwork.
 * `renderPanelSvg` filled the whole padded viewBox with `palette.paper`, so the board the panel sat
 * on took the design's colour. The answer then was to make the board a constant neutral.
 *
 * Then: "why is the label surrounded by white, and why is it not shown at full size?" The neutral
 * board was the white, and on a disc or an oval it was a rectangle sitting behind a round label —
 * a shape the customer never drew. Its 6 mm on every side also spent 17 % of a 70 × 45 oval's width
 * on emptiness, which is why the artwork looked small in a large canvas.
 *
 * So the board is gone. What is pinned here is the stronger rule it was an attempt at: nothing
 * outside the cut carries colour, the stock follows the cut whatever its shape, the extent is
 * marked by one constant hairline, and the geometry is never stretched to fill a slot.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { renderFrontSvg, renderPanelSvg, facePanelId, PREVIEW_PAD } from './renderArtwork'

function labelBrief(mood: StyleType, colors: string, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Nexora',
    productName: 'Sızma',
    sector: 'gıda',
    subProduct: 'zeytinyağı',
    packagingMode: 'label',
    styleType: mood,
    colors,
    volume: '500 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
    ...extra,
  }
}

function render(mood: StyleType, colors = 'koyu yeşil · altın') {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: labelBrief(mood, colors), overridePatch: { studio: true, variationIndex: 0 } })
  return { spec, svg: renderFrontSvg(spec.dieline, spec.artwork, spec.palette) }
}

const EDGE = /stroke="(rgba\([^"]+\))" stroke-width="0\.25"/

describe('preview surround — the design and nothing else', () => {
  it('paints no board: the only full-bleed shape is the design’s own stock', () => {
    /*
     * The board was a shape covering the padded viewBox. Its absence is what makes the label fill
     * its slot, so it is asserted directly rather than inferred from a colour.
     */
    for (const mood of ['luxury', 'minimal', 'playful'] as StyleType[]) {
      const { spec, svg } = render(mood)
      const panel = spec.dieline.panels.find((p) => p.id === spec.artwork.frontPanelId)!
      const padded = panel.w + PREVIEW_PAD * 2
      // No rect spans the padded box — the stock is a path on the cut line, the artwork is clipped to it.
      for (const [, width] of svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)) {
        expect(Number(width), `${mood}: a rect covers the board area`).toBeLessThan(padded - 0.01)
      }
      expect(svg, `${mood}: stock is not on the cut line`).toMatch(/<path d="M[^"]+" fill="#/)
    }
  })

  it('the hairline that marks the cut is the same on every mood and palette', () => {
    const edges = (['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful'] as StyleType[]).map(
      (mood) => EDGE.exec(render(mood).svg)?.[1],
    )
    expect(new Set(edges).size, `edges: ${edges.join(', ')}`).toBe(1)
    expect(edges[0]).toBeTruthy()
  })

  it('the hairline is not one of the design’s own colours', () => {
    for (const mood of ['luxury', 'playful'] as StyleType[]) {
      const { spec, svg } = render(mood)
      const edge = EDGE.exec(svg)![1].toLowerCase()
      const own = [spec.palette.bg, spec.palette.paper, spec.palette.accent, spec.palette.fg].map((hex) => hex.toLowerCase())
      expect(own, `${mood} leaked a design colour onto the hairline (${edge})`).not.toContain(edge)
    }
  })

  it('two very different briefs are marked the same way', () => {
    const a = render('luxury', 'siyah · altın')
    const b = render('playful', 'pembe · mor')
    expect(EDGE.exec(a.svg)?.[1]).toBe(EDGE.exec(b.svg)?.[1])
    // ...and the two designs themselves are genuinely different, so the check above is meaningful.
    expect(a.spec.palette.bg).not.toBe(b.spec.palette.bg)
  })

  it('a round label gets a round stock and a round hairline — no card behind it', () => {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: labelBrief('luxury', 'krem · altın', { templateId: 'fm-label-oval', dimensionsMm: { L: 70, W: 0, H: 45 } }),
      overridePatch: { studio: true, variationIndex: 0 },
    })
    for (const face of ['front', 'back'] as const) {
      const panelId = facePanelId(spec.dieline, spec.artwork, face)!
      const svg = renderPanelSvg(spec.dieline, spec.artwork, panelId, spec.palette, { pad: PREVIEW_PAD })
      // The rim is sampled into many points, so both paths carry far more than a rectangle's four.
      const stock = /<path d="(M[^"]+)" fill="#/.exec(svg)?.[1] ?? ''
      expect(stock.split(' L').length, `${face}: stock is a rectangle behind a round label`).toBeGreaterThan(8)
      const edgePath = /<path d="(M[^"]+)" fill="none" stroke=/.exec(svg)?.[1] ?? ''
      expect(edgePath.split(' L').length, `${face}: hairline is a rectangle around a round label`).toBeGreaterThan(8)
      expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
    }
  })

  it('the padding is only the room the hairline needs', () => {
    // 6 mm was sized for the board; with the board gone the artwork should own its slot.
    expect(PREVIEW_PAD).toBeLessThanOrEqual(2)
  })

  it('an unpadded panel gets no hairline — it is the surface itself', () => {
    // `Preview3D` and `BottlePreview` map panels straight onto geometry at pad 0. A hairline drawn
    // there would show up as a border wrapped around the box face.
    const { spec } = render('luxury')
    const panelId = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')!
    const flush = renderPanelSvg(spec.dieline, spec.artwork, panelId, spec.palette, { pad: 0 })
    expect(flush).not.toMatch(EDGE)
    expect(/<path d="M[^"]+" fill="(#[0-9a-f]{6})"/i.exec(flush)?.[1]?.toLowerCase()).toBe(spec.palette.paper.toLowerCase())
  })
})
