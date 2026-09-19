/**
 * Every label format, both faces, inside its own cut.
 *
 * The disc landed with a test that swept five briefs across four diameters — and only ever looked
 * at `frontPanelId`. The back was never measured, so `paintLabelBack` kept laying the regulatory
 * panel out against the bounding box on a shape that has no corners. Measured when the owner
 * reported it: seven recorded corners outside the cut on a 60 mm lid and five on a 70 × 45 oval,
 * the barcode worst at 117 % and 121 % of the radius — ink past the knife on a production file.
 *
 * The lesson is the sweep, not the painter: a format is not covered until *both* of its faces are.
 * This walks every active label structure and checks front and back together.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { activeTemplates } from '../catalog/catalog'
import { isRound } from './layoutContext'

type Job = { name: string; sector: string; subProduct: string; colors: string; style: DesignBrief['styleType'] }

/** Two sectors, because food drags in the nutrition table and its own gate. */
const JOBS: Job[] = [
  { name: 'Diako', sector: 'kozmetik', subProduct: 'parfüm', colors: 'krem · altın', style: 'luxury' },
  { name: 'Ege', sector: 'gıda', subProduct: 'zeytinyağı', colors: 'zeytin · krem', style: 'classic' },
]

const LABEL_TEMPLATES = activeTemplates(true).filter((t) => t.packagingMode === 'label')

/** Only pair a template with a sector it declares — an olive oil on a device label is not a design the catalog would ever offer. */
function jobsFor(template: (typeof LABEL_TEMPLATES)[number]): Job[] {
  const matched = JOBS.filter((job) => template.sectors.includes(job.sector))
  return matched.length ? matched : [JOBS[0]]
}

/**
 * Containment against the panel's own polygon, whatever shape it is.
 *
 * The first version assumed an ellipse whenever `isRound` was true, but that only means "sampled
 * into more than eight points" — it is also true of the hang tag's rounded rectangle, which then
 * failed against ellipse math that did not describe it. Ray casting plus a distance check works
 * for a rectangle, a rounded rectangle, a disc and an oval alike.
 */
function outsideBy(point: { x: number; y: number }, polygon: { x: number; y: number }[]): number {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  if (inside) return 0
  let best = Infinity
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = dx * dx + dy * dy
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len))
    best = Math.min(best, Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy)))
  }
  return best
}

function generate(job: Job, templateId: string, dimensionsMm: DesignBrief['dimensionsMm']) {
  resetArtMemory()
  return new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: job.name,
      productName: 'Erken Hasat',
      sector: job.sector,
      subProduct: job.subProduct,
      packagingMode: 'label',
      templateId,
      styleType: job.style,
      colors: job.colors,
      volume: '50 ml',
      barcode: '8690000000017',
      dimensionsMm,
    },
    overridePatch: { studio: true, variationIndex: 0 },
  })
}

describe('label formats — every face inside its own cut', () => {
  it('has label formats to sweep', () => {
    expect(LABEL_TEMPLATES.length).toBeGreaterThan(3)
  })

  for (const template of LABEL_TEMPLATES) {
    for (const job of jobsFor(template)) {
      it(`${template.id} · ${job.sector}: nothing crosses the knife, and it exports`, () => {
        const spec = generate(job, template.id, template.defaultsMm)
        for (const panel of spec.dieline.panels) {
          const report = spec.studio!.panels?.find((p) => p.panelId === panel.id)
          // A four-point panel is its own bounding box; the ledger already bounds-checks those.
          if (!report || !isRound(panel)) continue
          const local = panel.polygon.map((p) => ({ x: p.x - panel.x, y: p.y - panel.y }))
          for (const box of report.placed) {
            // `ground` fills the panel by design; the wreath and the tag sprig are clipped to the rim by their painters.
            if (box.kind === 'ground' || box.id.startsWith('wreath') || box.id.startsWith('tag-sprig')) continue
            for (const [x, y] of [
              [box.x, box.y],
              [box.x + box.w, box.y],
              [box.x, box.y + box.h],
              [box.x + box.w, box.y + box.h],
            ]) {
              expect(
                outsideBy({ x, y }, local),
                `${template.id} ${job.sector} ${panel.id}: ${box.id} crosses the cut`,
              ).toBeLessThanOrEqual(0.25)
            }
          }
        }
        expect(spec.studio!.collisions, `${template.id}: collisions`).toEqual([])
        expect(spec.studio!.outOfBounds, `${template.id}: out of bounds`).toEqual([])
        expect(Boolean(buildCombinedSvg(spec)), `${template.id}: export blocked`).toBe(true)
      })
    }
  }
})

describe('the round back is its own composition', () => {
  const round = generate(JOBS[0], 'fm-lid-round', { L: 60, W: 60, H: 0 })
  const backId = round.dieline.panels.find((p) => p.id === 'labelBack')!.id
  const markup = String(round.artwork.layers.find((l) => l.panelId === backId)?.markup ?? '')

  it('carries the product, the marks and the net quantity', () => {
    expect(markup).toContain('data-edit="product"')
    expect(markup).toMatch(/data-mark="barcode"/)
    expect(markup).toContain('data-art="net-quantity"')
  })

  it('wears the same rim as the front, so the pair reads as one label', () => {
    const frontId = round.artwork.frontPanelId
    const front = String(round.artwork.layers.find((l) => l.panelId === frontId)?.markup ?? '')
    for (const face of [front, markup]) expect(face).toMatch(/<(circle|ellipse)[^>]*fill="none"/)
  })

  it('a food disc draws a whole declaration or none, and says which', () => {
    /*
     * This used to assert the disc shows a table, because the table used to be truncated to fit —
     * and on an oil that dropped **Doymuş yağ**, the one row an oil is required to declare. A
     * partial nutrition table looks like a declaration and is not one.
     *
     * Measured: a complete set needs 18.2 mm at the press floor; a 60 mm lid's legal band is
     * 12–16 mm. So the honest outcome on a small disc is no table, plus a preflight line telling
     * the customer to put the full set on the body label — which is where real products carry it.
     */
    const food = generate(JOBS[1], 'fm-lid-round', { L: 60, W: 60, H: 0 })
    const id = food.dieline.panels.find((p) => p.id === 'labelBack')!.id
    const back = String(food.artwork.layers.find((l) => l.panelId === id)?.markup ?? '')
    const rows = [...back.matchAll(/>(Enerji|Yağ|Doymuş[^<]*|Karbonhidrat|Şeker|Protein|Tuz)</g)].length
    if (/Besin Değerleri/.test(back)) {
      // Drawn at all → drawn whole. An oil must carry its saturates row.
      expect(rows, 'beyan kırpılmış').toBeGreaterThanOrEqual(5)
      expect(back, 'yağda doymuş yağ satırı yok').toMatch(/Doymuş/)
    } else {
      expect(rows, 'tablo yok ama satır var').toBe(0)
      const fit = food.preflight.items.find((i) => i.id === 'ds-nutrition-fit')
      expect(fit?.status, 'sığmayan beyan sessizce düştü').toBe('warn')
    }
    expect(food.preflight.blocking).toBe(false)
  })
})
