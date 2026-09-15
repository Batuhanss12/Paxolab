/**
 * Learning Gate — raw feedback never edits knowledge directly.
 *
 *   Raw feedback / outcome → Observation → Aggregation → Pattern → Knowledge candidate
 *   → Validation → Approved (active) knowledge version
 *
 * Only `approveKnowledge` can activate a rule, and global scope needs a human.
 * Thresholds live in LEARNING_THRESHOLDS and are documented there; nothing else in
 * this file carries a magic number.
 */
import { idbGetMemory, idbPutMemory } from '../../storage'
import type { DesignDecisionLog, StructuredFeedback } from './DesignDecisionLog'
import {
  activeKnowledge,
  conditionKey,
  knowledgeRule,
  knowledgeRules,
  recommendationKey,
  recommendationRelationship,
  scopeKey,
  transitionKnowledge,
  upsertKnowledgeRule,
  type DesignKnowledgeRule,
  type KnowledgeCondition,
  type KnowledgeRecommendation,
  type KnowledgeScope,
  type KnowledgeScopeLevel,
} from './DesignKnowledgeStore'
import type { DirectorCue } from './DesignPlan'

export const LEARNING_THRESHOLDS = {
  /**
   * Observations a (scope, condition, recommendation) group needs before it becomes a
   * knowledge candidate. User scope learns fast (one person's taste), brand scope needs
   * repeated signal across sessions, global needs many independent designs.
   */
  minSamples: { user: 2, brand: 3, global: 30 } as Record<KnowledgeScopeLevel, number>,
  /** Share of observations in a group that must support the recommendation (0–1). */
  minConsistency: 0.7,
  /** Confidence a candidate must reach to pass validation. */
  minConfidence: 0.6,
  /**
   * Sample count at which evidence stops raising confidence
   * (confidence = consistency × min(1, n / saturation)). Chosen so that a fully consistent
   * group at exactly minSamples clears minConfidence (2/3, 3/4, 30/40 ≥ 0.6) while a
   * 70 %-consistent group needs roughly saturation samples to pass.
   */
  saturationSamples: { user: 3, brand: 4, global: 40 } as Record<KnowledgeScopeLevel, number>,
  /** Scopes an automated cycle may activate. Global design knowledge always needs a human. */
  autoApprove: { user: true, brand: true, global: false } as Record<KnowledgeScopeLevel, boolean>,
  /** Keep at most this many observations locally. */
  maxObservations: 500,
}

export type ObservationSignal = 'feedback' | 'outcome' | 'critic'

export type Observation = {
  id: string
  at: number
  designId: string
  scope: KnowledgeScope
  condition: KnowledgeCondition
  signal: ObservationSignal
  feedback?: Pick<StructuredFeedback, 'type' | 'target' | 'direction'>
  /** What the next design in this scope/condition should carry. Absent = evidence only. */
  recommendation?: KnowledgeRecommendation
  /** +1 supports applying the recommendation, -1 contradicts it. */
  support: 1 | -1
}

export type LearningPattern = {
  key: string
  scope: KnowledgeScope
  condition: KnowledgeCondition
  recommendation: KnowledgeRecommendation
  sampleCount: number
  supporting: number
  consistency: number
  evidence: string[]
}

const OBSERVATION_KEY = 'designObservations.v1'
let observations: Observation[] = []
let hydrated = false

async function hydrate(): Promise<void> {
  if (hydrated) return
  hydrated = true
  try {
    const stored = (await idbGetMemory(OBSERVATION_KEY)) as Observation[] | null
    if (Array.isArray(stored)) observations = stored.slice(-LEARNING_THRESHOLDS.maxObservations)
  } catch {
    /* no observations = no learning; baseline stays */
  }
}

async function persist(): Promise<void> {
  try {
    await idbPutMemory(OBSERVATION_KEY, observations.slice(-LEARNING_THRESHOLDS.maxObservations))
  } catch {
    /* best-effort */
  }
}

export function initLearning(): void {
  void hydrate()
}

export function resetLearning(): void {
  observations = []
  hydrated = true
  void persist()
}

