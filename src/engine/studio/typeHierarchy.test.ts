/**
 * Something on the face has to lead.
 *
 * Found by looking at ten generated fronts and then measuring why they read flat. The brand and the
 * product name were each clamped by their own hand-tuned ceiling, and the ceilings happened to land
 * near each other: eight of ten came back within 1.4×, and five shared the *identical* pair
 * 8.3 mm / 7.7 mm — proof it was not the content deciding. Nothing in any layout had decided which
 * element leads, so nothing led. The two faces that did read well were only accidentally right;
 * `dark-landscape` happened to be tuned 12 / 6.5.
 *
 * The rule is now one function, `secondaryMax`, applied to the brand's **drawn** size rather than
 * its ceiling — because on the column variants the brand itself has to shrink, and relating the
 * product to a ceiling the brand never reached put the product *above* the brand it belongs to.
 *
 * What is pinned here is the relationship, not a number: the leading tier must be clearly ahead of
 * the next one, on every archetype, in both surfaces, without costing a collision or an export.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode, StyleType } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { secondaryMax } from './anatomy'

type Job = { brand: string; product: string; sector: string; sub: string; colors: string; style: StyleType }

const JOBS: Job[] = [
  { brand: 'Noctis', product: 'Gece', sector: 'kozmetik', sub: 'parfüm', colors: 'siyah · altın', style: 'luxury' },
  { brand: 'Köyden', product: 'Naturel Sızma', sector: 'gıda', sub: 'zeytinyağı', colors: 'koyu yeşil · altın', style: 'eco' },
  { brand: 'Elite Brew', product: 'Mocha', sector: 'gıda', sub: 'kahve', colors: 'mermer · altın', style: 'luxury' },
  { brand: 'Verda', product: 'Aloe Mist', sector: 'kozmetik', sub: 'krem', colors: 'yeşil · krem', style: 'eco' },
  { brand: 'Nox', product: 'Pulse Buds', sector: 'elektronik', sub: 'kulaklık', colors: 'antrasit · turuncu', style: 'modern' },
  { brand: 'Yayla', product: 'Çiçek Balı', sector: 'gıda', sub: 'bal', colors: 'altın · sıcak', style: 'classic' },
  { brand: 'Cacaoa', product: 'Bitter', sector: 'gıda', sub: 'çikolata', colors: 'kahve · altın', style: 'luxury' },
  { brand: 'Clinia', product: 'B5 Serum', sector: 'kozmetik', sub: 'serum', colors: 'beyaz · mavi', style: 'minimal' },
  { brand: 'Ferah', product: 'Limon', sector: 'temizlik', sub: 'deterjan', colors: 'mavi · beyaz', style: 'modern' },
  { brand: 'Sleek', product: 'Volume', sector: 'kozmetik', sub: 'şampuan', colors: 'siyah · beyaz', style: 'modern' },
]

function briefOf(job: Job, mode: PackagingMode): DesignBrief {
  return {
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
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

function face(job: Job, mode: PackagingMode, variationIndex: number) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: briefOf(job, mode),
    overridePatch: { studio: true, variationIndex },
  })
  const markup = String(spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? '')
  /*
   * The defect was never "two similar numbers on the face" — it was the *brand* and the *product*
   * landing equal by accident, because each hit its own ceiling. Two close sizes inside one lockup
   * are ordinary craft: `botanical-card` sets a script prefix just above the product name, and
   * `titleCard` is meant to lead while the brand sits in a small pill. A blanket rule over raw tiers
   * called that a defect and would have pushed a good face apart.
   *
   * So the measurement follows the markup's own labels. Whichever of the two leads, it has to lead
   * clearly; which one it is belongs to the archetype.
   */
  const groupMax = (edit: string) => {
    // Sliced rather than regex-matched across `</g>`: these groups nest, so a lazy match to the
    // first closing tag stops inside the lockup and reads the wrong sizes. Taking the span up to the
    // next labelled group is both simpler and correct.
    const marker = `data-edit="${edit}"`
    const start = markup.indexOf(marker)
    if (start < 0) return 0
    const rest = markup.slice(start + marker.length)
    const next = rest.indexOf('data-edit="')
    const span = next < 0 ? rest : rest.slice(0, next)
    const sizes = [...span.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number.parseFloat(m[1]))
    return sizes.length ? Math.max(...sizes) : 0
  }
  const brand = groupMax('brand')
  const product = groupMax('product')
  const lead = brand && product ? Math.max(brand, product) / Math.min(brand, product) : Number.POSITIVE_INFINITY

  return {
    brand,
    product,
    lead,
    archetype: spec.studio!.direction.archetype,
    hits: spec.studio!.collisions.length + spec.studio!.outOfBounds.length,
    exportOk: Boolean(buildCombinedSvg(spec)),
  }
}

const SURFACES: PackagingMode[] = ['box', 'label']

describe('type hierarchy — the lead tier is ahead of the next', () => {
  for (const job of JOBS) {
    it(`${job.brand}: the face has a leading tier on both surfaces`, () => {
      for (const mode of SURFACES) {
        for (const variationIndex of [0, 1]) {
          const row = face(job, mode, variationIndex)
          expect(
            row.lead,
            `${mode} v${variationIndex} (${row.archetype}): brand ${row.brand} vs product ${row.product}`,
            // 1.2, not higher, and the number is a judgement rather than a measurement. The defect
            // being guarded against was 1.08 — five faces sharing the identical pair 8.3/7.7 — and
            // 1.2 catches that with room to spare. Pushing the bar further would force a change on
            // `botanical-card`, where the product sits in a filled, bordered card and the brand in a
            // small pill: that face carries its hierarchy in shape and weight, which type size alone
            // under-reports. A metric should not overrule a face it cannot see.
          ).toBeGreaterThanOrEqual(1.2)
        }
      }
    })
  }

  it('hierarchy did not come at the cost of the ledger or the export', () => {
    // The cheap way to get contrast is to overrun the panel. Every face here must stay clean and
    // still pass the export gate.
    let hits = 0
    let failures = 0
    for (const job of JOBS) {
      for (const mode of SURFACES) {
        const row = face(job, mode, 0)
        hits += row.hits
        if (!row.exportOk) failures += 1
      }
    }
    expect(hits, 'ledger hits').toBe(0)
    expect(failures, 'export failures').toBe(0)
  })

  it('across the whole spread the lead averages well clear of the next tier', () => {
    // A single face can be borderline for good reasons; the body of work should not be.
    const leads: number[] = []
    for (const job of JOBS) {
      for (const mode of SURFACES) {
        for (const variationIndex of [0, 1]) leads.push(face(job, mode, variationIndex).lead)
      }
    }
    const finite = leads.filter((n) => Number.isFinite(n))
    const mean = finite.reduce((a, b) => a + b, 0) / finite.length
    expect(mean, `mean lead ratio across ${finite.length} faces`).toBeGreaterThan(1.5)
  })

  it('the rule itself is a ratio, not a magic number', () => {
    // If this ever becomes 1.0 the relationship is gone and every assertion above still passes on
    // a face where the brand happens to be large.
    expect(secondaryMax(10)).toBeLessThan(10)
    expect(secondaryMax(10)).toBeGreaterThan(4)
    expect(secondaryMax(4) / 4).toBeCloseTo(secondaryMax(10) / 10, 5)
  })
})
