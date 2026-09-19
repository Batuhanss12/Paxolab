import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief, DesignSpec } from '../../types'
import { clearCompositionSearch } from '../artwork/compositionCandidates'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { matchingKnowledge } from './applyKnowledge'
import { decisionLogFor, resetDecisionLogs, type StructuredFeedback } from './DesignDecisionLog'
import {
  activeKnowledge,
  brandScopeKey,
  knowledgeRule,
  knowledgeRules,
  knowledgeVersion,
  rollbackKnowledge,
  resetDesignKnowledge,
  upsertKnowledgeRule,
} from './DesignKnowledgeStore'
import { resetArtMemory } from './DesignMemory'
import {
  LEARNING_THRESHOLDS,
  approveKnowledge,
  aggregateObservations,
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

  /*
   * These tests used to run on the kit compositor, because they call `generate` without asking for
   * the studio path and that used to select the old painter. Retiring the kit path moved them onto
   * the path the product actually uses, and that exposed a real hole:
   *
   *   `observeFeedback` drops the kit `avoid-motif` recommendation on a studio log and replaces it
   *   with recommendations that name *whatever was on screen* — the archetype, the background.
   *   `aggregateObservations` groups by the recommendation, so three rounds of the same complaint
   *   about three different archetypes made three groups of one. Measured: line-scene, line-scene,
   *   noir-stack, evidence split 2/1, the three-sample brand threshold unreachable. The gate could
   *   observe forever and never produce a candidate.
   *
   * Fixed by giving the screen-specific evidence a stable companion on the ornament axis, which is
   * what "modernise this" and "fewer motifs" actually mean and which does not depend on the face in
   * front of the customer. The whole chain is guarded below, including the part that was dead.
   *
   * (An earlier reading of this file also claimed `observeOutcome` records nothing on the studio
   * path. That was wrong — it has its own studio branch, and the approval test below proves it.)
   */
  it('records raw feedback as observations, scoped, without changing any knowledge', () => {
    const spec = engine.generate({ brief: lumaBrief(), feedback: TOO_CLASSIC })
    const log = decisionLogFor(spec.id)
    expect(log?.feedback).toHaveLength(1)
    expect(log?.brief.brandKey).toBe(brandScopeKey('Luma'))
    expect(JSON.stringify(log)).not.toMatch(/Luma/)

    const observations = listObservations()
    /*
     * One feedback, three scopes, three rows each: the signal itself (the kit motif recommendation
     * is dropped, so that row carries none), the archetype that was on screen, and the ornament
     * axis — the one that does not move with the face and therefore accumulates.
     */
    expect(observations.length).toBe(9)
    expect([...new Set(observations.map((row) => row.scope.level))].sort()).toEqual(['brand', 'global', 'user'])
    // A studio face has no kit motifs, so nothing may recommend avoiding one.
    expect(observations.some((row) => row.recommendation?.kind === 'avoid-motif')).toBe(false)
    expect(new Set(observations.filter((row) => row.recommendation).map((row) => row.recommendation?.kind))).toEqual(
      new Set(['studio-archetype', 'studio-ornament']),
    )

    expect(activeKnowledge()).toEqual([])
    expect(knowledgeRules()).toEqual([])
    expect(knowledgeVersion()).toBe(0)
    expect(spec.appliedKnowledge).toBeUndefined()
  })

  it('never auto-activates global knowledge, however strong the evidence looks', () => {
    let spec: DesignSpec | undefined
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.brand; i++) {
      spec = engine.generate({ brief: lumaBrief(), prev: spec, feedback: TOO_CLASSIC })
    }
    const cycle = runLearningCycle({ approve: 'automated' })
    expect(cycle.candidates.some((id) => id.startsWith('global'))).toBe(false)
    expect(activeKnowledge().every((rule) => rule.scope.level !== 'global')).toBe(true)
  })

  it('accumulates repeated feedback into brand knowledge, on an axis that does not move with the face', () => {
    let spec: DesignSpec | undefined
    const shown: string[] = []
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.brand; i++) {
      spec = engine.generate({ brief: lumaBrief(), prev: spec, feedback: TOO_CLASSIC })
      shown.push(String(spec.studio?.direction.archetype))
    }
    // The engine shows a different face as it walks; the evidence must survive that.
    expect(new Set(shown).size, 'yürüyüş tek arketipte kaldı — test kendi varsayımını doğrulamıyor').toBeGreaterThan(1)

    const brandPatterns = aggregateObservations().filter((row: { scope: { level: string } }) => row.scope.level === 'brand')
    const stable = brandPatterns.find((row: { recommendation: { kind: string } }) => row.recommendation.kind === 'studio-ornament')
    expect(stable, 'ekran bağımsız desen yok').toBeTruthy()
    expect(stable?.sampleCount, 'kanıt birikmedi').toBe(LEARNING_THRESHOLDS.minSamples.brand)
    expect(stable?.consistency).toBe(1)

    const cycle = runLearningCycle({ approve: 'automated' })
    expect(cycle.candidates.some((id) => id.startsWith('brand:')), 'marka adayı çıkmadı').toBe(true)
    const brandRule = activeKnowledge().find((rule) => rule.scope.level === 'brand')
    expect(brandRule, 'marka kuralı aktifleşmedi').toBeTruthy()
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

  it('active knowledge reaches the next design, says why, and rollback takes it back out', () => {
    const baseline = engine.generate({ brief: lumaBrief() })
    expect(baseline.appliedKnowledge).toBeUndefined()

    let spec: DesignSpec | undefined
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.brand; i++) {
      spec = engine.generate({ brief: lumaBrief(), prev: spec, feedback: TOO_CLASSIC })
    }
    runLearningCycle({ approve: 'automated' })
    const activeVersion = knowledgeVersion()
    expect(activeVersion).toBeGreaterThan(0)

    const learned = engine.generate({ brief: lumaBrief() })
    expect(learned.appliedKnowledge?.length, 'bilgi tasarıma ulaşmadı').toBeGreaterThan(0)
    // The customer asked for less ornament three times; the next design is drawn quiet.
    expect(learned.studio?.direction.ornament).toBe('quiet')
    expect((learned.studio?.direction.rationale ?? []).some((line) => /Bilgi tabanı/.test(line)), 'gerekçe söylemiyor').toBe(true)
    expect(decisionLogFor(learned.id)?.knowledgeVersion).toBe(activeVersion)

    // Brand scope does not leak to another brand.
    const other = matchingKnowledge(lumaBrief({ brandName: 'Nova' }))
    expect(other.every((rule) => rule.scope.level !== 'brand')).toBe(true)
    const otherStyle = matchingKnowledge(lumaBrief({ styleType: 'eco' }))
    expect(otherStyle).toEqual([])

    expect(rollbackKnowledge(0)).toBe(true)
    expect(activeKnowledge()).toEqual([])
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

  it('treats an approval as an outcome observation about the design that was approved', () => {
    const spec = engine.generate({ brief: lumaBrief(), overridePatch: { directorCue: 'luxury-tighten' } })
    noteRating(spec.id, 5, ['premium'])

    const outcomes = listObservations().filter((row) => row.signal === 'outcome')
    expect(outcomes.length, 'onay hiçbir şey kaydetmedi').toBeGreaterThan(0)
    expect(outcomes.every((row) => row.support === 1)).toBe(true)
    expect([...new Set(outcomes.map((row) => row.scope.level))].sort()).toEqual(['brand', 'global', 'user'])
    /*
     * The studio path records what the approved *design* carried, not a kit director-cue: the
     * archetype and the background, marked `prefer` because the customer kept them. The polarity
     * lives in `prefer`; `support` stays +1 either way.
     */
    const kinds = new Set(outcomes.map((row) => row.recommendation?.kind))
    expect(kinds).toEqual(new Set(['studio-archetype', 'studio-background']))
    expect(outcomes.every((row) => (row.recommendation as { prefer?: boolean }).prefer === true)).toBe(true)
    const archetype = outcomes.find((row) => row.recommendation?.kind === 'studio-archetype')
    expect((archetype?.recommendation as { archetype?: string }).archetype).toBe(spec.studio?.direction.archetype)

    expect(activeKnowledge()).toEqual([])
  })

  it('keeps the baseline when knowledge is empty', () => {
    resetDesignKnowledge()
    const again = engine.generate({ brief: lumaBrief() })
    expect(again.designPlan).toBeDefined()
    expect(again.appliedKnowledge).toBeUndefined()
  })
})
