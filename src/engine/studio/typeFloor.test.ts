/**
 * L2 — the print floor holds on the drawn face, not just in the helper.
 *
 * `fitSize` clamps to `STUDIO_TYPE_FLOOR_MM`, so every layout routed through it is safe by
 * construction. The leaks are the calls that bypass it: a literal `size:` passed straight to
 * `chip()` or `textEl()`. Two such calls shipped (boxLayouts `chip` at 1.4 mm, the QR caption at
 * 1.1 mm) and only surfaced when a rendered box failed the export gate — a helper-level test
 * would have stayed green through both.
 *
 * So this measures the *output*: every font-size the engine actually emits, across a spread of
 * sectors, styles and both packaging modes. It is the same check the preflight runs, pinned as a
 * test so a new literal fails here instead of at a user's download.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { STUDIO_TYPE_FLOOR_MM } from './text'

type Job = {
  label: string
  sector: string
  subProduct: string
  brand: string
  product: string
  colors: string
  style: DesignBrief['styleType']
  mode?: DesignBrief['packagingMode']
}

/** Wide enough to reach every archetype, every background and both painters. */
const JOBS: Job[] = [
  { label: 'parfüm/lüks', sector: 'kozmetik', subProduct: 'parfüm', brand: 'Noctis', product: 'Gece', colors: 'siyah · altın', style: 'luxury' },
  { label: 'serum/klinik', sector: 'kozmetik', subProduct: 'serum', brand: 'Clinia', product: 'B5 Serum', colors: 'beyaz · mavi', style: 'minimal' },
  { label: 'krem/botanik', sector: 'kozmetik', subProduct: 'krem', brand: 'Verda', product: 'Aloe Mist', colors: 'yeşil · krem', style: 'eco' },
  { label: 'şampuan/editorial', sector: 'kozmetik', subProduct: 'şampuan', brand: 'Sleek', product: 'Volume', colors: 'siyah · beyaz', style: 'modern' },
  { label: 'zeytinyağı/rustik', sector: 'gıda', subProduct: 'zeytinyağı', brand: 'Köyden', product: 'Naturel Sızma', colors: 'koyu yeşil · altın', style: 'eco' },
  { label: 'kahve/mermer', sector: 'gıda', subProduct: 'kahve', brand: 'Elite Brew', product: 'Mocha', colors: 'mermer · altın', style: 'luxury' },
  { label: 'çikolata/pop', sector: 'gıda', subProduct: 'çikolata', brand: 'Pop', product: 'Sütlü Kakao', colors: 'pembe · mor', style: 'playful' },
  { label: 'bal/klasik', sector: 'gıda', subProduct: 'bal', brand: 'Yayla', product: 'Çiçek Balı', colors: 'altın · sıcak', style: 'classic' },
  { label: 'çay/sakin', sector: 'gıda', subProduct: 'çay', brand: 'Calm', product: 'Papatya', colors: 'bej · yeşil', style: 'minimal' },
  // The box that actually broke: long uppercase spec chips on the back panel.
  { label: 'elektronik/tech', sector: 'elektronik', subProduct: 'kulaklık', brand: 'Nox', product: 'Pulse Buds', colors: 'antrasit · turuncu', style: 'modern' },
  { label: 'temizlik/ferah', sector: 'temizlik', subProduct: 'deterjan', brand: 'Ferah', product: 'Limon', colors: 'mavi · beyaz', style: 'modern' },
  { label: 'sağlık/premium', sector: 'sağlık', subProduct: 'vitamin', brand: 'Aurum', product: 'Omega 3', colors: 'lacivert · altın', style: 'luxury' },
  { label: 'etiket/zeytinyağı', sector: 'gıda', subProduct: 'zeytinyağı', brand: 'Nexora', product: 'Sızma', colors: 'koyu yeşil · altın', style: 'luxury', mode: 'label' },
  { label: 'etiket/serum', sector: 'kozmetik', subProduct: 'serum', brand: 'Amber', product: 'Gold Drops', colors: 'amber · toprak', style: 'luxury', mode: 'label' },
]

function briefOf(job: Job): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: job.mode ?? 'box',
    styleType: job.style,
    colors: job.colors,
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

/** Every font-size in the emitted markup, smallest first. */
function sizes(job: Job): { size: number; panel: string }[] {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: briefOf(job), overridePatch: { studio: true, variationIndex: 0 } })
  const out: { size: number; panel: string }[] = []
  for (const layer of spec.artwork.layers) {
    for (const m of String(layer.markup).matchAll(/font-size="([\d.]+)"/g)) {
      out.push({ size: Number.parseFloat(m[1]), panel: layer.panelId })
    }
  }
  return out.sort((a, b) => a.size - b.size)
}

describe('L2 — no emitted type falls below the print floor', () => {
  for (const job of JOBS) {
    it(`${job.label}: every panel stays at or above ${STUDIO_TYPE_FLOOR_MM} mm`, () => {
      const all = sizes(job)
      expect(all.length, 'face emitted no type at all').toBeGreaterThan(5)
      const under = all.filter((s) => s.size < STUDIO_TYPE_FLOOR_MM)
      expect(under.map((u) => `${u.panel}@${u.size}mm`), 'sub-floor type').toEqual([])
    })
  }
})
