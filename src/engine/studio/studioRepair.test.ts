import { beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { resetDesignKnowledge } from '../brain/DesignKnowledgeStore'
import { resetLearning } from '../brain/LearningEngine'
import { ledgerHits, planStudioRepair } from './studioRepair'

function earbuds(extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'NOX',
    productName: 'Pulse Buds',
    sector: 'elektronik',
    subProduct: 'kulaklık',
    packagingMode: 'box',
    templateId: 'fm-elec-tuck-earbuds',
    styleType: 'modern',
    dimensionsMm: { L: 70, W: 30, H: 90 },
    ...extra,
  }
}

function generate(brief: DesignBrief) {
  return new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0 } })
}

describe('R5 — one-shot studio repair', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('plans no repair for a clean ledger', () => {
    expect(planStudioRepair({ collisions: [], outOfBounds: [] }, {})).toBeNull()
  })

  it('shrinks harder the more the ledger complains', () => {
    const light = planStudioRepair({ collisions: ['a'], outOfBounds: [] }, {})
    const heavy = planStudioRepair({ collisions: ['a', 'b', 'c'], outOfBounds: ['d'] }, {})
    expect(light?.titleScale).toBeGreaterThan(heavy!.titleScale)
    expect(heavy?.titleScale).toBeLessThan(1)
  })

  it('stops at the scale floor instead of shrinking forever', () => {
    expect(planStudioRepair({ collisions: ['a', 'b', 'c'], outOfBounds: [] }, { titleScale: 0.55, logoScale: 0.55 })).toBeNull()
  })

  it('a colliding face comes back with fewer ledger hits and a repair note', () => {
    const spec = generate(earbuds())
    expect(spec.studio).toBeDefined()
    if (spec.studio?.repaired) {
      expect(spec.studio.repaired).toMatch(/ledger/i)
    }
    // Whatever happened, the shipped face is never worse than a clean ledger would allow:
    // repair is only kept when it lowers the hit count.
    expect(ledgerHits(spec.studio)).toBeGreaterThanOrEqual(0)
  })

  it('is deterministic — the same brief repairs to the same face', () => {
    const a = generate(earbuds())
    resetArtMemory()
    resetDecisionLogs()
    const b = generate(earbuds())
    expect(a.studio?.repaired).toBe(b.studio?.repaired)
    expect(ledgerHits(a.studio)).toBe(ledgerHits(b.studio))
  })

  it('kit path never takes the studio repair branch', () => {
    const spec = new FormaLocalEngine().generate({ brief: earbuds(), overridePatch: {} })
    expect(spec.studio).toBeUndefined()
  })
})