export function listObservations(): Observation[] {
  return [...observations]
}

/** Feedback → recommendation the brief can carry. Closed vocabulary; unknown feedback is evidence only. */
export function feedbackRecommendation(fb: Pick<StructuredFeedback, 'type' | 'target' | 'direction'>): KnowledgeRecommendation | undefined {
  if (fb.type === 'visual_language' && fb.direction === 'modernize') {
    return { kind: 'avoid-motif', tokens: ['generic-corners', 'heavy-frame'] }
  }
  if (fb.type === 'motif' && (fb.direction === 'decrease' || fb.direction === 'avoid')) {
    return { kind: 'avoid-motif', tokens: ['heavy-frame', 'dense-pattern'] }
  }
  if ((fb.type === 'composition' && fb.target === 'density' && fb.direction === 'decrease') || (fb.type === 'whitespace' && fb.direction === 'increase')) {
    return { kind: 'director-cue', cue: 'open-air' }
  }
  if (fb.type === 'composition' && fb.target === 'density' && fb.direction === 'increase') {
    return { kind: 'director-cue', cue: 'graphic-push' }
  }
  if (fb.type === 'brand_fit' && fb.direction === 'strengthen') {
    return { kind: 'director-cue', cue: 'luxury-tighten' }
  }
  return undefined
}

function conditionOf(log: DesignDecisionLog): KnowledgeCondition {
  return {
    sector: log.brief.sector,
    style: log.brief.style,
    surface: log.brief.surface === 'label' ? 'label' : 'box',
  }
}

export type ObserveContext = {
  /** Hashed brand key; defaults to the log's brandKey. */
  brandKey?: string
  userId?: string
}

function scopesFor(brandKey: string, userId: string): KnowledgeScope[] {
  const scopes: KnowledgeScope[] = [{ level: 'user', userId }, { level: 'global' }]
  if (brandKey) scopes.splice(1, 0, { level: 'brand', brandKey })
  return scopes
}

function pushObservation(row: Observation): void {
  if (observations.some((o) => o.id === row.id)) return
  observations = [...observations, row].slice(-LEARNING_THRESHOLDS.maxObservations)
}

/** Raw feedback → observations. Does not touch knowledge state. */
export function observeFeedback(log: DesignDecisionLog, feedback: StructuredFeedback[], ctx: ObserveContext = {}): Observation[] {
  void hydrate()
  const at = Date.now()
  const out: Observation[] = []
  const condition = conditionOf(log)
  feedback.forEach((fb, index) => {
    const recommendation = feedbackRecommendation(fb)
    const studioRecs = studioFeedbackRecommendations(log, fb)
    for (const scope of scopesFor(ctx.brandKey ?? log.brief.brandKey ?? '', ctx.userId ?? 'local')) {
      const row: Observation = {
        id: `${log.designId}:${log.revision}:fb${index}:${scopeKey(scope)}`,
        at,
        designId: log.designId,
        scope,
        condition,
        signal: 'feedback',
        feedback: { type: fb.type, target: fb.target, direction: fb.direction },
        recommendation,
        support: 1,
      }
      pushObservation(row)
      out.push(row)
      studioRecs.forEach((rec, k) => {
        const studioRow: Observation = {
          ...row,
          id: `${log.designId}:${log.revision}:fb${index}:studio${k}:${scopeKey(scope)}`,
          recommendation: rec,
        }
        pushObservation(studioRow)
        out.push(studioRow)
      })
    }
  })
  void persist()
  return out
}

/**
 * Behavioural outcome → observations about what the approved / rejected design carried.
 * Approved (export / ≥4★) supports the cue and avoid tokens in play; rejected (≤2★) contradicts them.
 */
