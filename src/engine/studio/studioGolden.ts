/**
 * S6 studio golden — 18 face hashes, separate from the 29 kit catalog freeze.
 * Intentional painter/DNA changes update STUDIO_FACE_GOLDEN; kit fingerprints stay put.
 */
import { createHash } from 'node:crypto'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { emptyBrief } from '../fields'
import type { BackgroundFamily, StudioArchetype, StudioFamily } from './types'
import { STUDIO_GALLERY_JOBS, type StudioGalleryJob } from './studioGalleryJobs'

export type StudioFaceFreeze = {
  archetype: StudioArchetype
  background: BackgroundFamily
  family: StudioFamily
  hash: string
}

/**
 * Captured 17 Eyl 2026 (L1). Two deliberate changes landed together so the set only moved once:
 *   - text is measured with real font advances instead of the old estimator (which drifted
 *     −10%…+20%, worst on `script`; the negative side let lines overrun their box),
 *   - every computed type size is clamped to `STUDIO_TYPE_FLOOR_MM` (1.5 mm).
 * 16 of 18 hashes moved. Archetype / background / family are unchanged on all 18 — the DNA did
 * not shift, only the type did.
 *
 * L2 then moved the set twice more, DNA unchanged both times:
 *   - scenery silhouettes come from the product's species instead of always being conifers,
 *   - the studio face is painted from the brief's own colours. Until now `paletteFromBrief` only
 *     ran on the blank-canvas path, so a brief that said "siyah · beyaz" was never consulted and
 *     the face came back turquoise. The kit path still uses `paletteFor`, which is why the 29
 *     catalog fingerprints are untouched.
 *
 * Then the marble painter was rewritten and only the two marble faces moved (05-kahve-kutu,
 * 05-kahve-etiket). Zoomed to print size the old slab read as a gold road map: ~27 veins, all in
 * the accent colour, each one stroke wide with hard vertices where the path jumped. Veins are now
 * tapered fills on a drifting turn rate, mostly stone-coloured, with gold as a rare thread.
 * A two-face move is the shape a background-only change should have — if a painter rewrite moves
 * faces that do not use that background, something leaked and the diff is worth reading.
 *
 * L2-C moved all 18 at once, and this is the move to read carefully. The mood knob had gone dead —
 * with any colour in the brief, all six moods produced the same ground — so the colour layer was
 * rebuilt around one rule: the brief owns which hues exist, the mood owns what they do. Every face
 * is painted by that layer, so every hash moves.
 *
 * Archetype / background / family are unchanged on all 18. That is the number that matters: the
 * colour layer changed and did *not* leak into the skeleton. Had archetypes shifted too, it would
 * mean the mood had started deciding composition as well, and the layering would be back where it
 * started. The 29 kit fingerprints are untouched — the kit path still paints from `paletteFor`.
 *
 * L2-H is the largest move so far and the only one where the **DNA** was meant to shift: 13 of 18
 * archetypes changed, deliberately. The owner reported that clicking through the moods barely
 * changed anything, and measurement agreed — on 3 of 4 briefs all six moods returned the same
 * skeleton, the same background and the same layout. Two things were holding it: `hintPin` was
 * worth +2 against a scoring range of about 1, so a sector guess could not be outvoted; and the
 * engine stamps `studioFamily` onto every brief it returns, which pinned the composition for the
 * rest of the session after the first generation.
 *
 * The owner chose maximum range, so a sector guess is now a strong preference rather than a lock
 * and the mood walks the ranked archetypes. The cost is visible in this table: honey moved to
 * marble, electronics to dark-landscape, baby care to marble. Those are defensible but they are no
 * longer the reference face the sector implies. If that trades away too much, the knob is the
 * `MOOD_WALK_OFFSET` table in `direction.ts` — all-zero restores the old behaviour exactly.
 *
 * Update via `npx vite-node scripts/dump-studio-golden.ts`.
 */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: 'a3b6fa920bb512c7' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'b69b47c732c2ab2b' },
  '02-krem-kutu': { archetype: 'ink-wash', background: 'ink-wash', family: 'ink', hash: 'ec675e536b647884' },
  '02-krem-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '3c1d571a6f0a1cd2' },
  '03-serum-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '95bff77845c10c6c' },
  '03-serum-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: 'ec10e03236ab8fbc' },
  '04-gida-bal-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '46c77adab12faf8f' },
  '04-gida-bal-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'c2e6b4e889891537' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '9e9ea449036aec01' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '5d272b1ba329a782' },
  '06-elektronik-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '4f4e7c281868293a' },
  '06-elektronik-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'a80aa3bd736b77ce' },
  '07-bebek-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: 'c612ab1e134979c1' },
  '07-bebek-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'e2f44a393b04cff8' },
  '08-saglik-kutu': { archetype: 'ink-wash', background: 'ink-wash', family: 'ink', hash: 'd180551e0767d17e' },
  '08-saglik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: 'ed75129fece1219c' },
  '09-temizlik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: 'ac9332c9fd6dbab1' },
  '09-temizlik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: 'a9a310029e2756eb' },
}

export function hashStudioFace(markup: string): string {
  return createHash('sha256').update(markup).digest('hex').slice(0, 16)
}

export function generateStudioFace(job: StudioGalleryJob) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({
    brief: {
      ...emptyBrief(),
      brandName: job.brand,
      productName: job.product,
      sector: job.sector,
      subProduct: job.subProduct,
      packagingMode: job.packagingMode,
      templateId: job.templateId,
      styleType: job.styleType,
      colors: job.colors,
      volume: job.volume,
      dimensionsMm: job.dimensionsMm,
    },
    overridePatch: { studio: true, premium: job.styleType === 'luxury', variationIndex: 0 },
  })
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return {
    slug: job.slug,
    studio: Boolean(spec.studio),
    archetype: spec.studio?.direction.archetype,
    background: spec.studio?.direction.background,
    family: spec.brief.studioFamily,
    hash: hashStudioFace(layer),
    markup: layer,
  }
}

export function dumpStudioGolden(jobs = STUDIO_GALLERY_JOBS): Record<string, StudioFaceFreeze> {
  const out: Record<string, StudioFaceFreeze> = {}
  for (const job of jobs) {
    const face = generateStudioFace(job)
    if (!face.archetype || !face.background || !face.family) {
      throw new Error(`studio golden missing direction: ${job.slug}`)
    }
    out[job.slug] = {
      archetype: face.archetype,
      background: face.background,
      family: face.family,
      hash: face.hash,
    }
  }
  return out
}
