/**
 * How many designs would a hard design gate actually block today?
 *
 * Phase 1 proposes three hard blockers, all of them already detected and reported as craft notes:
 *
 *   HIERARCHY_VIOLATION    studioCraft.ts — product larger than brand on a display-line lockup
 *   DESIGN_CONTRACT_FRAME  studioCraft.ts — the direction chose a frame the painter never drew
 *   REQUIRED_INFO_MISSING  visualCraftScores.ts — a food back with no nutrition declaration
 *
 * Turning a note into a blocker without counting it first is how a gate stops being enforcement and
 * starts being an outage. This counts, on the three populations Phase 1 names, and separates a real
 * render defect from a scoring bug — a note can fire because the design is wrong, or because the
 * detector is.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-blocker-prevalence.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief, DesignSpec } from '../src/types'
import { allSweepBriefs } from './sweep-briefs'

const BLOCKERS = {
  HIERARCHY_VIOLATION: /hiyerarşi kuralı ihlali/,
  DESIGN_CONTRACT_FRAME: /seçildi, çizilmedi/,
  REQUIRED_INFO_MISSING: /nutrition yok/,
} as const
type BlockerId = keyof typeof BLOCKERS

type Hit = { pop: string; label: string; surface: string; family: string; archetype: string; sector: string; frame: string; lockup: string; blocker: BlockerId; evidence: string }
const hits: Hit[] = []
const counts = new Map<string, Map<BlockerId, number>>()
const totals = new Map<string, number>()

function record(pop: string, label: string, spec: DesignSpec, family: string) {
  totals.set(pop, (totals.get(pop) ?? 0) + 1)
  const notes = spec.craftScore?.notes ?? []
  const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  const back = spec.artwork.layers.find((l) => /back/i.test(l.panelId))?.markup ?? ''
  for (const [id, re] of Object.entries(BLOCKERS) as [BlockerId, RegExp][]) {
    const note = notes.find((n) => re.test(n))
    if (!note) continue
    const per = counts.get(pop) ?? new Map<BlockerId, number>()
    per.set(id, (per.get(id) ?? 0) + 1)
    counts.set(pop, per)
    /*
     * Is the note true? A blocker earns its name only when the design is actually wrong. The
     * detector can also be wrong, and then the note is a false positive that must be fixed in the
     * detector rather than enforced against hundreds of valid designs.
     */
    let evidence = note
    if (id === 'REQUIRED_INFO_MISSING') {
      const drawn = /Besin Değerleri|Nutrition/i.test(back)
      evidence = drawn ? 'YANLIŞ POZİTİF — tablo çizili, dedektör büyük harf arıyor' : 'gerçek — arka yüzde tablo yok'
    }
    if (id === 'DESIGN_CONTRACT_FRAME') {
      /*
       * `paintFrame` says it plainly: "corner-brackets and rounded-card are deliberately not drawn
       * here — brackets sit around a lockup and a card *is* a composition, so both stay with the
       * painter that owns the geometry." Those painters write their own markers, so asking for
       * `data-frame=` finds nothing even when the frame is on the page.
       */
      const kind = String(spec.studio?.direction.frame)
      const drawnAs: Record<string, RegExp> = {
        'rounded-card': /data-art="title-card"|data-art="plate"/,
        'corner-brackets': /data-frame="corner-brackets"/,
      }
      const probe = drawnAs[kind] ?? new RegExp(`data-frame="${kind}"`)
      const drawn = probe.test(front) || /data-art="frame"/.test(front)
      evidence = drawn ? `YANLIŞ POZİTİF — ${kind} çizili, dedektör data-frame arıyor` : `gerçek — ${kind} vaat edildi, çizilmedi`
    }
    if (id === 'HIERARCHY_VIOLATION') {
      evidence = `gerçek — lockup ${spec.studio?.direction.lockup}`
    }
    hits.push({
      pop,
      label,
      surface: spec.kind === 'label' ? 'etiket' : 'kutu',
      family,
      archetype: String(spec.studio?.direction.archetype),
      sector: String(spec.brief.sector),
      frame: String(spec.studio?.direction.frame),
      lockup: String(spec.studio?.direction.lockup),
      blocker: id,
      evidence,
    })
  }
}

