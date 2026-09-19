/**
 * Two-brand sweep — does the brand change the design, or only the words on it?
 *
 * The audit measured six sector/mood pairs: two briefs identical except for the brand name, the
 * audience, the feeling, the price tier and the channel landed on the same archetype in 6 of 6,
 * the same layout variant in 3 of 6. `scoreArchetype` reads none of those fields. This is the
 * full sweep — every engine sector × every mood × both surfaces — through the production path
 * (`FormaLocalEngine.generate`, not the chat's `inspect`, whose palette can differ), so Phase 3's
 * target ("different top archetype in ≥ 70 % of pairs") is judged against the whole table.
 *
 * Personality A is restrained, boutique, corporate; B is loud, mass, young. If the engine ever
 * reads personality, these two should rarely share a skeleton.
 *
 * Permanent instrument. Run: `npx vite-node scripts/sweep-two-brands.ts`
 */
import type { DesignBrief } from '../src/types'
import { FormaLocalEngine } from '../src/engine/FormaLocalEngine'
import { resetArtMemory } from '../src/engine/brain/DesignMemory'
import { directionFingerprint, fingerprintDistance, COMPOSITION_AXES } from '../src/engine/studio/fingerprint'
import { SWEEP_MOODS as MOODS, SWEEP_SECTORS as SECTORS, SWEEP_SURFACES as SURFACES, sweepBrief as brief } from './sweep-briefs'

function direction(b: DesignBrief) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief: b, overridePatch: { studio: true, variationIndex: 0 } })
  const d = spec.studio?.direction
  if (!d) throw new Error(`no studio direction for ${b.sector}/${b.styleType}/${b.packagingMode}`)
  return d
}

let pairs = 0
let sameArchetype = 0
let sameVariant = 0
let sameLockup = 0
let sameOrnament = 0
let sameType = 0
let compositionIdentical = 0
let sameDesign = 0
let twoAxesApart = 0
let threeAxesApart = 0
const perSector = new Map<string, { pairs: number; same: number }>()

for (const row of SECTORS) {
  for (const mood of MOODS) {
    for (const surface of SURFACES) {
      const a = direction(brief(row, mood, surface, 'A'))
      const b = direction(brief(row, mood, surface, 'B'))
      pairs += 1
      const fa = directionFingerprint(a)
      const fb = directionFingerprint(b)
      if (a.archetype === b.archetype) sameArchetype += 1
      if (a.variant === b.variant) sameVariant += 1
      if (a.lockup === b.lockup) sameLockup += 1
      if (a.ornament === b.ornament) sameOrnament += 1
      if (a.typePairing === b.typePairing) sameType += 1
      if (fingerprintDistance(fa, fb, COMPOSITION_AXES) === 0) compositionIdentical += 1
      /*
       * "The same design" is the fingerprint, not the archetype: a loud perfume brand may keep
       * the perfume language and still get a different arrangement, pairing and ornament. Two
       * brands that agree on all four have been handed one design; two that differ on at least
       * two of the five design axes have been handed two.
       */
      const designAxes = ['archetype', 'lockup', 'typePairing', 'ornament', 'frame'] as const
      const d = fingerprintDistance(fa, fb, designAxes)
      if (d === 0) sameDesign += 1
      if (d >= 2) twoAxesApart += 1
      if (d >= 3) threeAxesApart += 1
      const s = perSector.get(row.sector) ?? { pairs: 0, same: 0 }
      s.pairs += 1
      if (a.archetype === b.archetype) s.same += 1
      perSector.set(row.sector, s)
    }
  }
}

const pct = (n: number) => `${((n / pairs) * 100).toFixed(0)}%`
console.log(`çift: ${pairs} (${SECTORS.length} sektör × ${MOODS.length} ruh hali × ${SURFACES.length} yüzey)`)
console.log(`aynı arketip      ${sameArchetype}/${pairs}  ${pct(sameArchetype)}`)
console.log(`aynı variant      ${sameVariant}/${pairs}  ${pct(sameVariant)}`)
console.log(`aynı lockup       ${sameLockup}/${pairs}  ${pct(sameLockup)}`)
console.log(`aynı süs          ${sameOrnament}/${pairs}  ${pct(sameOrnament)}`)
console.log(`aynı tip ikilisi  ${sameType}/${pairs}  ${pct(sameType)}`)
console.log(`kompozisyon birebir aynı (lockup+süs+mizaç+variant)  ${compositionIdentical}/${pairs}  ${pct(compositionIdentical)}`)
console.log(`aynı tasarım (arketip+lockup+tip+süs+çerçeve)  ${sameDesign}/${pairs}  ${pct(sameDesign)}`)
console.log(`≥2 tasarım ekseninde farklı  ${twoAxesApart}/${pairs}  ${pct(twoAxesApart)} · ≥3 eksende ${threeAxesApart}/${pairs}  ${pct(threeAxesApart)}`)
console.log('\nsektöre göre aynı arketip:')
for (const [sector, s] of perSector) console.log(`  ${sector.padEnd(11)} ${s.same}/${s.pairs}`)
