/**
 * `focal` has to be a reading, not a constant.
 *
 * Measured across 558 faces it took three values and sat on 45 for 49% of them. The cause was not
 * the threshold: `focalRatio` took the largest `element`/`container` box in the ledger whatever it
 * was, and on 163 faces that was the brand mark at 2.9% of the panel — under the 0.06 band, so the
 * reading said "the focal element is tiny" about faces whose design is their field.
 *
 * These tests pin the distinction the fix rests on: the ledger id says what a box *is*, and only
 * the ids that can carry a composition are focal candidates. Furniture — marks, chips, pictograms
 * — must not answer the question at all.
 */
import { describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { STUDIO_GALLERY_JOBS } from '../studio/studioGalleryJobs'
import type { StudioReport } from '../studio/types'
import { resetArtMemory } from './DesignMemory'
import { scoreVisualCraft } from './scoreVisualCraft'

function specOf(slug: string): DesignSpec {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug) ?? STUDIO_GALLERY_JOBS[0]!
  resetArtMemory()
  return new FormaLocalEngine().generate({
    brief: {
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
      barcode: '8690000000017',
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
}

const base = specOf(STUDIO_GALLERY_JOBS[0]!.slug)

/** Re-score with one box of the given id covering `ratio` of the front panel. */
function withBox(spec: DesignSpec, id: string, ratio: number): number {
  const frontId = spec.artwork.frontPanelId
  const panel = spec.dieline.panels.find((p) => p.id === frontId)!
  const side = Math.sqrt(panel.w * panel.h * ratio)
  const studio = JSON.parse(JSON.stringify(spec.studio)) as StudioReport
  const target = studio.panels.find((p) => p.panelId === frontId)
  target?.placed.push({ id, x: 0, y: 0, w: side, h: side, kind: 'element' })
  const card = scoreVisualCraft(
    {
      artwork: spec.artwork,
      preflight: spec.preflight,
      copy: spec.copy,
      kind: spec.kind,
      studio,
      brief: { colors: spec.brief.colors },
      dieline: spec.dieline,
    },
    spec.designPlan!,
  )
  return card.focal!
}

describe('what the ledger id says the box is', () => {
  it('a brand mark is never the focal, however large the ledger claims it is', () => {
    /*
     * The regression this guards: a 30% brand mark reading as a healthy focal. The mark is
     * furniture — `studioHero` is where a mark-led archetype is judged — so the face must still be
     * read by its field, not by the mark.
     */
    const asFurniture = withBox(base, 'brand-mark', 0.3)
    const asCarrier = withBox(base, 'specimen', 0.3)
    expect(asCarrier, 'specimen 0.30').toBe(85)
    expect(asFurniture, 'brand-mark 0.30').not.toBe(85)
    expect(asFurniture).toBe(base.craftScore!.focal)
  })

  it('a chip and a pictogram are furniture too', () => {
    for (const id of ['chip', 'picto-recycle', 'benefit-leaf', 'medallion']) {
      expect(withBox(base, id, 0.3), id).toBe(base.craftScore!.focal)
    }
  })

  it('every composition carrier answers the question', () => {
    for (const id of ['specimen', 'title-card', 'window', 'plate', 'inner-card', 'roundel']) {
      expect(withBox(base, id, 0.2), id).toBe(85)
    }
  })
})

describe('the bands are contiguous', () => {
  it('a carrier just over the healthy band reads as too large, not as too small', () => {
    // 0.55–0.60 used to fall past both tests into the `r > 0` branch and score 45.
    expect(withBox(base, 'specimen', 0.57)).toBe(40)
    expect(withBox(base, 'specimen', 0.7)).toBe(40)
  })

  it('a carrier under the band still reports as a tiny focal', () => {
    expect(withBox(base, 'specimen', 0.02)).toBe(45)
  })
})

describe('the signal steers, but only where nobody chose the direction', () => {
  it('a weak reading on a sector default is routed', async () => {
    /*
     * Phase 1.5 calibrated `focal` and left it inert; 2F measured what happens when it routes
     * (16 of 216 faces re-rolled, craft 74.8 → 75.0, focal 58.9 → 60.9) and 2G-A made it safe by
     * carrying `archetypePin` onto the direction.
     */
    const repair = await import('../studio/studioRepair')
    expect(repair.needsCraftRoute({ visualCraft: 95, hero: 95 })).toBe(false)
    expect(repair.needsCraftRoute({ visualCraft: 95, hero: 95, repairSignals: [{ axis: 'focal', score: 35 }] })).toBe(true)
    expect(
      repair.needsCraftRoute({ visualCraft: 95, hero: 95, repairSignals: [{ axis: 'focal', score: 35 }], archetypePin: 'sector' }),
    ).toBe(true)
  })

  it('and a direction somebody asked for is left alone', async () => {
    const repair = await import('../studio/studioRepair')
    for (const pin of ['visual', 'user', 'family', 'llm'] as const) {
      expect(
        repair.needsCraftRoute({ visualCraft: 95, hero: 95, repairSignals: [{ axis: 'focal', score: 35 }], archetypePin: pin }),
        pin,
      ).toBe(false)
    }
  })
})
