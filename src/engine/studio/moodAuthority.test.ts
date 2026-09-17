/**
 * L2-C — the layered control model, pinned.
 *
 * Reported by the owner, then measured: "I click the mood and nothing changes any more." It was
 * true. With any colour in the brief, all six moods produced the same ground and three of six
 * produced a byte-identical face. Three independent short-circuits stacked, each enough on its own:
 *
 *   1. `paletteFromBrief` let the brief decide the whole palette ("mood only tweaks contrast"),
 *   2. `temperamentFor` tested the sector before the style, so `sector === 'cream'` answered first,
 *   3. `varyFace` refused any temperament outside the archetype's own list, and `botanical-card`
 *      permits exactly one.
 *
 * None of the three is visible from the others' tests, which is why the knob could die silently.
 * This file tests the *contract* instead of the mechanism, so any future short-circuit anywhere in
 * the chain fails here:
 *
 *   Brief  → which colours exist          (locked; never dropped, never invented)
 *   Mood   → what those colours do        (ground, lightness, contrast — visibly different)
 *   Vary   → a new take on that decision  (arrangement moves, colour holds)
 *
 * It matters commercially, not just aesthetically: a credit is spent per change, so a control that
 * does nothing is a charge for nothing.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import type { DesignBrief, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { hsl } from './color'

const MOODS: StyleType[] = ['luxury', 'minimal', 'modern', 'eco', 'classic', 'playful']

type Job = { label: string; sector: string; subProduct: string; brand: string; colors: string }

const JOBS: Job[] = [
  // The brief that first showed the dead knob: `sector === 'cream'` short-circuited every mood.
  { label: 'krem / "yeşil · krem"', sector: 'kozmetik', subProduct: 'krem', brand: 'Verda', colors: 'yeşil · krem' },
  { label: 'kahve / "mermer · altın"', sector: 'gıda', subProduct: 'kahve', brand: 'Elite Brew', colors: 'mermer · altın' },
  { label: 'kulaklık / "antrasit · turuncu"', sector: 'elektronik', subProduct: 'kulaklık', brand: 'Nox', colors: 'antrasit · turuncu' },
  { label: 'zeytinyağı / "koyu yeşil · altın"', sector: 'gıda', subProduct: 'zeytinyağı', brand: 'Köyden', colors: 'koyu yeşil · altın' },
]

function briefOf(job: Job, mood: StyleType): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: 'Ürün',
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: 'box',
    styleType: mood,
    colors: job.colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

function run(brief: DesignBrief, variationIndex = 0) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex } })
  const face = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    ground: spec.studio!.direction.palette.ground,
    accent: spec.studio!.direction.palette.accent,
    temperament: spec.studio!.direction.temperament,
    hits: spec.studio!.collisions.length + spec.studio!.outOfBounds.length,
    hash: createHash('sha256').update(face).digest('hex').slice(0, 12),
  }
}

/** Shortest distance between two hues on the wheel. */
function hueGap(a: string, b: string): number {
  const d = Math.abs(hsl(a).h - hsl(b).h) % 360
  return d > 180 ? 360 - d : d
}

