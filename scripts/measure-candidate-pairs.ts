/**
 * Are the eight candidates eight designs, and does `distinctiveness` know?
 *
 * `studioDistinctiveness` is the mean Hamming distance from the selected candidate to the others
 * over `COMPOSITION_AXES` — `lockup`, `ornament`, `temperament`, `variant`. Four axes, so the score
 * is (differing axes / 4) × 100, and measured across 599 faces it never exceeds 50: the offer is
 * built by family uniqueness (`uniqueFamilyRows`), not by any composition constraint — the
 * fingerprint is recorded and, as `slimDirectionOffer` says, left for "Phase 3's diversity
 * constraint" that does not exist yet.
 *
 * So the metric's ceiling is a property of how the offer is built, and the question this answers is
 * whether that ceiling hides a real problem. Two candidates are compared three ways:
 *
 *   metadata   all eight `FINGERPRINT_AXES`
 *   composition the four `COMPOSITION_AXES` the score reads
 *   visual     what the painted markup does — where the mass sits, where the focal lands, the type
 *              rhythm and band, how many drawn groups, how much of the panel they reach
 *
 * and classified:
 *
 *   A  same metadata, same visual        — genuinely one candidate offered twice
 *   B  metadata differs, visual does not — a re-skin; the customer sees one design
 *   C  one visual reading differs        — different, not meaningfully
 *   D  two or more visual readings differ — a real art-direction difference
 *
 * Existing vocabulary throughout: the direction's own axes and the painters' own `data-art` names.
 *
 * Audit instrument. Run: `npx vite-node scripts/measure-candidate-pairs.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { inspectStudioDirectionOffer } from '../src/engine/studio/directionTalk'
import { COMPOSITION_AXES, FINGERPRINT_AXES } from '../src/engine/studio/fingerprint'
import { svgHull } from '../src/engine/studio/svgHull'
import type { DesignBrief } from '../src/types'

type Visual = {
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

function visualOf(markup: string, w: number, h: number): Visual {
  const texts = [...markup.matchAll(/<text[^>]*\sy="([-\d.]+)"[^>]*font-size="([\d.]+)"/g)].map((m) => ({
    y: Number(m[1]),
    size: Number(m[2]),
  }))
  const sizes = new Set(texts.map((t) => Math.round(t.size * 4) / 4)).size
  const all = texts.map((t) => t.size)
  const spread = all.length ? Math.max(...all) / Math.max(0.1, Math.min(...all)) : 1
  const ys = texts.map((t) => t.y)

  const groups: { cx: number; cy: number; area: number }[] = []
  for (const m of markup.matchAll(/<g[^>]*data-art="([a-z-]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    const id = m[1]!
    if (id === 'studio' || id === 'studio-fonts') continue
    const hull = svgHull(m[2]!)
    if (!hull) continue
    const gw = hull.maxX - hull.minX
    const gh = hull.maxY - hull.minY
    if (gw <= 0 || gh <= 0) continue
    groups.push({ cx: (hull.minX + hull.maxX) / 2, cy: (hull.minY + hull.maxY) / 2, area: gw * gh })
  }
  const biggest = groups.slice().sort((a, b) => b.area - a.area)[0]
  const coverage = Math.min(1, groups.reduce((n, g) => n + g.area, 0) / Math.max(1, w * h))
  const band = (y: number) => (y < h / 3 ? 'U' : y < (h * 2) / 3 ? 'M' : 'L')
  const occupied = new Set<string>()
  for (const g of groups) occupied.add(band(g.cy))
  for (const y of ys) occupied.add(band(y))

  return {
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

function visualDiffs(a: Visual, b: Visual): string[] {
  const out: string[] = []
  if (a.topology !== b.topology) out.push('topoloji')
  if (Math.hypot(a.focalX - b.focalX, a.focalY - b.focalY) > 0.12) out.push('odak')
  if (Math.abs(a.sizes - b.sizes) >= 2 || Math.abs(a.spread - b.spread) / Math.max(a.spread, b.spread) > 0.25) out.push('tipo ritmi')
  if (Math.abs(a.textTop - b.textTop) > 0.1 || Math.abs(a.textBottom - b.textBottom) > 0.1) out.push('metin bandı')
  if (Math.abs(a.groups - b.groups) >= 2) out.push('grafik')
  if (Math.abs(a.coverage - b.coverage) > 0.12) out.push('kaplama')
  return out
}

const BRIEFS: { name: string; brief: Partial<DesignBrief> }[] = [
  { name: 'lüks parfüm kutu', brief: { sector: 'parfüm', subProduct: 'eau de parfum', packagingMode: 'box', templateId: 'parfum-tuck-end', styleType: 'luxury', volume: '50 ml', dimensionsMm: { L: 70, W: 35, H: 140 } } },
  { name: 'gıda bal etiket', brief: { sector: 'gıda', subProduct: 'çiçek balı', packagingMode: 'label', templateId: 'fm-label-universal', styleType: 'classic', volume: '450 gr', dimensionsMm: { L: 70, W: 0, H: 90 } } },
  { name: 'elektronik kutu', brief: { sector: 'elektronik', subProduct: 'kulaklık', packagingMode: 'box', templateId: 'fm-elec-tuck-earbuds', styleType: 'modern', volume: '1 adet', dimensionsMm: { L: 90, W: 90, H: 45 } } },
  { name: 'bebek şampuan etiket', brief: { sector: 'bebek', subProduct: 'bebek şampuanı', packagingMode: 'label', templateId: 'fm-label-universal', styleType: 'minimal', volume: '250 ml', dimensionsMm: { L: 70, W: 0, H: 90 } } },
  { name: 'kozmetik krem kutu', brief: { sector: 'kozmetik', subProduct: 'yüz kremi', packagingMode: 'box', templateId: 'parfum-tuck-end', styleType: 'eco', volume: '50 ml', dimensionsMm: { L: 60, W: 60, H: 80 } } },
  { name: 'temizlik etiket', brief: { sector: 'temizlik', subProduct: 'yüzey temizleyici', packagingMode: 'label', templateId: 'fm-label-universal', styleType: 'modern', volume: '500 ml', dimensionsMm: { L: 80, W: 0, H: 110 } } },
]

const axisVary = new Map<string, number>()
const axisTotal = new Map<string, number>()
let pairsAll = 0
const classCount = new Map<string, number>()
const examples: string[] = []

for (const job of BRIEFS) {
  const base: DesignBrief = { ...emptyBrief(), brandName: 'Vera', productName: 'Altın Seri', barcode: '8690000000017', ...job.brief } as DesignBrief
  resetArtMemory()
  const offer = inspectStudioDirectionOffer(base)
  const rows: { fp: Record<string, string>; vis: Visual; arche: string }[] = []
  for (const candidate of offer.candidates) {
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({
      brief: { ...base, studioFamily: candidate.family, studioFamilyLocked: true },
      overridePatch: { studio: true, variationIndex: 0 },
    })
    const panel = spec.dieline.panels.find((p) => p.id === spec.artwork.frontPanelId)
    const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)
    if (!panel || !front || !spec.studio) continue
    const d = spec.studio.direction as unknown as Record<string, string>
    const fp: Record<string, string> = {}
    for (const axis of FINGERPRINT_AXES) fp[axis] = String(d[axis])
    rows.push({ fp, vis: visualOf(front.markup, panel.w, panel.h), arche: String(d.archetype) })
  }

  /*
   * Axis variation is read off the **offer's own fingerprints**, not off the regenerated faces.
   * Regenerating a candidate with its family pinned re-derives the direction and can resolve
   * `ornament`/`temperament`/`variant` differently, so measuring there would answer a question the
   * score never asks: `studioDistinctiveness` compares `offer.candidates[].fingerprint`.
   */
  for (const axis of FINGERPRINT_AXES) {
    const vals = new Set(offer.candidates.map((c) => String((c.fingerprint as Record<string, string> | undefined)?.[axis])))
    axisVary.set(axis, (axisVary.get(axis) ?? 0) + vals.size)
    axisTotal.set(axis, (axisTotal.get(axis) ?? 0) + 1)
  }
  const selected = offer.candidates.find((c) => c.selected)?.fingerprint as Record<string, string> | undefined
  if (selected) {
    const others = offer.candidates.filter((c) => !c.selected && c.fingerprint).map((c) => c.fingerprint as unknown as Record<string, string>)
    const mean = others.reduce((acc, f) => acc + COMPOSITION_AXES.filter((ax) => selected[ax] !== f[ax]).length, 0) / Math.max(1, others.length)
    const meanAll = others.reduce((acc, f) => acc + FINGERPRINT_AXES.filter((ax) => selected[ax] !== f[ax]).length, 0) / Math.max(1, others.length)
    /*
     * What the same score would read if the two structurally constant axes were replaced by the two
     * live ones. `temperament` is derived from sector × style and `variant` is 0 for every row in an
     * offer, so both contribute zero distance always — they only lower the denominator.
     */
    const ALT = ['lockup', 'ornament', 'typePairing', 'frame'] as const
    const altMean = others.reduce((acc, f) => acc + ALT.filter((ax) => selected[ax] !== f[ax]).length, 0) / Math.max(1, others.length)
    console.log(
      `  ${job.name.padEnd(22)} bugün ${mean.toFixed(2)}/4 → ${Math.round((mean / 4) * 100)} · önerilen eksenlerle ${altMean.toFixed(2)}/4 → ${Math.round((altMean / 4) * 100)} · tüm eksenlerde ${meanAll.toFixed(2)}/8`,
    )
  }

  let pairs = 0
  const local = new Map<string, number>()
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      pairs += 1
      pairsAll += 1
      const a = rows[i]!
      const b = rows[j]!
      const meta = FINGERPRINT_AXES.filter((ax) => a.fp[ax] !== b.fp[ax]).length
      const vis = visualDiffs(a.vis, b.vis)
      const cls = meta === 0 && vis.length === 0 ? 'A aynı aday' : vis.length === 0 ? 'B görsel aynı (re-skin)' : vis.length === 1 ? 'C zayıf fark' : 'D gerçek art-direction'
      classCount.set(cls, (classCount.get(cls) ?? 0) + 1)
      local.set(cls, (local.get(cls) ?? 0) + 1)
      if ((cls.startsWith('A') || cls.startsWith('B')) && examples.length < 10) {
        const comp = COMPOSITION_AXES.filter((ax) => a.fp[ax] !== b.fp[ax])
        examples.push(`${job.name}: ${a.arche} ↔ ${b.arche} · ${cls} · meta farkı ${meta} · kompozisyon farkı ${comp.length}${comp.length ? ` (${comp.join(',')})` : ''}`)
      }
    }
  }
  const d = local.get('D gerçek art-direction') ?? 0
  console.log(`${job.name.padEnd(22)} aday ${rows.length} · çift ${pairs} · D ${d} (%${((d / Math.max(1, pairs)) * 100).toFixed(0)}) · ${[...local].map(([k, v]) => `${k[0]}${v}`).join(' ')}`)
}

console.log(`\nİKİLİ SINIFLANDIRMA · ${pairsAll} çift`)
for (const [k, v] of [...classCount].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(26)} ${String(v).padStart(4)} (%${((v / pairsAll) * 100).toFixed(0)})`)
}

console.log('\nTEKLİF BAŞINA EKSEN ÇEŞİTLİLİĞİ (ortalama farklı değer sayısı)')
for (const axis of FINGERPRINT_AXES) {
  const avg = (axisVary.get(axis) ?? 0) / Math.max(1, axisTotal.get(axis) ?? 1)
  const inScore = (COMPOSITION_AXES as readonly string[]).includes(axis)
  console.log(`  ${axis.padEnd(14)} ${avg.toFixed(1)} farklı değer / teklif${inScore ? '   ← distinctiveness bunu sayıyor' : ''}`)
}

if (examples.length) {
  console.log('\nA/B örnekleri (görsel olarak ayırt edilemeyen çiftler)')
  for (const e of examples) console.log(`  ${e}`)
}
