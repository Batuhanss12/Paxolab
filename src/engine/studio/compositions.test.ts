/**
 * Compositions — the arrangement is an axis now, and the strip shows it.
 *
 * Phase 0 measured the offer: eight archetypes, and on the composition axes (lockup, ornament,
 * temperament, variant) every pair of cards at distance zero on eighteen of eighteen briefs;
 * sixteen of twenty archetypes on `stacked-center`. Phase 2 makes the lockup a preference list
 * like the other three axes and adds two compositions that borrow an archetype's field and type —
 * a band across the foot, a brand on its side — so a marble face can be shown three ways without
 * a marble painter learning three layouts.
 *
 * Every assertion here is about behaviour a customer sees: the strip carries different
 * arrangements, pressing "vary" walks them, the card they click is the design they get, and the
 * painted faces are clean on the ledger and exportable. The eighteen frozen faces are covered by
 * the golden diff: variation 0 still takes the first entry, which is the skeleton each was frozen with.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { COMPOSITIONS } from './compositions'
import { assembleStudioHints, inspectStudioDirection, inspectStudioDirectionOffer } from './directionTalk'
import { ALL_ARCHETYPES, ALT_LOCKUPS, dnaFor, lockupsFor } from './referenceDna'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function jobBrief(slug: string, patch: Partial<DesignBrief> = {}): DesignBrief {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`no gallery job ${slug}`)
  return {
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
    ...patch,
  }
}

function generate(brief: DesignBrief): DesignSpec {
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: brief.styleType === 'luxury', variationIndex: brief.directionVariation ?? 0 } })
}

function front(spec: DesignSpec): string {
  return spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
}

function frontBoxes(spec: DesignSpec) {
  return spec.studio?.panels.find((p) => p.panelId === spec.artwork.frontPanelId)?.placed ?? []
}

/** The coffee jobs land on marble, which lists both compositions. */
const MARBLE_LABEL = () => jobBrief('05-kahve-etiket', { studioFamily: 'marble', studioFamilyLocked: true })
const MARBLE_BOX = () => jobBrief('05-kahve-kutu', { studioFamily: 'marble', studioFamilyLocked: true })

describe('the lockup is a preference list, and the frozen skeleton is its first entry', () => {
  it('every archetype keeps its own skeleton first', () => {
    for (const id of ALL_ARCHETYPES) {
      for (const surface of ['label', 'box'] as const) {
        const dna = dnaFor(id, surface)
        if (dna.id !== id) continue
        expect(lockupsFor(dna)[0]).toBe(dna.lockup)
        for (const alt of ALT_LOCKUPS[id] ?? []) expect(COMPOSITIONS).toContain(alt)
      }
    }
  })

  it('the roundel-led crest wears no composition; the subject-led archetypes do since Phase 2B', () => {
    // Phase 2B taught the compositions to carry a subject, so the subject-led archetypes joined;
    // the crest is still led by its roundel, which no composition paints.
    expect(ALT_LOCKUPS['crest-panel']).toBeUndefined()
    expect(ALT_LOCKUPS['specimen-hero']).toContain('band-split')
    expect(ALT_LOCKUPS['line-scene']).toContain('band-split')
  })
})

describe('the strip shows arrangements, not one skeleton eight times', () => {
  it('each card takes a composition no earlier card took, where its archetype allows one', () => {
    const offer = inspectStudioDirection(jobBrief('05-kahve-etiket')).offer
    const lockups = offer.candidates.map((c) => c.direction.lockup)
    expect(new Set(lockups).size).toBeGreaterThanOrEqual(4)
    expect(lockups).toContain('band-split')
    expect(lockups).toContain('rotated-brand')
    // The painted card keeps the skeleton it was painted with.
    const selected = offer.candidates.find((c) => c.selected)!
    expect(selected.direction.lockup).toBe(dnaFor(selected.direction.archetype, 'label').lockup)
  })

  it('pressing vary walks the compositions the archetype lists', () => {
    const at = (n: number) => inspectStudioDirection({ ...MARBLE_LABEL(), directionVariation: n }).direction.lockup
    expect(at(0)).toBe('stacked-center')
    expect(at(1)).toBe('band-split')
    expect(at(2)).toBe('rotated-brand')
    expect(at(3)).toBe('top-left-block')
    // The carton roles are not on a label's list, so the walk wraps here.
    expect(at(4)).toBe('stacked-center')
  })
})