describe('L2-C · layer 2 — the mood decides the treatment', () => {
  for (const job of JOBS) {
    it(`${job.label}: six moods give six different grounds`, () => {
      const rows = MOODS.map((mood) => ({ mood, ...run(briefOf(job, mood)) }))
      // Every mood must produce a different face — that is the contract the credit is charged
      // against. Grounds are allowed one collision: on a near-neutral brief like marble, minimal
      // and classic legitimately arrive at almost the same paper.
      expect(new Set(rows.map((r) => r.hash)).size, `faces for ${job.label}`).toBe(MOODS.length)
      expect(new Set(rows.map((r) => r.ground)).size, `grounds for ${job.label}`).toBeGreaterThanOrEqual(MOODS.length - 1)
    })

    it(`${job.label}: every mood still lands a printable face`, () => {
      for (const mood of MOODS) expect(run(briefOf(job, mood)).hits, mood).toBe(0)
    })
  }

  it('the mood is predictable — the same mood always gives the same treatment', () => {
    for (const mood of MOODS) {
      const a = run(briefOf(JOBS[0], mood))
      const b = run(briefOf(JOBS[0], mood))
      expect(a.ground, mood).toBe(b.ground)
      expect(a.temperament, mood).toBe(b.temperament)
    }
  })

  it('no archetype may veto the mood', () => {
    // `botanical-card` declares only `vivid-mono`. The declaration is a ranking preference, paid
    // for in scoreArchetype's tempFit; it must not survive as a veto at paint time.
    const temps = new Set(MOODS.map((mood) => run(briefOf(JOBS[0], mood)).temperament))
    expect(temps.size, 'treatments reachable on a cream brief').toBeGreaterThan(3)
  })
})

describe('L2-C · layer 0 — the brief owns which colours exist', () => {
  it('the hue the brief leads with survives every mood, on the ground or on the accent', () => {
    // Green is green in all six. The mood may darken it, wash it, brighten it, or move it off the
    // ground onto the accent — `minimal` grounds on the brief's cream and lets the green do its
    // work in the type and the rule. What it may never do is drop the green entirely.
    const visible = (hex: string) => {
      const { s, l } = hsl(hex)
      return s >= 0.12 && l > 0.12 && l < 0.9
    }
    for (const mood of MOODS) {
      const { ground, accent } = run(briefOf(JOBS[0], mood))
      const carriers = [ground, accent].filter(visible)
      expect(carriers.length, `${mood} left no colour visible at all`).toBeGreaterThan(0)
      const nearest = Math.min(...carriers.map((hex) => hueGap(hex, '#2d6a4f')))
      expect(nearest, `${mood} dropped the brief's green (ground ${ground}, accent ${accent})`).toBeLessThan(60)
    }
  })

  it('a neutral brief never has a hue invented for it, in any mood', () => {
    for (const mood of MOODS) {
      const brief = { ...briefOf(JOBS[0], mood), colors: 'siyah · beyaz' }
      const { ground } = run(brief)
      const { s, l } = hsl(ground)
      expect(s < 0.25 || l < 0.15 || l > 0.85, `${mood} invented a hue: ${ground}`).toBe(true)
    }
  })

  it('the colour named first leads', () => {
    // Word order is the customer's own ranking. Table order used to win instead, so "pembe · mor"
    // came back purple-led purely because purple sits higher in NAMED.
    const pinkFirst = run({ ...briefOf(JOBS[0], 'playful'), colors: 'pembe · mor' })
    const purpleFirst = run({ ...briefOf(JOBS[0], 'playful'), colors: 'mor · pembe' })
    expect(hueGap(pinkFirst.ground, '#e59bb0'), `led with pink, got ${pinkFirst.ground}`).toBeLessThan(45)
    expect(hueGap(purpleFirst.ground, '#6b4f9e'), `led with purple, got ${purpleFirst.ground}`).toBeLessThan(45)
  })
})

describe('L2-C · layer 3 — varying is a new take, not a new decision', () => {
  for (const job of JOBS) {
    it(`${job.label}: six variations hold the mood's colour and still differ`, () => {
      const rows = [0, 1, 2, 3, 4, 5].map((v) => run(briefOf(job, 'luxury'), v))
      expect(new Set(rows.map((r) => r.ground)).size, 'grounds must stay put').toBe(1)
      expect(new Set(rows.map((r) => r.temperament)).size, 'treatment must stay put').toBe(1)
      expect(new Set(rows.map((r) => r.hash)).size, 'faces must still differ').toBe(rows.length)
      expect(rows.reduce((n, r) => n + r.hits, 0), 'ledger hits').toBe(0)
    })
  }
})
