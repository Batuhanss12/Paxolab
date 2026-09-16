import { beforeEach, describe, expect, it } from 'vitest'
import {
  addManualKnowledge,
  resetDesignKnowledge,
  upsertKnowledgeRule,
} from './DesignKnowledgeStore'
import { approveKnowledge, rejectKnowledge, resetLearning, validateKnowledge } from './LearningEngine'
import {
  describeKnowledgeRule,
  describeRecommendation,
  learnedPreferenceLine,
  learningSnapshot,
} from './learningUi'

describe('Learning UI snapshot', () => {
  beforeEach(() => {
    resetDesignKnowledge()
    resetLearning()
  })

  it('is empty baseline when nothing is stored', () => {
    const snap = learningSnapshot()
    expect(snap.empty).toBe(true)
    expect(snap.version).toBe(0)
    expect(snap.active).toEqual([])
    expect(snap.pendingHuman).toEqual([])
  })

  it('keeps global rules in the human queue and never auto-lists them as pendingAuto', () => {
    const rule = upsertKnowledgeRule({
      scope: { level: 'global' },
      condition: { sector: 'kahve', surface: 'box' },
      relationship: 'prefers',
      recommendation: { kind: 'studio-archetype', archetype: 'marble-frame', prefer: true },
      confidence: 0.9,
      sampleCount: 40,
      source: 'outcome',
      evidence: ['g1'],
    })
    expect(validateKnowledge(rule.id).ok).toBe(true)
    const snap = learningSnapshot()
    expect(snap.empty).toBe(false)
    expect(snap.pendingHuman.map((row) => row.id)).toEqual([rule.id])
    expect(snap.pendingAuto).toEqual([])
    expect(approveKnowledge(rule.id, 'automated')).toBe(false)
    expect(learningSnapshot().pendingHuman).toHaveLength(1)
    expect(approveKnowledge(rule.id, 'human')).toBe(true)
    expect(learningSnapshot().pendingHuman).toEqual([])
    expect(learningSnapshot().active).toHaveLength(1)
    expect(learnedPreferenceLine([rule.id])).toBe('Öğrendim: kahvede marble frame arketipi tercih.')
    expect(learnedPreferenceLine([rule.id], { studio: true })).toBe('Öğrendim: kahvede marble frame arketipi tercih.')
  })

  it('describes closed-vocabulary recommendations and lets a human reject a pending rule', () => {
    expect(describeRecommendation({ kind: 'avoid-motif', tokens: ['heavy-frame'] })).toBe('heavy frame motifinden kaçın')
    const rule = addManualKnowledge({
      scope: { level: 'global' },
      condition: { sector: 'serum', style: 'luxury' },
      relationship: 'avoids',
      recommendation: { kind: 'avoid-motif', tokens: ['heavy-frame'] },
      by: 'test',
    })
    expect(describeKnowledgeRule(rule)).toContain('global')
    expect(describeKnowledgeRule(rule)).toContain('stüdyo yüzünü boyamaz')
    expect(rejectKnowledge(rule.id)).toBe(true)
    expect(learningSnapshot().pendingHuman).toEqual([])
    expect(learningSnapshot().empty).toBe(true)
  })
})
