/**
 * Panel roles across the carton sweep — Phase 2B's instrument.
 *
 * Before 2B every carton side was a spine: the archetype's secondary field with stacked words.
 * The references put the art on a side (Matka), mirror it on both (Lunara), or keep the sides as
 * spines. This counts what the 108 sweep cartons actually paint on their sides, and checks that
 * the roles arrive clean (ledger) and exportable.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-panel-roles.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { allSweepBriefs } from './sweep-briefs'

const roles = new Map<string, number>()
const lockups = new Map<string, number>()
let cartons = 0
let dirty = 0
let blocked = 0
for (const { brief } of allSweepBriefs()) {
  if (brief.packagingMode !== 'box') continue
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  cartons += 1
  const lockup = spec.studio?.direction.lockup ?? '?'
  lockups.set(lockup, (lockups.get(lockup) ?? 0) + 1)
  for (const layer of spec.artwork.layers) {
    const role = /data-role-side="([a-z]+)"/.exec(layer.markup)?.[1] ?? (/data-role="side"/.test(layer.markup) ? 'spine' : null)
    if (role) roles.set(role, (roles.get(role) ?? 0) + 1)
  }
  if ((spec.studio?.collisions.length ?? 0) + (spec.studio?.outOfBounds.length ?? 0) > 0) dirty += 1
  if (!spec.preflight.exportOk) blocked += 1
}
console.log(`karton: ${cartons} · ledger kirli ${dirty} · export engelli ${blocked}`)
console.log('yan panel rolleri:')
for (const [role, n] of [...roles].sort((a, b) => b[1] - a[1])) console.log(`  ${role.padEnd(10)} ${n}`)
console.log('ön yüz yerleşimi:')
for (const [lockup, n] of [...lockups].sort((a, b) => b[1] - a[1])) console.log(`  ${lockup.padEnd(16)} ${n}`)
