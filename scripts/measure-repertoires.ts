/**
 * The two repertoires side by side — F-32's instrument.
 *
 * Runs the shared sweep (12 sectors × 6 moods × 2 surfaces × 2 personas) twice, once per
 * repertoire, and answers the three questions the feature exists for: does asking for other
 * designs actually give other designs, are they as sound as the first set, and does the first set
 * stay exactly where it was.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-repertoires.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { inspectStudioDirectionOffer } from '../src/engine/studio/directionTalk'
import { familyTalk } from '../src/engine/studio/family'
import type { StudioRepertoire } from '../src/engine/studio/types'
import { allSweepBriefs } from './sweep-briefs'

type Row = { faces: number; dirty: number; blocked: number; craft: number[]; hero: number[]; families: Map<string, number> }
const rows = new Map<StudioRepertoire, Row>()
const row = (r: StudioRepertoire): Row => {
  let hit = rows.get(r)
  if (!hit) {
    hit = { faces: 0, dirty: 0, blocked: 0, craft: [], hero: [], families: new Map() }
    rows.set(r, hit)
  }
  return hit
}
let briefs = 0
let sharedDesigns = 0

for (const { brief } of allSweepBriefs()) {
  briefs += 1
  const shown: Record<StudioRepertoire, string[]> = { studio: [], reference: [] }
  for (const repertoire of ['studio', 'reference'] as const) {
    const r = row(repertoire)
    resetArtMemory()
    const offer = inspectStudioDirectionOffer({ ...brief, studioRepertoire: repertoire })
    shown[repertoire] = offer.candidates.map((c) => c.archetype)
    for (const c of offer.candidates) r.families.set(c.family, (r.families.get(c.family) ?? 0) + 1)
    // The painted face of the design the strip arrives on.
    resetArtMemory()
    const spec = new FormaLocalEngine().generate({ brief: { ...brief, studioRepertoire: repertoire }, overridePatch: { studio: true, variationIndex: 0 } })
    r.faces += 1
    if ((spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0) > 0) r.dirty += 1
    if (!spec.preflight.exportOk) r.blocked += 1
    r.craft.push(spec.craftScore?.visualCraft ?? 0)
    r.hero.push(spec.craftScore?.hero ?? 0)
  }
  sharedDesigns += shown.studio.filter((id) => shown.reference.includes(id)).length
}

const stat = (xs: number[]) => (xs.length ? `${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)} (min ${Math.min(...xs)})` : '-')
console.log(`brief: ${briefs}`)
console.log('repertuar    yüz  kirli  engel  craft ort (min)   hero ort (min)')
for (const repertoire of ['studio', 'reference'] as const) {
  const r = row(repertoire)
  console.log(`${repertoire.padEnd(12)} ${String(r.faces).padStart(3)} ${String(r.dirty).padStart(6)} ${String(r.blocked).padStart(6)}   ${stat(r.craft).padEnd(17)} ${stat(r.hero)}`)
}
console.log(`\niki şeritte birden görünen tasarım: ${sharedDesigns} (0 olmalı — "tasarımları değiştir" hepsini değiştirir)`)
for (const repertoire of ['studio', 'reference'] as const) {
  const r = row(repertoire)
  const list = [...r.families].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${familyTalk(k)} ${n}`)
  console.log(`${repertoire} şeritlerinde aileler (${r.families.size}): ${list.join(' · ')}`)
}
