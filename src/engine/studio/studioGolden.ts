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
 * L2-I moved 12 of 18 on a type change. The brand and the product name used to be clamped by two
 * hand-tuned ceilings that happened to land near each other: measured across ten briefs, eight came
 * back within 1.4× and five shared the identical pair 8.3 mm / 7.7 mm. Nothing had decided which
 * element leads, so nothing led. The second line is now derived from the brand's *drawn* size
 * (`secondaryMax`), which also covers the column layouts where the brand itself had to shrink.
 * Across 40 faces the top-two ratio went from about 1.31× to 1.75×, with no collisions and no
 * export failures.
 *
 * L2-J then moved 10 DNA entries, and this one is a correction rather than a trade.
 *
 * Chasing why baby care had landed on marble turned up the wrong story first: the fallback looked
 * guilty, but tracing the engine showed marble was the *ranking's* pick all along and `line-scene`
 * had only ever been reached because marble used to paint dirty. Fixing marble removed the
 * accident. The real cause was the mood walk taking whatever sat at its offset, however unrelated —
 * `playful` steps five places, and five places down a baby brief is stone veining.
 *
 * Windowing the walk by score cannot fix it. Measured: the scores are one clear leader then a large
 * drop, so a window wide enough to keep any range (4.2 archetypes per brief) still reaches marble,
 * and one tight enough to block marble collapses range to 1.3.
 *
 * The walk is now drawn from archetypes whose DNA *lists* this sector — `line-scene` scores 1 on
 * baby, `wave-panel` 0.3, while marble and ink-wash do not appear at all. Range measured 3.3
 * archetypes per brief with all six faces still distinct, and the moves read as corrections: baby
 * to botanical-card and card-on-art, cleaning to the FERAH wave-panel. A word the customer wrote
 * ("elektronik kutu ama mermer") still overrules the sector, because that is them telling us
 * something the table does not know.
 *
 * Update via `npx vite-node scripts/dump-studio-golden.ts`.
 */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '75a5ed84ffdec4ea' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '34fe30fd3370a8a3' },
  '02-krem-kutu': { archetype: 'ink-wash', background: 'ink-wash', family: 'ink', hash: '8f7444ab8df76977' },
  '02-krem-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '512e71c2cd474a68' },
  '03-serum-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: 'dcee886b2f5bcc33' },
  '03-serum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'a1581e5e3e46d105' },
  '04-gida-bal-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '0d00d06ab50d826b' },
  '04-gida-bal-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: 'f3d16f09048dba7c' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '8a99b51f329ec13c' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '8606dc795ca6c395' },
  '06-elektronik-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '97c985020557fb30' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '4ee48a6738adf632' },
  '07-bebek-kutu': { archetype: 'landscape-window', background: 'landscape-meadow', family: 'landscape', hash: 'e9f6e9f4bd6f2218' },
  '07-bebek-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '25be0c51ee53e141' },
  '08-saglik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: 'cc7c0177f47f95da' },
  '08-saglik-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: 'b3fff17729d4dd27' },
  '09-temizlik-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '750d3bdfa0020ce5' },
  '09-temizlik-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: 'e3954f43c7661494' },
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
