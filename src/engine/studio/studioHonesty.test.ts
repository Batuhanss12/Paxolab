import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import {
  approveKnowledge,
  resetLearning,
  validateKnowledge,
} from '../brain/LearningEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { resetDecisionLogs } from '../brain/DesignDecisionLog'
import { resetDesignKnowledge, upsertKnowledgeRule } from '../brain/DesignKnowledgeStore'
import { learnedPreferenceLine } from '../brain/learningUi'
import { studioFaceLabel, studioLanguageCaption, studioProcessSummary } from './faceCaption'
import { hashStudioFace } from './studioGolden'

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

function generate(brief: DesignBrief = coffee()) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true },
  })
}

function faceHash(spec: ReturnType<FormaLocalEngine['generate']>): string {
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return hashStudioFace(layer)
}

describe('D4 P1 honesty — kit metadata is not the studio face', () => {
  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })
  afterEach(() => {
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('captions the painted studio DNA, not the kit hero family', () => {
    const spec = generate()
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
    const hero = spec.designPlan?.heroGraphic.family
    expect(studioFaceLabel(spec)).toBe('marble-frame · marble')
    if (hero && hero !== 'marble-frame') expect(studioFaceLabel(spec)).not.toContain(hero)
    expect(studioProcessSummary(spec)).toMatch(/marble-frame|marble frame/)
    expect(studioProcessSummary(spec)).not.toMatch(/Strateji:/)
    expect(spec.artwork.language).toBe('food-harvest')
    expect(studioLanguageCaption(spec)).toBe('')
    expect(spec.designPlan?.summaryTr).toMatch(/Strateji:/)
    const proof = spec.preflight.items.find((row) => row.id === 'proof')
    expect(proof?.detail).toContain('marble-frame')
    expect(proof?.detail).toContain('marble')
    expect(proof?.detail).not.toMatch(/Strateji:/)
    if (hero && hero !== 'marble-frame' && hero !== 'marble') {
      expect(proof?.detail).not.toContain(hero)
      expect(studioFaceLabel(spec)).not.toContain(hero)
    }
    const visible = [
      studioFaceLabel(spec),
      studioProcessSummary(spec),
      studioLanguageCaption(spec),
      ...spec.preflight.items.map((row) => `${row.label} ${row.detail}`),
    ].join('\n')
    expect(visible).not.toMatch(/food-harvest/)
    expect(visible).not.toMatch(/Strateji:/)
  })

  it('kit generate still captions heroGraphic and the food-harvest dialect id', () => {
    const spec = new FormaLocalEngine().generate({ brief: coffee() })
    expect(spec.studio).toBeFalsy()
    expect(spec.artwork.language).toBe('food-harvest')
    expect(studioLanguageCaption(spec)).toBe('food-harvest')
    const hero = spec.designPlan?.heroGraphic.family
    if (hero && hero !== 'none') {
      expect(studioFaceLabel(spec)).toContain(hero)
      expect(spec.preflight.items.find((row) => row.id === 'proof')?.detail).toContain(hero)
    }
    expect(studioProcessSummary(spec)).toMatch(/Strateji:/)
  })

  it('does not let an approved avoid-motif rule change the studio hash', () => {
    const baseline = faceHash(generate())
    const rule = upsertKnowledgeRule({
      scope: { level: 'user', userId: 'local' },
      condition: { sector: 'food', style: 'luxury', surface: 'box' },
      relationship: 'avoids',
      recommendation: { kind: 'avoid-motif', tokens: ['heavy-frame'] },
      confidence: 0.9,
      sampleCount: 8,
      source: 'user_feedback',
      evidence: ['m1', 'm2'],
    })
    expect(validateKnowledge(rule.id).ok).toBe(true)
    expect(approveKnowledge(rule.id, 'automated')).toBe(true)
    const next = generate()
    expect(next.appliedKnowledge).toContain(rule.id)
    expect(faceHash(next)).toBe(baseline)
    expect(learnedPreferenceLine(next.appliedKnowledge, { studio: true })).toBe('')
    expect(learnedPreferenceLine(next.appliedKnowledge)).toMatch(/motifinden kaçın/)
  })
})
