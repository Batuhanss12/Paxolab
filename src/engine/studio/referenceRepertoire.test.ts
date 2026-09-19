/**
 * F-32 — the second repertoire: eight other designs, on every surface, without touching the first.
 *
 * Four promises. The default offer is exactly what it always was. Asking for the other set gives
 * eight different families, painted, clean and deliverable, on labels, cartons, discs, ovals and
 * swing tags. Picking one of them brings that design back. And the two sets never mix: a strip is
 * one repertoire or the other, and a pin only resolves inside the set it belongs to.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { inspectStudioDirectionOffer } from './directionTalk'
import { familyRepertoire, REFERENCE_FAMILIES, STUDIO_FAMILIES } from './family'
import { archetypesFor, dnaFor, pickFromFingerprint, repertoireOf } from './referenceDna'
import { isReferenceArchetype } from './refArchetypes'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'
import type { StudioFamily } from './types'

const STUDIO_FAMILY_LIST: StudioFamily[] = ['marble', 'botanical', 'line-scene', 'wave', 'ink', 'dark-luxe', 'tech', 'specimen', 'atelier', 'crest']

/** The surfaces the owner named: carton, flat label, round, oval, swing tag. */
const SURFACES: { key: string; slug: string; templateId?: string }[] = [
  { key: 'etiket', slug: '05-kahve-etiket' },
  { key: 'kutu', slug: '05-kahve-kutu' },
  { key: 'yuvarlak', slug: '02-krem-etiket', templateId: 'fm-lid-round' },
  { key: 'oval', slug: '02-krem-etiket', templateId: 'fm-label-oval' },
  { key: 'aski', slug: '02-krem-etiket', templateId: 'fm-kit-hangtag' },
]

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

describe('the two sets are separate and complete', () => {
  it('eight archetypes each, on both surfaces, and no id in both', () => {
    for (const surface of ['label', 'box'] as const) {
      const studio = archetypesFor(surface, 'studio')
      const reference = archetypesFor(surface, 'reference')
      expect(studio.length, `${surface} studio`).toBe(10)
      expect(reference.length, `${surface} reference`).toBe(8)
      const ids = new Set(studio.map((d) => d.id))
      for (const dna of reference) expect(ids.has(dna.id), `${dna.id} is in both sets`).toBe(false)
      for (const dna of reference) expect(isReferenceArchetype(dna.id), `${dna.id} has no painter`).toBe(true)
      // The default pool is the studio set — this is what every existing caller gets.
      expect(archetypesFor(surface).map((d) => d.id)).toEqual(studio.map((d) => d.id))
    }
  })

  it('every family knows its repertoire, and each set owns its own archetypes', () => {
    expect(REFERENCE_FAMILIES.length).toBe(8)
    for (const family of STUDIO_FAMILY_LIST) expect(familyRepertoire(family), family).toBe('studio')
    for (const family of REFERENCE_FAMILIES) {
      expect(familyRepertoire(family), family).toBe('reference')
      expect(repertoireOf(STUDIO_FAMILIES[family].label), family).toBe('reference')
      expect(repertoireOf(STUDIO_FAMILIES[family].box), family).toBe('reference')
    }
    expect(familyRepertoire(undefined)).toBeUndefined()
  })
})

