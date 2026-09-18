/**
 * `round-label` — the jar lid, and the two ways a disc punishes a rectangular layout.
 *
 * The first is geometry. A layout that sizes lines against the bounding box will print over the
 * knife near the top and bottom, where the chord is barely half the width: measured on a 60 mm lid
 * the net quantity was placed 5 mm from the edge against a 60 mm width, where the real chord is
 * 33 mm. It fitted only because the copy happened to be short.
 *
 * The second is contrast, and the first explanation for it was wrong. A 45 mm clinical lid came
 * back with the brand, the product and the net quantity all recorded in the ledger, zero
 * collisions, export green — and blank to the eye. The obvious fix was `readableInk`, which every
 * other painter here uses; measured, it returned the ink *unchanged* at 13.92:1, because the ink
 * was never the problem. The type was fine against `palette.ground` and invisible against the wave
 * field painted over it, and nothing at palette level can see what a background painter puts down.
 *
 * So the guard is structural rather than predictive: a medallion under the lockup, which is both
 * what makes the contrast knowable and what a lid label has always looked like.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { buildDieline } from '../dieline/buildDieline'
import { contrastRatio } from './color'
import { isDisc } from './layoutContext'

type Job = { brand: string; product: string; sector: string; sub: string; colors: string; style: StyleType }

const JOBS: Job[] = [
  { brand: 'Verda', product: 'Aloe Balm', sector: 'kozmetik', sub: 'balm', colors: 'yeşil · krem', style: 'eco' },
  { brand: 'Noctis', product: 'Gece', sector: 'kozmetik', sub: 'krem', colors: 'siyah · altın', style: 'luxury' },
  { brand: 'Yayla', product: 'Çiçek Balı', sector: 'gıda', sub: 'reçel', colors: 'altın · sıcak', style: 'classic' },
  { brand: 'Clinia', product: 'B5', sector: 'kozmetik', sub: 'krem', colors: 'beyaz · mavi', style: 'minimal' },
  { brand: 'Uzunca Marka Adı', product: 'Yoğun Onarıcı Merhem', sector: 'sağlık', sub: 'merhem', colors: '', style: 'minimal' },
]

const DIAMETERS = [40, 50, 60, 80]

function face(job: Job, dia: number) {
  resetArtMemory()
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.sub,
    packagingMode: 'label',
    templateId: 'fm-lid-round',
    styleType: job.style,
    colors: job.colors,
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: dia, W: dia, H: 0 },
  }
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const panelId = spec.artwork.frontPanelId
  const report = spec.studio!.panels?.find((p) => p.panelId === panelId)
  return {
    spec,
    panel: spec.dieline.panels.find((p) => p.id === panelId)!,
    placed: report?.placed ?? [],
    hits: (report?.collisions.length ?? 0) + (report?.outOfBounds.length ?? 0),
    markup: String(spec.artwork.layers.find((l) => l.panelId === panelId)?.markup ?? ''),
    direction: spec.studio!.direction,
    exportOk: Boolean(buildCombinedSvg(spec)),
  }
}

describe('round-label', () => {
  it('builds a disc, not a square', () => {
    const model = buildDieline('round-label', { ...emptyBrief(), dimensionsMm: { L: 60, W: 60, H: 0 } })
    expect(model.structureId).toBe('round-label')
    for (const panel of model.panels) {
      expect(isDisc(panel), `${panel.id} is not round`).toBe(true)
      expect(panel.polygon.length).toBeGreaterThan(8)
      // Every sampled point sits on the rim, which is what the knife will follow.
      const r = panel.w / 2
      for (const pt of panel.polygon) {
        expect(Math.hypot(pt.x - (panel.x + r), pt.y - (panel.y + r))).toBeCloseTo(r, 4)
      }
    }
  })

  it('keeps every element inside the circle, not merely inside the box', () => {
    /*
     * The assertion a rectangular layout fails. Each recorded box is checked at its four corners
     * against the disc — a line can sit comfortably within `w` and still cross the cut, and only
     * this catches it.
     */
    for (const job of JOBS) {
      for (const dia of DIAMETERS) {
        const row = face(job, dia)
        const r = row.panel.w / 2
        for (const b of row.placed) {
          if (b.kind === 'ground' || b.id.startsWith('wreath')) continue
          for (const [x, y] of [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x, b.y + b.h],
            [b.x + b.w, b.y + b.h],
          ]) {
            expect(
              Math.hypot(x - r, y - r),
              `${job.brand} Ø${dia}: ${b.id} crosses the cut line`,
            ).toBeLessThanOrEqual(r + 0.25)
          }
        }
      }
    }
  })

  it('prints type the eye can actually find', () => {
    /*
     * The blank-lid defect, and the reason this assertion is written against the medallion rather
     * than against `palette.ground`.
     *
     * The first version of this test compared the brand fill to the ground and passed even with the
     * bug reinstated — measured 13.92:1, because the ink *was* fine against the ground. What it was
     * not fine against was the wave background painted over that ground, and no palette-level check
     * can see what a painter puts down. The medallion is what makes the question answerable: it is
     * a known fill directly under the type, so the contrast can be measured rather than assumed.
     */
    for (const job of JOBS) {
      for (const dia of DIAMETERS) {
        const row = face(job, dia)
        const card = row.direction.palette.card
        expect(row.markup, `${job.brand} Ø${dia}: no medallion under the lockup`).toContain(`fill="${card}"`)
        const inks = [...row.markup.matchAll(/data-edit="brand"[\s\S]{0,400}?fill="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1])
        expect(inks.length, `${job.brand} Ø${dia}: no brand drawn`).toBeGreaterThan(0)
        for (const hex of inks) {
          expect(
            contrastRatio(hex, card),
            `${job.brand} Ø${dia}: brand ${hex} vanishes into the medallion`,
          ).toBeGreaterThan(4)
        }
      }
    }
  })

  it('stays clean and exports at every diameter', () => {
    let hits = 0
    let failures = 0
    for (const job of JOBS) {
      for (const dia of DIAMETERS) {
        const row = face(job, dia)
        hits += row.hits
        if (!row.exportOk) failures += 1
      }
    }
    expect(hits, 'ledger hits').toBe(0)
    expect(failures, 'export failures').toBe(0)
  })

  it('offers the disc where a disc belongs and not where it does not', () => {
    // Measured: a 60×60 balm tin ranks it first at 0.85; a 90×70 perfume wrap ranks it last.
    // Both matter — a format that is never offered is dead, and one always offered is noise.
    const balm = face(JOBS[0], 60)
    expect(balm.spec.dieline.structureId).toBe('round-label')
  })
})
