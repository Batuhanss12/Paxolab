/**
 * Required, available, rendered, detectable — which layer actually failed?
 *
 * A nutrition table can be absent for three unrelated reasons, and until Phase 2D they arrived at
 * the gate as one fact: `nutritionTable` returns empty markup when the declaration will not fit,
 * the carton back skips the whole food register with under 26 mm left, and the flat label back
 * takes neither branch of its width chain. Phase 1 enforced the absence and blocked 8 legitimate
 * catalogue designs; Phase 1.5 had to withdraw the blocker because nothing could tell the cases
 * apart.
 *
 * `Ledger.skip` now records a declined block with its reason, so this reads both sides structurally
 * — `placed` for rendered, `skipped` for declined — and never searches the back markup. The last
 * column is the one that matters: an absence with no recorded reason is a renderer that failed.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-required-info.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { activeTemplates } from '../src/engine/catalog/catalog'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief, DesignSpec, StyleType } from '../src/types'
import { allSweepBriefs } from './sweep-briefs'

type State = 'NOT_REQUIRED' | 'REQUIRED_AND_RENDERED' | 'REQUIRED_BUT_NO_SPACE' | 'REQUIRED_BUT_NOT_RENDERED'
type Row = { pop: string; label: string; state: State; isLabel: boolean; blocked: boolean; markupHasTable: boolean; sector: string; templateId: string; drawn: string[]; skips: { id: string; reason: string }[] }

const rows: Row[] = []

function record(pop: string, label: string, spec: DesignSpec) {
  if (!spec.studio || !spec.designPlan) return
  const sector = spec.designPlan.sector
  const panels = spec.studio.panels
  const rendered = panels.some((p) => p.placed.some((b) => (b.id.split('#')[0] ?? b.id) === 'nutrition-table'))
  // Mirrors `nutritionState` in `brain/studioCraft.ts`; a swing tag carries no legal register at all.
  const skips = panels.flatMap((p) => p.skipped ?? []).filter((s) => s.id === 'nutrition-table')
  const state: State =
    sector !== 'food' && sector !== 'beverage'
      ? 'NOT_REQUIRED'
      : rendered
        ? 'REQUIRED_AND_RENDERED'
        : skips.some((x) => x.reason === 'not-this-surface')
          ? 'NOT_REQUIRED'
          : skips.length
            ? 'REQUIRED_BUT_NO_SPACE'
            : 'REQUIRED_BUT_NOT_RENDERED'
  /*
   * Every panel, not the ones named "back". A triangular gift box has `base`, `wall-0..2` and
   * `glue-tab` and carries its declaration on `wall-1`; filtering on the name reported a missing
   * table on a carton that has one — the exact failure the ledger-based detector does not have.
   */
  const back = spec.artwork.layers.map((l) => l.markup).join('')
  rows.push({
    pop,
    label,
    state,
    isLabel: spec.kind === 'label',
    blocked: (spec.craftScore?.blockers ?? []).some((b) => b.id === 'REQUIRED_INFO_MISSING'),
    // The old evidence, kept only so the two can be compared — the detector no longer reads it.
    markupHasTable: /Besin Değerleri|Nutrition Facts/.test(back),
    sector: String(sector),
    templateId: String(spec.brief.templateId),
    // Every register the column actually set, and every one it declined with its reason.
    drawn: [...new Set(panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id).filter((id) => id.startsWith('legal-title:')).map((id) => id.slice('legal-title:'.length)))],
    placedIds: [...new Set(panels.flatMap((p) => p.placed).map((b) => b.id.split('#')[0] ?? b.id))],
    skips: panels.flatMap((p) => p.skipped ?? []),
  })
}

