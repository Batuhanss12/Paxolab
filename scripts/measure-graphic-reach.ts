/**
 * How far the graphic languages reach — Phase 5's instrument.
 *
 * Over the shared sweep (12 sectors × 6 moods × 2 surfaces × 2 personas): which fields and frames
 * the offer strip shows, which the engine chooses at variation 0, and which render mode the
 * brief's personality gives the drawn subject. A language that no strip ever shows is a painter
 * nobody can reach.
 *
 * Permanent instrument. Run: `npx vite-node scripts/measure-graphic-reach.ts`
 */
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { inspectStudioDirectionOffer } from '../src/engine/studio/directionTalk'
import { allSweepBriefs } from './sweep-briefs'

const NEW_FIELDS = ['blob', 'ogee', 'celestial', 'pictogram', 'toile']
const NEW_FRAMES = ['laurel', 'cartouche']
const shownField = new Map<string, number>()
const shownFrame = new Map<string, number>()
const chosenField = new Map<string, number>()
const styles = new Map<string, number>()
let briefs = 0
let stripsWithNewField = 0
for (const { brief } of allSweepBriefs()) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
  const d = spec.studio?.direction
  if (!d) continue
  briefs += 1
  chosenField.set(d.background, (chosenField.get(d.background) ?? 0) + 1)
  const style = d.subjectStyle ?? 'seed'
  styles.set(style, (styles.get(style) ?? 0) + 1)
  resetArtMemory()
  const offer = inspectStudioDirectionOffer(brief)
  const fields = new Set(offer.candidates.map((c) => c.fingerprint?.background).filter(Boolean) as string[])
  const frames = new Set(offer.candidates.map((c) => c.fingerprint?.frame).filter(Boolean) as string[])
  if ([...fields].some((f) => NEW_FIELDS.includes(f))) stripsWithNewField += 1
  for (const f of fields) shownField.set(f, (shownField.get(f) ?? 0) + 1)
  for (const f of frames) shownFrame.set(f, (shownFrame.get(f) ?? 0) + 1)
}
console.log(`brief: ${briefs} · şeritte en az bir yeni alan gösteren brief: ${stripsWithNewField} (${((100 * stripsWithNewField) / Math.max(1, briefs)).toFixed(0)}%)`)
console.log('alan            şeritte  v0 seçildi')
for (const f of [...NEW_FIELDS, ...[...shownField.keys()].filter((k) => !NEW_FIELDS.includes(k)).sort()]) {
  console.log(`${f.padEnd(15)} ${String(shownField.get(f) ?? 0).padStart(7)} ${String(chosenField.get(f) ?? 0).padStart(10)}${NEW_FIELDS.includes(f) ? '   ← yeni' : ''}`)
}
console.log('çerçeve (şeritte):', [...shownFrame].map(([k, n]) => `${k} ${n}`).join(' · '))
console.log('yeni çerçeveler şeritte:', NEW_FRAMES.map((f) => `${f} ${shownFrame.get(f) ?? 0}`).join(' · '))
console.log('özne çizim modu (v0, kişilikten):', [...styles].map(([k, n]) => `${k} ${n}`).join(' · '))
