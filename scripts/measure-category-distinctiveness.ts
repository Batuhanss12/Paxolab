/**
 * What do `categoryFit` and `distinctiveness` actually measure?
 *
 * Both are read on every studio face, reported on the scorecard, and excluded from the weighted
 * craft total. Phase 1.5 left them uncalibrated with averages of 59 and 51, and those two numbers
 * produce most of the 60% repair-signal prevalence. Before either can steer anything, what they
 * are counting has to be established rather than assumed.
 *
 * Two things the code says that the plan did not:
 *
 *   `categoryFit` is **not** derived from `scoreSectorFit` / `scoreProductFit`. Those are separate
 *   weighted axes. `studioCategoryFit` is one lookup — `dna.sectors[plan.sector] ?? 0.2` — so it is
 *   a *declaration* the archetype makes about itself, not a measurement of the artwork. A low score
 *   means the direction put this archetype on a sector its own DNA does not claim.
 *
 *   `distinctiveness` is the mean Hamming distance from the selected candidate to the others over
 *   `COMPOSITION_AXES` — four axes, so the score is (differing axes / 4) × 100. The roadmap's own
 *   target is "each pair differs on ≥ 2 axes", which *is* 50. The metric's target value and the
 *   repair threshold sit on the same number.
 *
 * So this reports both distributions over all four populations, and for every low `categoryFit`
 * it records why: the sector key missing from the DNA table (fallback), the family pinned by the
 * caller, or the archetype genuinely chosen against its own affinity.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-category-distinctiveness.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { activeTemplates } from '../src/engine/catalog/catalog'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import { dnaFor } from '../src/engine/studio/referenceDna'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief, DesignSpec, StyleType } from '../src/types'
import { allSweepBriefs } from './sweep-briefs'

type Row = {
  pop: string
  label: string
  categoryFit: number
  distinctiveness: number | null
  archetype: string
  sector: string
  /** Was the caller holding the family fixed? Then a sector mismatch is the sweep's doing. */
  pinned: boolean
  /** Does the archetype's DNA even list this sector, or did the `?? 0.2` fallback answer? */
  listed: boolean
  raw: number | undefined
  candidates: number
}

const rows: Row[] = []

function record(pop: string, label: string, spec: DesignSpec, pinned: boolean) {
  const card = spec.craftScore
  if (card?.categoryFit == null || !spec.studio || !spec.designPlan) return
  const dna = dnaFor(spec.studio.direction.archetype, spec.studio.direction.surface)
  const sector = spec.designPlan.sector
  const raw = (dna.sectors as Record<string, number | undefined>)[sector]
  rows.push({
    pop,
    label,
    categoryFit: card.categoryFit,
    distinctiveness: card.distinctiveness ?? null,
    archetype: String(spec.studio.direction.archetype),
    sector: String(sector),
    pinned,
    listed: raw !== undefined,
    raw,
    candidates: spec.studio.offer?.candidates.length ?? 0,
  })
}

// A — 216 repertoire sweep
for (const { brief, name } of allSweepBriefs()) {
  resetArtMemory()
  record('A 216 süpürme', name, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }), false)
}

// B — 324 job × family, family deliberately pinned
const FAMILIES = Object.keys(STUDIO_FAMILIES) as StudioFamily[]
for (const job of STUDIO_GALLERY_JOBS) {
  for (const family of FAMILIES) {
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
      studioRepertoire: familyRepertoire(family) ?? 'studio',
      studioFamily: family,
      studioFamilyLocked: true,
    }
    resetArtMemory()
    record('B 324 iş×aile', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }), true)
  }
}

// C — the 18 frozen goldens
for (const job of STUDIO_GALLERY_JOBS) {
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
  record('C 18 golden', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }), false)
}

