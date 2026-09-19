/**
 * Why does `focal` sit on 45?
 *
 * Phase 1 measured 178 of 216 faces carrying a repair signal, with `focal` at a constant 45 for
 * more than half of them, and refused to let a reading that fires on four faces in five steer
 * candidate selection. This is the follow-up the refusal owed: the full distribution, and the
 * evidence for *why* the number is stuck.
 *
 * `studioFocal` reads `focalRatio`, which walks the **ledger** (`ctx.boxes`) and considers only
 * `element` and `container` boxes — text is excluded by kind, and a painted field is never placed
 * in the ledger at all. So this prints, beside the score: which ledger box actually won, how many
 * candidates it had, and what the **markup** says the largest drawn group is. Where those two
 * disagree, the score is measuring the wrong thing.
 *
 * Comparison uses the direction vocabulary that already exists — archetype and lockup. No new
 * taxonomy is invented here.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-focal-calibration.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import { svgHull } from '../src/engine/studio/svgHull'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief, DesignSpec } from '../src/types'
import { allSweepBriefs } from './sweep-briefs'

type Row = {
  pop: string
  label: string
  focal: number
  signals: number
  archetype: string
  lockup: string
  sector: string
  surface: string
  /** The ledger box `focalRatio` actually picked, and its share of the panel. */
  ledgerWinner: string
  ledgerRatio: number
  /** How many ledger boxes were even eligible — `element` + `container`, text excluded by kind. */
  eligible: number
  textBoxes: number
  /** What the painted markup says the largest drawn group is, by its own `data-art` name. */
  markupWinner: string
  markupRatio: number
  /** Every eligible box id with its panel share — the census the exclusion list must be built from. */
  eligibleIds: [string, number][]
}

const rows: Row[] = []

