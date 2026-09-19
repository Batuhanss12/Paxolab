/**
 * Phase 5 — graphic languages: five fields, two heritage frame members, two flat render modes.
 *
 * Each language is a fixture face the engine can be asked for through the same road a picked
 * card takes (`studioPick`), painted clean (ledger 0), deliverable (export gate), and read by the
 * evaluator as the archetype's own field. The strip reaches them: it cycles the field like it
 * cycles the arrangement, and the fingerprint carries it back. The frozen faces do not move —
 * every list grew at its end, and a silent brief keeps the illustrator's seed rule.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { inspectStudioDirectionOffer } from './directionTalk'
import { paintBackground } from './backgrounds'
import { motifAspect, paintMotif } from './motifs'
import { brandPersonality, subjectStyleFor } from './personality'
import { ALL_ARCHETYPES, BOX_DNA, LABEL_DNA, dnaFor, pickFromFingerprint } from './referenceDna'
import { speciesHero, toileSprig, type HeroInk } from './species'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import { svgHull } from './svgHull'
import type { BackgroundFamily, FrameStyle, StudioFamily } from './types'

const FIELDS: BackgroundFamily[] = ['blob', 'ogee', 'celestial', 'pictogram', 'toile']
const FRAMES: FrameStyle[] = ['laurel', 'cartouche']
const ORIGINAL_FIELDS: BackgroundFamily[] = ['marble', 'botanical', 'diagonal', 'ink-wash', 'gradient-wash', 'line-scene', 'paper', 'wave', 'circuit', 'arabesque']

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

const FAMILY_OF: Record<string, StudioFamily> = {
  'card-on-art': 'botanical',
  'botanical-card': 'botanical',
  'specimen-hero': 'specimen',
  'atelier-plate': 'atelier',
  'crest-panel': 'crest',
  'noir-plate': 'dark-luxe',
  'noir-stack': 'dark-luxe',
  'diagonal-tech': 'tech',
}

/** A gallery job whose archetype lists the field or frame, pinned to it. */
function briefFor(axis: 'background' | 'frame', value: BackgroundFamily | FrameStyle): DesignBrief {
  for (const [id, family] of Object.entries(FAMILY_OF)) {
    for (const surface of ['label', 'box'] as const) {
      const dna = dnaFor(id as never, surface)
      if (dna.id !== id) continue
      const list = axis === 'background' ? dna.backgrounds : dna.frames
      if (!(list as string[]).includes(value)) continue
      const job = STUDIO_GALLERY_JOBS.find((j) => (j.packagingMode === 'box') === (surface === 'box'))!
      return jobBrief(job.slug, { brandName: 'Nova', studioFamily: family, studioFamilyLocked: true, studioPick: { [axis]: value } as DesignBrief['studioPick'] })
    }
  }
  throw new Error(`nothing lists ${value}`)
}

describe('the lists grew at their ends', () => {
  it('every studio archetype still opens with a field and a frame the frozen faces know', () => {
    for (const id of ALL_ARCHETYPES) {
      for (const surface of ['label', 'box'] as const) {
        const dna = dnaFor(id, surface)
        if (dna.id !== id) continue
        // The second repertoire (F-32) is not what the frozen faces were painted with; it opens
        // on whichever field and frame its reference actually uses.
        if ((dna.repertoire ?? 'studio') !== 'studio') continue
        expect(ORIGINAL_FIELDS, `${id}/${surface} first field`).toContain(dna.backgrounds[0])
        expect(FRAMES, `${id}/${surface} first frame`).not.toContain(dna.frames[0])
      }
    }
  })

  it('each language is listed somewhere, only on painters that read the direction', () => {
    const rows = [...Object.values(LABEL_DNA), ...Object.values(BOX_DNA)]
    for (const field of FIELDS) {
      const listed = rows.filter((dna) => dna.backgrounds.includes(field))
      expect(listed.length, field).toBeGreaterThan(0)
      // Every reference archetype paints `d.background`; the map below is the studio set's allowlist.
      for (const dna of listed) {
        if ((dna.repertoire ?? 'studio') !== 'studio') continue
        expect(Object.keys(FAMILY_OF), `${dna.id} lists ${field} but paints its own field`).toContain(dna.id)
      }
    }
    for (const frame of FRAMES) expect(rows.some((dna) => dna.frames.includes(frame)), frame).toBe(true)
  })
})