for (const { brief, name } of allSweepBriefs()) {
  resetArtMemory()
  record('A 216', name, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
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
    record('B 324', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
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
  record('C 18', job.slug, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
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
    record('D 41', `${tmpl.id}·${sector}`, new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
  }
}

const POPS = ['A 216', 'B 324', 'C 18', 'D 41']
const STATES: State[] = ['NOT_REQUIRED', 'REQUIRED_AND_RENDERED', 'REQUIRED_BUT_NO_SPACE', 'REQUIRED_BUT_NOT_RENDERED']

console.log(`${rows.length} yüz\n`)
console.log('popülasyon  gerekmiyor  çizildi  yer yok  ÇİZİLMEDİ  blocker')
for (const pop of POPS) {
  const mine = rows.filter((r) => r.pop === pop)
  const n = (s: State) => mine.filter((r) => r.state === s).length
  console.log(
    `${pop.padEnd(11)} ${String(n('NOT_REQUIRED')).padStart(9)} ${String(n('REQUIRED_AND_RENDERED')).padStart(8)}` +
      ` ${String(n('REQUIRED_BUT_NO_SPACE')).padStart(8)} ${String(n('REQUIRED_BUT_NOT_RENDERED')).padStart(10)}` +
      ` ${String(mine.filter((r) => r.blocked).length).padStart(8)}`,
  )
}
const total = (s: State) => rows.filter((r) => r.state === s).length
console.log(`${'TOPLAM'.padEnd(11)} ${String(total('NOT_REQUIRED')).padStart(9)} ${String(total('REQUIRED_AND_RENDERED')).padStart(8)}` +
  ` ${String(total('REQUIRED_BUT_NO_SPACE')).padStart(8)} ${String(total('REQUIRED_BUT_NOT_RENDERED')).padStart(10)}` +
  ` ${String(rows.filter((r) => r.blocked).length).padStart(8)}`)

console.log('\nDEDEKTÖR BÜTÜNLÜĞÜ — yapısal durum ile işaretleme birbirini tutuyor mu')
const fp = rows.filter((r) => r.blocked && r.markupHasTable)
const fn = rows.filter((r) => r.state === 'REQUIRED_BUT_NOT_RENDERED' && !r.blocked)
const mismatch = rows.filter((r) => (r.state === 'REQUIRED_AND_RENDERED') !== r.markupHasTable && r.state !== 'NOT_REQUIRED')
console.log(`  yanlış pozitif (engellendi ama tablo işaretlemede var): ${fp.length}`)
console.log(`  yanlış negatif (çizilmedi ama engellenmedi):             ${fn.length}`)
console.log(`  ledger ile işaretleme uyuşmazlığı:                       ${mismatch.length}`)
for (const r of mismatch.slice(0, 6)) console.log(`    ${r.pop} ${r.label} · ${r.state} · işaretlemede tablo ${r.markupHasTable}`)

const failed = rows.filter((r) => r.state === 'REQUIRED_BUT_NOT_RENDERED')
if (failed.length) {
  console.log(`
ÇİZİLMEDİ — sebebi kaydedilmemiş ${failed.length} yüz (blocker bunlara ateşliyor)`)
  for (const r of failed) console.log(`    ${r.pop} ${r.label} · şablon ${r.templateId} · sektör ${r.sector}`)
}

const noSpace = rows.filter((r) => r.state === 'REQUIRED_BUT_NO_SPACE')
if (noSpace.length) {
  console.log(`\nYER YOK — ${noSpace.length} yüz, engellenmeyen ama uyarılan durum`)
  const byTmpl = new Map<string, number>()
  for (const r of noSpace) byTmpl.set(r.templateId, (byTmpl.get(r.templateId) ?? 0) + 1)
  for (const [k, v] of [...byTmpl].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`    ${k} × ${v}`)
}

console.log('')
console.log('ZORUNLU REGISTERLAR — çizilen / düşen / sessiz')
/*
 * The legal column's four registers plus the ones the footer carries. `drawn` for the legal ones is
 * the `legal-title:<id>` box the column writes; for the rest it is the element the painter places.
 * The last column is the only one that means a fault: absent, and nobody said why.
 */
const REG: [string, string][] = [
  ['ingredients', 'legal'],
  ['usage', 'legal'],
  ['warnings', 'legal'],
  ['storage', 'legal'],
  ['barcode', 'element'],
  ['pictograms', 'picto'],
  ['net-quantity', 'element'],
  ['nutrition-table', 'element'],
]
/*
 * Silence only means something inside the register's own scope. A barcode belongs on every face; a
 * storage line is a food *carton* register that rides beside the nutrition table, so counting its
 * absence on 522 labels and cosmetics faces would report the instrument's ignorance, not a fault.
 */
const touched = (r: Row, reg: string) => r.drawn.includes(reg) || r.skips.some((s) => s.id === reg)
const inScope = (r: Row, reg: string): boolean => {
  // Storage rides beside the nutrition table on a food *carton*; a food label has no such register.
  if (reg === 'storage') return (r.state !== 'NOT_REQUIRED' && !r.isLabel) || touched(r, reg)
  if (reg === 'nutrition-table') return r.state !== 'NOT_REQUIRED' || touched(r, reg)
  if (reg === 'ingredients' || reg === 'usage' || reg === 'warnings') {
    return r.drawn.length > 0 || r.skips.some((s) => ['ingredients', 'usage', 'warnings'].includes(s.id))
  }
  return true
}
let silentTotal = 0
for (const [reg, kind] of REG) {
  const present = (r: Row) =>
    kind === 'legal' ? r.drawn.includes(reg) : kind === 'picto' ? r.placedIds.some((i) => i.startsWith('picto-')) : r.placedIds.includes(reg)
  const drew = rows.filter(present).length
  const noSp = rows.filter((r) => r.skips.some((s) => s.id === reg && s.reason === 'no-space')).length
  const noCo = rows.filter((r) => r.skips.some((s) => s.id === reg && s.reason === 'no-content')).length
  const notHere = rows.filter((r) => r.skips.some((s) => s.id === reg && s.reason === 'not-this-surface')).length
  const scope = rows.filter((r) => inScope(r, reg))
  const counted = scope.filter((r) => !present(r) && !r.skips.some((s) => s.id === reg)).length
  silentTotal += counted
  console.log(
    `  ${reg.padEnd(16)} çizildi ${String(drew).padStart(4)} · yer yok ${String(noSp).padStart(3)} · içerik yok ${String(noCo).padStart(3)}` +
      ` · bu yüzey değil ${String(notHere).padStart(3)} · SESSİZ ${String(counted).padStart(3)} / kapsam ${scope.length}`,
  )
}
console.log(`  toplam sessiz düşüş: ${silentTotal}`)

const legalSilent = rows.filter((r) => inScope(r, 'ingredients') && !r.drawn.includes('ingredients') && !r.skips.some((s) => s.id === 'ingredients'))
if (legalSilent.length) {
  console.log('')
  console.log('içindekiler sessiz — hangi şablon:')
  const m = new Map<string, number>()
  for (const r of legalSilent) m.set(`${r.templateId} · legal-title çizildi=${r.drawn.length}`, (m.get(`${r.templateId} · legal-title çizildi=${r.drawn.length}`) ?? 0) + 1)
  for (const [k, v] of [...m].sort((a, b) => b[1] - a[1])) console.log(`    ${k} × ${v}`)
}

