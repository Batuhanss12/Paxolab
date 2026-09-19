/**
 * Does anything print outside the actual cut?
 *
 * The ledger's bounds check is `a.x + a.w > panel.w` — the panel's **bounding rectangle**. It never
 * reads `panel.polygon`, which is the shape the die actually cuts. On a rectangular label those are
 * the same thing and the check is right. On a disc, an oval or any shaped cut they are not: an
 * element sitting at the bottom centre of the bounding box is inside the rectangle and outside the
 * disc. The ledger reports clean and the print is wrong — which is why every sweep so far has said
 * "dirty 0" while the owner could see a barcode hanging off the edge of a round label.
 *
 * This measures the thing the ledger does not: every placed box against the real polygon.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-cut-overflow.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { emptyBrief } from '../src/engine/fields'
import { FORMA_TEMPLATES, modeFromTemplate } from '../src/engine/catalog/catalog'
import type { DesignBrief } from '../src/types'

type Pt = { x: number; y: number }

/** Ray casting. Points on the boundary count as inside — this hunts real overhang, not rounding. */
function inside(poly: Pt[], p: Pt): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!
    const b = poly[j]!
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}

/**
 * Signed clearance to the cut, in mm: positive inside, negative outside.
 *
 * Print needs more than "inside the cut" — trim wanders, so content keeps a safe margin. A barcode
 * that clears the die by half a millimetre is a barcode the guillotine will shave.
 */
function clearance(poly: Pt[], box: { x: number; y: number; w: number; h: number }): number {
  const cs: Pt[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x, y: box.y + box.h },
    { x: box.x + box.w, y: box.y + box.h },
  ]
  let worst = Infinity
  for (const c of cs) {
    let best = Infinity
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i]!
      const b = poly[j]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const l2 = dx * dx + dy * dy || 1
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / l2))
      best = Math.min(best, Math.hypot(c.x - (a.x + t * dx), c.y - (a.y + t * dy)))
    }
    worst = Math.min(worst, inside(poly, c) ? best : -best)
  }
  return worst
}

/** How far outside the cut a box reaches, in mm — 0 when every corner is in. */
function overhang(poly: Pt[], box: { x: number; y: number; w: number; h: number }): number {
  const corners: Pt[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x, y: box.y + box.h },
    { x: box.x + box.w, y: box.y + box.h },
  ]
  let worst = 0
  for (const c of corners) {
    if (inside(poly, c)) continue
    // Distance from the corner to the nearest polygon edge — how much has to come back in.
    let best = Infinity
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i]!
      const b = poly[j]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len2 = dx * dx + dy * dy || 1
      const t = Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2))
      const px = a.x + t * dx
      const py = a.y + t * dy
      best = Math.min(best, Math.hypot(c.x - px, c.y - py))
    }
    worst = Math.max(worst, best)
  }
  return worst
}

const SECTORS: [string, string, string][] = [
  ['gıda', 'çiçek balı', '450 gr'],
  ['kozmetik', 'yüz kremi', '50 ml'],
  ['içecek', 'filtre kahve', '250 gr'],
  ['sağlık', 'vitamin', '60 kapsül'],
]

let faces = 0
let dirty = 0
const hits: string[] = []

for (const template of FORMA_TEMPLATES) {
  if (modeFromTemplate(template) !== 'label') continue
  for (const [sector, subProduct, volume] of SECTORS) {
    const brief: DesignBrief = {
      ...emptyBrief(),
      brandName: 'Vera',
      productName: 'Altın',
      sector,
      subProduct,
      packagingMode: 'label',
      templateId: template.id,
      styleType: 'luxury',
      volume,
      barcode: '8690000000017',
    }
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
    const reports = (spec.studio as unknown as { panels?: { panelId: string; placed: { id: string; kind: string; x: number; y: number; w: number; h: number }[] }[] })?.panels ?? []
    for (const report of reports) {
      const panel = spec.dieline.panels.find((p) => p.id === report.panelId)
      const sheetPoly = (panel as unknown as { polygon?: Pt[] })?.polygon
      if (!panel || !Array.isArray(sheetPoly) || sheetPoly.length < 4) continue
      /*
       * The polygon is in sheet coordinates and the ledger's boxes are panel-local. Comparing them
       * directly reported a 104 mm overhang on a 60 mm label — the distance between the two origins,
       * not anything a printer would see.
       */
      const poly = sheetPoly.map((q) => ({ x: q.x - panel.x, y: q.y - panel.y }))
      faces += 1
      const SAFE_MM = 3
      const over = report.placed
        .filter((b) => b.kind !== 'ground' && b.kind !== 'container')
        .map((b) => ({ id: b.id, mm: overhang(poly, b), clear: clearance(poly, b) }))
        .filter((o) => o.mm > 0.2 || o.clear < SAFE_MM)
        .sort((a, b) => a.clear - b.clear)
      if (over.length === 0) continue
      dirty += 1
      hits.push(
        `${template.id.padEnd(22)} ${sector.padEnd(9)} ${report.panelId.padEnd(10)} ${over.slice(0, 3).map((o) => `${o.id} pay ${o.clear.toFixed(1)}mm`).join(' · ')}`,
      )
    }
  }
}

console.log(`poligon kesimli yüz: ${faces} · 3 mm güvenli alanı ihlal eden: ${dirty}`)
for (const h of hits.slice(0, 30)) console.log(`  ${h}`)
if (dirty === 0) console.log('  — temiz —')
