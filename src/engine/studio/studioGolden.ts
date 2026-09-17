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
 * L2 then moved 2 more (the meadow-backed food faces): scenery silhouettes now come from the
 * product's species instead of always being conifers. DNA unchanged again.
 * Update via `npx vite-node scripts/dump-studio-golden.ts`.
 */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '530cb8a4537e0469' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '2f33f772b8f1b506' },
  '02-krem-kutu': { archetype: 'botanical-card', background: 'botanical', family: 'botanical', hash: 'ed03088422c947ab' },
  '02-krem-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: 'a143ef466005bcbf' },
  '03-serum-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '84d5b6dce359144f' },
  '03-serum-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '64a1423b81734924' },
  '04-gida-bal-kutu': { archetype: 'landscape-window', background: 'landscape-meadow', family: 'landscape', hash: 'd5a2f427ab652750' },
  '04-gida-bal-etiket': { archetype: 'landscape-badge', background: 'landscape-meadow', family: 'landscape', hash: '4eba883ed99a5c3c' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '33f73eaad2a64666' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '721d886bb154eb53' },
  '06-elektronik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: 'adc4b12b62dcd643' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: 'fadf050aa5ca2c7e' },
  '07-bebek-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'dbf9ef51f9728b83' },
  '07-bebek-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'a3d455ae15ad4d47' },
  '08-saglik-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '8ffae60b5f286442' },
  '08-saglik-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'de8a53882257b767' },
  '09-temizlik-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: 'fd441011f1ddf8dc' },
  '09-temizlik-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: 'e81bdee2d84e64c3' },
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
