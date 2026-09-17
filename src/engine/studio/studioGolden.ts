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
 * Update via `npx vite-node scripts/dump-studio-golden.ts`.
 */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: 'a3b6fa920bb512c7' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: 'b69b47c732c2ab2b' },
  '02-krem-kutu': { archetype: 'botanical-card', background: 'botanical', family: 'botanical', hash: '0d7ef418e4cc2cf9' },
  '02-krem-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: '85dbc11d834185bb' },
  '03-serum-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'a551338af36eb372' },
  '03-serum-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'c8465fb935b5a0f0' },
  '04-gida-bal-kutu': { archetype: 'landscape-window', background: 'landscape-meadow', family: 'landscape', hash: 'c7b5acec64883268' },
  '04-gida-bal-etiket': { archetype: 'landscape-badge', background: 'landscape-meadow', family: 'landscape', hash: '1859d69ac6bde662' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '9e9ea449036aec01' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '5d272b1ba329a782' },
  '06-elektronik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: 'f30e79fb2fa06c2f' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '4ee48a6738adf632' },
  '07-bebek-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '05a33d48326f47f6' },
  '07-bebek-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'e2f44a393b04cff8' },
  '08-saglik-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '82c02d17ca9bc048' },
  '08-saglik-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '0c2a65daef36ab39' },
  '09-temizlik-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '4a0c1638045045b8' },
  '09-temizlik-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '13563fa041b5d5bd' },
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
