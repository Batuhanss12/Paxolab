/**
 * Golden diff — what moved since the table was frozen, and how.
 *
 * `dump-studio-golden.ts` prints the whole table; reading 18 rows by eye to find the two that
 * changed is how mistakes get in. This prints only the rows that differ, split into DNA moves
 * (archetype / background / family — a different design) and hash moves (same design, different
 * markup), which is the distinction the roadmap records for every change.
 */
import { STUDIO_FACE_GOLDEN, dumpStudioGolden } from '../src/engine/studio/studioGolden'

const now = dumpStudioGolden()
let dna = 0
let hash = 0
for (const [slug, face] of Object.entries(now)) {
  const frozen = STUDIO_FACE_GOLDEN[slug]
  if (!frozen) {
    console.log(`NEW   ${slug}`)
    continue
  }
  if (frozen.archetype !== face.archetype || frozen.background !== face.background || frozen.family !== face.family) {
    dna += 1
    console.log(`DNA   ${slug}: ${frozen.archetype}/${frozen.background} → ${face.archetype}/${face.background}`)
  } else if (frozen.hash !== face.hash) {
    hash += 1
    console.log(`HASH  ${slug}`)
  }
}
console.log(`moved: DNA ${dna} · hash ${hash} · of ${Object.keys(now).length}`)