describe('asking for the other designs', () => {
  it('the default strip is the first set, and the flag swaps all eight', () => {
    for (const slug of ['05-kahve-etiket', '01-parfum-kutu']) {
      resetArtMemory()
      const before = inspectStudioDirectionOffer(jobBrief(slug))
      resetArtMemory()
      const after = inspectStudioDirectionOffer(jobBrief(slug, { studioRepertoire: 'reference' }))
      expect(before.candidates.length).toBe(8)
      expect(after.candidates.length).toBe(8)
      for (const row of before.candidates) expect(STUDIO_FAMILY_LIST, `${slug} default`).toContain(row.family)
      for (const row of after.candidates) expect(REFERENCE_FAMILIES, `${slug} swapped`).toContain(row.family)
      // Not one design survives the swap — "change the designs" means what it says.
      const shared = after.candidates.filter((row) => before.candidates.some((b) => b.archetype === row.archetype))
      expect(shared, `${slug} kept a design across the swap`).toEqual([])
    }
  })

  it('a strip never mixes the two sets', () => {
    for (const repertoire of ['studio', 'reference'] as const) {
      const offer = inspectStudioDirectionOffer(jobBrief('05-kahve-etiket', { studioRepertoire: repertoire }))
      const sets = new Set(offer.candidates.map((row) => repertoireOf(row.archetype)))
      expect([...sets]).toEqual([repertoire])
      // Eight different families, so the strip is an offer and not the same design eight times.
      expect(new Set(offer.candidates.map((row) => row.family)).size).toBe(8)
    }
  })

  it('a pinned family carries its own repertoire, even with no flag set', () => {
    for (const family of REFERENCE_FAMILIES) {
      const spec = generate(jobBrief('05-kahve-etiket', { studioFamily: family, studioFamilyLocked: true }))
      expect(spec.studio?.direction.archetype, family).toBe(STUDIO_FAMILIES[family].label)
    }
    /*
     * And the precedence when both speak: the flag wins. Pressing "change the designs" is the later
     * act — it happens *after* a family was pinned — so a family left behind by the set being left
     * must not drag the customer back into it. (The app clears the pin on the swap anyway; this is
     * the guard for the brief that arrives with both already set.)
     */
    const stale = generate(jobBrief('05-kahve-etiket', { studioRepertoire: 'reference', studioFamily: 'marble', studioFamilyLocked: true }))
    expect(REFERENCE_FAMILIES).toContain(stale.brief.studioFamily)
  })
})

describe('the eight paint on every surface the owner named', () => {
  for (const surface of SURFACES) {
    it(`${surface.key}: all eight are clean, deliverable and their own design`, () => {
      const seen = new Set<string>()
      const faces = new Set<string>()
      for (const family of REFERENCE_FAMILIES) {
        const spec = generate(
          jobBrief(surface.slug, {
            ...(surface.templateId ? { templateId: surface.templateId } : {}),
            studioRepertoire: 'reference',
            studioFamily: family,
            studioFamilyLocked: true,
          }),
        )
        const d = spec.studio?.direction
        expect(d?.archetype, `${surface.key}/${family}`).toBe(STUDIO_FAMILIES[family].label)
        expect(spec.studio?.collisions, `${surface.key}/${family} çarpışma`).toEqual([])
        expect(spec.studio?.outOfBounds, `${surface.key}/${family} taşma`).toEqual([])
        expect(spec.preflight.exportOk, `${surface.key}/${family} export`).toBe(true)
        expect(spec.studio!.minTextMm, `${surface.key}/${family} baskı tabanı`).toBeGreaterThanOrEqual(1.5)
        expect(spec.craftScore?.visualCraft ?? 0, `${surface.key}/${family} craft`).toBeGreaterThanOrEqual(60)
        /*
         * Every face says which skeleton painted it. On a rectangle that is one per family; a
         * round cut and a swing tag have no corners to hang a crown, a window or a grid off, so
         * the eight collapse into three round skeletons (`data-round`) and tell themselves apart
         * by field, type system and subject instead. Either way the eight faces are eight faces.
         */
        const mark = /data-composition="([a-z-]+)"/.exec(front(spec))?.[1]
        expect(mark, `${surface.key}/${family} imzasız`).toBeTruthy()
        const kind = /data-round="([a-z]+)"/.exec(front(spec))?.[1]
        seen.add(kind ? `${mark}/${kind}` : mark!)
        faces.add(front(spec))
      }
      expect(faces.size, `${surface.key}: sekiz yüz sekiz tasarım değil`).toBe(8)
      expect(seen.size, `${surface.key}: iskelet çeşidi`).toBeGreaterThanOrEqual(3)
    })
  }

  it('a round label and a swing tag take the reference skeletons, not the studio ones', () => {
    const round = generate(jobBrief('02-krem-etiket', { templateId: 'fm-lid-round', studioRepertoire: 'reference', studioFamily: 'acid', studioFamilyLocked: true }))
    expect(front(round)).toContain('data-composition="ref-round"')
    const tag = generate(jobBrief('02-krem-etiket', { templateId: 'fm-kit-hangtag', studioRepertoire: 'reference', studioFamily: 'arch', studioFamilyLocked: true }))
    expect(front(tag)).toContain('data-composition="ref-tag"')
    // The studio repertoire keeps the painters it always had on those surfaces.
    const studioRound = generate(jobBrief('02-krem-etiket', { templateId: 'fm-lid-round', studioFamily: 'marble', studioFamilyLocked: true }))
    expect(front(studioRound)).not.toContain('data-composition="ref-round"')
  })
})

