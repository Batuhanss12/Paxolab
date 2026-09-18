/**
 * F-8 — quality closes the loop.
 *
 * Three things that used to be computed and then ignored now act. The craft score gates the
 * studio repair loop (a clean face under the floor tries the next archetype, bounded and
 * monotonic); a learned rule carries the design principle it is an instance of; and the knowledge
 * store can speak to the three preference axes the direction decides, through the same hint the
 * archetype and background already travelled on.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { principleForRecommendation } from '../brain/DesignKnowledge'
import { knowledgeRule, resetDesignKnowledge, transitionKnowledge, upsertKnowledgeRule } from '../brain/DesignKnowledgeStore'
import { deriveKnowledgeCandidates, resetLearning } from '../brain/LearningEngine'
import { studioHintsFromKnowledge } from '../brain/studioKnowledge'
import { STUDIO_CRAFT_FLOOR } from './studioRepair'
import { STUDIO_GALLERY_JOBS } from './studioGalleryJobs'

function perfume(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Odette',
    productName: 'Fleur',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: 'label',
    templateId: 'fm-cos-label-bottle',
    styleType: 'luxury',
    colors: 'krem · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: { L: 70, W: 0, H: 90 },
    ...extra,
  }
}

function activate(recommendation: Parameters<typeof upsertKnowledgeRule>[0]['recommendation'], confidence = 0.9) {
  const rule = upsertKnowledgeRule({
    scope: { level: 'user', userId: 'local' },
    condition: {},
    relationship: 'prefers',
    recommendation,
    confidence,
    sampleCount: 3,
    source: 'user_feedback',
    evidence: ['t:1', 't:2', 't:3'],
  })
  transitionKnowledge(rule.id, 'validated', 'test')
  transitionKnowledge(rule.id, 'active', 'test')
  return knowledgeRule(rule.id)!
}

describe('F-8 knowledge on the three axes', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDesignKnowledge()
    resetLearning()
  })
  afterEach(() => {
    resetDesignKnowledge()
    resetLearning()
  })

  it('a preferred frame, pairing or ornament becomes a hint and reaches the face', () => {
    activate({ kind: 'studio-frame', frame: 'band-hairline', prefer: true })
    activate({ kind: 'studio-ornament', ornament: 'quiet', prefer: true })
    activate({ kind: 'studio-typePairing', typePairing: 'serif-display/sans-meta', prefer: true })
    const knowledge = studioHintsFromKnowledge(perfume())
    expect(knowledge.hints[0]).toMatchObject({ source: 'knowledge', frame: 'band-hairline', ornament: 'quiet', typePairing: 'serif-display/sans-meta' })
    expect(knowledge.applied).toHaveLength(3)

    const spec = new FormaLocalEngine().generate({ brief: perfume(), overridePatch: { studio: true, variationIndex: 0 } })
    const d = spec.studio!.direction
    // ink-panel lists all three values, so every pin lands; the frame is drawn, not just recorded.
    expect(d.archetype).toBe('ink-panel')
    expect(d.frame).toBe('band-hairline')
    expect(d.ornament).toBe('quiet')
    expect(d.typePairing).toBe('serif-display/sans-meta')
    const front = spec.artwork.layers.find((l) => l.panelId === spec.artwork.frontPanelId)!.markup
    expect(front).toContain('data-frame="band-hairline"')
  })

  it('an avoided value and a weak preference do not pin', () => {
    activate({ kind: 'studio-frame', frame: 'none', prefer: false })
    activate({ kind: 'studio-ornament', ornament: 'rich', prefer: true }, 0.4)
    const knowledge = studioHintsFromKnowledge(perfume())
    expect(knowledge.hints).toEqual([])
  })

  it('a learned rule names the principle it is an instance of', () => {
    expect(principleForRecommendation({ kind: 'studio-ornament', ornament: 'quiet', prefer: true })).toBe('negative-space-is-luxury')
    expect(principleForRecommendation({ kind: 'studio-frame', frame: 'none', prefer: true })).toBe('negative-space-is-luxury')
    expect(principleForRecommendation({ kind: 'avoid-motif', tokens: ['dense-pattern'] })).toBe('one-motif-family')
    expect(principleForRecommendation({ kind: 'director-cue', cue: 'luxury-tighten' })).toBe('negative-space-is-luxury')
    expect(principleForRecommendation({ kind: 'studio-archetype', prefer: true })).toBeUndefined()

    const [rule] = deriveKnowledgeCandidates([
      {
        key: 'k',
        scope: { level: 'user', userId: 'local' },
        condition: { sector: 'perfume' },
        recommendation: { kind: 'studio-ornament', ornament: 'quiet', prefer: true },
        sampleCount: 2,
        supporting: 2,
        consistency: 1,
        evidence: ['a:1:fb0', 'b:1:fb0'],
      },
    ])
    expect(rule.principle).toBe('negative-space-is-luxury')
  })
})

describe('F-8 craft gate', () => {
  it('sits below every golden face, so the frozen table is never re-routed by it', () => {
    /*
     * Measured 2026-09-18 across the eighteen golden faces: craft 57–76. The floor is a catch for a
     * mood-walk landing an archetype on a panel it reads badly on, not an argument with the table.
     */
    let min = 100
    for (const job of STUDIO_GALLERY_JOBS) {
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
      min = Math.min(min, spec.craftScore!.visualCraft)
      expect(spec.studio!.repaired ?? '', `${job.slug} was re-routed by the craft gate`).not.toMatch(/zanaat/)
    }
    expect(min).toBeGreaterThanOrEqual(STUDIO_CRAFT_FLOOR)
  })
})
