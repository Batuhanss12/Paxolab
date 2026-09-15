/**
 * Design Knowledge store — validated, versioned, scoped design memory.
 *
 * A rule says: under `condition`, for `scope`, the brief should carry `recommendation`.
 * Recommendations are restricted to inputs the Design Brain already consumes through
 * the brief (avoidMotifs, directorCue). Nothing here paints, scores or invents assets.
 *
 * Lifecycle:  candidate → validated → active → deprecated  (rejected is terminal)
 * Every active-set change bumps the knowledge version and snapshots the active ids,
 * so `rollbackKnowledge(v)` restores a previous active set exactly.
 *
 * Empty store = baseline deterministic rules. Persistence is best-effort IndexedDB.
 */
import { idbGetMemory, idbPutMemory } from '../../storage'
import type { DirectorCue } from './DesignPlan'

export const DESIGN_KNOWLEDGE_SCHEMA = 'designKnowledge.v1'

export type KnowledgeScopeLevel = 'user' | 'brand' | 'global'

export type KnowledgeScope = {
  level: KnowledgeScopeLevel
  /** Hashed brand key (see brandScopeKey) for brand scope — no brand PII in stores or logs. */
  brandKey?: string
  /** Stable local user id for user scope. */
  userId?: string
}

export type KnowledgeCondition = {
  sector?: string
  style?: string
  surface?: 'box' | 'label'
}

export type KnowledgeRecommendation =
  | { kind: 'avoid-motif'; tokens: string[] }
  | { kind: 'director-cue'; cue: DirectorCue }
  /** Studio layer: prefer / avoid a reference archetype (closed vocabulary, see studio/referenceDna). */
  | { kind: 'studio-archetype'; archetype: string; prefer: boolean }
  /** Studio layer: prefer / avoid a procedural background family. */
  | { kind: 'studio-background'; background: string; prefer: boolean }

export type KnowledgeState = 'candidate' | 'validated' | 'active' | 'deprecated' | 'rejected'

export type KnowledgeSource = 'user_feedback' | 'outcome' | 'manual'

export type KnowledgeTransition = {
  at: number
  from: KnowledgeState | null
  to: KnowledgeState
  by: string
  version: number
}

export type DesignKnowledgeRule = {
  id: string
  scope: KnowledgeScope
  condition: KnowledgeCondition
  relationship: 'avoids' | 'prefers'
  recommendation: KnowledgeRecommendation
  /** 0–1: consistency × evidence saturation. */
  confidence: number
  sampleCount: number
  source: KnowledgeSource
  /** Knowledge version at the last state change. */
  version: number
  state: KnowledgeState
  createdAt: number
  updatedAt: number
  /** Observation ids backing the rule. */
  evidence: string[]
  history: KnowledgeTransition[]
}

export type KnowledgeVersionEntry = {
  version: number
  at: number
  note: string
  activeRuleIds: string[]
}

type StoreShape = {
  rules: DesignKnowledgeRule[]
  versions: KnowledgeVersionEntry[]
  currentVersion: number
}

const ALLOWED: Record<KnowledgeState, KnowledgeState[]> = {
  candidate: ['validated', 'rejected'],
  validated: ['active', 'rejected', 'candidate'],
  active: ['deprecated'],
  deprecated: ['active', 'rejected'],
  rejected: [],
}

let store: StoreShape = { rules: [], versions: [{ version: 0, at: 0, note: 'baseline', activeRuleIds: [] }], currentVersion: 0 }
let hydrated = false

async function hydrate(): Promise<void> {
  if (hydrated) return
  hydrated = true
  try {
    const stored = (await idbGetMemory(DESIGN_KNOWLEDGE_SCHEMA)) as StoreShape | null
    if (stored && Array.isArray(stored.rules) && Array.isArray(stored.versions)) store = stored
  } catch {
    /* baseline rules stay available */
  }
}

async function persist(): Promise<void> {
  try {
    await idbPutMemory(DESIGN_KNOWLEDGE_SCHEMA, store)
  } catch {
    /* best-effort */
  }
}

export function initDesignKnowledge(): void {
  void hydrate()
}

export function resetDesignKnowledge(): void {
  store = { rules: [], versions: [{ version: 0, at: 0, note: 'baseline', activeRuleIds: [] }], currentVersion: 0 }
  hydrated = true
  void persist()
}

