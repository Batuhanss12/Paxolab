/**
 * Which drawn elements does the placement model actually know about?
 *
 * The owner's complaint is that shapes are placed to fill space rather than to do a job, and the
 * screenshot that came with it shows a botanical sprig drawn straight through the "DAĞDAN"
 * wordmark. Reading that face's ledger explains it: the front books five boxes — the mark, the
 * brand, the product, the strip and the net quantity — and the sprig is not among them. The
 * collision checker reported zero collisions because the illustration was never *placed*; it was
 * only painted.
 *
 * This sweeps every archetype and asks, per face: what is drawn, and what does the ledger know?
 * An element the ledger cannot see cannot be judged, repaired, or reasoned about — it can only be
 * decoration.
 *
 * Audit instrument. Run: `npx vite-node scripts/audit-element-roles.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { STUDIO_FAMILIES, familyRepertoire } from '../src/engine/studio/family'
import type { StudioFamily } from '../src/engine/studio/types'
import type { DesignBrief } from '../src/types'

/** Drawn groups that are visual matter rather than type — the things "decoration" refers to. */
const DRAWN = ['hero', 'collage', 'window', 'seal', 'ribbon', 'stars', 'plate', 'title-card', 'band', 'pictograms', 'frame', 'skin']

const SURFACES: { key: string; mode: 'box' | 'label'; template: string }[] = [
  { key: 'kutu', mode: 'box', template: 'parfum-tuck-end' },
  { key: 'etiket', mode: 'label', template: 'fm-label-universal' },
]

type Row = { family: string; archetype: string; surface: string; drawn: string[]; booked: number; unbooked: string[] }
const rows: Row[] = []

for (const surface of SURFACES) {
  for (const family of Object.keys(STUDIO_FAMILIES) as StudioFamily[]) {
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: 'Dağdan',
      productName: 'Organi',
      sector: 'gıda',
      subProduct: 'doğal bal',
      packagingMode: surface.mode,
      templateId: surface.template,
      styleType: 'luxury',
      volume: '340 g',
      barcode: '8690000000017',
      dimensionsMm: surface.mode === 'box' ? { L: 70, W: 35, H: 140 } : { L: 70, W: 0, H: 90 },
      studioRepertoire: familyRepertoire(family) ?? 'studio',
      studioFamily: family,
      studioFamilyLocked: true,
    }
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
    const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)
    const report = (spec.studio as unknown as { panels?: { panelId: string; placed: { id: string; kind: string }[] }[] })?.panels?.find(
      (p) => p.panelId === spec.artwork.frontPanelId,
    )
    if (!front || !report) continue

    const drawn = DRAWN.filter((k) => new RegExp(`data-art="${k}"`).test(front.markup))
    // What the ledger booked that is not type: the visual matter it can actually reason about.
    const bookedVisual = report.placed.filter((b) => b.kind === 'element' || b.kind === 'container').map((b) => b.id.replace(/#\d+$/, ''))
    // A drawn group with no plausible booking is invisible to collision, repair and critique.
    const unbooked = drawn.filter((k) => !bookedVisual.some((id) => id.includes(k) || (k === 'hero' && /specimen|hero|subject/.test(id))))
    rows.push({ family, archetype: String(spec.studio?.direction.archetype), surface: surface.key, drawn, booked: bookedVisual.length, unbooked })
  }
}

console.log('yüzey  aile            arketip           çizilen görsel grup           ledger görsel kutu  GÖRÜNMEYEN')
for (const r of rows) {
  console.log(
    `${r.surface.padEnd(6)} ${r.family.padEnd(14)} ${r.archetype.padEnd(17)} ${r.drawn.join(',').padEnd(28)} ${String(r.booked).padStart(6)}              ${r.unbooked.join(',') || '—'}`,
  )
}
const blind = rows.filter((r) => r.unbooked.length > 0)
console.log(`\nyüz ${rows.length} · en az bir görsel öğesi ledger'da olmayan yüz: ${blind.length} (%${((blind.length / rows.length) * 100).toFixed(0)})`)
const perKind = new Map<string, number>()
for (const r of rows) for (const k of r.unbooked) perKind.set(k, (perKind.get(k) ?? 0) + 1)
console.log('görünmeyen grup türleri:', [...perKind].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ') || '—')