describe('the five fields', () => {
  const pal = { ground: '#f4efe6', ink: '#171512', accent: '#2d6a4f', accent2: '#b5651d', deep: '#1f3d2f', card: '#ffffff', cardInk: '#171512', muted: '#8a8378' } as never

  for (const field of FIELDS) {
    it(`${field}: paints its marker, seeded, from paths only`, () => {
      const a = paintBackground(field, 80, 120, pal, 11, { uid: 'a', species: 'olive' })
      const b = paintBackground(field, 80, 120, pal, 11, { uid: 'a', species: 'olive' })
      const c = paintBackground(field, 80, 120, pal, 12, { uid: 'a', species: 'olive' })
      expect(a).toContain(`data-bg="${field}"`)
      expect(a).toBe(b)
      expect(a).not.toBe(c)
      expect(a).not.toMatch(/<(use|image|filter|text)[\s>]/)
      expect(svgHull(a)).not.toBeNull()
    })

    it(`${field}: a pinned face carries it, clean and deliverable, and the evaluator reads it as the field`, () => {
      const spec = generate(briefFor('background', field))
      expect(spec.studio?.direction.background).toBe(field)
      expect(front(spec)).toContain(`data-bg="${field}"`)
      expect(spec.studio?.collisions).toEqual([])
      expect(spec.studio?.outOfBounds).toEqual([])
      expect(spec.preflight.exportOk).toBe(true)
      expect(spec.craftScore?.hero).toBeGreaterThanOrEqual(70)
      expect(spec.craftScore?.visualCraft).toBeGreaterThanOrEqual(60)
    })
  }

  it('the toile repeats a one-ink sprig of the product\'s own plant', () => {
    const sprig = toileSprig('olive', 0, 0, 20, '#334455', 3, 't')
    expect(sprig).toContain('data-motif="toile-sprig"')
    const colours = new Set([...sprig.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g)].map((m) => m[1]))
    expect([...colours]).toEqual(['#334455'])
    const field = paintBackground('toile', 80, 120, pal, 11, { uid: 'a', species: 'olive' })
    expect((field.match(/data-motif="toile-sprig"/g) ?? []).length).toBeGreaterThanOrEqual(6)
    // Real paths in every cell — no symbol reused, because the delivered file carries no references.
    expect(field).not.toMatch(/<use[\s>]/)
  })

  it('the pictogram repeat takes the icons of the product\'s botany', () => {
    const olive = paintBackground('pictogram', 80, 120, pal, 11, { uid: 'a', species: 'olive' })
    const lavender = paintBackground('pictogram', 80, 120, pal, 11, { uid: 'a', species: 'lavender' })
    expect(olive).toMatch(/data-icon="leaf"/)
    expect(lavender).toMatch(/data-icon="flask"/)
    expect(olive).not.toMatch(/data-icon="flask"/)
  })
})

describe('the heritage frame members', () => {
  for (const frame of FRAMES) {
    it(`${frame}: a pinned face wears it, clean and deliverable`, () => {
      const spec = generate(briefFor('frame', frame))
      expect(spec.studio?.direction.frame).toBe(frame)
      expect(front(spec)).toContain(`data-frame="${frame}"`)
      expect(spec.studio?.collisions).toEqual([])
      expect(spec.studio?.outOfBounds).toEqual([])
      expect(spec.preflight.exportOk).toBe(true)
    })
  }

  it('a ported motif keeps its proportions, takes the caller\'s colour and mirrors in place', () => {
    const m = paintMotif('cartouche-arc', 10, 20, 50, 50, '#c9a227')
    expect(m).toContain('data-motif="cartouche-arc"')
    expect(m).not.toContain('currentColor')
    expect(m).toContain('stroke="#c9a227"')
    const hull = svgHull(m)!
    // Fitted to the 50-wide box, so the arc is ~50 wide and ~24 tall, inside (10, 20)–(60, 70).
    expect(hull.minX).toBeGreaterThanOrEqual(10 - 1)
    expect(hull.maxX).toBeLessThanOrEqual(60 + 1)
    expect((hull.maxY - hull.minY) / (hull.maxX - hull.minX)).toBeLessThan(motifAspect('cartouche-arc') + 0.2)
    const flipped = svgHull(paintMotif('double-line-corner', 0, 0, 20, 20, '#000', { flipX: true }))!
    const plain = svgHull(paintMotif('double-line-corner', 0, 0, 20, 20, '#000'))!
    expect(flipped.minX).toBeCloseTo(20 - plain.maxX, 1)
  })
})