// --- population 1: the 216 ordinary sweep faces ---
for (const { brief, name } of allSweepBriefs()) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  record('216 süpürme', name, spec, String(spec.brief.studioFamily ?? '—'))
}

// --- population 2: every catalogue job against every family ---
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
    const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } })
    record('324 iş×aile', job.slug, spec, family)
  }
}

// --- population 3: the frozen golden faces ---
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
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } })
  record('19 golden', job.slug, spec, String(spec.brief.studioFamily ?? '—'))
}

console.log('popülasyon        yüz   HIERARCHY  CONTRACT_FRAME  REQUIRED_INFO')
for (const [pop, n] of totals) {
  const per = counts.get(pop) ?? new Map()
  const pct = (k: BlockerId) => {
    const v = per.get(k) ?? 0
    return `${String(v).padStart(4)} (%${((v / n) * 100).toFixed(0)})`
  }
  console.log(`${pop.padEnd(17)} ${String(n).padStart(4)}   ${pct('HIERARCHY_VIOLATION')}   ${pct('DESIGN_CONTRACT_FRAME')}    ${pct('REQUIRED_INFO_MISSING')}`)
}

console.log('\ngerçek kusur mu, dedektör hatası mı:')
const verdicts = new Map<string, number>()
for (const h of hits) {
  const key = `${h.blocker} · ${h.evidence.startsWith('YANLIŞ POZİTİF') ? 'YANLIŞ POZİTİF' : 'gerçek'}`
  verdicts.set(key, (verdicts.get(key) ?? 0) + 1)
}
for (const [k, v] of [...verdicts].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(46)} ${v}`)

for (const id of Object.keys(BLOCKERS) as BlockerId[]) {
  const mine = hits.filter((h) => h.blocker === id)
  if (mine.length === 0) continue
  console.log(`\n--- ${id} (${mine.length}) ---`)
  const by = (pick: (h: Hit) => string) => {
    const m = new Map<string, number>()
    for (const h of mine) m.set(pick(h), (m.get(pick(h)) ?? 0) + 1)
    return [...m].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(' · ')
  }
  console.log(`  yüzey:    ${by((h) => h.surface)}`)
  console.log(`  arketip:  ${by((h) => h.archetype)}`)
  console.log(`  sektör:   ${by((h) => h.sector)}`)
  console.log(`  aile:     ${by((h) => h.family)}`)
  const golden = mine.filter((h) => h.pop === '19 golden')
  console.log(`  GOLDEN'da: ${golden.length}${golden.length ? ' → ' + golden.map((g) => g.label).join(', ') : ''}`)
  const verdictSplit = new Map<string, number>()
  for (const h of mine) verdictSplit.set(h.evidence.replace(/ — .*/, ''), (verdictSplit.get(h.evidence.replace(/ — .*/, '')) ?? 0) + 1)
  console.log(`  karar:    ${[...verdictSplit].map(([k, v]) => `${k} ${v}`).join(' · ')}`)
  if (id === 'DESIGN_CONTRACT_FRAME') {
    const real = mine.filter((h) => !h.evidence.startsWith('YANLIŞ'))
    const fp = mine.filter((h) => h.evidence.startsWith('YANLIŞ'))
    const tally = (list: Hit[]) => {
      const m = new Map<string, number>()
      for (const h of list) m.set(`${h.frame}/${h.lockup}`, (m.get(`${h.frame}/${h.lockup}`) ?? 0) + 1)
      return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')
    }
    console.log(`  GERÇEK:   ${tally(real)}`)
    console.log(`  YANLIŞ:   ${tally(fp)}`)
    const detail = new Map<string, number>()
    for (const h of real) {
      const k = `${h.surface}/${h.archetype}/${h.lockup}/${h.frame}`
      detail.set(k, (detail.get(k) ?? 0) + 1)
    }
    for (const [k, v] of [...detail].sort((a, b) => b[1] - a[1])) console.log(`    · ${k} ${v}`)
  }
}