describe('the card you click is the design you get', () => {
  it('a pinned arrangement becomes a hint and is honoured where the archetype lists it', () => {
    const brief = { ...MARBLE_LABEL(), studioPick: { lockup: 'band-split' as const } }
    expect(assembleStudioHints(brief, 'label').some((h) => h.lockup === 'band-split')).toBe(true)
    expect(inspectStudioDirection(brief).direction.lockup).toBe('band-split')
  })

  it('and is ignored where it does not — the crest keeps its roundel', () => {
    const brief = jobBrief('01-parfum-etiket', { studioFamily: 'crest', studioFamilyLocked: true, studioPick: { lockup: 'band-split' } })
    const d = inspectStudioDirection(brief).direction
    expect(d.archetype).toBe('crest-panel')
    expect(d.lockup).toBe(dnaFor('crest-panel', 'label').lockup)
  })

  it('a chat pick carries the arrangement of the card, not just its family', () => {
    const brief = jobBrief('05-kahve-etiket')
    const offer = inspectStudioDirectionOffer(brief)
    const card = offer.candidates.find((c) => !c.selected && c.fingerprint?.lockup === 'band-split')
    expect(card, 'the strip should carry a band-split card for a coffee label').toBeDefined()
    const result = runConversation({ text: String(card!.index), attachments: [], brief, awaiting: null, hasDesign: true, directionOffer: offer })
    expect(result.note).toBe('direction-pick')
    expect(result.brief.studioPick?.lockup).toBe('band-split')
    expect(result.brief.studioFamily).toBe(card!.family)
  })
})

