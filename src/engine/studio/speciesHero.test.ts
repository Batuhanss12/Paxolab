/**
 * Hero illustrations — the three promises that make drawing better than placing a scan.
 *
 * 1. It wears the brief's colours. This is the whole reason the subject is drawn rather than a
 *    public-domain watercolour being embedded: a scanned olive is always olive-green. So the test
 *    that matters most is that no hue is hardcoded anywhere in the drawing.
 * 2. It stays print-safe vector — no filters, and no `NaN` in path data. The second is the real
 *    hazard here: the bough is laid out on a quadratic curve, and one bad divisor produces
 *    `d="M NaN NaN"`, which draws *nothing* and fails silently.
 * 3. Every species is distinguishable. `coffee` first came back as an olive bough with fatter
 *    leaves; a species that is merely parameterised differently is not a species.
 */
import { describe, expect, it } from 'vitest'
import { heroAspect, heroLayout, speciesFor, speciesHero, speciesLeaf, speciesTree, type HeroInk, type HeroLayout, type Species } from './species'

const ALL: Species[] = ['olive', 'coffee', 'tea', 'grain', 'citrus', 'cocoa', 'flora', 'conifer', 'aloe',
  'lavender', 'chamomile', 'rose', 'mint', 'grape', 'berry', 'blossom']

const INK: HeroInk = {
  leafLight: '#a8bd97',
  leaf: '#6f8f63',
  leafMid: '#5d7c54',
  leafDeep: '#4a6742',
  fruit: '#3d5236',
  fruitDeep: '#2c3a27',
  stem: '#5c6b4f',
}

const ALT: HeroInk = {
  leafLight: '#ef9ab4',
  leaf: '#d1567e',
  leafMid: '#b8446b',
  leafDeep: '#9c3457',
  fruit: '#f0834f',
  fruitDeep: '#c15a2c',
  stem: '#a8446a',
}

function draw(sp: Species, ink = INK, seed = 7) {
  return speciesHero(sp, 75, 75, 110, ink, seed)
}

describe('speciesHero', () => {
  it('invents no colour of its own', () => {
    /*
     * Any hex in the markup has to be one the caller passed. A single hardcoded green would mean
     * the illustration stops answering to the brief on some palettes and quietly clashes — which
     * is exactly the failure mode that ruled out embedding a scan in the first place.
     */
    const allowed = new Set(Object.values(INK).map((c) => c.toLowerCase()))
    for (const sp of ALL) {
      const hexes = [...draw(sp).matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0].toLowerCase())
      expect(hexes.length, `${sp} drew nothing`).toBeGreaterThan(0)
      for (const hex of hexes) {
        expect(allowed.has(hex), `${sp} used ${hex}, which is not in the supplied ink`).toBe(true)
      }
    }
  })

  it('recolours completely — nothing survives a palette swap', () => {
    // The counterpart to the test above: not just "no foreign hue" but "every hue actually moved".
    for (const sp of ALL) {
      const a = draw(sp, INK)
      const b = draw(sp, ALT, 7)
      expect(b, `${sp} did not change with the palette`).not.toBe(a)
      for (const hex of Object.values(INK)) {
        expect(b.toLowerCase(), `${sp} kept ${hex} after the swap`).not.toContain(hex.toLowerCase())
      }
    }
  })

  it('emits finite geometry — no NaN reaches the path data', () => {
    // A NaN in `d` draws nothing at all and throws no error. Worth pinning explicitly.
    for (const sp of ALL) {
      const markup = draw(sp)
      expect(markup, `${sp}`).not.toMatch(/NaN|Infinity|undefined/)
      const numbers = [...markup.matchAll(/-?\d+\.?\d*/g)].map((m) => Number.parseFloat(m[0]))
      expect(numbers.every((n) => Number.isFinite(n)), `${sp} emitted a non-finite number`).toBe(true)
    }
  })

  it('stays print-safe vector', () => {
    for (const sp of ALL) {
      const markup = draw(sp)
      expect(markup, `${sp}`).not.toContain('<filter')
      expect(markup, `${sp}`).not.toContain('<image')
      expect(markup, `${sp}`).toMatch(/<(path|ellipse|circle|g)/)
    }
  })

  it('draws a different picture for each species', () => {
    /*
     * Compared on shape only — the colours are identical across these calls, so two species that
     * differ merely in fill would still collide here, which is the point.
     */
    const shapes = new Map<string, Species>()
    for (const sp of ALL) {
      const geometry = draw(sp).replace(/(fill|stroke)="[^"]*"/g, '')
      const twin = shapes.get(geometry)
      // `conifer` is documented as sharing the neutral bough with `flora`; nothing else may.
      if (twin) expect([twin, sp].sort()).toEqual(['conifer', 'flora'])
      shapes.set(geometry, sp)
    }
  })

  it('is seeded — same seed, same drawing', () => {
    for (const sp of ALL) {
      expect(draw(sp, INK, 42)).toBe(draw(sp, INK, 42))
      if (sp !== 'citrus') expect(draw(sp, INK, 42)).not.toBe(draw(sp, INK, 43))
    }
  })

  it('routes the brief to a subject the customer would recognise', () => {
    expect(speciesFor({ productName: 'Aloe Mist', sector: 'kozmetik' })).toBe('aloe')
    expect(speciesFor({ subProduct: 'zeytinyağı' })).toBe('olive')
    expect(speciesFor({ subProduct: 'kahve' })).toBe('coffee')
    expect(speciesFor({ subProduct: 'limon' })).toBe('citrus')
    // The aloe rule is listed before the cosmetics fallback, which used to swallow it as `flora`.
    expect(speciesFor({ sector: 'kozmetik', subProduct: 'krem' })).toBe('flora')
  })
})