export function observeOutcome(log: DesignDecisionLog, ctx: ObserveContext = {}): Observation[] {
  void hydrate()
  const approved = log.outcome.exported || (log.outcome.stars ?? 0) >= 4
  const rejected = (log.outcome.stars ?? 0) > 0 && (log.outcome.stars ?? 0) <= 2
  if (!approved && !rejected) return []
  const support: 1 | -1 = approved ? 1 : -1
  const at = Date.now()
  const condition = conditionOf(log)
  const recs: KnowledgeRecommendation[] = []
  const cue = log.intent.cue as DirectorCue | undefined
  if (cue && cue !== 'none') recs.push({ kind: 'director-cue', cue })
  if (log.assetLanguage.avoid.length) recs.push({ kind: 'avoid-motif', tokens: [...log.assetLanguage.avoid].sort() })
  const out: Observation[] = []
  recs.forEach((recommendation, index) => {
    for (const scope of scopesFor(ctx.brandKey ?? log.brief.brandKey ?? '', ctx.userId ?? 'local')) {
      const row: Observation = {
        id: `${log.designId}:${log.revision}:out${index}:${scopeKey(scope)}:${support}`,
        at,
        designId: log.designId,
        scope,
        condition,
        signal: 'outcome',
        recommendation,
        support,
      }
      pushObservation(row)
      out.push(row)
    }
  })
  // Studio direction: an approved design supports "prefer this archetype / background";
  // a rejected one supports "avoid" it. Always +1 support on the matching-polarity recommendation.
  if (log.studio) {
    const studioRecs: KnowledgeRecommendation[] = [
      { kind: 'studio-archetype', archetype: log.studio.archetype, prefer: approved },
      { kind: 'studio-background', background: log.studio.background, prefer: approved },
    ]
    studioRecs.forEach((recommendation, index) => {
      for (const scope of scopesFor(ctx.brandKey ?? log.brief.brandKey ?? '', ctx.userId ?? 'local')) {
        const row: Observation = {
          id: `${log.designId}:${log.revision}:studio${index}:${scopeKey(scope)}:${approved ? 'p' : 'a'}`,
          at,
          designId: log.designId,
          scope,
          condition,
          signal: 'outcome',
          recommendation,
          support: 1,
        }
        pushObservation(row)
        out.push(row)
      }
    })
  }
  void persist()
  return out
}

/** Revision feedback on a studio design: "change the texture / layout" → avoid the current one. */
export function studioFeedbackRecommendations(log: DesignDecisionLog, fb: Pick<StructuredFeedback, 'type' | 'target' | 'direction'>): KnowledgeRecommendation[] {
  if (!log.studio) return []
  const out: KnowledgeRecommendation[] = []
  const wantsChange = fb.direction === 'avoid' || fb.direction === 'decrease' || fb.direction === 'modernize' || fb.direction === 'change'
  if (fb.type === 'motif' && wantsChange) out.push({ kind: 'studio-background', background: log.studio.background, prefer: false })
  if ((fb.type === 'composition' || fb.type === 'visual_language') && wantsChange) {
    out.push({ kind: 'studio-archetype', archetype: log.studio.archetype, prefer: false })
  }
  return out
}

