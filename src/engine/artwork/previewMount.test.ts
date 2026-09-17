/**
 * The preview surround belongs to the page, not to the design.
 *
 * Reported by the owner on label designs: changing the style or the mood visibly recoloured the
 * area *around* the artwork. Two places were doing it —
 *
 *   - `renderPanelSvg` filled the whole padded viewBox with `palette.paper`, so the 6 mm board the
 *     panel is shown on took the design's colour,
 *   - `BottlePreview` painted the bottle glass from `palette.paper` / `palette.muted`, so the
 *     vessel the label is mocked up on changed colour with the mood too.
 *
 * Both are misleading in the same way: they suggest the engine coloured something the customer
 * never asked it to, and when the surround and the design land on neighbouring tones, the edge of
 * the customer's own label stops being visible at all. Nothing outside the artwork may carry a
 * palette colour, and the artwork's extent must stay readable on any palette.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { renderFrontSvg, renderPanelSvg, facePanelId } from './renderArtwork'

function labelBrief(mood: StyleType, colors: string): DesignBrief {
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
  }
}

function render(mood: StyleType, colors = 'koyu yeşil · altın') {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: labelBrief(mood, colors), overridePatch: { studio: true, variationIndex: 0 } })
  return { spec, svg: renderFrontSvg(spec.dieline, spec.artwork, spec.palette) }
}

/** The mount is the first rect: it is painted before anything else, under the whole viewBox. */
function mountFill(svg: string): string | undefined {
  return /<rect[^>]*fill="([^"]+)"/.exec(svg)?.[1]
}

describe('preview surround — no design colour outside the design', () => {
  it('the mount is the same colour whatever the mood', () => {
    const fills = (['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful'] as StyleType[]).map(
      (mood) => mountFill(render(mood).svg),
    )
    expect(new Set(fills).size, `mount fills: ${fills.join(', ')}`).toBe(1)
    expect(fills[0]).toBeTruthy()
  })

  it('the mount is not any of the design’s own colours', () => {
    for (const mood of ['luxury', 'playful'] as StyleType[]) {
      const { spec, svg } = render(mood)
      const mount = mountFill(svg)!.toLowerCase()
      const own = [spec.palette.bg, spec.palette.paper, spec.palette.accent, spec.palette.fg].map((hex) => hex.toLowerCase())
      expect(own, `${mood} leaked a design colour onto the mount (${mount})`).not.toContain(mount)
    }
  })

  it('two very different briefs still sit on the same board', () => {
    const a = render('luxury', 'siyah · altın')
    const b = render('playful', 'pembe · mor')
    expect(mountFill(a.svg)).toBe(mountFill(b.svg))
    // ...and the two designs themselves are genuinely different, so the check above is meaningful.
    expect(a.spec.palette.bg).not.toBe(b.spec.palette.bg)
  })

  it('the design’s own edge is drawn, so a pale design still reads as an object', () => {
    const { svg } = render('minimal', 'beyaz · krem')
    expect(svg, 'no edge stroke on the panel').toMatch(/stroke="rgba\(20,24,28,0\.22\)"/)
  })

  it('an unpadded panel gets no mount and no edge — it is the surface itself', () => {
    // `Preview3D` and `BottlePreview` map panels straight onto geometry at pad 0. A board drawn
    // there would show up as a border wrapped around the box face.
    const { spec } = render('luxury')
    const panelId = spec.artwork.frontPanelId || facePanelId(spec.dieline, spec.artwork, 'front')!
    const flush = renderPanelSvg(spec.dieline, spec.artwork, panelId, spec.palette, { pad: 0 })
    expect(flush).not.toMatch(/stroke="rgba\(20,24,28,0\.22\)"/)
    expect(mountFill(flush)?.toLowerCase()).toBe(spec.palette.paper.toLowerCase())
  })
})
