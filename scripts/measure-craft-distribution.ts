/**
 * Craft score distribution over the 18 golden faces — Phase 0 baseline for the evaluator.
 *
 * The audit measured three faces and found the typography dimension saturated by accident (the
 * font-name regex matches fallback names in the studio font stacks) and the decoration dimension
 * blind (the kit's `data-pattern` / LIBRARY signals never fire on a studio face). Phase 1 repairs
 * the evaluator; this prints the numbers it has to move, over the whole frozen set, so the repair
 * is judged against a baseline and not against a memory of one.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-craft-distribution.ts`
 */
import { faceOf } from '../src/engine/brain/visualCraftScores'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_GALLERY_JOBS } from '../src/engine/studio/studioGalleryJobs'
import { STUDIO_CRAFT_FLOOR } from '../src/engine/studio/studioRepair'
import { allSweepBriefs } from './sweep-briefs'

const DIMS = ['visualCraft', 'hero', 'composition', 'hierarchy', 'typography', 'decoration', 'sectorFit', 'productFit', 'informationDesign', 'originality'] as const

/** The kit-vocabulary signals the scorer looks for, and the studio ones it could look for. */
const SIGNALS: Record<string, RegExp> = {
  displayFonts: /Palatino|Segoe UI|Trebuchet|Cambria|Garamond|Constantia|Corbel/,
  hasHero: /data-art="hero"/,
  library: /data-hero="(monstera|palm|organic-wave|zebra|botanical|emblem)"/,
  kitPattern: /data-pattern=/,
  lockout: /lockout-/,
  studioFrame: /data-art="frame"/,
  studioLockup: /data-art="lockup"/,
}

const rows: { slug: string; scores: Record<string, number>; hits: Record<string, boolean> }[] = []
for (const job of STUDIO_GALLERY_JOBS) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
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
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const face = faceOf(spec)
  const cs = spec.craftScore
  const scores: Record<string, number> = {}
  for (const d of DIMS) scores[d] = (cs as Record<string, number> | undefined)?.[d] ?? 0
  const hits: Record<string, boolean> = {}
  for (const [k, re] of Object.entries(SIGNALS)) hits[k] = re.test(face)
  rows.push({ slug: job.slug, scores, hits })
}

const stat = (key: string) => {
  const v = rows.map((r) => r.scores[key] ?? 0)
  const min = Math.min(...v)
  const max = Math.max(...v)
  const mean = v.reduce((a, b) => a + b, 0) / v.length
  return { min, max, mean, spread: max - min }
}

console.log(`golden yüz: ${rows.length}`)
console.log('boyut          min   max   ort   yayılım')
for (const d of DIMS) {
  const s = stat(d)
  console.log(`${d.padEnd(14)} ${String(s.min).padStart(4)} ${String(s.max).padStart(5)} ${s.mean.toFixed(1).padStart(6)} ${String(s.spread).padStart(6)}`)
}
console.log('\nsinyal isabeti (18 yüzde kaçında ateşliyor)')
for (const k of Object.keys(SIGNALS)) {
  const n = rows.filter((r) => r.hits[k]).length
  console.log(`  ${k.padEnd(13)} ${String(n).padStart(2)}/${rows.length}`)
}
const floor = STUDIO_CRAFT_FLOOR
const under = rows.filter((r) => (r.scores.visualCraft ?? 0) < floor).map((r) => r.slug)
console.log(`\nzanaat tabanı ${floor} altında: ${under.length}${under.length ? ` (${under.join(', ')})` : ''}`)

/*
 * Ordinary faces, not curated ones.
 *
 * The goldens are the faces the catalogue deliberately keeps, so their band says where *good*
 * lands. A gate floor also has to respect where an ordinary, un-curated brief lands — a floor set
 * from the goldens alone would re-route legitimate faces it never saw. The sweep table is 108
 * briefs across every sector, mood, surface and two personalities; the totals below are read
 * with the gate as configured, so a raised floor shows up here as re-routing before it ships.
 */
const sweep: number[] = []
let rerouted = 0
for (const { brief } of allSweepBriefs()) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  sweep.push(spec.craftScore?.visualCraft ?? 0)
  if (/zanaat/.test(spec.studio?.repaired ?? '')) rerouted += 1
}
sweep.sort((a, b) => a - b)
const pct = (p: number) => sweep[Math.min(sweep.length - 1, Math.floor(sweep.length * p))]
console.log(`\ngolden olmayan yüz (${sweep.length}): min ${sweep[0]} · p05 ${pct(0.05)} · p25 ${pct(0.25)} · medyan ${pct(0.5)} · max ${sweep[sweep.length - 1]} · zanaat kapısı yönlendirdi ${rerouted}`)
for (const candidate of [50, 55, 60, 62, 65]) {
  console.log(`  taban ${candidate} olsa altında kalan: ${sweep.filter((s) => s < candidate).length}/${sweep.length}`)
}
