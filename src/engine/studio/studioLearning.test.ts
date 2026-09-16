import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { runConversation } from '../conversation'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { parseFeedback } from '../iterate/feedbackParser'
import { isIteration } from '../iterate/parseIntent'
import {
  applyKnowledgeToBrief,
  matchingKnowledge,
} from '../brain/applyKnowledge'
import { decisionLogFor, resetDecisionLogs } from '../brain/DesignDecisionLog'
import {
  activeKnowledge,
  knowledgeRule,
  resetDesignKnowledge,
  upsertKnowledgeRule,
} from '../brain/DesignKnowledgeStore'
import { resetArtMemory } from '../brain/DesignMemory'
import { learnedPreferenceLine } from '../brain/learningUi'
import { noteRating } from '../brain/OutcomeTracker'
import {
  LEARNING_THRESHOLDS,
  approveKnowledge,
  listObservations,
  rejectKnowledge,
  resetLearning,
  validateKnowledge,
} from '../brain/LearningEngine'
import { parseDirectionTalk } from './directionTalk'
import { familyOf } from './family'
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

function generate(brief: DesignBrief, extra: { feedback?: ReturnType<typeof parseFeedback> } = {}) {
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { studio: true },
    feedback: extra.feedback,
  })
}

function faceHash(spec: ReturnType<FormaLocalEngine['generate']>): string {
  const layer = spec.artwork.layers.find((row) => row.panelId === spec.artwork.frontPanelId)?.markup ?? ''
  return hashStudioFace(layer)
}

const DENSE = parseFeedback('Bu yön fazla yoğun.')

