/**
 * Copy + index every SVG from Desktop/ART-PATTERN-DESİGN into the motor library.
 * Usage: npx vite-node scripts/ingest-art-pattern-library.ts
 */
import {
  ART_PATTERN_ASSET_DIR,
  ART_PATTERN_SOURCE_DIR,
  ingestArtPatternLibrary,
  usableArtPatterns,
} from '../src/engine/artwork/artPatternLibrary'
import { MOTIF_BANK_DIR, writeMotifBank } from '../src/engine/artwork/artMotifBank'

const source = process.argv[2] || ART_PATTERN_SOURCE_DIR
const dest = process.argv[3] || ART_PATTERN_ASSET_DIR
const entries = ingestArtPatternLibrary(source, dest)
const skipped = entries.filter((e) => e.skipReason)
console.log(`ingested ${entries.length} files → ${dest}`)
for (const e of entries) {
  const skip = e.skipReason ? ` SKIP:${e.skipReason}` : ''
  console.log(`  ${e.id}  tags:${e.tags.join(',')}  ${e.placementHint}  ${e.bytes}b${skip}`)
}
if (skipped.length) console.log(`skipped with reason: ${skipped.length}`)

if (dest === ART_PATTERN_ASSET_DIR) {
  const bank = writeMotifBank(usableArtPatterns(entries), MOTIF_BANK_DIR)
  const withMeta = bank.atoms.filter((a) => a.design?.visualWeight != null).length
  console.log(`motif-bank ${bank.atoms.length} atoms (${withMeta} with design metadata) → ${MOTIF_BANK_DIR}`)
}