const LAYOUTS: HeroLayout[] = ['arch', 'sprig', 'wreath', 'crossed', 'rosette', 'citrus']

describe('speciesHero — the three axes', () => {
  it('renders every species in every arrangement without breaking geometry', () => {
    /*
     * Cross-product on purpose. The parameters used to mean different things in different
     * arrangements — `leafLen` was a fraction of the drawing in `rosette` and of the leaf in
     * `arch`, so forcing an aloe through an arch produced a blade longer than the panel. A table
     * of per-species numbers is only safe if every arrangement reads it the same way.
     */
    for (const sp of ALL) {
      for (const layout of LAYOUTS) {
        const markup = speciesHero(sp, 75, 75, 110, INK, 7, { layout })
        expect(markup, `${sp}/${layout}`).not.toMatch(/NaN|Infinity|undefined/)
        const nums = [...markup.replace(/#[0-9a-fA-F]{3,8}/g, '').matchAll(/-?\d+\.?\d*/g)].map((m) => Number.parseFloat(m[0]))
        expect(nums.every((n) => Number.isFinite(n)), `${sp}/${layout} non-finite`).toBe(true)
        /*
         * A bound on the largest number was tried here and removed. It read `#4a6742` as the
         * coordinate 6742 and failed on a drawing whose real extent was 35 — a green test would
         * have meant nothing and a red one pointed at the wrong thing. What actually guards the
         * scale is `heroAspect` agreeing with `heroLayout` (below) and the layout's own ledger box.
         */
      }
    }
  })

  it('draws a different arrangement for each layout', () => {
    for (const sp of ['olive', 'tea'] as Species[]) {
      const seen = new Set(['arch', 'sprig', 'wreath', 'crossed'].map((l) => speciesHero(sp, 75, 75, 110, INK, 7, { layout: l as HeroLayout })))
      expect(seen.size, `${sp} collapsed two arrangements into one drawing`).toBe(4)
    }
  })

  it('gives each species its own leaf outline', () => {
    /*
     * Shape is what names a plant. Held to one arrangement and one palette so the only thing that
     * can differ is the outline itself — an olive is lanceolate, a coffee ovate, a tea serrate,
     * and if two of them emit identical path data the anatomy table is not doing anything.
     */
    const paths = new Map<string, Species>()
    for (const sp of ['olive', 'coffee', 'tea', 'cocoa', 'grain'] as Species[]) {
      const key = speciesHero(sp, 75, 75, 110, INK, 3, { layout: 'sprig', style: 'engraved' }).replace(/[a-z-]+="[^"]*"/g, (m) =>
        m.startsWith('d=') ? m : '',
      )
      expect(paths.has(key), `${sp} shares its outline with ${paths.get(key)}`).toBe(false)
      paths.set(key, sp)
    }
  })

  it('engraved is a line language, not a filled one', () => {
    for (const sp of ALL) {
      const engraved = speciesHero(sp, 75, 75, 110, INK, 7, { style: 'engraved' })
      const solid = speciesHero(sp, 75, 75, 110, INK, 7, { style: 'solid' })
      expect(engraved, `${sp} engraved drew no stroke`).toContain('stroke=')
      expect(engraved, `${sp} engraved is identical to solid`).not.toBe(solid)
      // A few fills survive on purpose (the rosette's foot shadow); what must not survive is the
      // leaf body, which is the whole point of the mode.
      const leafFills = [...engraved.matchAll(/<path d="M0 0[^"]*" fill="#/g)].length
      expect(leafFills, `${sp} engraved still filled its leaves`).toBe(0)
    }
  })

  it('the aspect it reports is the arrangement it will draw', () => {
    // The caller sizes the band from `heroAspect`; if the two disagreed the drawing would be sized
    // for one composition and painted as another.
    for (const sp of ALL) {
      for (const seed of [0, 1, 2, 3, 11, 47]) {
        const layout = heroLayout(sp, seed)
        const aspect = heroAspect(sp, seed)
        expect(aspect, `${sp}@${seed}`).toBeGreaterThan(0.4)
        expect(aspect, `${sp}@${seed}`).toBeLessThanOrEqual(1)
        if (layout === 'arch') expect(aspect).toBeLessThan(0.7)
        if (layout === 'sprig') expect(aspect).toBe(1)
      }
    }
  })
})

const FLOWERING: Species[] = ['lavender', 'chamomile', 'rose', 'grape', 'berry', 'blossom']

describe('speciesHero — blooms', () => {
  it('every flowering species actually flowers', () => {
    /*
     * The gap this closes: every species used to be leaves plus fruit, which is a crop vocabulary.
     * Cosmetics, baby care and perfume — the sectors Paxolab prints most of — speak in blooms, and
     * a lavender without its spike is not lavender.
     */
    for (const sp of FLOWERING) {
      const withBloom = speciesHero(sp, 75, 75, 110, INK, 7, { layout: 'sprig' })
      expect(withBloom, `${sp} drew no bloom`).toMatch(/data-bloom="(daisy|spike|umbel|cup|cluster)"/)
    }
    // And the non-flowering ones stay non-flowering: a marker that appears everywhere proves nothing.
    for (const sp of ['olive', 'mint', 'tea', 'aloe'] as Species[]) {
      expect(speciesHero(sp, 75, 75, 110, INK, 7, { layout: 'sprig' }), `${sp} grew a flower it has not got`).not.toContain('data-bloom=')
    }
  })

  it('each bloom kind is its own drawing, and a shared head is separated some other way', () => {
    /*
     * Held to one arrangement and one seed, so the only thing that can differ is the flower.
     *
     * Two pairs share a head on purpose. A currant and a grape are the same drawing at this scale.
     * And honey's blossom is a daisy because a daisy is the shape a reader names as "flower" —
     * chamomile is literally one — so those two are told apart by the bee instead, which is the
     * mark that makes a honey pack say honey rather than say botany.
     */
    const ALLOWED_TWINS = [
      ['berry', 'grape'],
      ['blossom', 'chamomile'],
    ]
    const heads = new Map<string, Species>()
    for (const sp of FLOWERING) {
      const key = (speciesHero(sp, 75, 75, 110, INK, 5, { layout: 'sprig', style: 'solid' }).match(/data-bloom="\w+"/) ?? [''])[0]
      const twin = heads.get(key)
      if (twin) expect(ALLOWED_TWINS).toContainEqual([twin, sp].sort())
      heads.set(key, sp)
    }
  })

  it('honey carries the bee, and nothing else does', () => {
    const honey = speciesHero('blossom', 75, 75, 110, INK, 5, { layout: 'sprig', style: 'solid' })
    expect(honey, 'no bee on the honey drawing').toMatch(/data-hero-mark="bee"/)
    for (const sp of FLOWERING) {
      if (sp === 'blossom') continue
      expect(speciesHero(sp, 75, 75, 110, INK, 5, { layout: 'sprig', style: 'solid' }), `${sp} grew a bee`).not.toMatch(
        /data-hero-mark="bee"/,
      )
    }
  })

  it('the new species have scenery silhouettes of their own', () => {
    /*
     * Found by measuring rather than by reading: adding species to the union left them falling
     * through `speciesTree`'s default, so a lavender field would have grown conifers. The hero and
     * the hillside have to agree about what the plant is.
     */
    const pine = speciesTree('conifer', 10, 20, 8, '#000')
    for (const sp of [...FLOWERING, 'mint'] as Species[]) {
      expect(speciesTree(sp, 10, 20, 8, '#000'), `${sp} still draws a conifer on the hillside`).not.toBe(pine)
    }
    // And the small-scale leaf too, for the ones whose foliage is genuinely not the neutral broad.
    const broad = speciesLeaf('flora', 5, 5, 6, 0, '#000', 1)
    for (const sp of ['lavender', 'chamomile', 'berry', 'blossom'] as Species[]) {
      expect(speciesLeaf(sp, 5, 5, 6, 0, '#000', 1), `${sp} sprig fell back to the neutral leaf`).not.toBe(broad)
    }
  })
})