/** Stable, non-reversible brand scope key (FNV-1a over the normalised name). Empty brand → ''. */
export function brandScopeKey(brand: string | undefined): string {
  const raw = (brand ?? '').trim().toLocaleLowerCase('tr')
  if (!raw) return ''
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function recommendationKey(rec: KnowledgeRecommendation): string {
  if (rec.kind === 'avoid-motif') return `avoid-motif:${[...rec.tokens].sort().join(',')}`
  if (rec.kind === 'studio-archetype') return `studio-archetype:${rec.prefer ? 'prefer' : 'avoid'}:${rec.archetype}`
  if (rec.kind === 'studio-background') return `studio-background:${rec.prefer ? 'prefer' : 'avoid'}:${rec.background}`
  return `director-cue:${rec.cue}`
}

/** prefers / avoids relationship implied by a recommendation. */
export function recommendationRelationship(rec: KnowledgeRecommendation): 'avoids' | 'prefers' {
  if (rec.kind === 'avoid-motif') return 'avoids'
  if (rec.kind === 'studio-archetype' || rec.kind === 'studio-background') return rec.prefer ? 'prefers' : 'avoids'
  return 'prefers'
}

export function scopeKey(scope: KnowledgeScope): string {
  if (scope.level === 'brand') return `brand:${scope.brandKey ?? ''}`
  if (scope.level === 'user') return `user:${scope.userId ?? 'local'}`
  return 'global'
}

export function conditionKey(condition: KnowledgeCondition): string {
  return `${condition.sector ?? '*'}|${condition.style ?? '*'}|${condition.surface ?? '*'}`
}

/** Deterministic id — the same pattern always maps to the same rule. */
export function knowledgeRuleId(scope: KnowledgeScope, condition: KnowledgeCondition, rec: KnowledgeRecommendation): string {
  return `${scopeKey(scope)}|${conditionKey(condition)}|${recommendationKey(rec)}`
}

export function knowledgeRules(filter?: { state?: KnowledgeState; level?: KnowledgeScopeLevel }): DesignKnowledgeRule[] {
  return store.rules
    .filter((rule) => (!filter?.state || rule.state === filter.state) && (!filter?.level || rule.scope.level === filter.level))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function knowledgeRule(id: string): DesignKnowledgeRule | undefined {
  return store.rules.find((rule) => rule.id === id)
}

export function activeKnowledge(): DesignKnowledgeRule[] {
  return knowledgeRules({ state: 'active' })
}

export function knowledgeVersion(): number {
  return store.currentVersion
}

export function knowledgeVersions(): KnowledgeVersionEntry[] {
  return [...store.versions]
}

function bumpVersion(note: string): number {
  store.currentVersion += 1
  store.versions.push({
    version: store.currentVersion,
    at: Date.now(),
    note,
    activeRuleIds: store.rules.filter((rule) => rule.state === 'active').map((rule) => rule.id).sort(),
  })
  return store.currentVersion
}

/**
 * Insert or refresh a rule's evidence. Never changes the state of an existing rule:
 * aggregation may strengthen or weaken confidence, but only the gate moves states.
 */
export function upsertKnowledgeRule(input: {
  scope: KnowledgeScope
  condition: KnowledgeCondition
  relationship: 'avoids' | 'prefers'
  recommendation: KnowledgeRecommendation
  confidence: number
  sampleCount: number
  source: KnowledgeSource
  evidence: string[]
}): DesignKnowledgeRule {
  void hydrate()
  const id = knowledgeRuleId(input.scope, input.condition, input.recommendation)
  const at = Date.now()
  const existing = store.rules.find((rule) => rule.id === id)
  if (existing) {
    existing.confidence = Math.round(Math.max(0, Math.min(1, input.confidence)) * 100) / 100
    existing.sampleCount = input.sampleCount
    existing.evidence = [...new Set([...existing.evidence, ...input.evidence])]
    existing.updatedAt = at
    void persist()
    return existing
  }
  const rule: DesignKnowledgeRule = {
    id,
    scope: { ...input.scope },
    condition: { ...input.condition },
    relationship: input.relationship,
    recommendation: input.recommendation,
    confidence: Math.round(Math.max(0, Math.min(1, input.confidence)) * 100) / 100,
    sampleCount: input.sampleCount,
    source: input.source,
    version: store.currentVersion,
    state: 'candidate',
    createdAt: at,
    updatedAt: at,
    evidence: [...new Set(input.evidence)],
    history: [{ at, from: null, to: 'candidate', by: 'aggregation', version: store.currentVersion }],
  }
  store.rules.push(rule)
  void persist()
  return rule
}

/** Guarded state machine. Returns false for illegal transitions. Active-set changes bump the version. */
export function transitionKnowledge(id: string, to: KnowledgeState, by: string): boolean {
  const rule = store.rules.find((row) => row.id === id)
  if (!rule) return false
  if (!ALLOWED[rule.state].includes(to)) return false
  const from = rule.state
  rule.state = to
  rule.updatedAt = Date.now()
  const touchesActive = from === 'active' || to === 'active'
  const version = touchesActive ? bumpVersion(`${id}: ${from} → ${to} (${by})`) : store.currentVersion
  rule.version = version
  rule.history.push({ at: rule.updatedAt, from, to, by, version })
  void persist()
  return true
}

/** Restore the active set of a previous version. Creates a new version entry; history is never rewritten. */
export function rollbackKnowledge(toVersion: number, by = 'rollback'): boolean {
  const snapshot = store.versions.find((entry) => entry.version === toVersion)
  if (!snapshot) return false
  const target = new Set(snapshot.activeRuleIds)
  const at = Date.now()
  for (const rule of store.rules) {
    if (rule.state === 'active' && !target.has(rule.id)) {
      rule.state = 'deprecated'
      rule.updatedAt = at
      rule.history.push({ at, from: 'active', to: 'deprecated', by, version: store.currentVersion + 1 })
    } else if (rule.state !== 'active' && target.has(rule.id) && rule.state !== 'rejected') {
      const from = rule.state
      rule.state = 'active'
      rule.updatedAt = at
      rule.history.push({ at, from, to: 'active', by, version: store.currentVersion + 1 })
    }
  }
  const version = bumpVersion(`rollback → v${toVersion} (${by})`)
  for (const rule of store.rules) if (rule.updatedAt === at) rule.version = version
  void persist()
  return true
}

/** Human-authored rule (e.g. brand guideline). Enters as validated; activation still goes through approve. */
export function addManualKnowledge(input: {
  scope: KnowledgeScope
  condition: KnowledgeCondition
  relationship: 'avoids' | 'prefers'
  recommendation: KnowledgeRecommendation
  by: string
}): DesignKnowledgeRule {
  const rule = upsertKnowledgeRule({ ...input, confidence: 1, sampleCount: 1, source: 'manual', evidence: [`manual:${input.by}`] })
  if (rule.state === 'candidate') transitionKnowledge(rule.id, 'validated', input.by)
  return rule
}