describe('the press floor holds across sectors and moods', () => {
  /*
   * Found by `measure-repertoires.ts`: the monospace grid set its body lines at 1.40 mm on a serum
   * carton — under the 1.5 mm press floor — and the export gate refused twelve of the sweep's 216
   * faces. One gallery job per family could not have caught it; the shape of the panel is what
   * decides, so the guard walks a few sectors and moods instead.
   */
  const SECTORS: { sector: string; subProduct: string; dimensionsMm: { L: number; W: number; H: number } }[] = [
    { sector: 'kozmetik', subProduct: 'serum', dimensionsMm: { L: 38, W: 38, H: 105 } },
    { sector: 'gıda', subProduct: 'kahve', dimensionsMm: { L: 80, W: 55, H: 180 } },
    { sector: 'elektronik', subProduct: 'kulaklık', dimensionsMm: { L: 90, W: 90, H: 45 } },
  ]

  it('every reference design clears 1.5 mm and exports, on narrow and squat cartons too', () => {
    for (const row of SECTORS) {
      for (const mood of ['luxury', 'minimal', 'playful'] as const) {
        for (const family of REFERENCE_FAMILIES) {
          const spec = generate({
            ...emptyBrief(),
            brandName: 'Meridian',
            productName: 'Aurum',
            sector: row.sector,
            subProduct: row.subProduct,
            packagingMode: 'box',
            styleType: mood,
            colors: 'koyu yeşil · altın',
            volume: '250 ml',
            dimensionsMm: row.dimensionsMm,
            barcode: '8690000000017',
            studioRepertoire: 'reference',
            studioFamily: family,
            studioFamilyLocked: true,
          })
          const where = `${row.subProduct}/${mood}/${family}`
          expect(spec.studio!.minTextMm, `${where} baskı tabanı`).toBeGreaterThanOrEqual(1.5)
          expect(spec.studio?.collisions, `${where} çarpışma`).toEqual([])
          expect(spec.preflight.exportOk, `${where} export`).toBe(true)
        }
      }
    }
  })
})

describe('a carton is one design on every panel', () => {
  /*
   * Measured before this guard, with a dieline on screen: the eight archetypes were front-only
   * painters. `paintBoxBack` and `paintBoxSide` read the incoming archetype as
   * `d.archetype as BoxArchetype`, so the eight new names matched no branch, fell silently to the
   * default, and the cast stopped the compiler from saying so. The front carried the arch, the
   * medallion and the frame; no other panel carried any of it, and 116 of 614 reference panels
   * wore the generic sector glyph on a carton whose face never showed a mark at all.
   */
  /*
   * The panels a customer sees face-on: the two sides, the back and the lid. The glue flap hides
   * under the seam and the tuck and dust wings fold inside, so they are painted by `paintGlue` /
   * `paintBoxFlap` and dressed by nobody — dressing what nobody sees is not what this is about.
   */
  const SEEN = ['left', 'right', 'back', 'top', 'bottom']
  const panels = (spec: DesignSpec) => spec.artwork.layers.filter((l) => l.panelId !== spec.artwork.frontPanelId && SEEN.includes(l.panelId))
  const wearsMark = (markup: string) => /data-art="brand-(?:mark|logo)"/.test(markup)

  it('every reference archetype dresses its own back and sides', () => {
    for (const family of REFERENCE_FAMILIES) {
      const spec = generate(jobBrief('01-parfum-kutu', { studioRepertoire: 'reference', studioFamily: family, studioFamilyLocked: true }))
      const where = `${family}/${spec.studio?.direction.archetype}`
      const others = panels(spec)
      expect(others.length, `${where} ikincil panel yok`).toBeGreaterThan(2)
      for (const layer of others) {
        // The archetype's own outline, not the shared rectangular frame.
        expect(layer.markup, `${where} · ${layer.panelId} giysisiz`).toMatch(/data-art="frame" data-skin="(arch|crest|plate|rule)"/)
      }
    }
  })

  it('no panel wears a brand mark the face never showed', () => {
    for (const family of REFERENCE_FAMILIES) {
      for (const slug of ['01-parfum-kutu', '04-gida-bal-kutu']) {
        const spec = generate(jobBrief(slug, { studioRepertoire: 'reference', studioFamily: family, studioFamilyLocked: true }))
        if (wearsMark(front(spec))) continue
        for (const layer of panels(spec)) {
          expect(wearsMark(layer.markup), `${family}/${slug} · ${layer.panelId} yüzün göstermediği işareti takıyor`).toBe(false)
        }
      }
    }
  })
})

