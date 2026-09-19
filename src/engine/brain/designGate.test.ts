/**
 * The design gate: the facts that stop a face, separate from the score that grades it.
 *
 * Phase 1 was specified as a craft-score floor. Measuring 216 faces killed it — the distribution
 * runs 71–78, so no floor blocks anything, and the face the owner rejected by eye scored 71. What
 * replaced it is three yes/no promises, each already detected and previously thrown away as prose.
 *
 * Every test below takes a real generated face and breaks exactly one promise the way the engine
 * could break it in a regression — swap the brand and product sizes in the ledger, remove the frame
 * the direction chose, take the nutrition table off a food back — and asserts the gate closes. The
 * clean case asserts the opposite on all eighteen frozen faces: measured before this shipped, the
 * gate blocks nothing that exists today.
 */
import { describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { STUDIO_GALLERY_JOBS, type StudioGalleryJob } from '../studio/studioGalleryJobs'
import { STUDIO_CRAFT_FLOOR, craftRouteImproves, needsCraftRoute } from '../studio/studioRepair'
import type { StudioReport } from '../studio/types'
import { resetArtMemory } from './DesignMemory'
import { scoreVisualCraft, type VisualCraftScorecard } from './scoreVisualCraft'

function generate(job: StudioGalleryJob): DesignSpec {
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

const cache = new Map<string, DesignSpec>()
function specOf(slug: string): DesignSpec {
  let spec = cache.get(slug)
  if (!spec) {
    const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug)
    if (!job) throw new Error(`no gallery job ${slug}`)
    spec = generate(job)
    cache.set(slug, spec)
  }
  return spec
}

const allGoldens = (): DesignSpec[] => STUDIO_GALLERY_JOBS.map((j) => specOf(j.slug))

function firstWhere(pred: (spec: DesignSpec) => boolean, what: string): DesignSpec {
  const hit = allGoldens().find(pred)
  if (!hit) throw new Error(`no frozen face ${what}`)
  return hit
}

/** Re-score the same design with the front markup and/or the ledger changed. */
function rescore(
  spec: DesignSpec,
  patch: { markup?: (m: string) => string; back?: (m: string) => string; studio?: (s: StudioReport) => StudioReport },
): VisualCraftScorecard {
  const backId = spec.artwork.layers.find((l) => /back/i.test(l.panelId))?.panelId
  const layers = spec.artwork.layers.map((l) => {
    if (patch.markup && l.panelId === spec.artwork.frontPanelId) return { ...l, markup: patch.markup(l.markup) }
    if (patch.back && l.panelId === backId) return { ...l, markup: patch.back(l.markup) }
    return l
  })
  const studio = patch.studio ? patch.studio(JSON.parse(JSON.stringify(spec.studio)) as StudioReport) : spec.studio
  return scoreVisualCraft(
    {
      artwork: { ...spec.artwork, layers },
      preflight: spec.preflight,
      copy: spec.copy,
      kind: spec.kind,
      studio,
      brief: { colors: spec.brief.colors },
      dieline: spec.dieline,
    },
    spec.designPlan!,
  )
}

const ids = (card: VisualCraftScorecard): string[] => card.blockers.map((b) => b.id)

describe('D — a clean design passes the design gate', () => {
  it('every frozen face carries no blocker and is allowed to export', () => {
    for (const spec of allGoldens()) {
      const card = spec.craftScore!
      expect(card.blockers, spec.copy.brand).toEqual([])
      expect(card.exportAllowed, spec.copy.brand).toBe(true)
    }
  })
})

describe('B — the brand leads when the direction says it leads', () => {
  it('a product title bigger than the brand on a display line closes the gate', () => {
    const spec = firstWhere((s) => s.studio?.direction.lockup === 'stacked-center', 'on a stacked-center lockup')
    const clean = rescore(spec, {})
    expect(clean.blockers).toEqual([])

    // The ledger is what the scorer reads; make the product out-measure the brand.
    const card = rescore(spec, {
      studio: (s) => {
        for (const panel of s.panels) {
          const brand = panel.placed.find((b) => b.id.split('#')[0] === 'brand')
          const product = panel.placed.find((b) => b.id.split('#')[0] === 'product')
          if (brand?.sizeMm && product?.sizeMm) product.sizeMm = brand.sizeMm * 1.4
        }
        return s
      },
    })
    expect(ids(card)).toContain('HIERARCHY_VIOLATION')
    expect(card.exportAllowed).toBe(false)
    expect(card.blockers[0]!.reason).toMatch(/ürün adı markadan büyük/i)
  })
})

describe('C — a frame the direction chose has to be on the page', () => {
  it('removing the drawn frame closes the gate', () => {
    const spec = firstWhere((s) => (s.studio?.direction.frame ?? 'none') !== 'none', 'with a frame')
    expect(rescore(spec, {}).blockers).toEqual([])

    const card = rescore(spec, { markup: (m) => m.replace(/ data-frame="[a-z-]+"/g, '') })
    expect(ids(card)).toContain('DESIGN_CONTRACT_FRAME')
    expect(card.exportAllowed).toBe(false)
  })

  it('the painter that owns the geometry declares the frame it drew', () => {
    /*
     * `paintFrame` leaves `rounded-card` and `corner-brackets` to the painter that owns the
     * lockup. Those painters used to draw them without saying so, and the decoration reading
     * reported "çerçeve seçildi, çizilmedi" on 29 faces that were carrying the frame all along.
     */
    for (const spec of allGoldens()) {
      const frame = spec.studio?.direction.frame
      if (frame !== 'rounded-card' && frame !== 'corner-brackets') continue
      const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)!.markup
      expect(front, `${spec.copy.brand} · ${frame}`).toContain(`data-frame="${frame}"`)
    }
  })
})

