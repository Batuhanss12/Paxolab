/**
 * The final export decision is one AND, computed in one place.
 *
 * Before this, `buildCombinedSvg` read `preflight.exportOk` and the download button read it again
 * independently. Phase 1 produced a second verdict about the design and left it unwired on purpose.
 * The risk in joining them is not the boolean — it is ending up with the expression written twice,
 * so that the button says "ready" about a file the exporter refuses to build. These tests pin the
 * four combinations and assert the export chain agrees with the decision function on every one.
 */
import { describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { STUDIO_GALLERY_JOBS } from '../studio/studioGalleryJobs'
import { designAllowsExport, exportAllowed, technicalAllowsExport } from './exportDecision'
import { buildCombinedSvg } from './exportDoc'

function cleanSpec(): DesignSpec {
  const job = STUDIO_GALLERY_JOBS[0]!
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

/** The same design with either half of the gate forced. */
function withGates(spec: DesignSpec, technical: boolean, design: boolean): DesignSpec {
  return {
    ...spec,
    preflight: { ...spec.preflight, exportOk: technical, blocking: !technical },
    craftScore: {
      ...spec.craftScore!,
      exportAllowed: design,
      blockers: design ? [] : [{ id: 'HIERARCHY_VIOLATION' as const, reason: 'kurgulanmış ihlal' }],
    },
  }
}

describe('final export = technical AND design', () => {
  const base = cleanSpec()

  it('the clean design passes both halves on its own', () => {
    expect(technicalAllowsExport(base)).toBe(true)
    expect(designAllowsExport(base)).toBe(true)
    expect(exportAllowed(base)).toBe(true)
  })

  const cases: [string, boolean, boolean, boolean][] = [
    ['A  teknik GEÇER + tasarım GEÇER', true, true, true],
    ['B  teknik KALIR + tasarım GEÇER', false, true, false],
    ['C  teknik GEÇER + tasarım KALIR', true, false, false],
    ['D  teknik KALIR + tasarım KALIR', false, false, false],
  ]

  for (const [label, technical, design, expected] of cases) {
    it(`${label} → ${expected ? 'izin' : 'engel'}`, () => {
      const spec = withGates(base, technical, design)
      expect(exportAllowed(spec), 'karar').toBe(expected)
      // The chain has to agree: no second copy of the expression anywhere downstream.
      expect(buildCombinedSvg(spec) !== null, 'buildCombinedSvg').toBe(expected)
    })
  }

  it('a spec with no scorecard is decided by the technical gate alone', () => {
    /*
     * The design verdict is optional on `DesignSpec` and kit-era specs never carried one. Treating
     * "absent" as "blocked" would refuse every such design; the gate only speaks when it was asked.
     */
    const noCard: DesignSpec = { ...base, craftScore: undefined }
    expect(designAllowsExport(noCard)).toBe(true)
    expect(exportAllowed(noCard)).toBe(true)
    expect(buildCombinedSvg(noCard)).not.toBeNull()
    expect(buildCombinedSvg({ ...noCard, preflight: { ...noCard.preflight, exportOk: false } })).toBeNull()
  })
})
