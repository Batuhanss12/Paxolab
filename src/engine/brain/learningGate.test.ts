import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { clearCompositionSearch } from '../artwork/compositionCandidates'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { applyKnowledgeToBrief, matchingKnowledge } from './applyKnowledge'
import { decisionLogFor, resetDecisionLogs, type StructuredFeedback } from './DesignDecisionLog'
import {
  activeKnowledge,
  brandScopeKey,
  knowledgeRule,
  knowledgeRules,
  knowledgeVersion,
  knowledgeVersions,
  resetDesignKnowledge,
  rollbackKnowledge,
  upsertKnowledgeRule,
} from './DesignKnowledgeStore'
import { resetArtMemory } from './DesignMemory'
import {
  LEARNING_THRESHOLDS,
  aggregateObservations,
  approveKnowledge,
  listObservations,
  resetLearning,
  runLearningCycle,
  validateKnowledge,
} from './LearningEngine'
import { noteRating } from './OutcomeTracker'

function lumaBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Luma',
    productName: 'Glow',
    sector: 'kozmetik',
    subProduct: 'serum',
    packagingMode: 'box',
    templateId: 'serum-box',
    dimensionsMm: { L: 45, W: 45, H: 120 },
    styleType: 'luxury',
    ...patch,
  }
}

const TOO_CLASSIC: StructuredFeedback[] = [{ type: 'visual_language', target: 'dialect', direction: 'modernize', strength: 'medium' }]

function stablePlan(spec: DesignSpec): string {
  const plan = spec.designPlan!
  return JSON.stringify({
    concept: plan.visualConcept.id,
    languages: plan.visualLanguage,
    chrome: plan.artDirection.chrome,
    hero: plan.heroGraphic.family,
    pattern: plan.patternSystem.family,
    cue: plan.cue,
    avoid: plan.visualConcept.avoid,
  })
}

