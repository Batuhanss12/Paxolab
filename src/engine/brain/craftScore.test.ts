import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from './DesignMemory'
import { resetDecisionLogs } from './DesignDecisionLog'
import { resetDesignKnowledge } from './DesignKnowledgeStore'
import { resetLearning } from './LearningEngine'

function coffee(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Elite Brew',
    productName: 'Mocha',
    sector: 'gıda',
    subProduct: 'kahve',
    packagingMode: 'box',
    templateId: 'coffee-box',
    dimensionsMm: { L: 80, W: 50, H: 180 },
    styleType: 'luxury',
    colors: 'siyah · altın',
    volume: '250 g',
    ...extra,
  }
}

function generate(studio: boolean, brief: DesignBrief = coffee()) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: studio ? { studio: true } : {},
  })
}

describe('R3 — craft score reaches every generate', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('kit generate carries a scorecard over the shipped markup', () => {
    const spec = generate(false)
    expect(spec.craftScore).toBeDefined()
    expect(spec.craftScore?.visualCraft).toBeGreaterThan(0)
    expect(spec.craftScore?.visualCraft).toBeLessThanOrEqual(100)
  })

  it('studio generate carries the same scorecard — not a kit-only field', () => {
    const spec = generate(true)
    expect(spec.studio).toBeDefined()
    expect(spec.craftScore).toBeDefined()
    expect(spec.craftScore?.visualCraft).toBeGreaterThan(0)
  })

  it('scores the shipped face: production reflects preflight exportOk', () => {
    const spec = generate(true)
    expect(spec.craftScore?.production).toBe(spec.preflight.exportOk ? 88 : spec.preflight.blocking ? 22 : 48)
  })

  it('is report-only — it never turns into a repair on the studio path', () => {
    const spec = generate(true)
    expect(spec.critique?.needsRepair).toBe(false)
    expect(spec.critique?.repaired).not.toBe(true)
  })

  it('craft findings, when emitted, stay advisory and cite the craftScore source', () => {
    const spec = generate(true)
    const craftRows = (spec.designCritique ?? []).filter((row) => row.evidence.source === 'craftScore')
    for (const row of craftRows) {
      expect(row.severity).not.toBe('error')
      expect(typeof row.evidence.score).toBe('number')
    }
    // The studio face used to get geometry-only critic coverage; craft rows are the non-geometry channel.
    const sources = new Set((spec.designCritique ?? []).map((row) => row.evidence.source))
    expect(sources.has('critiquePlan')).toBe(false)
  })
})
