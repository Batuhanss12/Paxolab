/**
 * The evaluator reads the studio face in the studio's own vocabulary.
 *
 * Phase 0 measured what the kit-era scorer made of the eighteen frozen faces: hero 28–92 with
 * eleven field-led faces scored as "missing a hero", typography 80–88 saturated by fallback font
 * names, originality a constant 60, geometry read off a wrapper `<g>`. Each test below takes a
 * real generated face, changes one thing a designer would notice — strips the subject, swaps the
 * brand and product sizes, removes the tracking, drops the frame — and asserts the score moves
 * the way a designer's opinion would. Nothing here asserts an absolute number the frozen set
 * happens to produce; `craftGate.test.ts` keeps the floor honest against the goldens.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import type { DesignSpec } from '../../types'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { COMPOSITION_AXES, fingerprintDistance, type Fingerprint } from '../studio/fingerprint'
import { dnaFor } from '../studio/referenceDna'
import { STUDIO_GALLERY_JOBS, type StudioGalleryJob } from '../studio/studioGalleryJobs'
import { STUDIO_CRAFT_FLOOR, craftRouteImproves, needsCraftRoute } from '../studio/studioRepair'
import type { StudioReport } from '../studio/types'
import { critiqueDesign } from './DesignCritic'
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

/** The first golden whose painted archetype satisfies the predicate. */
function specWhere(pred: (archetype: string) => boolean): DesignSpec {
  for (const job of STUDIO_GALLERY_JOBS) {
    const spec = specOf(job.slug)
    if (pred(spec.studio?.direction.archetype ?? '')) return spec
  }
  throw new Error('no golden face matches')
}

function face(spec: DesignSpec): string {
  return spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
}

/** Score the same design again with the front markup and/or the studio report changed. */
function rescore(
  spec: DesignSpec,
  patch: { markup?: (m: string) => string; studio?: (s: StudioReport) => StudioReport; colors?: string },
): VisualCraftScorecard {
  const artwork = patch.markup
    ? {
        ...spec.artwork,
        layers: spec.artwork.layers.map((l) => (l.panelId === spec.artwork.frontPanelId ? { ...l, markup: patch.markup!(l.markup) } : l)),
      }
    : spec.artwork
  const studio = patch.studio ? patch.studio(JSON.parse(JSON.stringify(spec.studio)) as StudioReport) : spec.studio
  return scoreVisualCraft(
    {
      artwork,
      preflight: spec.preflight,
      copy: spec.copy,
      kind: spec.kind,
      studio,
      brief: { colors: patch.colors ?? spec.brief.colors },
      dieline: spec.dieline,
    },
    spec.designPlan!,
  )
}

