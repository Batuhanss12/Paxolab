/**
 * L2 — how much does the studio actually vary?
 *
 * The product promise is "genuinely original designs from a brief". The archetype pool is
 * closed (12 faces distilled from TASARIM REF), so there is a ceiling somewhere. This measures
 * where it is instead of guessing:
 *
 *   1. coverage   — how many of the available archetypes ever get used
 *   2. spread     — how concentrated the picks are (is one archetype eating everything?)
 *   3. in-sector  — two different briefs in the SAME sector: same face or different?
 *
 * Run: npx --yes vite-node scripts/measure-originality.ts
 */
import { createHash } from 'node:crypto'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { emptyBrief } from '../src/engine/fields'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { resetDecisionLogs } from '../src/engine/brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../src/engine/brain/DesignKnowledgeStore'
import { resetLearning } from '../src/engine/brain/LearningEngine'
import type { DesignBrief } from '../src/types'

type Job = {
  label: string
  sector: string
  subProduct: string
  brand: string
  product: string
  colors: string
  style: DesignBrief['styleType']
  story?: string
}

/** Two contrasting briefs per sector — same category, deliberately different direction. */
const JOBS: Job[] = [
  { label: 'parfüm/gece', sector: 'kozmetik', subProduct: 'parfüm', brand: 'Noctis', product: 'Gece', colors: 'siyah · altın', style: 'luxury' },
  { label: 'parfüm/temiz', sector: 'kozmetik', subProduct: 'parfüm', brand: 'Lumen', product: 'Beyaz', colors: 'beyaz · klinik', style: 'minimal' },
  { label: 'krem/botanik', sector: 'kozmetik', subProduct: 'krem', brand: 'Verda', product: 'Aloe', colors: 'yeşil · botanik', style: 'eco' },
  { label: 'krem/mermer', sector: 'kozmetik', subProduct: 'krem', brand: 'Marbre', product: 'Riche', colors: 'mermer · altın', style: 'luxury' },
  { label: 'serum/klinik', sector: 'kozmetik', subProduct: 'serum', brand: 'Clinia', product: 'B5', colors: 'beyaz · mavi', style: 'minimal' },
  { label: 'serum/sıcak', sector: 'kozmetik', subProduct: 'serum', brand: 'Amber', product: 'Gold', colors: 'amber · toprak', style: 'luxury' },
  { label: 'zeytinyağı/editorial', sector: 'gıda', subProduct: 'zeytinyağı', brand: 'Nexora', product: 'Sızma', colors: 'koyu yeşil · altın', style: 'luxury' },
  { label: 'zeytinyağı/rustik', sector: 'gıda', subProduct: 'zeytinyağı', brand: 'Köyden', product: 'Naturel', colors: 'kraft · toprak', style: 'eco' },
  { label: 'bal/dağ', sector: 'gıda', subProduct: 'bal', brand: 'Yayla', product: 'Çiçek', colors: 'altın · sıcak', style: 'classic' },
  { label: 'bal/modern', sector: 'gıda', subProduct: 'bal', brand: 'Hive', product: 'Raw', colors: 'siyah · sarı', style: 'modern' },
  { label: 'kahve/mermer', sector: 'gıda', subProduct: 'kahve', brand: 'Elite Brew', product: 'Mocha', colors: 'mermer · altın', style: 'luxury' },
  { label: 'kahve/endüstriyel', sector: 'gıda', subProduct: 'kahve', brand: 'Roast Co', product: 'Dark', colors: 'antrasit · turuncu', style: 'modern' },
  { label: 'çikolata/lüks', sector: 'gıda', subProduct: 'çikolata', brand: 'Cacaoa', product: 'Bitter', colors: 'kahve · altın', style: 'luxury' },
  { label: 'çikolata/eğlenceli', sector: 'gıda', subProduct: 'çikolata', brand: 'Pop', product: 'Sütlü', colors: 'pembe · mor', style: 'playful' },
  { label: 'elektronik/tech', sector: 'elektronik', subProduct: 'kulaklık', brand: 'Nox', product: 'Pulse', colors: 'siyah · neon', style: 'modern' },
  { label: 'elektronik/mermer', sector: 'elektronik', subProduct: 'kulaklık', brand: 'Auren', product: 'Studio', colors: 'mermer ve altın', style: 'luxury' },
  { label: 'bebek/yumuşak', sector: 'kozmetik', subProduct: 'bebek', brand: 'Mio', product: 'Bebek', colors: 'pastel · mavi', style: 'minimal' },
  { label: 'bebek/botanik', sector: 'kozmetik', subProduct: 'bebek', brand: 'Bella', product: 'Papatya', colors: 'yeşil · botanik', style: 'eco' },
  { label: 'temizlik/ferah', sector: 'temizlik', subProduct: 'deterjan', brand: 'Ferah', product: 'Limon', colors: 'mavi · beyaz', style: 'modern' },
  { label: 'temizlik/doğal', sector: 'temizlik', subProduct: 'deterjan', brand: 'Saf', product: 'Sirke', colors: 'yeşil · kraft', style: 'eco' },
  { label: 'sağlık/klinik', sector: 'sağlık', subProduct: 'vitamin', brand: 'Vitalis', product: 'D3', colors: 'beyaz · yeşil', style: 'minimal' },
  { label: 'sağlık/premium', sector: 'sağlık', subProduct: 'vitamin', brand: 'Aurum', product: 'Omega', colors: 'lacivert · altın', style: 'luxury' },
  { label: 'şampuan/botanik', sector: 'kozmetik', subProduct: 'şampuan', brand: 'Herbae', product: 'Onarıcı', colors: 'yeşil · krem', style: 'eco' },
  { label: 'şampuan/editorial', sector: 'kozmetik', subProduct: 'şampuan', brand: 'Sleek', product: 'Volume', colors: 'siyah · beyaz', style: 'modern' },
  { label: 'çay/klasik', sector: 'gıda', subProduct: 'çay', brand: 'Demlik', product: 'Earl', colors: 'bordo · altın', style: 'classic' },
  { label: 'çay/sakin', sector: 'gıda', subProduct: 'çay', brand: 'Calm', product: 'Papatya', colors: 'bej · yeşil', style: 'minimal' },
  { label: 'atıştırmalık/pop', sector: 'gıda', subProduct: 'kurabiye', brand: 'Crunch', product: 'Kakao', colors: 'turuncu · mor', style: 'playful' },
  { label: 'atıştırmalık/artisan', sector: 'gıda', subProduct: 'kurabiye', brand: 'Fırın', product: 'Tereyağlı', colors: 'kraft · kahve', style: 'classic' },
]