describe('Learning Gate — raw feedback → observation → candidate → validated → active → rollback', () => {
  const engine = new FormaLocalEngine()

  beforeEach(() => {
    resetArtMemory()
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
    clearCompositionSearch()
  })
  afterEach(() => {
    resetDecisionLogs()
    resetDesignKnowledge()
    resetLearning()
  })

  it('records raw feedback as observations without changing any knowledge', () => {
    const spec = engine.generate({ brief: lumaBrief(), feedback: TOO_CLASSIC })
    const log = decisionLogFor(spec.id)
    expect(log?.feedback).toHaveLength(1)
    expect(log?.brief.brandKey).toBe(brandScopeKey('Luma'))
    expect(JSON.stringify(log)).not.toMatch(/Luma/)

    const observations = listObservations()
    expect(observations.length).toBe(3)
    expect(observations.map((row) => row.scope.level).sort()).toEqual(['brand', 'global', 'user'])
    expect(observations.every((row) => row.recommendation?.kind === 'avoid-motif')).toBe(true)

    expect(activeKnowledge()).toEqual([])
    expect(knowledgeRules()).toEqual([])
    expect(knowledgeVersion()).toBe(0)
    expect(spec.appliedKnowledge).toBeUndefined()
  })

  it('needs repeated, consistent evidence before a candidate exists; global never auto-activates', () => {
    let spec: DesignSpec | undefined
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.brand; i++) {
      spec = engine.generate({ brief: lumaBrief(), prev: spec, feedback: TOO_CLASSIC })
      if (i < LEARNING_THRESHOLDS.minSamples.brand - 1) {
        expect(runLearningCycle().candidates.filter((id) => id.startsWith('brand:'))).toEqual([])
      }
    }
    const patterns = aggregateObservations()
    const brandPattern = patterns.find((row) => row.scope.level === 'brand')
    expect(brandPattern?.sampleCount).toBe(LEARNING_THRESHOLDS.minSamples.brand)
    expect(brandPattern?.consistency).toBe(1)

    const cycle = runLearningCycle({ approve: 'automated' })
    expect(cycle.candidates.some((id) => id.startsWith('brand:'))).toBe(true)
    expect(cycle.candidates.some((id) => id.startsWith('user:'))).toBe(true)
    expect(cycle.candidates.some((id) => id.startsWith('global'))).toBe(false)
    expect(activeKnowledge().length).toBeGreaterThan(0)
    expect(activeKnowledge().every((rule) => rule.scope.level !== 'global')).toBe(true)
    expect(knowledgeVersion()).toBeGreaterThan(0)

    const brandRule = activeKnowledge().find((rule) => rule.scope.level === 'brand')
    expect(brandRule?.confidence).toBeGreaterThanOrEqual(LEARNING_THRESHOLDS.minConfidence)
    expect(brandRule?.history.map((row) => row.to)).toEqual(['candidate', 'validated', 'active'])
    expect(brandRule?.condition).toEqual({ sector: 'serum', style: 'luxury', surface: 'box' })
  })

  it('global knowledge requires a human even when the evidence is strong', () => {
    const rule = upsertKnowledgeRule({
      scope: { level: 'global' },
      condition: { sector: 'serum', style: 'luxury' },
      relationship: 'avoids',
      recommendation: { kind: 'avoid-motif', tokens: ['heavy-frame'] },
      confidence: 0.9,
      sampleCount: 40,
      source: 'user_feedback',
      evidence: ['synthetic'],
    })
    expect(validateKnowledge(rule.id).ok).toBe(true)
    expect(approveKnowledge(rule.id, 'automated')).toBe(false)
    expect(knowledgeRule(rule.id)?.state).toBe('validated')
    expect(approveKnowledge(rule.id, 'human')).toBe(true)
    expect(knowledgeRule(rule.id)?.state).toBe('active')
  })

  it('rejects thin or inconsistent candidates and contradicting cues', () => {
    const thin = upsertKnowledgeRule({
      scope: { level: 'brand', brandKey: brandScopeKey('Luma') },
      condition: { sector: 'serum' },
      relationship: 'prefers',
      recommendation: { kind: 'director-cue', cue: 'open-air' },
      confidence: 0.3,
      sampleCount: 1,
      source: 'user_feedback',
      evidence: ['a'],
    })
    expect(validateKnowledge(thin.id)).toEqual(expect.objectContaining({ ok: false }))
    expect(knowledgeRule(thin.id)?.state).toBe('candidate')

    const strong = upsertKnowledgeRule({
      scope: { level: 'brand', brandKey: brandScopeKey('Luma') },
      condition: { sector: 'serum' },
      relationship: 'prefers',
      recommendation: { kind: 'director-cue', cue: 'luxury-tighten' },
      confidence: 0.9,
      sampleCount: 5,
      source: 'user_feedback',
      evidence: ['b'],
    })
    expect(validateKnowledge(strong.id).ok).toBe(true)
    expect(approveKnowledge(strong.id, 'automated')).toBe(true)

    const contradicting = upsertKnowledgeRule({
      scope: { level: 'brand', brandKey: brandScopeKey('Luma') },
      condition: { sector: 'serum' },
      relationship: 'prefers',
      recommendation: { kind: 'director-cue', cue: 'graphic-push' },
      confidence: 0.9,
      sampleCount: 5,
      source: 'user_feedback',
      evidence: ['c'],
    })
    expect(validateKnowledge(contradicting.id).ok).toBe(false)
    expect(knowledgeRule(contradicting.id)?.state).toBe('rejected')
  })

  it('active knowledge shapes future briefs as KNOWLEDGE_DERIVED, scoped to the brand, and rollback removes it', () => {
    const baseline = engine.generate({ brief: lumaBrief() })
    expect(baseline.appliedKnowledge).toBeUndefined()

    let spec: DesignSpec | undefined
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.brand; i++) {
      spec = engine.generate({ brief: lumaBrief(), prev: spec, feedback: TOO_CLASSIC })
    }

    runLearningCycle({ approve: 'automated' })
    const activeVersion = knowledgeVersion()

    const applied = applyKnowledgeToBrief(lumaBrief())
    expect(applied.applied.length).toBeGreaterThan(0)
    expect(applied.brief.avoidMotifs).toEqual(expect.arrayContaining(['heavy-frame', 'generic-corners']))
    expect(applied.brief.provenance?.avoidMotifs?.source).toBe('KNOWLEDGE_DERIVED')
    expect(applied.version).toBe(activeVersion)

    const learned = engine.generate({ brief: lumaBrief() })
    expect(learned.appliedKnowledge?.length).toBeGreaterThan(0)
    expect(learned.designPlan?.visualConcept.avoid).toEqual(expect.arrayContaining(['heavy-frame']))
    expect(decisionLogFor(learned.id)?.knowledgeVersion).toBe(activeVersion)
    expect(decisionLogFor(learned.id)?.appliedKnowledge).toEqual(learned.appliedKnowledge)

    // Brand scope does not leak to another brand; user scope (same local user) still applies.
    const other = matchingKnowledge(lumaBrief({ brandName: 'Nova' }))
    expect(other.every((rule) => rule.scope.level !== 'brand')).toBe(true)
    const otherStyle = matchingKnowledge(lumaBrief({ styleType: 'eco' }))
    expect(otherStyle).toEqual([])

    expect(rollbackKnowledge(0)).toBe(true)
    expect(activeKnowledge()).toEqual([])
    expect(knowledgeVersion()).toBeGreaterThan(activeVersion)
    expect(knowledgeVersions().some((entry) => entry.version === activeVersion)).toBe(true)
    const rolled = engine.generate({ brief: lumaBrief() })
    expect(rolled.appliedKnowledge).toBeUndefined()
    expect(stablePlan(rolled)).toBe(stablePlan(baseline))

    expect(rollbackKnowledge(activeVersion)).toBe(true)
    expect(activeKnowledge().length).toBeGreaterThan(0)
  })

  it('is deterministic: same brief + same knowledge version → same decision path', () => {
    const a = engine.generate({ brief: lumaBrief() })
    resetArtMemory()
    clearCompositionSearch()
    const b = engine.generate({ brief: lumaBrief() })
    expect(stablePlan(a)).toBe(stablePlan(b))
    const la = decisionLogFor(a.id)
    const lb = decisionLogFor(b.id)
    expect(la?.candidates).toEqual(lb?.candidates)
    expect(la?.winner?.why).toEqual(lb?.winner?.why)
    expect(la?.critiques).toEqual(lb?.critiques)
  })

  it('treats approvals and rejections as outcome observations and keeps the baseline when knowledge is empty', () => {
    const spec = engine.generate({ brief: lumaBrief(), overridePatch: { directorCue: 'luxury-tighten' } })
    noteRating(spec.id, 5, ['premium'])
    const outcomes = listObservations().filter((row) => row.signal === 'outcome')
    expect(outcomes.length).toBeGreaterThan(0)
    expect(outcomes.every((row) => row.support === 1)).toBe(true)
    expect(outcomes.some((row) => row.recommendation?.kind === 'director-cue')).toBe(true)
    expect(activeKnowledge()).toEqual([])

    resetDesignKnowledge()
    const again = engine.generate({ brief: lumaBrief() })
    expect(again.designPlan).toBeDefined()
    expect(again.appliedKnowledge).toBeUndefined()
  })
})
