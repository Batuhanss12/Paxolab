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

/** Captured 16 Eyl 2026 after S5 density. Update via `npx vite-node scripts/dump-studio-golden.ts`. */
export const STUDIO_FACE_GOLDEN: Record<string, StudioFaceFreeze> = {
  '01-parfum-kutu': { archetype: 'dark-landscape', background: 'landscape-moon', family: 'dark-luxe', hash: '56a3a06ec7e942bf' },
  '01-parfum-etiket': { archetype: 'ink-panel', background: 'ink-wash', family: 'ink', hash: '2d8dbcb377b72cf3' },
  '02-krem-kutu': { archetype: 'botanical-card', background: 'botanical', family: 'botanical', hash: '2e9a7e854e83004e' },
  '02-krem-etiket': { archetype: 'card-on-art', background: 'botanical', family: 'botanical', hash: 'baa05032abe3e48a' },
  '03-serum-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '07995e65b46e0f39' },
  '03-serum-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '4897ad1fac025a57' },
  '04-gida-bal-kutu': { archetype: 'landscape-window', background: 'landscape-meadow', family: 'landscape', hash: '01e21d6913f571dd' },
  '04-gida-bal-etiket': { archetype: 'landscape-badge', background: 'landscape-meadow', family: 'landscape', hash: '460d8591fba31920' },
  '05-kahve-kutu': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: 'f5adac72190acea6' },
  '05-kahve-etiket': { archetype: 'marble-frame', background: 'marble', family: 'marble', hash: '91d545167658bd9c' },
  '06-elektronik-kutu': { archetype: 'diagonal-tech', background: 'diagonal', family: 'tech', hash: '67679d13a9c03ffc' },
  '06-elektronik-etiket': { archetype: 'diagonal-split', background: 'diagonal', family: 'tech', hash: '9124e496263f56ec' },
  '07-bebek-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '7de72f62c01ff5fe' },
  '07-bebek-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '4ef359706b0bdec6' },
  '08-saglik-kutu': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '0ec7f1e6abcaeec5' },
  '08-saglik-etiket': { archetype: 'line-scene', background: 'line-scene', family: 'line-scene', hash: '0e7d8534778f8886' },
  '09-temizlik-kutu': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '768168753c80d252' },
  '09-temizlik-etiket': { archetype: 'wave-panel', background: 'wave', family: 'wave', hash: '7acc02bac8b79e38' },
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
