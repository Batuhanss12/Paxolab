/**
 * R9 — the compact side panel shares one centre line between mark, spine and brand.
 * `fitSize` floors at 1.6 mm, so an unguarded spine draws a line longer than the gap and
 * runs across both neighbours. The golden electronics box shipped that way (7 ledger hits).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../brain/DesignKnowledgeStore'
import { resetLearning } from '../brain/LearningEngine'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function briefOf(slug: string): DesignBrief {
  const job = STUDIO_GALLERY_JOBS.find((row) => row.slug === slug)
  if (!job) throw new Error(`unknown gallery job: ${slug}`)
  return {
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
  }
}

function ledgerOf(brief: DesignBrief): string[] {
  const spec = new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true, variationIndex: 0 },
  })
  return [...(spec.studio?.collisions ?? []), ...(spec.studio?.outOfBounds ?? [])]
}

describe('R9 — the side spine only claims space it fits in', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('the rotated spine never overlaps the side mark or the side brand', () => {
    const rows = ledgerOf(briefOf('06-elektronik-kutu'))
    const spineClashes = rows.filter((row) => row.includes('vertical-brand'))
    expect(spineClashes).toEqual([])
  })

  it('a long product line does not push the spine out of the panel', () => {
    const rows = ledgerOf({ ...briefOf('06-elektronik-kutu'), productName: 'Pulse Buds Pro Max Edition' })
    expect(rows.filter((row) => row.includes('vertical-brand'))).toEqual([])
  })

  it('the whole golden set stays close to a clean ledger', () => {
    let total = 0
    for (const job of STUDIO_GALLERY_JOBS) {
      resetArtMemory()
      total += ledgerOf(briefOf(job.slug)).length
    }
    // Was 8 before the spine guard + paragraph fit guard. Kept as a ratchet: it must not grow.
    expect(total).toBeLessThanOrEqual(1)
  })
})
