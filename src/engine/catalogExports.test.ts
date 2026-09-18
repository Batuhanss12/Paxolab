/**
 * Every combination the catalogue would actually offer has to export.
 *
 * Found by sweeping the catalogue rather than by a report: 8 of the 41 template × sector pairings
 * a customer can reach were export-blocked — one in five. Four separate causes, none of them
 * visible from the 803 unit tests, because every one of them needed a *panel shape* the fixtures
 * did not contain:
 *
 *   - the brand story took four lines before anything measured the room, so on a 40–50 mm back
 *     (pillow, tray, carrier, rigid-gift base) `legalColumn` found no space and drew nothing, and
 *     the gate correctly refused a file with no regulatory stack;
 *   - the sector blocks (scent pyramid, nutrition table) had the same priority inversion;
 *   - the back's header was sized on width alone, spending 18 of a 40 mm back's height on brand +
 *     product + category;
 *   - the gate looked for `İÇERİK` while the painter writes `İÇİNDEKİLER`, so a back carrying only
 *     its ingredients section was judged to have none;
 *   - the scent pyramid's column headings were drawn at a fixed size, so "TEPE NOTALAR" measured
 *     15.5 mm inside a 13 mm column on a 45 mm carton and the three overlapped.
 *
 * The lesson is the sweep. A format is not covered by one fixture in its middle: it is covered when
 * every shape the catalogue can hand the painters has been through them.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, StyleType } from '../types'
import { emptyBrief } from './fields'
import { FormaLocalEngine } from './FormaLocalEngine'
import { resetArtMemory } from './brain/DesignMemory'
import { buildCombinedSvg } from './production/exportDoc'
import { activeTemplates } from './catalog/catalog'

const JOBS: [string, string, string, string, StyleType][] = [
  ['Diako', 'kozmetik', 'parfüm', 'krem · altın', 'luxury'],
  ['Yayla', 'gıda', 'bal', 'altın · krem', 'classic'],
  ['Nox', 'sağlık', 'merhem', 'beyaz · mavi', 'minimal'],
  ['Ferah', 'temizlik', 'deterjan', 'mavi · beyaz', 'eco'],
]

/** Only the pairings the catalogue declares — an olive oil on a device label is not one of them. */
const CASES = activeTemplates(true).flatMap((tmpl) =>
  JOBS.filter(([, sector]) => tmpl.sectors.includes(sector)).map(([brand, sector, sub, colors, style]) => ({
    tmpl,
    brand,
    sector,
    sub,
    colors,
    style,
  })),
)

describe('catalogue × sector — every offered combination exports', () => {
  it('has a catalogue worth sweeping', () => {
    expect(CASES.length).toBeGreaterThan(30)
  })

  for (const c of CASES) {
    it(`${c.tmpl.id} · ${c.sector}`, () => {
      resetArtMemory()
      const brief: DesignBrief = {
        ...emptyBrief(),
        brandName: c.brand,
        productName: 'Örnek Ürün',
        sector: c.sector,
        subProduct: c.sub,
        packagingMode: c.tmpl.packagingMode,
        templateId: c.tmpl.id,
        styleType: c.style,
        colors: c.colors,
        volume: '250 ml',
        barcode: '8690000000017',
        dimensionsMm: c.tmpl.defaultsMm,
      }
      const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
      const failed = spec.preflight.items.filter((i) => i.status === 'fail').map((i) => `${i.id}: ${i.detail}`)
      expect(failed, `${c.tmpl.id} · ${c.sector}`).toEqual([])
      expect(spec.studio!.collisions, 'collisions').toEqual([])
      expect(spec.studio!.outOfBounds, 'out of bounds').toEqual([])
      expect(Boolean(buildCombinedSvg(spec)), 'export').toBe(true)
    })
  }
})

describe('a short box back keeps the block it is legally required to carry', () => {
  /*
   * The 40 mm pillow back is the shape that exposed the priority inversion: the story is
   * decorative, the regulatory stack is not, and the room has to be spent in that order.
   */
  function backArtOf(templateId: string, sector: string, sub: string) {
    resetArtMemory()
    const tmpl = activeTemplates(true).find((t) => t.id === templateId)!
    const spec = new FormaLocalEngine().generate({
      brief: {
        ...emptyBrief(),
        brandName: 'Diako',
        productName: 'Örnek Ürün',
        sector,
        subProduct: sub,
        packagingMode: 'box',
        templateId,
        styleType: 'luxury',
        colors: 'krem · altın',
        volume: '250 ml',
        barcode: '8690000000017',
        dimensionsMm: tmpl.defaultsMm,
      },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    const back = spec.studio!.panels!.find((p) => p.archetype === 'back')
    return { spec, art: String(spec.artwork.layers.find((l) => l.panelId === back?.panelId)?.markup ?? '') }
  }

  for (const [id, sector, sub] of [
    ['fm-box-pillow', 'kozmetik', 'parfüm'],
    ['fm-food-tray-snack', 'gıda', 'bal'],
    ['fm-box-tray-glued', 'gıda', 'bal'],
    ['fm-box-rigid-gift', 'kozmetik', 'parfüm'],
  ] as [string, string, string][]) {
    it(`${id}: the back carries a regulatory heading`, () => {
      const { spec, art } = backArtOf(id, sector, sub)
      expect(art).toMatch(/KULLANIM|İÇİNDEKİLER|UYARI|SAKLAMA|ÜRETİCİ/)
      expect(spec.preflight.blocking, 'export blocked').toBe(false)
    })
  }
})
