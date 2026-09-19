/**
 * Does the engine execute its ornament, typography and claim decisions, or only declare them?
 *
 * Phase 2C set out to wire `vocabularyTable.ts`'s `ornamentLevel`, `typographyVoice` and
 * `claimStrip` into the studio painters. Grepping the repository first showed why that cannot be
 * the job: **none of those three fields is read anywhere outside the table that declares them.**
 * The fields the table does feed — `heroFamilies`, `patternFamilies`, `backgroundTreatments`,
 * `forbiddenHeroes`, `forbiddenPatterns` — are read only by `ArtDirection`, `RepairPlanner`,
 * `CritiqueEngine` and `DesignDirector`, in kit vocabulary a studio face never emits.
 *
 * The studio owns all three concepts itself, and the owner is `DesignDirection`:
 *
 *   ornament    `direction.ornament` (quiet | measured | rich), handed to `paintBackground`
 *   typography  `direction.typePairing`, handed to `titleFaces`
 *   claim       `claimBand()`, drawn when the layout has the room for it
 *
 * So the question the phase is really asking — declared versus executed — is asked here of the
 * vocabulary that actually owns the decision. For each face this records the decision and a
 * geometric consequence of it, so a decision that changes nothing on the page shows up as a flat
 * distribution rather than as a passing test.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-vocabulary-contract.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { activeTemplates } from '../src/engine/catalog/catalog'
import { emptyBrief } from '../src/engine/fields'
import { paintBackground } from '../src/engine/studio/backgrounds'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import { ALL_BACKGROUNDS } from '../src/engine/studio/referenceDna'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { OrnamentLevel, StudioFamily, StudioPalette } from '../src/engine/studio/types'
import type { DesignBrief, DesignSpec, StyleType } from '../src/types'
import { allSweepBriefs } from './sweep-briefs'

type Row = {
  pop: string
  ornament: string
  /** Decorative ink: the faint stacked washes a background lays down, by count. */
  washes: number
  /** Drawn ornament groups the painters name themselves. */
  ornamentGroups: number
  typePairing: string
  /** Distinct font families actually set on the face. */
  faces: number
  /** Largest / smallest set size — the type system's contrast, as drawn. */
  sizeRatio: number
  /** Mean letter-spacing actually emitted. */
  tracking: number
  claimDrawn: boolean
  sector: string
  background: string
}

const rows: Row[] = []

function record(pop: string, spec: DesignSpec) {
  if (!spec.studio || !spec.designPlan) return
  const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  const d = spec.studio.direction
  const sizes = [...front.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]))
  const tracks = [...front.matchAll(/letter-spacing="([\d.]+)"/g)].map((m) => Number(m[1]))
  const placed = spec.studio.panels.flatMap((p) => p.placed)
  rows.push({
    pop,
    ornament: String(d.ornament),
    washes: (front.match(/(?:fill|stroke)-opacity="0\.(0[1-9]|1[0-5])"/g) ?? []).length,
    ornamentGroups: (front.match(/data-art="[a-z-]+"/g) ?? []).length,
    typePairing: String(d.typePairing),
    faces: new Set([...front.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1])).size,
    sizeRatio: sizes.length ? Math.max(...sizes) / Math.max(0.1, Math.min(...sizes)) : 1,
    tracking: tracks.length ? tracks.reduce((a, b) => a + b, 0) / tracks.length : 0,
    claimDrawn: placed.some((b) => b.id.split('#')[0] === 'claim-band'),
    sector: String(spec.designPlan.sector),
    background: String(d.background),
  })
}

for (const { brief } of allSweepBriefs()) {
  resetArtMemory()
  record('A 216', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
}
const FAMILIES = Object.keys(STUDIO_FAMILIES) as StudioFamily[]
for (const job of STUDIO_GALLERY_JOBS) {
  for (const family of FAMILIES) {
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: job.brand, productName: job.product, sector: job.sector, subProduct: job.subProduct,
      packagingMode: job.packagingMode, templateId: job.templateId, styleType: job.styleType,
      colors: job.colors, volume: job.volume, dimensionsMm: job.dimensionsMm, barcode: '8690000000017',
      studioRepertoire: familyRepertoire(family) ?? 'studio', studioFamily: family, studioFamilyLocked: true,
    }
    resetArtMemory()
    record('B 324', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
  }
}
for (const job of STUDIO_GALLERY_JOBS) {
  const brief: DesignBrief = {
    ...emptyBrief(),
    brandName: job.brand, productName: job.product, sector: job.sector, subProduct: job.subProduct,
    packagingMode: job.packagingMode, templateId: job.templateId, styleType: job.styleType,
    colors: job.colors, volume: job.volume, dimensionsMm: job.dimensionsMm, barcode: '8690000000017',
  }
  resetArtMemory()
  record('C 18', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
}
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
      brandName: brand, productName: 'Örnek Ürün', sector, subProduct: sub,
      packagingMode: tmpl.packagingMode, templateId: tmpl.id, styleType: style,
      colors, volume: '250 ml', barcode: '8690000000017', dimensionsMm: tmpl.defaultsMm,
    }
    resetArtMemory()
    record('D 41', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
  }
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0)

