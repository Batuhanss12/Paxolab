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

/** Captured 16 Eyl 2026 after live copy data-edit tags. Update via `npx vite-node scripts/dump-studio-golden.ts`. */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '26fcc9ab061011b9' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '8e9cab42e32d9143' },
  '02-krem-kutu': { archetype: 'botanical-card', background: 'botanical', family: 'botanical', hash: '453eb291ccb25237' },
  '02-krem-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: 'c3bc029734ddb996' },
  '03-serum-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '48b341c93f53863c' },
  '03-serum-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'ea59ae672acdf7f6' },
  '04-gida-bal-kutu': { archetype: 'landscape-window', background: 'landscape-meadow', family: 'landscape', hash: '93eed48ab83b7bdc' },
  '04-gida-bal-etiket': { archetype: 'landscape-badge', background: 'landscape-meadow', family: 'landscape', hash: '63671ee1e49b264e' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '6287dc7883785bb7' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '040a35987cf9cbf2' },
  '06-elektronik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: '368d41b68baf27bc' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '514de1c9444de144' },
  '07-bebek-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '197d9923b7bf677c' },
  '07-bebek-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'b9f7aebb3eb52dee' },
  '08-saglik-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '3c8410f12b480c1d' },
  '08-saglik-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: 'b5343babe3c1f924' },
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
