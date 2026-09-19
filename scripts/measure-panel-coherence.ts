/**
 * Does a carton look like one design, panel by panel — for BOTH repertoires.
 *
 * The owner's report, with a dieline on screen: the front carries the arch, the medallion, the
 * frame and the botanical; the back carries none of it and the sides carry a different brand mark
 * entirely. "Ön yüzü Antalya, arka kısımları Konya."
 *
 * This instrument reads the painted markup of every panel and compares each non-front panel with
 * the front on four signals a customer actually sees:
 *   ground    — the panel's base colour
 *   signature — the elements that make the front *this* archetype rather than any other (the arch
 *               window, the seal, the ribbon, the plate, the stars…): do they reach another panel?
 *   type      — the font families the panel sets
 *   mark      — whether the panel draws the shared brand mark, and whether the front does too
 *
 * A back panel legitimately carries elements the front does not (the legal column, the table), so
 * raw element overlap is a bad proxy and is not what is counted here — only carry-over of the
 * front's own signature, which is what "one design" means to the eye.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-panel-coherence.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import type { StudioRepertoire } from '../src/engine/studio/types'
import { allSweepBriefs } from './sweep-briefs'

type Sig = { ground: string; art: Set<string>; fonts: Set<string>; mark: boolean; paths: number }

function signature(markup: string): Sig {
  const ground = /<rect[^>]*\sfill="(#[0-9a-fA-F]{3,8})"/.exec(markup)?.[1]?.toLowerCase() ?? '-'
  const art = new Set([...markup.matchAll(/data-art="([a-z-]+)"/g)].map((m) => m[1]))
  const fonts = new Set([...markup.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1].split(',')[0].replace(/['"]/g, '').trim()))
  return { ground, art, fonts, mark: art.has('brand-mark') || art.has('brand-logo'), paths: (markup.match(/<path /g) ?? []).length }
}

const jaccard = (a: Set<string>, b: Set<string>) => {
  const union = new Set([...a, ...b])
  if (!union.size) return 1
  let hit = 0
  for (const k of a) if (b.has(k)) hit += 1
  return hit / union.size
}

/**
 * What makes the front *this* archetype — its structure, not its artwork.
 *
 * `hero` is deliberately absent: no design repeats its hero illustration on a back or a side, so
 * counting it would charge every carton for something none of them should do — the first version
 * of this set included it and reported 0% carry for a whole brief for that reason alone.
 */
const SIGNATURE = new Set(['window', 'seal', 'ribbon', 'stars', 'plate', 'title-card', 'band', 'pictograms', 'frame'])
const signatureOf = (art: Set<string>) => new Set([...art].filter((k) => SIGNATURE.has(k)))

type Acc = { panels: number; ground: number; art: number[]; fonts: number[]; markSplit: number; faces: number; frontMark: number }
const acc = new Map<StudioRepertoire, Acc>()
const of = (r: StudioRepertoire): Acc => {
  let hit = acc.get(r)
  if (!hit) {
    hit = { panels: 0, ground: 0, art: [], fonts: [], markSplit: 0, faces: 0, frontMark: 0 }
    acc.set(r, hit)
  }
  return hit
}
const worst: Array<[StudioRepertoire, string, string, number]> = []

for (const { brief, name } of allSweepBriefs()) {
  if (brief.packagingMode !== 'box') continue
  for (const repertoire of ['studio', 'reference'] as const) {
    const a = of(repertoire)
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({ brief: { ...brief, studioRepertoire: repertoire }, overridePatch: { studio: true, variationIndex: 0 } })
    const layers = spec.artwork.layers
    const front = layers.find((l) => l.panelId === spec.artwork.frontPanelId)
    if (!front) continue
    const fs = signature(front.markup)
    a.faces += 1
    if (fs.mark) a.frontMark += 1
    for (const layer of layers) {
      if (layer.panelId === spec.artwork.frontPanelId) continue
      const s = signature(layer.markup)
      // A panel that draws no art element at all is a glue flap, not a design panel. (Counting
      // paths instead, as this once did, miscounts any panel whose skin is drawn with rects.)
      if (s.art.size === 0) continue
      a.panels += 1
      if (s.ground === fs.ground) a.ground += 1
      const sig = signatureOf(fs.art)
      const carried = [...sig].filter((k) => s.art.has(k)).length
      const art = sig.size ? carried / sig.size : 1
      a.art.push(art)
      a.fonts.push(jaccard(fs.fonts, s.fonts))
      // The defect the owner pointed at: a panel wearing the shared mark while the front wears its own.
      if (s.mark && !fs.mark) a.markSplit += 1
      worst.push([repertoire, name, layer.panelId, art])
    }
  }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((x, y) => x + y, 0) / xs.length : 0)
console.log('repertuar    panel  zemin aynı  imza taşıma  tip örtüşmesi  işaret bölünmesi')
for (const repertoire of ['studio', 'reference'] as const) {
  const a = of(repertoire)
  console.log(
    `${repertoire.padEnd(12)} ${String(a.panels).padStart(5)}  ${`${((a.ground / a.panels) * 100).toFixed(0)}%`.padStart(10)}  ${`${(avg(a.art) * 100).toFixed(0)}%`.padStart(16)}  ${`${(avg(a.fonts) * 100).toFixed(0)}%`.padStart(13)}  ${`${a.markSplit}/${a.panels}`.padStart(16)}`,
  )
  console.log(`             ön yüzde ortak marka işareti taşıyan: ${a.frontMark}/${a.faces}`)
}

worst.sort((x, y) => x[3] - y[3])
console.log('\nön yüzün imzasını en az taşıyan paneller:')
for (const [r, name, panel, score] of worst.slice(0, 10)) console.log(`  ${r.padEnd(10)} ${name.padEnd(26)} ${panel.padEnd(12)} imza taşıma %${(score * 100).toFixed(0)}`)