describe('the engraved collage is a collage', () => {
  /*
   * Measured before this guard: the window held one drawing of one plant spanning a third of the
   * plate, with the arch empty around it — which is a specimen label, and the studio already has
   * one. R16 and R05 layer several engraved subjects, and that layering is the whole language.
   */
  const plates = (markup: string) => [...markup.matchAll(/data-plate="([a-z]+)"/g)].map((m) => m[1])

  it('lays several plates of different plants, seals the foot, and stays clean', () => {
    for (const slug of ['05-kahve-etiket', '01-parfum-kutu', '02-krem-etiket', '04-gida-bal-kutu']) {
      const spec = generate(jobBrief(slug, { studioRepertoire: 'reference', studioFamily: 'collage', studioFamilyLocked: true }))
      const face = front(spec)
      const laid = plates(face)
      expect(laid.length, `${slug} plaka sayısı`).toBeGreaterThanOrEqual(3)
      expect(new Set(laid).size, `${slug} tek bitki tekrar ediyor`).toBeGreaterThanOrEqual(2)
      expect(face, `${slug} mühür`).toContain('data-art="seal"')
      // The lead plate is the product's own plant; the others are its companions.
      expect(laid, `${slug} ürünün kendi bitkisi yok`).toContain(spec.studio!.direction.archetype === 'collage-plate' ? laid[laid.length - 1] : laid[0])
      expect(spec.studio?.collisions, `${slug} çarpışma`).toEqual([])
      expect(spec.preflight.exportOk, `${slug} export`).toBe(true)
    }
  })

  it('drops the satellites rather than the design when the plate is small', () => {
    // A 38 × 76 mm swing tag: too small for three plates, and still a face that prints.
    const spec = generate(jobBrief('02-krem-etiket', { templateId: 'fm-kit-hangtag', studioRepertoire: 'reference', studioFamily: 'collage', studioFamilyLocked: true }))
    expect(spec.studio?.collisions).toEqual([])
    expect(spec.preflight.exportOk).toBe(true)
    expect(front(spec)).toMatch(/data-hero="/)
  })

  /*
   * Measured before this guard: on a wide face the arch never fitted under the wordmark and the
   * window was dropped on 48 of the 216 sweep faces (22%) — the archetype degraded to type on an
   * empty ground, which is the one thing it must not be. A wide face now reads the same grammar
   * across instead of down: the plate takes the left column, the type the right.
   */
  it('turns the plate on its side rather than dropping it when the face is wide', () => {
    const wide = generate(
      jobBrief('02-krem-etiket', {
        studioRepertoire: 'reference',
        studioFamily: 'collage',
        studioFamilyLocked: true,
        dimensionsMm: { L: 120, W: 0, H: 70 },
      }),
    )
    const panel = wide.dieline.panels.find((p) => p.id === wide.artwork.frontPanelId)!
    expect(panel.w, 'yüz yatık değil — kapı yanlış şeyi ölçüyor').toBeGreaterThanOrEqual(panel.h * 1.15)
    const face = front(wide)
    const win = /<rect x="([-\d.]+)" y="[-\d.]+" width="([\d.]+)" height="([\d.]+)"[^>]*data-art="window"/.exec(face)
    expect(win, 'yatık yüzde pencere yok').not.toBeNull()
    // The plate holds its own column: the window lives in the left half and is worth drawing in.
    const [x, w, h] = [Number(win![1]), Number(win![2]), Number(win![3])]
    expect(x + w / 2, 'pencere sol sütunda değil').toBeLessThan(panel.w * 0.5)
    expect(w * h, 'pencere yüzün altıda birinden küçük').toBeGreaterThan(panel.w * panel.h * 0.16)
    expect(plates(face).length, 'yatık yüzde kolaj yok').toBeGreaterThanOrEqual(3)
    expect(wide.studio?.collisions).toEqual([])
    expect(wide.preflight.exportOk).toBe(true)
  })

  it('a range shares its plate: same brand and surface, different SKU, same plants', () => {
    const base = { studioRepertoire: 'reference' as const, studioFamily: 'collage' as const, studioFamilyLocked: true }
    const one = generate(jobBrief('05-kahve-etiket', { ...base, productName: 'Cold Brew' }))
    const two = generate(jobBrief('05-kahve-etiket', { ...base, productName: 'Filtre Kahve' }))
    expect(plates(front(one))).toEqual(plates(front(two)))
  })
})

describe('clicking a card brings that design back', () => {
  it('the family and the fingerprint of a reference card resolve to the same face', () => {
    const brief = jobBrief('05-kahve-etiket', { studioRepertoire: 'reference' })
    const offer = inspectStudioDirectionOffer(brief)
    for (const card of offer.candidates) {
      const picked = generate({
        ...brief,
        studioFamily: card.family,
        studioFamilyLocked: true,
        studioPick: pickFromFingerprint(card.fingerprint),
      })
      const d = picked.studio!.direction
      expect(d.archetype, `${card.index}. ${card.family}`).toBe(card.archetype)
      expect(d.lockup, `${card.index} lockup`).toBe(card.fingerprint?.lockup)
      expect(d.background, `${card.index} alan`).toBe(card.fingerprint?.background)
      expect(d.typePairing, `${card.index} tip`).toBe(card.fingerprint?.typePairing)
    }
  })
})

describe('the first set is untouched', () => {
  it('every studio family still paints its own archetype, clean, on a label and a carton', () => {
    for (const family of STUDIO_FAMILY_LIST) {
      for (const [slug, surface] of [['05-kahve-etiket', 'label'], ['05-kahve-kutu', 'box']] as const) {
        const spec = generate(jobBrief(slug, { studioFamily: family, studioFamilyLocked: true }))
        expect(spec.studio?.direction.archetype, `${family}/${surface}`).toBe(STUDIO_FAMILIES[family][surface])
        expect(isReferenceArchetype(spec.studio!.direction.archetype), `${family}/${surface} sızdı`).toBe(false)
        expect(spec.studio?.collisions, `${family}/${surface}`).toEqual([])
        expect(spec.preflight.exportOk, `${family}/${surface}`).toBe(true)
      }
    }
  })

  it('the reference archetypes carry a DNA row on both surfaces with their reference recorded', () => {
    for (const family of REFERENCE_FAMILIES) {
      for (const surface of ['label', 'box'] as const) {
        const dna = dnaFor(STUDIO_FAMILIES[family][surface === 'label' ? 'label' : 'box'], surface)
        expect(dna.repertoire, `${family}/${surface}`).toBe('reference')
        expect(dna.reference, `${family}/${surface} reference`).toMatch(/R\d\d/)
        expect(dna.anatomy.length, `${family}/${surface} anatomy`).toBeGreaterThan(2)
        expect(dna.summaryTr.length, `${family}/${surface} özet`).toBeGreaterThan(20)
      }
    }
  })
})