function record(pop: string, label: string, spec: DesignSpec) {
  const card = spec.craftScore
  if (card?.focal == null || !spec.studio) return
  const frontId = spec.artwork.frontPanelId
  const panel = spec.dieline.panels.find((p) => p.id === frontId)
  const markup = spec.artwork.layers.find((l) => l.panelId === frontId)?.markup ?? ''
  const placed = spec.studio.panels.find((p) => p.panelId === frontId)?.placed ?? []
  if (!panel) return
  const panelArea = Math.max(1, panel.w * panel.h)

  let ledgerWinner = '—'
  let ledgerRatio = 0
  let eligible = 0
  let textBoxes = 0
  const eligibleIds: [string, number][] = []
  for (const b of placed) {
    if (b.kind === 'text') textBoxes += 1
    if (b.kind !== 'element' && b.kind !== 'container') continue
    eligible += 1
    const r = (b.w * b.h) / panelArea
    eligibleIds.push([b.id.split('#')[0] ?? b.id, r])
    if (r > ledgerRatio) {
      ledgerRatio = r
      ledgerWinner = b.id.split('#')[0] ?? b.id
    }
  }

  // The same question asked of the ink instead of the ledger.
  let markupWinner = '—'
  let markupRatio = 0
  for (const m of markup.matchAll(/<g[^>]*data-art="([a-z-]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const id = m[1]!
    if (id === 'studio' || id === 'studio-fonts') continue
    const hull = svgHull(m[2]!)
    if (!hull) continue
    const r = ((hull.maxX - hull.minX) * (hull.maxY - hull.minY)) / panelArea
    if (r > markupRatio) {
      markupRatio = r
      markupWinner = id
    }
  }

  rows.push({
    pop,
    label,
    focal: card.focal,
    signals: card.repairSignals.length,
    archetype: String(spec.studio.direction.archetype),
    lockup: String(spec.studio.direction.lockup),
    sector: String(spec.brief.sector),
    surface: spec.kind === 'label' ? 'etiket' : 'kutu',
    ledgerWinner,
    ledgerRatio,
    eligible,
    textBoxes,
    markupWinner,
    markupRatio,
    eligibleIds,
  })
}

for (const { brief, name } of allSweepBriefs()) {
  resetArtMemory()
  record('216 süpürme', name, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
}

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
    record('324 iş×aile', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
  }
}

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
  record('18 golden', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
}

const scores = rows.map((r) => r.focal).sort((a, b) => a - b)
const q = (p: number) => scores[Math.min(scores.length - 1, Math.floor(scores.length * p))]
console.log(`focal dağılımı · ${rows.length} yüz`)
console.log(`  min ${q(0)} · p05 ${q(0.05)} · p25 ${q(0.25)} · medyan ${q(0.5)} · p75 ${q(0.75)} · p95 ${q(0.95)} · max ${scores[scores.length - 1]}`)
const uniq = new Map<number, number>()
for (const s of scores) uniq.set(s, (uniq.get(s) ?? 0) + 1)
console.log(`  farklı değer sayısı: ${uniq.size}`)
for (const [v, n] of [...uniq].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(v).padStart(3)} → ${String(n).padStart(4)} yüz (%${((n / rows.length) * 100).toFixed(0)})`)
}

const by = (pick: (r: Row) => string, only?: (r: Row) => boolean) => {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (only && !only(r)) continue
    m.set(pick(r), (m.get(pick(r)) ?? 0) + 1)
  }
  return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')
}

console.log('\n45 alan yüzler — nerede yoğunlaşıyor')
const is45 = (r: Row) => r.focal === 45
console.log(`  arketip:  ${by((r) => r.archetype, is45)}`)
console.log(`  kilit:    ${by((r) => r.lockup, is45)}`)
console.log(`  sektör:   ${by((r) => r.sector, is45)}`)
console.log(`  yüzey:    ${by((r) => r.surface, is45)}`)

console.log('\nTEŞHİS — focalRatio neyi ölçüyor')
const census = new Map<string, { n: number; sum: number; max: number }>()
for (const r of rows) {
  for (const [id, ratio] of r.eligibleIds) {
    const cur = census.get(id) ?? { n: 0, sum: 0, max: 0 }
    cur.n += 1
    cur.sum += ratio
    cur.max = Math.max(cur.max, ratio)
    census.set(id, cur)
  }
}
const winner = new Map<string, { n: number; sum: number }>()
for (const r of rows) {
  const cur = winner.get(r.ledgerWinner) ?? { n: 0, sum: 0 }
  cur.n += 1
  cur.sum += r.ledgerRatio
  winner.set(r.ledgerWinner, cur)
}
console.log('  ledger kazananı (focalRatio bunu görüyor):')
for (const [k, v] of [...winner].sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
  console.log(`    ${k.padEnd(16)} ${String(v.n).padStart(4)} yüz · ortalama panel payı %${((v.sum / v.n) * 100).toFixed(1)}`)
}
const mWinner = new Map<string, { n: number; sum: number }>()
for (const r of rows) {
  const cur = mWinner.get(r.markupWinner) ?? { n: 0, sum: 0 }
  cur.n += 1
  cur.sum += r.markupRatio
  mWinner.set(r.markupWinner, cur)
}
console.log('  UYGUN TÜM LEDGER KİMLİKLERİ (yalnız kazananlar değil):')
for (const [k, v] of [...census].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`    ${k.padEnd(16)} ${String(v.n).padStart(4)} kez · ortalama panel payı %${((v.sum / v.n) * 100).toFixed(1)} · max %${(v.max * 100).toFixed(1)}`)
}
console.log('  işaretleme kazananı (gerçekte çizilen en büyük grup):')
for (const [k, v] of [...mWinner].sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
  console.log(`    ${k.padEnd(16)} ${String(v.n).padStart(4)} yüz · ortalama panel payı %${((v.sum / v.n) * 100).toFixed(1)}`)
}
const disagree = rows.filter((r) => r.ledgerWinner !== r.markupWinner).length
const noEligible = rows.filter((r) => r.eligible === 0).length
const oneEligible = rows.filter((r) => r.eligible === 1).length
const avgEligible = rows.reduce((n, r) => n + r.eligible, 0) / rows.length
const avgText = rows.reduce((n, r) => n + r.textBoxes, 0) / rows.length
console.log(`\n  ledger ile işaretleme farklı kazanan diyor: ${disagree}/${rows.length} (%${((disagree / rows.length) * 100).toFixed(0)})`)
console.log(`  uygun ledger kutusu: ortalama ${avgEligible.toFixed(1)} · hiç yok ${noEligible} yüz · tek kutu ${oneEligible} yüz`)
console.log(`  kind='text' olduğu için dışlanan kutu: ortalama ${avgText.toFixed(1)} / yüz`)

console.log('\n  eşik bandı (focalRatio → puan): r<0.06→45 · 0.06–0.55→85 · 0.55<r≤0.6→45 · r>0.6→40 · r=0→35|60')
const band = (r: number) => (r === 0 ? 'r=0' : r < 0.06 ? 'r<0.06' : r <= 0.55 ? '0.06–0.55' : r <= 0.6 ? '0.55–0.60 (BOŞLUK)' : 'r>0.6')
const bands = new Map<string, number>()
for (const r of rows) bands.set(band(r.ledgerRatio), (bands.get(band(r.ledgerRatio)) ?? 0) + 1)
for (const [k, v] of [...bands].sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(20)} ${String(v).padStart(4)} yüz`)
