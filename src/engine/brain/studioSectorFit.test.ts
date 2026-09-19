/**
 * `sectorFit` on a studio face is read from what the engine decided, not from what it drew.
 *
 * Seven of the nine craft axes hand off to `studioCraft.ts` when the face is a studio face. These
 * two never did, so they were still scored with kit-era evidence — `data-hero="crest"`,
 * `data-pattern="hexagon"`, the perfume flash point `2004.78`, ingredient words like `CERAMIDE`.
 * Measured across 599 studio faces, 5% carry any of those tokens, so `sectorFit` reported five
 * distinct values over the whole engine and mostly returned its opening constant of 62.
 *
 * The adversarial cases below are the point of this file: a valid design must not be punished for
 * lacking a kit token, and a face must not be rewarded for carrying one. Those two tests are what
 * stop the old heuristic coming back.
 */
import { describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { dnaFor } from '../studio/referenceDna'
import { STUDIO_GALLERY_JOBS } from '../studio/studioGalleryJobs'
import { resetArtMemory } from './DesignMemory'
import { VISUAL_CRAFT_WEIGHTS } from './scoreConfig'
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

/** Re-score with the front markup rewritten. */
function rescore(spec: DesignSpec, edit: (m: string) => string) {
  const layers = spec.artwork.layers.map((l) =>
    l.panelId === spec.artwork.frontPanelId ? { ...l, markup: edit(l.markup) } : l,
  )
  return scoreVisualCraft(
    {
      artwork: { ...spec.artwork, layers },
      preflight: spec.preflight,
      copy: spec.copy,
      kind: spec.kind,
      studio: spec.studio,
      brief: { colors: spec.brief.colors },
      dieline: spec.dieline,
    },
    spec.designPlan!,
  )
}

const cream = specOf('02-krem-etiket')
const perfume = specOf('01-parfum-kutu')

describe('A — the reading comes from the direction the engine chose', () => {
  it('is the archetype\'s own declared sector and style affinity', () => {
    for (const spec of [cream, perfume]) {
      const dna = dnaFor(spec.studio!.direction.archetype, spec.studio!.direction.surface)
      const sector = dna.sectors[spec.designPlan!.sector] ?? 0
      const style = dna.styles[spec.designPlan!.style] ?? 0.3
      expect(spec.craftScore!.sectorFit, spec.copy.brand).toBe(Math.round(sector * 60 + style * 40))
    }
  })

  it('a face on its home sector outscores one admitted at the floor', () => {
    // Perfume on `parfum-tuck-end` is the reference this archetype was built from.
    expect(perfume.craftScore!.sectorFit).toBeGreaterThan(cream.craftScore!.sectorFit)
  })
})

describe('B — adversarial: the kit tokens must not move it', () => {
  it('a valid studio face is not punished for lacking them', () => {
    /*
     * The old scorer gave perfume +16 only if the face carried `2004.78`, `EAU DE`,
     * `data-hero="crest"` or `data-lockup-chrome="centered-crest"`. A studio perfume face draws
     * none of those and is still a perfume design.
     */
    const front = perfume.artwork.layers.find((l) => l.panelId === perfume.artwork.frontPanelId)!.markup
    expect(front).not.toMatch(/data-hero="crest"|data-lockup-chrome=|2004\.78/)
    expect(perfume.craftScore!.sectorFit).toBeGreaterThanOrEqual(90)
  })

  it('and injecting them does not raise it', () => {
    const injected = rescore(perfume, (m) => `${m}<g data-hero="crest" data-lockup-chrome="centered-crest">2004.78 EAU DE</g>`)
    expect(injected.sectorFit).toBe(perfume.craftScore!.sectorFit)
  })

  it('nor does injecting a foreign sector\'s literal onto a cosmetic face', () => {
    // `2004.78` used to cost a non-perfume face 30 points on sight.
    const injected = rescore(cream, (m) => `${m}<text>2004.78 EAU DE PARFUM</text>`)
    expect(injected.sectorFit).toBe(cream.craftScore!.sectorFit)
  })

  it('and stripping every drawn pattern does not lower it', () => {
    const stripped = rescore(cream, (m) => m.replace(/data-pattern="[a-z-]+"/g, ''))
    expect(stripped.sectorFit).toBe(cream.craftScore!.sectorFit)
  })
})

describe('E + F — the legacy path is untouched and separate', () => {
  it('a face without the studio marker still takes the kit branch', () => {
    /*
     * `studioCraftCtx` returns undefined when the front carries no `data-art="studio"`, which is how
     * a kit-era spec is recognised. Removing the marker must drop back to the old reading — same
     * input, different branch, and the numbers must differ or the branch is not doing anything.
     */
    const legacy = rescore(cream, (m) => m.replace('data-art="studio"', 'data-art="kit-legacy"'))
    expect(legacy.sectorFit).toBe(62) // the kit opening constant, no markers present
    expect(legacy.sectorFit).not.toBe(cream.craftScore!.sectorFit)
  })

  it('and the kit branch still rewards its own evidence', () => {
    const legacyWithMark = rescore(cream, (m) =>
      m.replace('data-art="studio"', 'data-art="kit-legacy"') + '<text>YÜZEY SURFACE</text>',
    )
    // `cleaning` is the sector that reads YÜZEY; cream does not, so the constant stands.
    expect(legacyWithMark.sectorFit).toBe(62)
  })
})

describe('G + H — the contracts around the axis are unchanged', () => {
  it('the scale stays 0..100', () => {
    for (const spec of [cream, perfume]) {
      expect(spec.craftScore!.sectorFit).toBeGreaterThanOrEqual(0)
      expect(spec.craftScore!.sectorFit).toBeLessThanOrEqual(100)
      expect(Number.isInteger(spec.craftScore!.sectorFit)).toBe(true)
    }
  })

  it('the weights are not touched', () => {
    expect(VISUAL_CRAFT_WEIGHTS.sectorFit).toBe(0.1)
    expect(VISUAL_CRAFT_WEIGHTS.productFit).toBe(0.06)
    const total = Object.values(VISUAL_CRAFT_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('C + D — productFit is NOT yet canonical, and this records why', () => {
  it('still reads the kit ingredient words on a studio face', () => {
    /*
     * Phase 2B stopped here rather than inventing. The canonical per-product table
     * (`vocabularyTable.ts`, keyed `sector:subProduct`) is not consulted by the studio on any axis
     * measured: its `ornamentLevel` is a 0–3 scale the studio's `quiet|measured|rich` was never
     * reconciled with (69% of faces read as "over ceiling"), its `typographyVoice` has no relation
     * to the chosen `typePairing` (every voice uses nearly every pairing), and `claimStrip` is
     * honoured on 16 of the 240 faces that ask for it. Scoring the studio against a table it does
     * not consult would rebuild the same fault in a new place.
     *
     * So this test does not assert that productFit is good. It asserts what it currently is, so the
     * next phase starts from a measured fact instead of an assumption.
     */
    const withWord = rescore(cream, (m) => `${m}<text>CERAMIDE</text>`)
    expect(withWord.productFit).toBeGreaterThan(cream.craftScore!.productFit)
    expect(cream.craftScore!.productFit).toBe(64) // the opening constant
  })
})
