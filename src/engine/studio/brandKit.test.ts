/**
 * Swing tag and thank-you card — the pieces that turn a design into a brand kit.
 *
 * Two things had to be learned the hard way here, and both are about a piece that travels as
 * `label` without being one.
 *
 * The gates identified the regulatory back by the literal id `labelBack`, so every kit piece
 * failed three separate checks at once — no back label, a food family with no nutrition table, and
 * a perfume mark "on a face" that was actually on the tag's back. All eight sample pieces were
 * blocked from export while reporting zero collisions, which is the worst kind of failure: green
 * everywhere the engine looks and unusable at the end.
 *
 * And the structure recommender ranks mainly on shape, so a 90×55 card scored 0.72 against a 90×70
 * perfume wrap and pushed `flat-label` to third. Narrowing its sub-products made it worse — the tag
 * fell to 0.66 even when asked for by name. A tag is not an alternative to a label, it is an
 * addition to one, so it stays out of the pool until the brief says the word.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { buildDieline } from '../dieline/buildDieline'
import { recommendStructures } from '../catalog/structureRecommend'

type Job = { brand: string; product: string; sector: string; sub: string; colors: string; style: StyleType }

const JOBS: Job[] = [
  { brand: 'Köyden', product: 'Naturel Sızma', sector: 'gıda', sub: 'zeytinyağı', colors: 'koyu yeşil · altın', style: 'eco' },
  { brand: 'Noctis', product: 'Gece', sector: 'kozmetik', sub: 'parfüm', colors: 'siyah · altın', style: 'luxury' },
  { brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', sub: 'krem', colors: 'yeşil · krem', style: 'eco' },
  { brand: 'Yayla', product: 'Çiçek Balı', sector: 'gıda', sub: 'bal', colors: 'altın · sıcak', style: 'classic' },
]

const PIECES = [
  { templateId: 'fm-kit-hangtag', dims: { L: 38, W: 0, H: 76 }, front: 'tag', structure: 'hang-tag' },
  { templateId: 'fm-kit-card', dims: { L: 90, W: 0, H: 55 }, front: 'card', structure: 'insert-card' },
] as const

function piece(job: Job, spec: (typeof PIECES)[number]) {
  resetArtMemory()
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.sub,
    packagingMode: 'label',
    templateId: spec.templateId,
    styleType: job.style,
    colors: job.colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: spec.dims,
  }
  const design = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const report = design.studio!.panels?.find((p) => p.panelId === design.artwork.frontPanelId)
  return {
    design,
    markup: String(design.artwork.layers.find((l) => l.panelId === design.artwork.frontPanelId)?.markup ?? ''),
    hits: (report?.collisions.length ?? 0) + (report?.outOfBounds.length ?? 0),
    exportOk: Boolean(buildCombinedSvg(design)),
  }
}

describe('brand kit', () => {
  it('the tag is punched, and the punch is a separate cut', () => {
    // The knife has to lift for a hole, so it cannot be part of the outline.
    const model = buildDieline('hang-tag', { ...emptyBrief(), dimensionsMm: { L: 38, W: 0, H: 76 } })
    expect(model.panels.map((p) => p.id)).toEqual(['tag', 'tagBack'])
    expect(model.cut.length, 'outline and punch per face').toBe(4)
    const tag = model.panels[0]
    // Two of the four paths are small closed loops well inside the outline — the punches.
    const punches = model.cut.filter((path) => path.length === 36)
    expect(punches.length).toBe(2)
    for (const punch of punches) {
      const xs = punch.map((p) => p.x)
      const ys = punch.map((p) => p.y)
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(tag.w * 0.2)
      expect(Math.min(...ys)).toBeGreaterThan(0)
    }
  })

  it('every piece paints clean and actually exports', () => {
    /*
     * The assertion that would have caught the gate problem. Zero collisions was already true while
     * all eight pieces were blocked — `exportOk` is the only thing that spans the gates.
     */
    for (const job of JOBS) {
      for (const spec of PIECES) {
        const row = piece(job, spec)
        expect(row.design.dieline.structureId, `${job.brand} ${spec.structure}`).toBe(spec.structure)
        expect(row.hits, `${job.brand} ${spec.structure}: ledger`).toBe(0)
        expect(row.exportOk, `${job.brand} ${spec.structure}: export blocked`).toBe(true)
        expect(row.markup, `${job.brand} ${spec.structure}: no brand`).toContain('data-edit="brand"')
      }
    }
  })

  it('a tag carries a name, not a regulatory back', () => {
    /*
     * Measured before this was written: a 38 × 76 mm tag was handed to `paintLabelBack` and came
     * back with a nutrition table, ingredients, warnings, pictograms and a barcode — thirty-two
     * elements, all of them fitting, so the ledger called it clean. Fitting was never the question.
     */
    const tag = piece(JOBS[0], PIECES[0])
    expect(tag.markup).not.toContain('data-art="barcode"')
    expect(tag.markup).not.toContain('data-art="legal-column"')

    const back = String(tag.design.artwork.layers.find((l) => l.panelId === 'tagBack')?.markup ?? '')
    expect(back, 'the tag back drew nothing').toContain('data-art')
    for (const forbidden of ['data-art="barcode"', 'data-art="legal-column"', 'data-edit="ingredients"', 'data-edit="warnings"']) {
      expect(back, `a swing tag back is carrying ${forbidden}`).not.toContain(forbidden)
    }
    const placed = tag.design.studio!.panels?.find((p) => p.panelId === 'tagBack')?.placed ?? []
    expect(placed.length, `a tag back with ${placed.length} elements is a label, not a tag`).toBeLessThan(10)
  })

  it('stays out of the way until the customer asks for it', () => {
    const plain = recommendStructures({
      ...emptyBrief(),
      packagingMode: 'label',
      sector: 'parfüm',
      dimensionsMm: { L: 90, W: 0, H: 70 },
    })
    const kit = ['hang-tag', 'insert-card']
    expect(
      plain.candidates.every((row) => !kit.includes(row.structureId)),
      `a plain label brief was offered ${plain.candidates.map((r) => r.structureId).join(', ')}`,
    ).toBe(true)

    const asked = recommendStructures({
      ...emptyBrief(),
      packagingMode: 'label',
      sector: 'kozmetik',
      subProduct: 'askı etiketi',
      dimensionsMm: { L: 38, W: 0, H: 76 },
    })
    expect(asked.candidates[0]?.structureId, 'asked for a swing tag and did not get one').toBe('hang-tag')
  })
})
