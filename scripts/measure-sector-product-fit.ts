/**
 * What do `sectorFit` and `productFit` read on a studio face?
 *
 * Every other craft axis hands off to `studioCraft.ts` when `ctx.studio` is present. These two
 * never got that branch, so they are still scored with kit-era evidence: `data-hero="crest"`,
 * `data-pattern="hexagon"`, `data-lockup-chrome=`, `CERAMIDE`, `NIACINAMIDE`, the perfume flash
 * point `2004.78`. `visualCraftScores.ts` says in its own `ScoreCtx` comment that those markers are
 * "not something a studio face ever emits".
 *
 * Together they carry 16% of the weighted craft total (`sectorFit` .10, `productFit` .06), so this
 * reports what they actually produce across all four populations, and how much of the reading comes
 * from evidence versus from the opening constant.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-sector-product-fit.ts`
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

/** The kit-era markers the two scorers look for, exactly as written in `visualCraftScores.ts`. */
const KIT_MARKERS = [
  /data-hero="(crest|seal|tech)"/,
  /data-lockup-chrome="centered-crest"/,
  /data-pattern="(hexagon|dotgrid|lattice|stripe|weave|grain|ornament|wave)"/,
  /2004\.78/,
  /CERAMIDE|SHEA|CENTELLA|NIACINAMIDE/,
]

type Row = { pop: string; sectorFit: number; productFit: number; visualCraft: number; kitMarker: boolean; sector: string }
const rows: Row[] = []

function record(pop: string, spec: DesignSpec) {
  const card = spec.craftScore
  if (!card || !spec.studio) return
  const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  rows.push({
    pop,
    sectorFit: card.sectorFit,
    productFit: card.productFit,
    visualCraft: card.visualCraft,
    kitMarker: KIT_MARKERS.some((m) => m.test(front)),
    sector: String(spec.designPlan?.sector),
  })
}

for (const { brief } of allSweepBriefs()) {
  resetArtMemory()
  record('A 216 süpürme', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
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
    record('B 324 iş×aile', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
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
  record('C 18 golden', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 } }))
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
    record('D 41 katalog', new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }))
  }
}

const POPS = ['A 216 süpürme', 'B 324 iş×aile', 'C 18 golden', 'D 41 katalog']
const stats = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b)
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(s.length * p))]
  const mean = s.reduce((a, b) => a + b, 0) / s.length
  return `min ${q(0)} · p25 ${q(0.25)} · medyan ${q(0.5)} · p75 ${q(0.75)} · max ${s[s.length - 1]} · ort ${mean.toFixed(1)} · farklı ${new Set(s).size}`
}

for (const [label, pick] of [['SECTOR FIT', (r: Row) => r.sectorFit], ['PRODUCT FIT', (r: Row) => r.productFit], ['VISUAL CRAFT', (r: Row) => r.visualCraft]] as const) {
  console.log(`\n${label}`)
  for (const pop of POPS) {
    const mine = rows.filter((r) => r.pop === pop)
    if (mine.length) console.log(`  ${pop.padEnd(15)} ${String(mine.length).padStart(4)} yüz · ${stats(mine.map(pick))}`)
  }
}

const withMarker = rows.filter((r) => r.kitMarker).length
console.log(`\nKANIT: kit-dönemi işaretini taşıyan stüdyo yüzü ${withMarker}/${rows.length} (%${((withMarker / rows.length) * 100).toFixed(0)})`)
console.log('  yani bu iki eksen çoğu yüzde kendi açılış sabitini raporluyor, tasarımı değil.')
