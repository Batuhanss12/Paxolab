/**
 * Are the eight candidates different *designs*, or the same design wearing different clothes?
 *
 * F-28 measured axis difference — archetype, lockup, type pairing, ornament, frame — and reported
 * "identical design: 0 of 108". That is a real measurement and it is not the question the owner is
 * asking. Two faces can differ on five axes and still be a centred stack with a mark on top: same
 * topology, same focal position, same text rhythm, different decoration.
 *
 * So this reads the painted markup and compares what a designer would compare:
 *
 *   topology     where the visual mass sits vertically (thirds), as a signature
 *   focal        the largest drawn group's centre, normalised to the panel
 *   textRhythm   how many type sizes, and the spread between largest and smallest
 *   textBand     the vertical band the type occupies
 *   graphic      how many distinct drawn groups carry visual matter
 *   coverage     how much of the panel the drawn geometry reaches
 *
 * Two candidates count as *visually distinct* when they differ meaningfully on at least three of
 * these. Anything less is a re-skin.
 *
 * Audit instrument. Run: `npx vite-node scripts/audit-candidate-diversity.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { inspectStudioDirectionOffer } from '../src/engine/studio/directionTalk'
import { svgHull } from '../src/engine/studio/svgHull'
import type { DesignBrief } from '../src/types'

type Sig = {
  archetype: string
  topology: string
  focalX: number
  focalY: number
  sizes: number
  spread: number
  textTop: number
  textBottom: number
  groups: number
  coverage: number
}

function signature(markup: string, w: number, h: number, archetype: string): Sig {
  // Type: every set line, with its size and baseline.
  const texts = [...markup.matchAll(/<text[^>]*\sy="([-\d.]+)"[^>]*font-size="([\d.]+)"/g)].map((m) => ({
    y: Number(m[1]),
    size: Number(m[2]),
  }))
  const sizes = new Set(texts.map((t) => Math.round(t.size * 4) / 4)).size
  const allSizes = texts.map((t) => t.size)
  const spread = allSizes.length ? Math.max(...allSizes) / Math.max(0.1, Math.min(...allSizes)) : 1
  const ys = texts.map((t) => t.y)

  // Drawn matter: each `data-art` group's real reach.
  const groups: { id: string; cx: number; cy: number; area: number }[] = []
  for (const m of markup.matchAll(/<g[^>]*data-art="([a-z-]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const id = m[1]!
    if (id === 'studio' || id === 'studio-fonts') continue
    const hull = svgHull(m[2]!)
    if (!hull) continue
    const gw = hull.maxX - hull.minX
    const gh = hull.maxY - hull.minY
    if (gw <= 0 || gh <= 0) continue
    groups.push({ id, cx: (hull.minX + hull.maxX) / 2, cy: (hull.minY + hull.maxY) / 2, area: gw * gh })
  }
  const biggest = groups.slice().sort((a, b) => b.area - a.area)[0]
  const coverage = Math.min(1, groups.reduce((n, g) => n + g.area, 0) / Math.max(1, w * h))

  // Topology: which vertical third each piece of mass lands in, as a three-letter signature.
  const band = (y: number) => (y < h / 3 ? 'U' : y < (h * 2) / 3 ? 'M' : 'L')
  const occupied = new Set<string>()
  for (const g of groups) occupied.add(band(g.cy))
  for (const y of ys) occupied.add(band(y))

  return {
    archetype,
    topology: ['U', 'M', 'L'].map((k) => (occupied.has(k) ? k : '·')).join(''),
    focalX: biggest ? biggest.cx / w : 0.5,
    focalY: biggest ? biggest.cy / h : 0.5,
    sizes,
    spread,
    textTop: ys.length ? Math.min(...ys) / h : 0,
    textBottom: ys.length ? Math.max(...ys) / h : 0,
    groups: groups.length,
    coverage,
  }
}

/** How many of the six readings differ meaningfully between two candidates. */
function distinctAxes(a: Sig, b: Sig): string[] {
  const out: string[] = []
  if (a.topology !== b.topology) out.push('topology')
  if (Math.hypot(a.focalX - b.focalX, a.focalY - b.focalY) > 0.12) out.push('focal')
  if (Math.abs(a.sizes - b.sizes) >= 2 || Math.abs(a.spread - b.spread) / Math.max(a.spread, b.spread) > 0.25) out.push('textRhythm')
  if (Math.abs(a.textTop - b.textTop) > 0.1 || Math.abs(a.textBottom - b.textBottom) > 0.1) out.push('textBand')
  if (Math.abs(a.groups - b.groups) >= 2) out.push('graphic')
  if (Math.abs(a.coverage - b.coverage) > 0.12) out.push('coverage')
  return out
}