describe('Phase 2B — the compositions carry a subject, a corner block, and the carton roles', () => {
  const SPECIMEN_LABEL = () => jobBrief('07-bebek-etiket', { studioFamily: 'specimen', studioFamilyLocked: true })
  const SPECIMEN_BOX = () => jobBrief('07-bebek-kutu', { studioFamily: 'specimen', studioFamilyLocked: true })

  it('a band split on a specimen draws the specimen into the field, reaching the band', () => {
    const spec = generate({ ...SPECIMEN_LABEL(), studioPick: { lockup: 'band-split' } })
    expect(spec.studio?.direction.archetype).toBe('specimen-hero')
    expect(spec.studio?.direction.lockup).toBe('band-split')
    const face = front(spec)
    expect(face).toContain('data-composition="band-split"')
    expect(face).toMatch(/data-art="hero"/)
    const specimen = frontBoxes(spec).find((b) => b.id.startsWith('specimen#'))
    expect(specimen).toBeDefined()
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.studio?.outOfBounds).toEqual([])
    expect(spec.craftScore?.hero).toBeGreaterThanOrEqual(78)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('a line scene brings its subject with its field', () => {
    const spec = generate({ ...jobBrief('03-serum-etiket', { studioFamily: 'line-scene', studioFamilyLocked: true }), studioPick: { lockup: 'band-split' } })
    expect(spec.studio?.direction.lockup).toBe('band-split')
    expect(front(spec)).toMatch(/data-bg="line-scene" data-art="hero"/)
    expect(spec.craftScore?.hero).toBeGreaterThanOrEqual(78)
    expect(spec.studio?.collisions).toEqual([])
  })

  it('top-left-block: the block in the corner, the subject in the lower right, on a label and a carton', () => {
    for (const brief of [SPECIMEN_LABEL(), SPECIMEN_BOX(), MARBLE_LABEL()]) {
      const spec = generate({ ...brief, studioPick: { lockup: 'top-left-block' } })
      expect(spec.studio?.direction.lockup).toBe('top-left-block')
      expect(front(spec)).toContain('data-composition="top-left-block"')
      const boxes = frontBoxes(spec)
      const brand = boxes.find((b) => b.id.startsWith('brand#'))!
      const product = boxes.find((b) => b.id.startsWith('product#'))!
      expect(brand.x).toBeLessThan(spec.dieline.panels.find((p) => p.id === spec.artwork.frontPanelId)!.w * 0.3)
      expect(product.y).toBeGreaterThan(brand.y)
      expect(spec.studio?.collisions).toEqual([])
      expect(spec.studio?.outOfBounds).toEqual([])
      expect(spec.preflight.exportOk).toBe(true)
    }
  })

  it('art-panel: a quiet front, the art on the first side — and the evaluator reads the lead there', () => {
    const spec = generate({ ...SPECIMEN_BOX(), studioPick: { lockup: 'art-panel' } })
    expect(spec.studio?.direction.lockup).toBe('art-panel')
    expect(front(spec)).toContain('data-role-front="quiet"')
    expect(front(spec)).not.toMatch(/data-art="hero"/)
    const sides = spec.artwork.layers.filter((l) => /data-role-side=/.test(l.markup))
    expect(sides.length).toBe(1)
    expect(sides[0]!.markup).toMatch(/data-role-side="art"/)
    expect(sides[0]!.markup).toMatch(/data-art="hero"/)
    expect(spec.craftScore?.hero, 'lider yan panelde, skorlayıcı görmeli').toBeGreaterThanOrEqual(78)
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.studio?.outOfBounds).toEqual([])
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('flanked: a solid front between two mirrored sides', () => {
    const spec = generate({ ...SPECIMEN_BOX(), studioPick: { lockup: 'flanked' } })
    expect(spec.studio?.direction.lockup).toBe('flanked')
    expect(front(spec)).toContain('data-role-front="solid"')
    const sides = spec.artwork.layers.filter((l) => /data-role-side=/.test(l.markup))
    expect(sides.length).toBe(2)
    expect(sides.map((l) => /data-role-side="([a-z]+)"/.exec(l.markup)?.[1]).sort()).toEqual(['art', 'mirrored'])
    expect(sides.find((l) => /mirrored/.test(l.markup))!.markup).toMatch(/scale\(-1 1\)/)
    for (const side of sides) expect(side.markup).toMatch(/data-art="hero"/)
    expect(spec.craftScore?.hero).toBeGreaterThanOrEqual(78)
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.studio?.outOfBounds).toEqual([])
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('a label cannot wear a carton role', () => {
    expect(lockupsFor(dnaFor('specimen-hero', 'label'))).not.toContain('art-panel')
    expect(lockupsFor(dnaFor('specimen-hero', 'box'))).toContain('art-panel')
    const spec = generate({ ...SPECIMEN_LABEL(), studioPick: { lockup: 'art-panel' } })
    expect(spec.studio?.direction.lockup).toBe('stacked-center')
  })
})

describe('the compositions paint real, clean, exportable faces', () => {
  it('band-split: brand in the field, product in the band, nothing colliding', () => {
    const spec = generate({ ...MARBLE_LABEL(), studioPick: { lockup: 'band-split' } })
    expect(spec.studio?.direction.lockup).toBe('band-split')
    const face = front(spec)
    expect(face).toContain('data-composition="band-split"')
    expect(face).toContain('data-art="band"')
    expect(face).toMatch(/data-bg="marble"/)
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.studio?.outOfBounds).toEqual([])
    const boxes = frontBoxes(spec)
    const brand = boxes.find((b) => b.id.startsWith('brand#'))!
    const product = boxes.find((b) => b.id.startsWith('product#'))!
    expect(brand).toBeDefined()
    expect(product).toBeDefined()
    expect(product.y).toBeGreaterThan(brand.y)
    expect(brand.sizeMm!).toBeGreaterThan(product.sizeMm!)
    expect(spec.preflight.exportOk).toBe(true)
    expect(spec.craftScore?.hero).toBeGreaterThanOrEqual(70)
  })

  it('rotated-brand: the brand turned and booked as a brand, the product beside it', () => {
    const spec = generate({ ...MARBLE_LABEL(), studioPick: { lockup: 'rotated-brand' } })
    expect(spec.studio?.direction.lockup).toBe('rotated-brand')
    const face = front(spec)
    expect(face).toContain('data-composition="rotated-brand"')
    expect(face).toMatch(/transform="rotate\(-90/)
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.studio?.outOfBounds).toEqual([])
    const brand = frontBoxes(spec).find((b) => b.id.startsWith('brand#'))!
    expect(brand.h).toBeGreaterThan(brand.w)
    expect(spec.preflight.exportOk).toBe(true)
    expect(spec.craftScore?.hierarchy).toBeGreaterThanOrEqual(70)
  })

  it('on a carton as well, with the sides and back untouched', () => {
    for (const lockup of ['band-split', 'rotated-brand'] as const) {
      const spec = generate({ ...MARBLE_BOX(), studioPick: { lockup } })
      expect(front(spec)).toContain(`data-composition="${lockup}"`)
      expect(spec.studio?.collisions).toEqual([])
      expect(spec.studio?.outOfBounds).toEqual([])
      expect(spec.preflight.exportOk).toBe(true)
      const side = spec.artwork.layers.find((l) => /left|right/i.test(l.panelId))
      expect(side?.markup).toMatch(/data-role="side"/)
    }
  })
})