describe('the flat render modes', () => {
  const ink: HeroInk = { leafLight: '#5a9a6f', leaf: '#2d6a4f', leafMid: '#2a5c46', leafDeep: '#24503d', fruit: '#b5651d', fruitDeep: '#8f4f16', stem: '#233f33' }

  it('a silhouette is one ink and a cut paper adds only a shadow; neither draws a vein or a gradient', () => {
    for (const layout of ['spray', 'arch', 'wreath', 'sprig'] as const) {
      const silhouette = speciesHero('olive', 0, 0, 100, ink, 11, { layout, style: 'silhouette', uid: 's' })
      const fills = new Set([...silhouette.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]))
      expect(silhouette, layout).not.toMatch(/url\(#/)
      expect(fills.size, `${layout} silhouette inks`).toBeLessThanOrEqual(3)
      const paper = speciesHero('olive', 0, 0, 100, ink, 11, { layout, style: 'cut-paper', uid: 'p' })
      expect(paper, layout).not.toMatch(/url\(#/)
      expect(paper, layout).toMatch(/fill-opacity="0.42"/)
      const solid = speciesHero('olive', 0, 0, 100, ink, 11, { layout, style: 'solid', uid: 'p' })
      expect(paper).not.toBe(solid)
      expect(silhouette).not.toBe(solid)
    }
  })

  it('the personality decides the mode where it spoke, and a silent brief keeps the seed rule', () => {
    expect(subjectStyleFor(brandPersonality({ ...emptyBrief() }))).toBeUndefined()
    const heritage = brandPersonality({ ...emptyBrief(), feeling: 'köklü, klasik, zamansız', priceTier: 'boutique' })
    const lively = brandPersonality({ ...emptyBrief(), feeling: 'sıcak, neşeli, enerjik', audience: 'genç aileler' })
    const technical = brandPersonality({ ...emptyBrief(), feeling: 'teknik, hassas, sakin', channel: 'eczane' })
    const modes = [subjectStyleFor(heritage), subjectStyleFor(lively), subjectStyleFor(technical)]
    expect(new Set(modes.filter(Boolean)).size).toBeGreaterThanOrEqual(2)
    // Painted: a warm, lively brief on the specimen family draws its subject as cut paper.
    const spec = generate(jobBrief('07-bebek-etiket', { brandName: 'Nova', feeling: 'sıcak, neşeli, enerjik', audience: 'genç aileler', studioFamily: 'specimen', studioFamilyLocked: true }))
    const expected = subjectStyleFor(brandPersonality(spec.brief))
    expect(spec.studio?.direction.subjectStyle).toBe(expected)
    if (expected === 'cut-paper') expect(front(spec)).toMatch(/fill-opacity="0.42"/)
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.preflight.exportOk).toBe(true)
  })
})

describe('the strip reaches the languages', () => {
  it('cards cycle the field, and the picked card carries it back', () => {
    const brief = jobBrief('01-parfum-etiket', { brandName: 'Nova' })
    const offer = inspectStudioDirectionOffer(brief)
    const fields = offer.candidates.map((c) => c.fingerprint?.background)
    const card = offer.candidates.find((c) => !c.selected && FIELDS.includes(c.fingerprint?.background as BackgroundFamily))
    expect(card, `a card wearing a new field — strip had ${fields.join(', ')}`).toBeDefined()
    const pick = pickFromFingerprint(card!.fingerprint)
    expect(pick?.background).toBe(card!.fingerprint!.background)
    const picked = generate({ ...brief, studioFamily: card!.family, studioFamilyLocked: true, studioPick: pick })
    expect(picked.studio?.direction.background).toBe(card!.fingerprint!.background)
    expect(front(picked)).toContain(`data-bg="${card!.fingerprint!.background}"`)
  })
})
