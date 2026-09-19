/**
 * `categoryFit` and `distinctiveness` have to agree with the layers that produce them.
 *
 * Both were reported at averages of 59 and 51 and between them produced most of the repair-signal
 * prevalence. Neither turned out to be a design problem:
 *
 *   `categoryFit` is a lookup in the archetype's DNA, and the chooser admits anything at or above
 *   `SECTOR_AFFINITY_FLOOR`. Reading 30 as a failure meant calling the bottom of the admissible
 *   band a defect; measured, 30 is exactly the minimum on all three unpinned populations.
 *
 *   `distinctiveness` counted four axes, two of which cannot move within one offer — `temperament`
 *   comes from sector × style and every offered row is variation 0 — so the score could never
 *   exceed 50, which is where the repair threshold sat.
 *
 * These tests pin both contracts to their producers rather than to the numbers they happen to
 * emit today.
 */
import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { SECTOR_AFFINITY_FLOOR } from '../studio/direction'
import { inspectStudioDirectionOffer } from '../studio/directionTalk'
import { COMPOSITION_AXES } from '../studio/fingerprint'
import { STUDIO_GALLERY_JOBS } from '../studio/studioGalleryJobs'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from './DesignMemory'

function goldens(): DesignSpec[] {
  return STUDIO_GALLERY_JOBS.map((job) => {
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
  })
}

describe('categoryFit answers to the layer that chose the archetype', () => {
  const specs = goldens()

  it('never reads below the floor the chooser admits, when nothing was pinned', () => {
    /*
     * `rankDirectionPool` keeps only rows whose sector affinity clears `SECTOR_AFFINITY_FLOOR`, so
     * a face that was not pinned or spoken for cannot carry a lower one. If this ever fails, the
     * chooser and the scorer have drifted apart again.
     */
    const floor = Math.round(SECTOR_AFFINITY_FLOOR * 100)
    for (const spec of specs) {
      expect(spec.craftScore!.categoryFit!, spec.copy.brand).toBeGreaterThanOrEqual(floor)
    }
  })

  it('so a face at the floor is not reported as needing repair', () => {
    const atFloor = specs.filter((s) => s.craftScore!.categoryFit === Math.round(SECTOR_AFFINITY_FLOOR * 100))
    for (const spec of atFloor) {
      expect(
        spec.craftScore!.repairSignals.map((r) => r.axis),
        `${spec.copy.brand} categoryFit ${spec.craftScore!.categoryFit}`,
      ).not.toContain('categoryFit')
    }
  })
})

describe('an unlisted sector reads as off-category, not as a consolation score', () => {
  it('a family pinned onto a sector its DNA does not claim scores zero', () => {
    /*
     * The fallback used to be 0.2, which disagreed with the chooser's own `?? 0`. Measured, all 151
     * faces that hit it were in the pinned job×family sweep — the caller forcing a family past the
     * sector floor. Twenty out of a hundred implies a little affinity; the table says none.
     */
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Yayla',
        productName: 'Çiçek Balı',
        sector: 'gıda',
        subProduct: 'bal',
        packagingMode: 'label',
        templateId: 'fm-label-universal',
        styleType: 'classic',
        volume: '450 gr',
        dimensionsMm: { L: 70, W: 0, H: 90 },
        barcode: '8690000000017',
        studioRepertoire: 'studio',
        studioFamily: 'line-scene',
        studioFamilyLocked: true,
      },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    expect(spec.studio?.direction.archetype).toBe('line-scene')
    expect(spec.craftScore!.categoryFit).toBe(0)
    // And this one *is* worth routing — it is below the band the chooser would ever admit.
    expect(spec.craftScore!.repairSignals.map((r) => r.axis)).toContain('categoryFit')
  })
})

describe('distinctiveness counts axes that can move', () => {
  it('excludes the two that are constant within an offer', () => {
    expect(COMPOSITION_AXES).not.toContain('temperament')
    expect(COMPOSITION_AXES).not.toContain('variant')
  })

  it('and the ones it counts really do vary across a real offer', () => {
    /*
     * The guard that matters: an axis is only worth counting if an offer moves it. Measured on the
     * offer's own fingerprints — not on regenerated faces, which re-derive the direction.
     */
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: 'Vera',
      productName: 'Altın Seri',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box',
      templateId: 'parfum-tuck-end',
      styleType: 'luxury',
      volume: '50 ml',
      dimensionsMm: { L: 70, W: 35, H: 140 },
      barcode: '8690000000017',
    }
    resetArtMemory()
    const offer = inspectStudioDirectionOffer(brief)
    expect(offer.candidates.length).toBeGreaterThan(1)
    for (const axis of COMPOSITION_AXES) {
      const values = new Set(offer.candidates.map((c) => String((c.fingerprint as Record<string, string> | undefined)?.[axis])))
      expect(values.size, `${axis} teklif içinde sabit`).toBeGreaterThan(1)
    }
  })

  it('a clean offer clears the two-axis target the roadmap sets', () => {
    // 50 is "each pair differs on at least two of the four axes" — reachable now that all four move.
    for (const spec of goldens()) {
      if (spec.craftScore!.distinctiveness == null) continue
      expect(spec.craftScore!.distinctiveness!, spec.copy.brand).toBeGreaterThanOrEqual(50)
    }
  })
})

describe('the readings steer a default, never a choice', () => {
  it('a weak reading routes a face nobody pinned', async () => {
    const repair = await import('../studio/studioRepair')
    for (const axis of ['categoryFit', 'distinctiveness'] as const) {
      expect(repair.needsCraftRoute({ visualCraft: 95, hero: 95, repairSignals: [{ axis, score: 10 }] }), axis).toBe(true)
    }
  })

  it('but a pinned family is not re-rolled for a weak reading', async () => {
    /*
     * `categoryFit` reads near zero exactly when a family was pinned onto a sector its DNA does not
     * claim — which is the caller's doing. Routing that would undo the pin the sweep asked for.
     */
    const repair = await import('../studio/studioRepair')
    expect(
      repair.needsCraftRoute({ visualCraft: 95, hero: 95, repairSignals: [{ axis: 'categoryFit', score: 0 }], archetypePin: 'family' }),
    ).toBe(false)
  })
})
