/**
 * L2-B — arrangement inside the archetype.
 *
 * Measured 2026-09-17: 28 briefs landed on 7 archetypes, and two brands in the same category
 * with similar briefs got the same skeleton. The archetype pool is the ceiling (8 box faces), so
 * variety has to come from *within* a face: the same skeleton with the weight in a different
 * place. The variant is derived from the brief's own seed, so it needs no extra user input.
 */
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { LAYOUT_VARIANTS } from './direction'

function coffee(brand: string, product = 'Kavurma'): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: brand,
    productName: product,
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    styleType: 'luxury',
    colors: 'mermer · altın',
    volume: '250 g',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

function run(brief: DesignBrief) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const face = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    archetype: spec.studio!.direction.archetype,
    variant: spec.studio!.direction.variant,
    hits: (spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0),
    hash: createHash('sha256').update(face).digest('hex').slice(0, 12),
  }
}

const BRANDS = ['Elite Brew', 'Roast Co', 'Kahve Evi', 'Nord', 'Vesta', 'Kuzey', 'Mavi Fincan']

describe('L2-B — the same archetype produces different arrangements', () => {
  it('stays inside the declared variant range', () => {
    for (const brand of BRANDS) {
      const { variant } = run(coffee(brand))
      expect(variant, brand).toBeGreaterThanOrEqual(0)
      expect(variant, brand).toBeLessThan(LAYOUT_VARIANTS)
    }
  })

  it('spreads brands across arrangements instead of pinning one', () => {
    const variants = new Set(BRANDS.map((b) => run(coffee(b)).variant))
    // Seven brands in one category must not collapse onto a single arrangement.
    expect(variants.size).toBeGreaterThan(1)
  })

  it('same archetype + different arrangement means a different face', () => {
    const rows = BRANDS.map((b) => ({ brand: b, ...run(coffee(b)) }))
    const sameArchetype = rows.filter((r) => r.archetype === rows[0].archetype)
    expect(sameArchetype.length).toBeGreaterThan(2)
    const pair = sameArchetype.find((r) => r.variant !== sameArchetype[0].variant)
    expect(pair, 'no differing arrangement found').toBeTruthy()
    expect(pair!.hash).not.toBe(sameArchetype[0].hash)
  })

  it('no arrangement pushes anything out of its box', () => {
    for (const brand of BRANDS) {
      expect(run(coffee(brand)).hits, brand).toBe(0)
    }
  })

  it('is deterministic — the same brand always gets the same arrangement', () => {
    const a = run(coffee('Elite Brew'))
    const b = run(coffee('Elite Brew'))
    expect(a.variant).toBe(b.variant)
    expect(a.hash).toBe(b.hash)
  })

  it('the arrangement follows the brand, not the clock', () => {
    // Two brands that differ only by name must be allowed to differ in arrangement.
    const all = new Set(['Aaa', 'Bbb', 'Ccc', 'Ddd', 'Eee', 'Fff'].map((b) => run(coffee(b)).variant))
    expect(all.size).toBeGreaterThan(1)
  })
})

/** Every box archetype that carries arrangements must actually spread across them. */
const VARIED_FACES: { label: string; brief: (brand: string) => DesignBrief }[] = [
  {
    label: 'dark-landscape',
    brief: (brand) => ({ ...coffee(brand, 'Seri'), sector: 'kozmetik', subProduct: 'parfüm', colors: 'siyah · altın', styleType: 'luxury' }),
  },
  {
    label: 'diagonal-tech',
    brief: (brand) => ({ ...coffee(brand, 'Seri'), sector: 'elektronik', subProduct: 'kulaklık', colors: 'antrasit · turuncu', styleType: 'modern' }),
  },
  {
    label: 'botanical-card',
    brief: (brand) => ({ ...coffee(brand, 'Onarıcı'), sector: 'kozmetik', subProduct: 'şampuan', colors: 'yeşil · krem', styleType: 'eco' }),
  },
  {
    label: 'wave-panel',
    brief: (brand) => ({ ...coffee(brand, 'Limon'), sector: 'temizlik', subProduct: 'deterjan', colors: 'mavi · beyaz', styleType: 'modern' }),
  },
]

describe('L2-B — every varied archetype spreads', () => {
  for (const face of VARIED_FACES) {
    it(`${face.label}: seven brands land on more than one arrangement, with distinct faces`, () => {
      const rows = BRANDS.map((b) => run(face.brief(b)))
      expect(new Set(rows.map((r) => r.variant)).size, 'arrangements').toBeGreaterThan(1)
      expect(new Set(rows.map((r) => r.hash)).size, 'faces').toBe(BRANDS.length)
      expect(rows.reduce((n, r) => n + r.hits, 0), 'ledger hits').toBe(0)
    })
  }
})
