/**
 * Every composition on every sweep brief — Phase 2B's ledger instrument.
 *
 * The craft-distribution sweep runs variation 0, which is the archetype's own skeleton, so it
 * never exercises a composition. This one asks for each composition the archetype lists, on every
 * brief of the shared sweep (12 sectors × 6 moods × 2 surfaces × 2 personas), and counts what
 * came back: was the pick honoured, is the ledger clean, does export pass, did the craft gate
 * call the face a "no lead" case, and how the craft total sits.
 *
 * Permanent instrument. Run: `npx vite-node scripts/sweep-compositions.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { COMPOSITIONS } from '../src/engine/studio/compositions'
import { dnaFor, lockupsFor } from '../src/engine/studio/referenceDna'
import type { LockupStyle } from '../src/engine/studio/types'
import { allSweepBriefs } from './sweep-briefs'

type Row = { asked: number; honoured: number; dirty: number; blocked: number; noLead: number; lowTotal: number; hero: number[]; total: number[] }
const rows = new Map<LockupStyle, Row>()
const row = (l: LockupStyle): Row => {
  let r = rows.get(l)
  if (!r) {
    r = { asked: 0, honoured: 0, dirty: 0, blocked: 0, noLead: 0, lowTotal: 0, hero: [], total: [] }
    rows.set(l, r)
  }
  return r
}
const dirtyFaces: string[] = []

for (const { name, brief } of allSweepBriefs()) {
  resetArtMemory()
  /*
   * The archetype this brief lands on decides which compositions are even on the list — read off
   * the engine's own path (knowledge, plan hints, personality), not the bare direction inspector,
   * which lands eight of the 288 briefs on a different archetype and would count those as misses.
   */
  const base = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } }).studio?.direction
  if (!base) continue
  const surface = brief.packagingMode === 'box' ? 'box' : 'label'
  const dna = dnaFor(base.archetype, surface)
  for (const lockup of lockupsFor(dna).filter((l) => COMPOSITIONS.includes(l))) {
    resetArtMemory()
    const r = row(lockup)
    r.asked += 1
    const spec = new FormaLocalEngine().generate({ brief: { ...brief, studioPick: { lockup } }, overridePatch: { studio: true, variationIndex: 0 } })
    const d = spec.studio?.direction
    if (d?.lockup === lockup) r.honoured += 1
    const hits = (spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0)
    if (hits) {
      r.dirty += 1
      dirtyFaces.push(`${name} ${d?.archetype}/${d?.lockup}: ${[...(spec.studio?.collisions ?? []), ...(spec.studio?.outOfBounds ?? [])].join(', ')}`)
    }
    if (!spec.preflight.exportOk) r.blocked += 1
    const hero = spec.craftScore?.hero ?? 0
    const total = spec.craftScore?.visualCraft ?? 0
    if (hero < 45) r.noLead += 1
    if (total < 50) r.lowTotal += 1
    r.hero.push(hero)
    r.total.push(total)
  }
}

const mean = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-')
const min = (xs: number[]) => (xs.length ? Math.min(...xs).toString() : '-')
console.log('kompozisyon      istendi  alındı  kirli  engel  lidersiz  <50   hero ort/min   craft ort/min')
for (const [lockup, r] of [...rows].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(
    `${lockup.padEnd(16)} ${String(r.asked).padStart(7)} ${String(r.honoured).padStart(7)} ${String(r.dirty).padStart(6)} ${String(r.blocked).padStart(6)} ${String(r.noLead).padStart(9)} ${String(r.lowTotal).padStart(4)}   ${mean(r.hero).padStart(5)}/${min(r.hero).padStart(3)}      ${mean(r.total).padStart(5)}/${min(r.total)}`,
  )
}
if (dirtyFaces.length) {
  console.log(`\nkirli yüzler (${dirtyFaces.length}):`)
  for (const line of dirtyFaces.slice(0, 40)) console.log('  ' + line)
  if (dirtyFaces.length > 40) console.log(`  … +${dirtyFaces.length - 40}`)
}