console.log(`${rows.length} yüz\n`)

/*
 * Ornament is measured by controlled experiment, not by population statistics.
 *
 * `gain()` multiplies the painter's *own* intensity, and those bases are tuned per background — a
 * toile lays down thousands of strokes where a wave lays down seven — so pooling faces hides the
 * multiplier entirely, and counting faint opacities finds nothing on the backgrounds that spend
 * the level on counts instead. Painting the same background at each level, everything else held
 * still, answers the only question that matters: does the decision change what is drawn?
 */
console.log('ORNAMENT — aynı zemin, üç seviye, her şey sabit')
const PROBE_PAL = {
  ground: '#f2ece2', ink: '#221c14', accent: '#a8863b', accent2: '#6b5530',
  card: '#fbf7ef', cardInk: '#221c14', deep: '#171208',
} as unknown as StudioPalette
let honoured = 0
for (const bg of ALL_BACKGROUNDS) {
  const counts = (['quiet', 'measured', 'rich'] as OrnamentLevel[]).map((ornament) => {
    const markup = paintBackground(bg, 70, 90, PROBE_PAL, 12345, { uid: 'probe', ornament })
    return { els: (markup.match(/<(path|rect|circle|ellipse|line|polygon|g)[\s>]/g) ?? []).length, len: markup.length }
  })
  const moves = new Set(counts.map((c) => `${c.els}:${c.len}`)).size > 1
  if (moves) honoured += 1
  console.log(
    `  ${String(bg).padEnd(16)} quiet ${String(counts[0]!.els).padStart(4)} · measured ${String(counts[1]!.els).padStart(4)}` +
      ` · rich ${String(counts[2]!.els).padStart(4)} öğe  ${moves ? '✓ uyguluyor' : '✗ kararı yok sayıyor'}`,
  )
}
console.log(`  sözleşmeye uyan zemin: ${honoured}/${ALL_BACKGROUNDS.length} (%${((honoured / ALL_BACKGROUNDS.length) * 100).toFixed(0)})`)

console.log('\nTYPOGRAPHY — karar → çizilen tipografi geometrisi')
const pairings = [...new Set(rows.map((r) => r.typePairing))].sort()
for (const p of pairings) {
  const mine = rows.filter((r) => r.typePairing === p)
  console.log(
    `  ${p.padEnd(34)} ${String(mine.length).padStart(4)} yüz · yüz sayısı ${mean(mine.map((r) => r.faces)).toFixed(1)}` +
      ` · punto oranı ${mean(mine.map((r) => r.sizeRatio)).toFixed(2)} · harf arası ${mean(mine.map((r) => r.tracking)).toFixed(3)}`,
  )
}

console.log('\nCLAIM BAND — çizildiği yüzler')
const drawn = rows.filter((r) => r.claimDrawn).length
console.log(`  toplam ${drawn}/${rows.length} (%${((drawn / rows.length) * 100).toFixed(0)})`)
const bySector = new Map<string, { n: number; drawn: number }>()
for (const r of rows) {
  const cur = bySector.get(r.sector) ?? { n: 0, drawn: 0 }
  cur.n += 1
  if (r.claimDrawn) cur.drawn += 1
  bySector.set(r.sector, cur)
}
for (const [k, v] of [...bySector].sort((a, b) => b[1].drawn - a[1].drawn)) {
  if (v.drawn) console.log(`    ${k.padEnd(12)} ${v.drawn}/${v.n}`)
}

// A decision that changes nothing on the page is a declaration, not a contract.
const spread = (pick: (r: Row) => number, group: (r: Row) => string) => {
  const g = new Map<string, number[]>()
  for (const r of rows) g.set(group(r), [...(g.get(group(r)) ?? []), pick(r)])
  const means = [...g.values()].filter((v) => v.length >= 5).map(mean)
  if (means.length < 2) return 0
  return (Math.max(...means) - Math.min(...means)) / Math.max(0.001, Math.max(...means))
}
console.log('\nSÖZLEŞME KANITI — karar değiştiğinde geometri ne kadar değişiyor')
console.log(`  typePairing → yüz sayısı:  %${(spread((r) => r.faces, (r) => r.typePairing) * 100).toFixed(0)} fark`)
console.log(`  typePairing → punto oranı: %${(spread((r) => r.sizeRatio, (r) => r.typePairing) * 100).toFixed(0)} fark`)
console.log(`  typePairing → harf arası:  %${(spread((r) => r.tracking, (r) => r.typePairing) * 100).toFixed(0)} fark`)