describe('C7 learning loop', () => {
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

  it('TEST 1 — conversation feedback reaches parse + generate', () => {
    expect(DENSE).toEqual([
      expect.objectContaining({ type: 'composition', target: 'density', direction: 'decrease' }),
    ])
    expect(parseFeedback('çok sıkışık')[0]?.direction).toBe('decrease')
    expect(parseFeedback('too dense')[0]?.direction).toBe('decrease')
    expect(isIteration('Bu yön fazla yoğun.')).toBe(true)
    const start = generate(coffee({ studioFamily: 'marble' }))
    const turn = runConversation({
      text: 'Bu yön fazla yoğun.',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(turn.shouldGenerate).toBe(true)
    expect(turn.feedback).toEqual(expect.arrayContaining([expect.objectContaining({ target: 'density', direction: 'decrease' })]))
  })

  it('TEST 2 — feedback becomes a structured observation', () => {
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    const rows = listObservations()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.signal === 'feedback')).toBe(true)
    expect(rows.some((row) => row.feedback?.type === 'composition' && row.feedback.direction === 'decrease')).toBe(true)
    expect(rows.some((row) => row.recommendation?.kind === 'director-cue' && row.recommendation.cue === 'open-air')).toBe(true)
    expect(rows.some((row) => row.recommendation?.kind === 'studio-archetype' && row.recommendation.prefer === false)).toBe(true)
    expect(rows[0]?.scope.level).toBeDefined()
    expect(rows[0]?.condition.surface).toBe('box')
  })

  it('TEST 3 — local user signal does not become a global active rule', () => {
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    expect(activeKnowledge().every((rule) => rule.scope.level !== 'global')).toBe(true)
    const otherUser = matchingKnowledge(coffee(), { userId: 'other' })
    expect(otherUser.every((rule) => rule.scope.level !== 'user')).toBe(true)
    expect(matchingKnowledge(coffee({ brandName: 'Nova' })).every((rule) => rule.scope.level !== 'brand')).toBe(true)
  })

  it('TEST 4 — enough observations become a knowledge candidate then validate', () => {
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    expect(activeKnowledge()).toEqual([])
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    expect(LEARNING_THRESHOLDS.minSamples.user).toBe(2)
    const userRules = activeKnowledge().filter((rule) => rule.scope.level === 'user')
    expect(userRules.length).toBeGreaterThan(0)
    expect(userRules.every((rule) => rule.history.some((h) => h.to === 'candidate'))).toBe(true)
    expect(userRules.every((rule) => rule.history.some((h) => h.to === 'validated'))).toBe(true)
    expect(userRules.every((rule) => rule.history.some((h) => h.to === 'active'))).toBe(true)
  })

  it('TEST 5 — unvalidated candidate is not approved knowledge', () => {
    const thin = upsertKnowledgeRule({
      scope: { level: 'user', userId: 'local' },
      condition: { sector: 'food', style: 'luxury', surface: 'box' },
      relationship: 'avoids',
      recommendation: { kind: 'studio-archetype', archetype: 'marble-frame', prefer: false },
      confidence: 0.2,
      sampleCount: 1,
      source: 'user_feedback',
      evidence: ['thin'],
    })
    expect(thin.state).toBe('candidate')
    expect(validateKnowledge(thin.id).ok).toBe(false)
    expect(knowledgeRule(thin.id)?.state).toBe('candidate')
    const spec = generate(coffee({ studioFamily: 'marble' }))
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
    expect(spec.appliedKnowledge ?? []).not.toContain(thin.id)
  })

  it('TEST 6 — rejected knowledge does not change a future decision', () => {
    const rule = upsertKnowledgeRule({
      scope: { level: 'user', userId: 'local' },
      condition: { sector: 'food', style: 'luxury', surface: 'box' },
      relationship: 'avoids',
      recommendation: { kind: 'studio-archetype', archetype: 'marble-frame', prefer: false },
      confidence: 0.9,
      sampleCount: 4,
      source: 'user_feedback',
      evidence: ['rej'],
    })
    expect(validateKnowledge(rule.id).ok).toBe(true)
    expect(rejectKnowledge(rule.id)).toBe(true)
    expect(knowledgeRule(rule.id)?.state).toBe('rejected')
    const spec = generate(coffee({ studioFamily: 'marble' }))
    expect(spec.studio?.direction.archetype).toBe('marble-frame')
    expect(spec.appliedKnowledge ?? []).not.toContain(rule.id)
  })

  it('TEST 7–8 — approved knowledge changes a future independent generate (A/B)', () => {
    const before = generate(coffee())
    expect(before.studio?.direction.archetype).toBe('marble-frame')
    expect(before.appliedKnowledge).toBeUndefined()

    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    const after = generate(coffee())
    expect(after.appliedKnowledge?.length).toBeGreaterThan(0)
    expect(after.studio?.direction.archetype).not.toBe('marble-frame')
    expect(familyOf(after.studio!.direction.archetype)).not.toBe('marble')
    expect(faceHash(after)).not.toBe(faceHash(before))
  })

  it('TEST 9 — provenance from observation ids to applied rule', () => {
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    const obsIds = new Set(listObservations().map((row) => row.id))
    const rule = activeKnowledge().find((row) => row.recommendation.kind === 'studio-archetype')
    expect(rule).toBeTruthy()
    expect(rule!.evidence.some((id) => obsIds.has(id))).toBe(true)
    const future = generate(coffee())
    expect(future.appliedKnowledge).toContain(rule!.id)
    expect(decisionLogFor(future.id)?.appliedKnowledge).toContain(rule!.id)
    expect(future.studio?.direction.rationale.join(' ')).toMatch(/Bilgi tabanı|kaçınıldı/i)
  })

  it('TEST 10 — same learning state is deterministic', () => {
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    generate(coffee({ studioFamily: 'marble' }), { feedback: DENSE })
    const a = generate(coffee())
    resetArtMemory()
    const b = generate(coffee())
    expect(a.studio?.direction.archetype).toBe(b.studio?.direction.archetype)
    expect(a.appliedKnowledge).toEqual(b.appliedKnowledge)
    expect(faceHash(a)).toBe(faceHash(b))
  })

  it('TEST 11 — C6 veto/vary still works with an empty knowledge store', () => {
    expect(activeKnowledge()).toEqual([])
    expect(parseDirectionTalk('Marble istemiyorum.', 'marble')?.kind).toBe('veto')
    const start = generate(coffee({ studioFamily: 'marble' }))
    const veto = runConversation({
      text: 'Marble istemiyorum.',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    expect(veto.shouldGenerate).toBe(true)
    expect(veto.brief.avoidStudioFamilies).toContain('marble')
    const painted = generate(veto.brief)
    expect(painted.studio?.direction.archetype).not.toBe('marble-frame')
    expect(activeKnowledge()).toEqual([])
  })

  it('TEST 12 — production path: chat feedback → observe → validate → future SVG + preflight', () => {
    const start = generate(coffee({ studioFamily: 'marble' }))
    const turn = runConversation({
      text: 'Bu yön fazla yoğun.',
      attachments: [],
      brief: start.brief,
      awaiting: null,
      hasDesign: true,
    })
    generate(turn.brief, { feedback: turn.feedback })
    const again = runConversation({
      text: 'Bu yön fazla yoğun.',
      attachments: [],
      brief: turn.brief,
      awaiting: null,
      hasDesign: true,
    })
    generate(again.brief, { feedback: again.feedback })
    const future = generate(coffee())
    expect(future.studio?.direction.archetype).not.toBe('marble-frame')
    expect(future.artwork.layers.some((l) => /data-art="studio"/.test(l.markup))).toBe(true)
    expect(future.preflight.blocking).toBe(false)
    expect(future.preflight.exportOk).toBe(true)
    expect(applyKnowledgeToBrief(coffee()).applied.length).toBeGreaterThan(0)
  })
})

describe('studio outcome prefer — archetype/background only', () => {
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

  it('one 5-star is evidence, not an active rule', () => {
    const liked = generate(coffee({ studioFamily: 'botanical' }))
    expect(liked.studio?.direction.archetype).toBe('botanical-card')
    noteRating(liked.id, 5, ['beğendim'])
    const rows = listObservations().filter((row) => row.signal === 'outcome')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.recommendation?.kind !== 'avoid-motif')).toBe(true)
    expect(rows.every((row) => row.recommendation?.kind !== 'director-cue')).toBe(true)
    expect(
      rows.some(
        (row) =>
          row.recommendation?.kind === 'studio-archetype' &&
          row.recommendation.prefer &&
          row.recommendation.archetype === 'botanical-card',
      ),
    ).toBe(true)
    expect(activeKnowledge()).toEqual([])
    expect(generate(coffee()).studio?.direction.archetype).toBe('marble-frame')
  })

  it('two independent 5-star studio faces pin that DNA on a later coffee generate', () => {
    const before = generate(coffee())
    expect(before.studio?.direction.archetype).toBe('marble-frame')
    for (let i = 0; i < LEARNING_THRESHOLDS.minSamples.user; i++) {
      const liked = generate(coffee({ studioFamily: 'botanical' }))
      expect(liked.studio?.direction.archetype).toBe('botanical-card')
      noteRating(liked.id, 5, ['beğendim'])
    }
    const rule = activeKnowledge().find(
      (row) => row.recommendation.kind === 'studio-archetype' && row.recommendation.prefer,
    )
    expect(rule?.source).toBe('outcome')
    expect(rule?.recommendation).toEqual({
      kind: 'studio-archetype',
      archetype: 'botanical-card',
      prefer: true,
    })
    expect(activeKnowledge().every((row) => row.recommendation.kind !== 'avoid-motif')).toBe(true)
    const after = generate(coffee())
    expect(after.studio?.direction.archetype).toBe('botanical-card')
    expect(after.studio?.direction.background).toBe('botanical')
    expect(familyOf(after.studio!.direction.archetype)).toBe('botanical')
    expect(faceHash(after)).not.toBe(faceHash(before))
    expect(learnedPreferenceLine(after.appliedKnowledge, { studio: true })).toMatch(/botanical/)
  })

  it('çok klasik on studio does not write avoid-motif; it avoids the painted archetype', () => {
    const classic = parseFeedback('çok klasik')
    expect(classic[0]).toEqual(expect.objectContaining({ type: 'visual_language', direction: 'modernize' }))
    generate(coffee({ studioFamily: 'marble' }), { feedback: classic })
    const rows = listObservations()
    expect(rows.every((row) => row.recommendation?.kind !== 'avoid-motif')).toBe(true)
    expect(
      rows.some(
        (row) =>
          row.recommendation?.kind === 'studio-archetype' &&
          row.recommendation.prefer === false &&
          row.recommendation.archetype === 'marble-frame',
      ),
    ).toBe(true)
  })
})

describe('C7 validation gate — no silent global approve', () => {
  beforeEach(() => {
    resetDesignKnowledge()
    resetLearning()
  })

  it('global rule validates but automated approve is refused', () => {
    const rule = upsertKnowledgeRule({
      scope: { level: 'global' },
      condition: { sector: 'food', style: 'luxury' },
      relationship: 'avoids',
      recommendation: { kind: 'avoid-motif', tokens: ['heavy-frame'] },
      confidence: 0.9,
      sampleCount: 40,
      source: 'user_feedback',
      evidence: ['g'],
    })
    expect(validateKnowledge(rule.id).ok).toBe(true)
    expect(approveKnowledge(rule.id, 'automated')).toBe(false)
    expect(knowledgeRule(rule.id)?.state).toBe('validated')
    expect(generate(coffee()).appliedKnowledge ?? []).not.toContain(rule.id)
    expect(approveKnowledge(rule.id, 'human')).toBe(true)
  })
})
