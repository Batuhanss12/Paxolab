/**
 * Type behaviours across the sweep — Phase 4's instrument.
 *
 * Counts which type systems the engine chooses at variation 0 over the shared sweep (12 sectors ×
 * 6 moods × 2 surfaces × 2 personas), why (a pin, the brain's prior, the personality, the
 * default), and which systems the offer strip shows across its eight cards. The audit's target:
 * at least eight distinct behaviours reachable in one sweep.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-type-behaviours.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { inspectStudioDirectionOffer } from '../src/engine/studio/directionTalk'
import { TYPE_SYSTEMS } from '../src/engine/studio/typeSystem'
import type { TypePairing } from '../src/engine/studio/types'
import { allSweepBriefs } from './sweep-briefs'

const chosen = new Map<TypePairing, number>()
const shown = new Map<TypePairing, number>()
const why = new Map<string, number>()
let briefs = 0
let stripDistinct = 0
for (const { brief } of allSweepBriefs()) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const d = spec.studio?.direction
  if (!d) continue
  briefs += 1
  chosen.set(d.typePairing, (chosen.get(d.typePairing) ?? 0) + 1)
  const reason = d.reasons?.find((r) => r.axis === 'typePairing')?.because ?? '?'
  const bucket = /kişilik/.test(reason) ? 'kişilik' : /tasarım beyni/.test(reason) ? 'tasarım beyni' : /ipucu/.test(reason) ? 'ipucu' : /varyasyon/.test(reason) ? 'varyasyon' : 'varsayılan'
  why.set(bucket, (why.get(bucket) ?? 0) + 1)
  resetArtMemory()
  const offer = inspectStudioDirectionOffer(brief)
  const onStrip = new Set(offer.candidates.map((c) => c.fingerprint?.typePairing).filter((p): p is TypePairing => Boolean(p)))
  stripDistinct += onStrip.size
  for (const p of onStrip) shown.set(p, (shown.get(p) ?? 0) + 1)
}

const row = (p: TypePairing) => `${p.padEnd(36)} ${String(chosen.get(p) ?? 0).padStart(6)} ${String(shown.get(p) ?? 0).padStart(8)}   ${TYPE_SYSTEMS[p].talk}`
console.log(`brief: ${briefs}`)
console.log('sistem                               seçildi  şeritte   davranış')
for (const p of Object.keys(TYPE_SYSTEMS) as TypePairing[]) console.log(row(p))
console.log(`\nseçilen farklı sistem (v0): ${chosen.size} · şeritte görünen farklı sistem: ${shown.size} · şerit başına ortalama farklı sistem: ${(stripDistinct / Math.max(1, briefs)).toFixed(2)}`)
console.log('seçimin sebebi:', [...why].map(([k, n]) => `${k} ${n}`).join(' · '))