/** Group observations into patterns. Pure; deterministic order. */
export function aggregateObservations(rows: Observation[] = observations): LearningPattern[] {
  const groups = new Map<string, LearningPattern>()
  for (const row of rows) {
    if (!row.recommendation) continue
    const key = `${scopeKey(row.scope)}|${conditionKey(row.condition)}|${recommendationKey(row.recommendation)}`
    const group =
      groups.get(key) ??
      {
        key,
        scope: row.scope,
        condition: row.condition,
        recommendation: row.recommendation,
        sampleCount: 0,
        supporting: 0,
        consistency: 0,
        evidence: [],
      }
    group.sampleCount += 1
    if (row.support > 0) group.supporting += 1
    group.evidence.push(row.id)
    groups.set(key, group)
  }
  return [...groups.values()]
    .map((group) => ({ ...group, consistency: group.sampleCount ? group.supporting / group.sampleCount : 0 }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function patternConfidence(pattern: LearningPattern): number {
  const saturation = LEARNING_THRESHOLDS.saturationSamples[pattern.scope.level]
  return Math.round(pattern.consistency * Math.min(1, pattern.sampleCount / saturation) * 100) / 100
}

/** Patterns with enough evidence become (or refresh) knowledge candidates. Never activates. */
export function deriveKnowledgeCandidates(patterns: LearningPattern[] = aggregateObservations()): DesignKnowledgeRule[] {
  const out: DesignKnowledgeRule[] = []
  for (const pattern of patterns) {
    if (pattern.sampleCount < LEARNING_THRESHOLDS.minSamples[pattern.scope.level]) continue
    if (pattern.consistency < LEARNING_THRESHOLDS.minConsistency) continue
    out.push(
      upsertKnowledgeRule({
        scope: pattern.scope,
        condition: pattern.condition,
        relationship: recommendationRelationship(pattern.recommendation),
        recommendation: pattern.recommendation,
        confidence: patternConfidence(pattern),
        sampleCount: pattern.sampleCount,
        source: pattern.evidence.some((id) => /:out\d/.test(id)) ? 'outcome' : 'user_feedback',
        evidence: pattern.evidence,
      }),
    )
  }
  return out
}

export type ValidationResult = { id: string; ok: boolean; reason: string }

function conflictsWithActive(rule: DesignKnowledgeRule): boolean {
  if (rule.recommendation.kind !== 'director-cue') return false
  const cue = rule.recommendation.cue
  return activeKnowledge().some(
    (other) =>
      other.id !== rule.id &&
      other.recommendation.kind === 'director-cue' &&
      scopeKey(other.scope) === scopeKey(rule.scope) &&
      conditionKey(other.condition) === conditionKey(rule.condition) &&
      other.recommendation.cue !== cue,
  )
}

/** Validation: sample count, confidence, scope consistency (no contradicting active cue). */
export function validateKnowledge(id: string, by = 'validation'): ValidationResult {
  const rule = knowledgeRule(id)
  if (!rule) return { id, ok: false, reason: 'unknown rule' }
  if (rule.state !== 'candidate') return { id, ok: rule.state === 'validated' || rule.state === 'active', reason: `state ${rule.state}` }
  if (rule.sampleCount < LEARNING_THRESHOLDS.minSamples[rule.scope.level]) {
    return { id, ok: false, reason: `sampleCount ${rule.sampleCount} < ${LEARNING_THRESHOLDS.minSamples[rule.scope.level]}` }
  }
  if (rule.confidence < LEARNING_THRESHOLDS.minConfidence) {
    return { id, ok: false, reason: `confidence ${rule.confidence} < ${LEARNING_THRESHOLDS.minConfidence}` }
  }
  if (conflictsWithActive(rule)) {
    transitionKnowledge(id, 'rejected', by)
    return { id, ok: false, reason: 'contradicts an active cue in the same scope/condition' }
  }
  transitionKnowledge(id, 'validated', by)
  return { id, ok: true, reason: 'validated' }
}

/** Only door into `active`. Global scope refuses automated approval. */
export function approveKnowledge(id: string, by: 'human' | 'automated'): boolean {
  const rule = knowledgeRule(id)
  if (!rule || rule.state !== 'validated') return false
  if (by === 'automated' && !LEARNING_THRESHOLDS.autoApprove[rule.scope.level]) return false
  return transitionKnowledge(id, 'active', by)
}

export function deprecateKnowledge(id: string, by = 'human'): boolean {
  return transitionKnowledge(id, 'deprecated', by)
}

/**
 * One learning cycle: aggregate → candidates → validate → (optionally) approve.
 * `approve: 'none'` (default) stops at validated; the app never activates silently.
 */
export function runLearningCycle(opts: { approve?: 'none' | 'automated' | 'human' } = {}): {
  candidates: string[]
  validated: string[]
  activated: string[]
} {
  const candidates = deriveKnowledgeCandidates().map((rule) => rule.id)
  const validated: string[] = []
  const activated: string[] = []
  for (const rule of knowledgeRules({ state: 'candidate' })) {
    if (validateKnowledge(rule.id).ok) validated.push(rule.id)
  }
  const approve = opts.approve ?? 'none'
  if (approve !== 'none') {
    for (const rule of knowledgeRules({ state: 'validated' })) {
      if (approveKnowledge(rule.id, approve)) activated.push(rule.id)
    }
  }
  return { candidates, validated, activated }
}