describe('B2 — line-scene keeps the hierarchy its own DNA declares', () => {
  /*
   * No frozen face paints `line-scene`, so the golden set never covered it — and all 25 hierarchy
   * violations in the engine were this one painter. Its DNA declares `lockup: 'stacked-center'`,
   * a display line, brand first; the painter drew the brand at a 4.4 mm ceiling and the two-tone
   * title at 7.5 mm, so the brand could never lead. Pinned here because the sweep is the only
   * other place it appears.
   */
  const lineSceneLabel = (): DesignSpec => {
    resetArtMemory()
    return new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        // A short product word reaches the title ceiling; a long one shrinks to fit and hides the fault.
        brandName: 'Dermavia',
        productName: 'Serum',
        sector: 'sağlık',
        subProduct: 'serum',
        packagingMode: 'label',
        templateId: 'fm-label-universal',
        styleType: 'minimal',
        volume: '30 ml',
        dimensionsMm: { L: 70, W: 0, H: 90 },
        barcode: '8690000000017',
        studioRepertoire: 'studio',
        studioFamily: 'line-scene',
        studioFamilyLocked: true,
      },
      overridePatch: { studio: true, variationIndex: 0 },
    })
  }

  it('the brand is drawn at least as large as the product, and the gate stays open', () => {
    const spec = lineSceneLabel()
    expect(spec.studio?.direction.archetype).toBe('line-scene')
    const placed = spec.studio!.panels.flatMap((p) => p.placed)
    const brand = placed.find((b) => b.id.split('#')[0] === 'brand' && (b.sizeMm ?? 0) > 0)
    const product = placed.find((b) => b.id.split('#')[0] === 'product' && (b.sizeMm ?? 0) > 0)
    expect(brand?.sizeMm, 'brand drawn').toBeGreaterThan(0)
    expect(product?.sizeMm, 'product drawn').toBeGreaterThan(0)
    expect(brand!.sizeMm!).toBeGreaterThanOrEqual(product!.sizeMm!)
    expect(ids(spec.craftScore!)).not.toContain('HIERARCHY_VIOLATION')
    expect(spec.craftScore!.exportAllowed).toBe(true)
  })
})

