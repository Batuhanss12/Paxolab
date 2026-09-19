/**
 * A nutrition declaration is a legal statement about food.
 *
 * The engine used to print convincing figures for honey, olive oil and coffee — "1360 kJ /
 * 320 kcal", "100 g", "2 kJ / 1 kcal" — on a panel the customer sends to a printer. Nobody
 * measured those products, nothing in the brief can supply the values, and the coffee row was not
 * even right for the product it was printed on: 2 kJ is brewed coffee, while the pack holds beans.
 *
 * This is the one place in the engine where a convincing invention is worse than an obvious blank,
 * so the guards here are about exactly that: no digits, a marked header, and a preflight line the
 * customer sees before they download.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { nutritionRows } from './copyBank'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

const FOOD_JOBS = STUDIO_GALLERY_JOBS.filter((j) => j.sector === 'gıda' || j.sector === 'içecek')

function generate(slug: string): DesignSpec {
  const job = STUDIO_GALLERY_JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`no gallery job ${slug}`)
  const brief: DesignBrief = {
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
  }
  resetArtMemory()
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
}

const artOf = (spec: DesignSpec) => spec.artwork.layers.map((l) => l.markup).join('\n')
/** The declaration's own header and the rows under it, not the rest of the panel. */
const tableOf = (art: string) => /(?:Besin Değerleri|Nutrition)[\s\S]{0,1400}/.exec(art)?.[0] ?? ''

describe('the nutrition table states nothing it was not told', () => {
  it('carries no figure at any locale or food', () => {
    for (const locale of ['tr', 'en'] as const) {
      for (const blob of ['çiçek balı bal', 'sızma zeytinyağı olive oil', 'filtre kahve coffee', 'bisküvi', '']) {
        for (const [label, value] of nutritionRows(locale, blob)) {
          expect(label.length, `${locale}/${blob} etiketsiz satır`).toBeGreaterThan(0)
          // A blank a producer fills in — never a number this engine made up.
          expect(value, `${locale}/${blob} · ${label} uydurma değer`).not.toMatch(/\d/)
          expect(value, `${locale}/${blob} · ${label} boşluk yok`).toContain('—')
        }
      }
    }
  })

  it('still carries the rows the food itself must declare', () => {
    // Structure is not invented: an oil declares saturates where a honey declares sugars.
    const labels = (blob: string) => nutritionRows('tr', blob).map(([l]) => l).join('|')
    expect(labels('sızma zeytinyağı'), 'yağda doymuş yağ satırı yok').toContain('Doymuş yağ')
    expect(labels('çiçek balı'), 'balda şeker satırı yok').toContain('Şeker')
    for (const blob of ['çiçek balı', 'sızma zeytinyağı', 'filtre kahve']) {
      expect(labels(blob), `${blob} enerji`).toContain('Enerji')
      expect(labels(blob), `${blob} tuz`).toContain('Tuz')
    }
  })
})

describe('a food design says its table is a sample', () => {
  it('marks the header and tells the customer before they download', () => {
    for (const job of FOOD_JOBS) {
      const spec = generate(job.slug)
      const table = tableOf(artOf(spec))
      if (!table) continue
      expect(table, `${job.slug} başlık işaretsiz`).toMatch(/ÖRNEK|SAMPLE/)
      expect(table.replace(/(?:ÖRNEK|SAMPLE)/g, ''), `${job.slug} tabloda rakam var`).not.toMatch(/\d+\s*(?:kJ|kcal|g)</)
      const check = spec.preflight.items.find((i) => i.id === 'ds-nutrition-sample')
      expect(check, `${job.slug} ön kontrol satırı yok`).toBeTruthy()
      expect(check?.status, `${job.slug} ön kontrol durumu`).toBe('warn')
      // A sample table is a caution, not a blocker: the design is still deliverable.
      expect(spec.preflight.exportOk, `${job.slug} export`).toBe(true)
    }
  })
})