describe('the lead element is what the archetype is for', () => {
  let field: DesignSpec
  let subject: DesignSpec
  beforeAll(() => {
    field = specWhere((a) => a === 'marble-frame' || a === 'noir-stack' || a === 'ink-wash' || a === 'diagonal-tech' || a === 'wave-panel')
    subject = specWhere((a) => a === 'specimen-hero' || a === 'line-scene')
  })

  it('a field-led face is not scored as missing a hero', () => {
    const card = spec(field)
    expect(card.hero, `${field.studio?.direction.archetype} hero`).toBeGreaterThanOrEqual(70)
    expect(card.notes.join(' ')).not.toMatch(/Hero gerekli/)
  })

  it('but it is scored for its field: strip the background and the lead is gone', () => {
    const before = spec(field).hero
    const after = rescore(field, { markup: (m) => m.replace(/data-bg="[a-z-]+"/g, 'data-bg-stripped=""') }).hero
    expect(after).toBeLessThan(before - 20)
  })

  it('a subject-led face loses its lead when the subject is stripped', () => {
    const before = spec(subject)
    expect(before.hero).toBeGreaterThanOrEqual(78)
    // The field's marker and the drawn subject both go: the evaluator reads either as the lead.
    const after = rescore(subject, { markup: (m) => m.replace(/data-art="hero"/g, 'data-art="hero-stripped"').replace(/data-hero="/g, 'data-hero-stripped="') })
    expect(after.hero).toBeLessThanOrEqual(40)
    expect(after.notes.join(' ')).toMatch(/Özne/)
    expect(after.focal).toBeLessThan(before.focal ?? 100)
  })
})

describe('typography is scored on behaviour, not on font names', () => {
  it('renaming every face to a name on no list changes nothing', () => {
    const s = specOf('01-parfum-kutu')
    const before = spec(s).typography
    const after = rescore(s, { markup: (m) => m.replace(/'Cormorant Garamond'/g, "'Quux Serif'").replace(/'Montserrat'/g, "'Quux Sans'") }).typography
    expect(after).toBe(before)
  })

  it('removing the tracking lowers it', () => {
    const s = specOf('01-parfum-kutu')
    expect(face(s)).toMatch(/letter-spacing="/)
    const before = spec(s).typography
    const after = rescore(s, { markup: (m) => m.replace(/ letter-spacing="[^"]*"/g, '') }).typography
    expect(after).toBeLessThan(before)
  })

  it('flattening every weight to one lowers it', () => {
    // A face that actually carries two weights — the tracked-serif perfume box sets everything
    // in one, so there is nothing to flatten there.
    const s = specWhere(() => true) && (() => {
      for (const job of STUDIO_GALLERY_JOBS) {
        const candidate = specOf(job.slug)
        const weights = new Set((face(candidate).match(/font-weight="(\d+)"/g) ?? []).map((m) => m.match(/\d+/)?.[0]))
        if (weights.size >= 2) return candidate
      }
      throw new Error('no golden face carries two weights')
    })()
    const before = spec(s).typography
    const after = rescore(s, { markup: (m) => m.replace(/font-weight="\d+"/g, 'font-weight="500"') }).typography
    expect(after).toBeLessThan(before)
  })
})

describe('hierarchy is measured from the ledger', () => {
  it('a product set larger than its brand is the failure the rule forbids', () => {
    const s = specWhere((a) => a !== 'card-on-art' && a !== 'botanical-card')
    const before = spec(s)
    const after = rescore(s, {
      studio: (st) => {
        for (const panel of st.panels) {
          const brand = panel.placed.find((b) => b.id.startsWith('brand#'))
          const product = panel.placed.find((b) => b.id.startsWith('product#'))
          if (brand?.sizeMm && product?.sizeMm) {
            const tmp = brand.sizeMm
            brand.sizeMm = product.sizeMm
            product.sizeMm = tmp * 1.6
          }
        }
        return st
      },
    })
    expect(after.hierarchy).toBeLessThan(before.hierarchy - 10)
    expect(after.notes.join(' ')).toMatch(/markadan büyük/)
  })
})

describe('decoration sees the studio frame and field', () => {
  it('a frame that was decided and then not painted costs', () => {
    const s = specWhere((a) => a === 'ink-wash' || a === 'marble-frame' || a === 'atelier-plate' || a === 'crest-panel')
    expect(s.studio?.direction.frame).not.toBe('none')
    expect(face(s)).toMatch(/data-frame="/)
    const before = spec(s).decoration
    const after = rescore(s, { markup: (m) => m.replace(/data-frame="[a-z-]+"/g, 'data-frame-stripped=""') }).decoration
    expect(after).toBeLessThan(before)
  })

  it('the field counts', () => {
    const s = specOf('01-parfum-kutu')
    const before = spec(s).decoration
    const after = rescore(s, { markup: (m) => m.replace(/data-bg="[a-z-]+"/g, 'data-bg-stripped=""') }).decoration
    expect(after).toBeLessThan(before)
  })
})

describe('originality reads the brief', () => {
  it('the brand’s own colours and the customer’s own line move it', () => {
    const s = specOf('01-parfum-kutu')
    const base = spec(s).originality
    expect(rescore(s, { colors: '' }).originality).toBeLessThan(base)
    const own = rescore(s, { studio: (st) => ({ ...st, direction: { ...st.direction, copySource: 'user' } }) }).originality
    expect(own).toBeGreaterThan(base)
  })
})

describe('the separate readings', () => {
  it('categoryFit is the archetype’s own sector fit', () => {
    const s = specOf('01-parfum-kutu')
    const d = s.studio!.direction
    const expected = Math.round((dnaFor(d.archetype, d.surface).sectors[s.designPlan!.sector] ?? 0.2) * 100)
    expect(spec(s).categoryFit).toBe(expected)
  })

  it('distinctiveness is the mean composition distance to the other offered candidates', () => {
    const s = specOf('01-parfum-kutu')
    const rows = s.studio!.offer!.candidates
    const selected = rows.find((r) => r.selected)!.fingerprint as Fingerprint
    const others = rows.filter((r) => !r.selected).map((r) => r.fingerprint as Fingerprint)
    const mean = others.reduce((a, f) => a + fingerprintDistance(selected, f, COMPOSITION_AXES), 0) / others.length
    expect(spec(s).distinctiveness).toBe(Math.round((mean / COMPOSITION_AXES.length) * 100))
  })


  it('an element that swallows the face is flagged as the focal problem it is', () => {
    const s = specOf('01-parfum-kutu')
    const after = rescore(s, {
      studio: (st) => {
        const front = st.panels.find((p) => p.panelId === s.artwork.frontPanelId)!
        front.placed.push({ id: 'giant#99', kind: 'container', x: 0, y: 0, w: 66, h: 130 })
        return st
      },
    })
    expect(after.focal).toBeLessThanOrEqual(40)
  })
})

describe('the gate steps on a missing lead, not only on the total', () => {
  it('a sound golden is left alone; the same face without its lead is routed', () => {
    const s = specWhere((a) => a === 'specimen-hero' || a === 'line-scene')
    expect(needsCraftRoute(spec(s))).toBe(false)
    const stripped = rescore(s, { markup: (m) => m.replace(/data-art="hero"/g, 'data-art="hero-stripped"').replace(/data-hero="/g, 'data-hero-stripped="') })
    // The total alone would not have caught it — measured, a lead-less face still totals 62–68.
    expect(stripped.visualCraft).toBeGreaterThanOrEqual(STUDIO_CRAFT_FLOOR)
    expect(needsCraftRoute(stripped)).toBe(true)
  })

  it('an alternative is kept only when it answers the reason it was tried for', () => {
    // Routed for the total: only a strictly higher total counts.
    expect(craftRouteImproves({ visualCraft: 40, hero: 80 }, { visualCraft: 41, hero: 80 })).toBe(true)
    expect(craftRouteImproves({ visualCraft: 40, hero: 80 }, { visualCraft: 40, hero: 90 })).toBe(false)
    // Routed for a missing lead: the alternative needs its lead and must stay above the floor.
    expect(craftRouteImproves({ visualCraft: 66, hero: 30 }, { visualCraft: 60, hero: 82 })).toBe(true)
    expect(craftRouteImproves({ visualCraft: 66, hero: 30 }, { visualCraft: 70, hero: 30 })).toBe(false)
    expect(craftRouteImproves({ visualCraft: 66, hero: 30 }, { visualCraft: 48, hero: 82 })).toBe(false)
  })

  it('a mark-led lockup is not scored as a hierarchy fault for its product title', () => {
    const s = specWhere((a) => a === 'diagonal-tech' || a === 'diagonal-split' || a === 'card-on-art')
    expect(spec(s).notes.join(' ')).not.toMatch(/markadan büyük/)
    expect(spec(s).hierarchy).toBeGreaterThanOrEqual(70)
  })
})

describe('the critic raises the two findings a designer raises first', () => {
  it('lead element and focal point, as advisory findings citing the scorecard', () => {
    const s = specOf('01-parfum-kutu')
    const rows = critiqueDesign({
      plan: s.designPlan!,
      critique: s.critique!,
      preflight: s.preflight,
      studioLedger: { collisions: [], outOfBounds: [], minTextMm: 1.5 },
      craft: { ...s.craftScore!, hero: 30, focal: 30 },
    })
    const lead = rows.find((r) => r.evidence.source === 'craftScore' && r.evidence.topic === 'hero')
    const focal = rows.find((r) => r.evidence.source === 'craftScore' && r.evidence.topic === 'focal')
    expect(lead?.target).toBe('lead_element')
    expect(focal?.target).toBe('focal_point')
    for (const row of [lead, focal]) expect(row?.severity).not.toBe('error')
  })
})

function spec(s: DesignSpec): VisualCraftScorecard {
  return s.craftScore!
}
