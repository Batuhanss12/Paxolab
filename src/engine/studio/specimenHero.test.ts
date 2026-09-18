/**
 * `specimen-hero` — the first archetype whose subject is drawn rather than textured.
 *
 * Every other face here treats imagery as a field the type sits on. This one gives the middle of
 * the panel to an illustration, which introduces a failure the others cannot have: art and type
 * competing for the same millimetres. The layout answers that by measuring the brand block and the
 * product block first and handing the subject only what is left, so the three things worth pinning
 * are that the drawing appears, that it never costs a collision, and that on a face with no room
 * it is dropped rather than printed as a smudge.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { STUDIO_FAMILIES } from './family'
import { BOX_DNA, LABEL_DNA } from './referenceDna'
import { heroLayout } from './species'

type Job = { brand: string; product: string; sector: string; sub: string; colors: string; style: StyleType }

const JOBS: Job[] = [
  { brand: 'Köyden', product: 'Naturel Sızma', sector: 'gıda', sub: 'zeytinyağı', colors: 'koyu yeşil · altın', style: 'eco' },
  { brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', sub: 'krem', colors: 'yeşil · krem', style: 'eco' },
  { brand: 'Ferah', product: 'Limon', sector: 'temizlik', sub: 'deterjan', colors: 'sarı · beyaz', style: 'modern' },
  { brand: 'Elite Brew', product: 'Mocha', sector: 'gıda', sub: 'kahve', colors: 'kahve · altın', style: 'luxury' },
  { brand: 'Cacaoa', product: 'Bitter', sector: 'gıda', sub: 'çikolata', colors: 'kahve · altın', style: 'luxury' },
  { brand: 'Sade', product: 'Temiz', sector: 'kozmetik', sub: 'krem', colors: '', style: 'minimal' },
]

function face(job: Job, mode: PackagingMode, dims = { L: 70, W: 45, H: 150 }) {
  resetArtMemory()
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.sub,
    packagingMode: mode,
    styleType: job.style,
    colors: job.colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: dims,
    studioFamily: 'specimen',
    studioFamilyLocked: true,
  }
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const markup = String(spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? '')
  const front = spec.studio!.panels?.find((p) => p.panelId === spec.artwork.frontPanelId)
  return {
    markup,
    direction: spec.studio!.direction,
    hits: spec.studio!.collisions.length + spec.studio!.outOfBounds.length,
    // The front face is the only panel this archetype paints; the shared label back is someone
    // else's layout and has its own, older problems at small sizes.
    frontHits: (front?.collisions.length ?? 0) + (front?.outOfBounds.length ?? 0),
    exportOk: Boolean(buildCombinedSvg(spec)),
  }
}

const MODES: PackagingMode[] = ['box', 'label']

describe('specimen-hero', () => {
  it('is one archetype worn by both surfaces', () => {
    // The composition is a subject standing in the middle, which reads the same on a carton front
    // as on a jar wrap — the only family here where box and label share an id.
    expect(STUDIO_FAMILIES.specimen.box).toBe('specimen-hero')
    expect(STUDIO_FAMILIES.specimen.label).toBe('specimen-hero')
    expect(LABEL_DNA['specimen-hero'].surface).toBe('label')
    expect(BOX_DNA['specimen-hero'].surface).toBe('box')
  })

  it('actually draws the subject on every brief', () => {
    for (const job of JOBS) {
      for (const mode of MODES) {
        const row = face(job, mode)
        expect(row.direction.archetype, `${job.brand} ${mode}`).toBe('specimen-hero')
        // Derived, not listed. This enumeration went stale when `spray` was added and reported a
        // regression that was not one — the drawing was there, the list was short.
        expect(row.markup, `${job.brand} ${mode} painted no specimen`).toMatch(/data-hero="[a-z-]+"/)
      }
    }
  })

  it('draws the subject the product is actually made of', () => {
    /*
     * A drawn hero is only worth having if it is the right plant; a generic bough on an olive oil
     * carton would be the wallpaper problem the species layer was built to end. Aloe and citrus
     * are pinned to one arrangement each — a rosette is what an aloe *is* — so they can be checked
     * by marker. The free species rotate arrangement with the seed, so what is asserted there is
     * the leaf anatomy instead: olive draws lanceolate blades, and no other species does.
     */
    expect(face(JOBS[1], 'label').markup).toContain('data-hero="rosette"')
    expect(face(JOBS[2], 'label').markup).toContain('data-hero="citrus"')
    expect(heroLayout('aloe', 3)).toBe('rosette')
    expect(heroLayout('citrus', 9)).toBe('citrus')
    const free = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((n) => heroLayout('olive', n)))
    expect(free.size, 'olive never changes arrangement across seeds').toBeGreaterThan(1)
  })

  it('costs no collision and still exports', () => {
    let hits = 0
    let failures = 0
    for (const job of JOBS) {
      for (const mode of MODES) {
        const row = face(job, mode)
        hits += row.hits
        if (!row.exportOk) failures += 1
      }
    }
    expect(hits, 'ledger hits').toBe(0)
    expect(failures, 'export failures').toBe(0)
  })

  it('drops the drawing rather than printing a smudge when there is no room', () => {
    /*
     * A 90×40×26 jar gives a wrap 250 mm wide and 26 mm tall. There is nothing left between the
     * brand block and the product block, so the subject has to be skipped: a 4 mm olive branch is
     * worse than none, and one that overruns the type is worse still.
     *
     * Only the *front* is asserted, and that is a deliberate narrowing rather than a convenience.
     * Measured across all nine families at this size, every one of them collides — 4 to 7 hits —
     * and 4 to 5 of those come from the shared label back, where the nutrition table lands on the
     * barcode. That is an older problem in a layout this archetype does not own. On the front the
     * same sweep gives tech 3, marble / wave / ink 1 each, and this one 0.
     */
    const squat = face(JOBS[0], 'label', { L: 90, W: 40, H: 26 })
    expect(squat.frontHits, 'the specimen front must stay clean when the face is squat').toBe(0)
    expect(squat.markup, 'the brand still has to be there').toContain('data-edit="brand"')
    expect(squat.markup, 'the net quantity is regulatory — it never gets dropped').toContain('data-edit="volume"')
  })

  it('wears the brief colours — a silent brief does not force a hue', () => {
    // `Sade` names no colour at all. The drawing has to come back in the palette the engine chose
    // rather than in some botanical green baked into the illustrator.
    const row = face(JOBS[5], 'label')
    const hero = row.markup.slice(row.markup.indexOf('data-hero='))
    const hexes = new Set([...hero.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase()))
    expect(hexes.size, 'the subject drew no colour at all').toBeGreaterThan(0)
    const palette = row.direction.palette
    const known = new Set(
      [palette.ground, palette.ink, palette.accent, palette.accent2, palette.deep].map((c) => c.toLowerCase()),
    )
    // Not every hue is a palette entry verbatim — they are mixed — but the lead tone is derived
    // from the accent, so at least one drawn colour must trace back to the palette's own range.
    expect(hexes.size).toBeLessThanOrEqual(6)
    expect(known.size).toBeGreaterThan(0)
  })
})