// D — 41 catalogue × sector. Phase 1 skipped this one and it cost a correct decision.
const JOBS: [string, string, string, string, StyleType][] = [
  ['Diako', 'kozmetik', 'parfüm', 'krem · altın', 'luxury'],
  ['Yayla', 'gıda', 'bal', 'altın · krem', 'classic'],
  ['Nox', 'sağlık', 'merhem', 'beyaz · mavi', 'minimal'],
  ['Ferah', 'temizlik', 'deterjan', 'mavi · beyaz', 'eco'],
]
for (const tmpl of activeTemplates(true)) {
  for (const [brand, sector, sub, colors, style] of JOBS) {
    if (!tmpl.sectors.includes(sector)) continue
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: brand,
      productName: 'Örnek Ürün',
      sector,
      subProduct: sub,
      packagingMode: tmpl.packagingMode,
      templateId: tmpl.id,
      styleType: style,
      colors,
      volume: '250 ml',
      barcode: '8690000000017',
      dimensionsMm: tmpl.defaultsMm,
    }
    resetArtMemory()
    record('D 41 katalog', `${tmpl.id}·${sector}`, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }), false)
  }
}

const POPS = ['A 216 süpürme', 'B 324 iş×aile', 'C 18 golden', 'D 41 katalog']

function stats(values: number[]): string {
  if (!values.length) return 'veri yok'
  const s = [...values].sort((a, b) => a - b)
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))]
  return `min ${q(0)} · p05 ${q(0.05)} · p25 ${q(0.25)} · medyan ${q(0.5)} · p75 ${q(0.75)} · p95 ${q(0.95)} · max ${s[s.length - 1]} · farklı ${new Set(s).size}`
}

console.log('CATEGORY FIT')
for (const pop of POPS) {
  const mine = rows.filter((r) => r.pop === pop)
  console.log(`  ${pop.padEnd(15)} ${String(mine.length).padStart(4)} yüz · ${stats(mine.map((r) => r.categoryFit))}`)
}

console.log('\nDISTINCTIVENESS')
for (const pop of POPS) {
  const mine = rows.filter((r) => r.pop === pop && r.distinctiveness != null)
  const absent = rows.filter((r) => r.pop === pop).length - mine.length
  console.log(`  ${pop.padEnd(15)} ${String(mine.length).padStart(4)} yüz · ${stats(mine.map((r) => r.distinctiveness!))}${absent ? ` · teklif yok ${absent}` : ''}`)
}

console.log('\nDÜŞÜK CATEGORY FIT (<50) — kök neden')
const low = rows.filter((r) => r.categoryFit < 50)
const reason = (r: Row): string => {
  if (!r.listed) return '2 eksik semantic metadata — sektör DNA tablosunda yok, ?? 0.2 cevapladı'
  if (r.pinned) return '7 aile çağıran tarafından sabitlendi — süpürmenin kastı, kusur değil'
  return '1 gerçek kategori uyumsuzluğu — yön, DNA düşük derken bu arketipi seçti'
}
const byReason = new Map<string, number>()
for (const r of low) byReason.set(reason(r), (byReason.get(reason(r)) ?? 0) + 1)
console.log(`  toplam ${low.length}/${rows.length} yüz`)
for (const [k, v] of [...byReason].sort((a, b) => b[1] - a[1])) console.log(`    ${k} → ${v}`)

const realMismatch = low.filter((r) => reason(r).startsWith('1'))
if (realMismatch.length) {
  const m = new Map<string, number>()
  for (const r of realMismatch) m.set(`${r.archetype}/${r.sector} (dna ${r.raw})`, (m.get(`${r.archetype}/${r.sector} (dna ${r.raw})`) ?? 0) + 1)
  console.log('  gerçek uyumsuzluklar:')
  for (const [k, v] of [...m].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`    ${k} × ${v}`)
}

const unlistedPairs = new Map<string, number>()
for (const r of rows.filter((r) => !r.listed)) {
  unlistedPairs.set(`${r.archetype}/${r.sector}`, (unlistedPairs.get(`${r.archetype}/${r.sector}`) ?? 0) + 1)
}
console.log(`\nSEKTÖR DNA'DA LİSTELENMEMİŞ: ${rows.filter((r) => !r.listed).length}/${rows.length} yüz`)
for (const [k, v] of [...unlistedPairs].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`    ${k} × ${v}`)
const unlistedPinned = rows.filter((r) => !r.listed && r.pinned).length
console.log(`    bunların ${unlistedPinned} tanesi sabitlenmiş aile (B popülasyonu)`)