const BRIEFS: { name: string; brief: Partial<DesignBrief> }[] = [
  { name: 'lüks parfüm kutu', brief: { sector: 'parfüm', subProduct: 'eau de parfum', packagingMode: 'box', templateId: 'parfum-tuck-end', styleType: 'luxury', volume: '50 ml', dimensionsMm: { L: 70, W: 35, H: 140 } } },
  { name: 'gıda bal etiket', brief: { sector: 'gıda', subProduct: 'çiçek balı', packagingMode: 'label', templateId: 'fm-label-universal', styleType: 'classic', volume: '450 gr', dimensionsMm: { L: 70, W: 0, H: 90 } } },
  { name: 'elektronik kutu', brief: { sector: 'elektronik', subProduct: 'kulaklık', packagingMode: 'box', templateId: 'fm-elec-tuck-earbuds', styleType: 'modern', volume: '1 adet', dimensionsMm: { L: 90, W: 90, H: 45 } } },
]

for (const job of BRIEFS) {
  const base: DesignBrief = { ...emptyBrief(), brandName: 'Vera', productName: 'Altın', barcode: '8690000000017', ...job.brief } as DesignBrief
  resetArtMemory()
  const offer = inspectStudioDirectionOffer(base)
  const sigs: Sig[] = []
  for (const candidate of offer.candidates) {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: { ...base, studioFamily: candidate.family, studioFamilyLocked: true },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    const panel = spec.dieline.panels.find((p) => p.id === spec.artwork.frontPanelId)
    const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)
    if (!panel || !front) continue
    sigs.push(signature(front.markup, panel.w, panel.h, String(spec.studio?.direction.archetype)))
  }

  console.log(`\n=== ${job.name} · ${sigs.length} aday ===`)
  console.log('arketip           topoloji  odak(x,y)    punto  aralık  metin bandı   grup  kaplama')
  for (const s of sigs) {
    console.log(
      `${s.archetype.padEnd(17)} ${s.topology.padEnd(9)} ${s.focalX.toFixed(2)},${s.focalY.toFixed(2)}   ${String(s.sizes).padStart(4)} ${s.spread.toFixed(1).padStart(6)}  ${s.textTop.toFixed(2)}–${s.textBottom.toFixed(2)}   ${String(s.groups).padStart(3)}  ${(s.coverage * 100).toFixed(0).padStart(4)}%`,
    )
  }
  let pairs = 0
  let distinct = 0
  const weak: string[] = []
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      pairs += 1
      const axes = distinctAxes(sigs[i]!, sigs[j]!)
      if (axes.length >= 3) distinct += 1
      else weak.push(`${sigs[i]!.archetype} ↔ ${sigs[j]!.archetype} (yalnız ${axes.join(',') || 'hiçbiri'})`)
    }
  }
  console.log(`çift ${pairs} · görsel olarak ayrı (≥3 okuma) ${distinct} (%${((distinct / pairs) * 100).toFixed(0)})`)
  for (const w of weak.slice(0, 6)) console.log(`  zayıf: ${w}`)
}