describe('G — a food back reports its nutrition, and does not gate on it', () => {
  it('the real mixed-case header counts', () => {
    /*
     * The detector used to demand `BESİN DEĞERLERİ`, the spelling of the kit renderer F-37
     * retired. The studio writes `Besin Değerleri (100 g için)`, so every food back in the engine
     * — 100 faces, four of them frozen goldens — reported its table missing.
     */
    const spec = firstWhere((s) => s.designPlan?.sector === 'food', 'in the food sector')
    expect(rescore(spec, {}).blockers).toEqual([])
    expect(rescore(spec, {}).notes.join(' ')).not.toMatch(/nutrition yok/)
  })

  it('a missing table is a note, because the engine has a reason to omit one', () => {
    /*
     * Phase 1 made this a hard blocker on 558 faces that all had room. A 60 mm lid does not:
     * a complete declaration needs 18.2 mm against a 12–16 mm legal band, so `nutritionTable`
     * draws nothing and `ds-nutrition-fit` tells the customer to use the body label. Blocking
     * export for that repeats the mistake F-42 corrected — measured at 8 catalogue designs — and
     * nothing here can tell "too small" from "the renderer broke". Reported, not enforced.
     */
    const spec = firstWhere((s) => s.designPlan?.sector === 'food', 'in the food sector')
    const card = rescore(spec, { back: (m) => m.replace(/Besin Değerleri|Nutrition Facts/g, '—') })
    expect(card.notes.join(' ')).toMatch(/nutrition yok/)
    expect(ids(card)).not.toContain('REQUIRED_INFO_MISSING')
    expect(card.exportAllowed).toBe(true)
  })
})

describe('A + E — a blocker routes the face, and the route stays bounded', () => {
  it('a broken promise sends the face to the repair route even when every number reads well', () => {
    const perfect = { visualCraft: 95, hero: 95 }
    expect(needsCraftRoute(perfect)).toBe(false)
    expect(needsCraftRoute({ ...perfect, blockers: [{ id: 'HIERARCHY_VIOLATION' }] })).toBe(true)
  })

  it('an alternative is kept only when it actually keeps the promise', () => {
    const routed = { visualCraft: 74, hero: 80, blockers: [{ id: 'DESIGN_CONTRACT_FRAME' }] }
    // Still broken — a swap is not a repair.
    expect(craftRouteImproves(routed, { visualCraft: 90, hero: 90, blockers: [{ id: 'DESIGN_CONTRACT_FRAME' }] })).toBe(false)
    // Traded the promise for a collapsed face — also not a repair.
    expect(craftRouteImproves(routed, { visualCraft: STUDIO_CRAFT_FLOOR - 1, hero: 90, blockers: [] })).toBe(false)
    // Keeps the promise and holds the floor.
    expect(craftRouteImproves(routed, { visualCraft: 74, hero: 80, blockers: [] })).toBe(true)
  })
})

describe('the repair signals are reported but do not steer yet', () => {
  it('every studio face carries the three excluded readings', () => {
    const spec = allGoldens()[0]!
    const card = spec.craftScore!
    expect(card.focal).toBeTypeOf('number')
    expect(card.categoryFit).toBeTypeOf('number')
    expect(Array.isArray(card.repairSignals)).toBe(true)
  })

  it('a signal is not a blocker — it never closes the gate on its own', () => {
    /*
     * Measured on the 216-face sweep: 178 faces (82%) carry a repair signal, and `focal` sits at
     * a constant 45 for more than half of them. A reading that fires on four faces in five is not
     * a defect detector, so it reports and does not route. Fixing `studioFocal`'s calibration is
     * the prerequisite, not this gate.
     */
    for (const spec of allGoldens()) {
      const card = spec.craftScore!
      if (!card.repairSignals.length) continue
      expect(card.exportAllowed, spec.copy.brand).toBe(true)
    }
  })
})