function briefOf(job: Job): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: job.brand,
    productName: job.product,
    sector: job.sector,
    subProduct: job.subProduct,
    packagingMode: 'box',
    styleType: job.style,
    colors: job.colors,
    story: job.story ?? '',
    volume: '250 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 45, H: 150 },
  }
}

type Row = { job: Job; archetype: string; background: string; temperament: string; hash: string }

function run(job: Job): Row {
  resetArtMemory()
  resetDecisionLogs()
  resetDesignKnowledge()
  resetLearning()
  const spec = new FormaLocalEngine().generate({ brief: briefOf(job), overridePatch: { studio: true, variationIndex: 0 } })
  const face = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    job,
    archetype: spec.studio?.direction.archetype ?? '?',
    background: spec.studio?.direction.background ?? '?',
    temperament: spec.studio?.direction.temperament ?? '?',
    hash: createHash('sha256').update(face).digest('hex').slice(0, 10),
  }
}

function pct(n: number, d: number): string {
  return `${((n / d) * 100).toFixed(0)}%`
}

const rows = JOBS.map(run)

console.log('\n--- her brief ---')
for (const r of rows) {
  console.log(r.job.label.padEnd(26), r.archetype.padEnd(18), r.background.padEnd(18), r.temperament)
}

const archetypes = new Map<string, number>()
for (const r of rows) archetypes.set(r.archetype, (archetypes.get(r.archetype) ?? 0) + 1)
const sorted = [...archetypes.entries()].sort((a, b) => b[1] - a[1])

console.log('\n--- arketip dağılımı ---')
for (const [a, n] of sorted) console.log(a.padEnd(20), String(n).padStart(2), pct(n, rows.length))

const top = sorted[0]
console.log('\n--- özet ---')
console.log('brief sayısı           :', rows.length)
console.log('kullanılan arketip     :', archetypes.size)
console.log('en baskın arketip      :', `${top[0]} — ${top[1]} kez (${pct(top[1], rows.length)})`)
console.log('benzersiz yüz hash     :', new Set(rows.map((r) => r.hash)).size, '/', rows.length)
console.log('benzersiz zemin        :', new Set(rows.map((r) => r.background)).size)
console.log('benzersiz temperament  :', new Set(rows.map((r) => r.temperament)).size)

// Pairs are adjacent: each sector contributes two deliberately contrasting briefs.
let sameArch = 0
const pairs: string[] = []
for (let i = 0; i < rows.length; i += 2) {
  const a = rows[i]
  const b = rows[i + 1]
  if (!b) break
  if (a.archetype === b.archetype) {
    sameArch += 1
    pairs.push(`${a.job.label} ↔ ${b.job.label} → ${a.archetype}`)
  }
}
const pairCount = Math.floor(rows.length / 2)
console.log('\n--- aynı kategori, zıt brief ---')
console.log('aynı arketipe düşen çift:', sameArch, '/', pairCount, `(${pct(sameArch, pairCount)})`)
for (const p of pairs) console.log('  ', p)
