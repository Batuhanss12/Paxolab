/**
 * FAZ 4 — append-only design decision log.
 * Records what/why/score/source/version. Does not paint, does not mutate knowledge.
 * Persist is best-effort IndexedDB; generate must not throw if storage fails.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, FieldSource, PreflightReport } from '../../types'
import { idbGetMemory, idbPutMemory } from '../../storage'
import { assetLanguageFor } from '../artwork/assetLanguage'
import { lastCompositionSearch, type CompositionSearchDebug } from '../artwork/compositionCandidates'
import type { CompositionScore } from '../artwork/compositionStrategy'
import { briefUsedLlm } from '../briefProvenance'
import { kitGradeSkipsOverlay } from '../designSystem/conceptKitAlignment'
import { activeModelConfig, type LlmModelConfig } from '../llm/provider'
import type { CritiqueReport } from './CritiqueEngine'
import { critiqueDesign, type DesignCritique, type StudioLedgerEvidence } from './DesignCritic'
import { brandScopeKey } from './DesignKnowledgeStore'
import type { DesignPlan } from './DesignPlan'
import type { StudioDirectionOffer } from '../studio/types'

export const DESIGN_BRAIN_VERSION = '1.0'
export const VISUAL_LANGUAGE_VERSION = '1.0'
export const ASSET_LANGUAGE_VERSION = '2.0'
export const COMPOSITION_VERSION = '3.0'

const LIMIT = 200
const MEMORY_KEY = 'designDecisionLog.v1'

export type FeedbackType =
  | 'composition'
  | 'visual_language'
  | 'typography'
  | 'color'
  | 'motif'
  | 'hierarchy'
  | 'density'
  | 'whitespace'
  | 'brand_fit'
  | 'sector_fit'
  | 'technical'
  | 'concept'

export type FeedbackStrength = 'low' | 'medium' | 'high'

export type StructuredFeedback = {
  type: FeedbackType
  target: string
  direction: string
  strength: FeedbackStrength
  raw?: string
}

export type CandidateReason = {
  axis: string
  score: number
}

export type LoggedCandidate = {
  id: string
  strategy?: string
  score: number
  decision: 'WINNER' | 'FINALIST' | 'REJECTED' | 'ELIMINATED' | 'ONLY'
  reasons: CandidateReason[]
  critic?: string
}

export type WinnerWhy = {
  sectorCompatibility: number
  visualLanguageFit: number
  assetRoleFit: number
  compositionFit: number
  novelty: number
  selectedLanguage?: string
  selectedConcept?: string
  selectedStrategy?: string
}

export type DesignOutcome = {
  generated: boolean
  regeneratedCount: number
  revisionCount: number
  revisionTypes: string[]
  exported: boolean
  downloaded: boolean
  finalized: boolean
  preflightPass: boolean
  stars?: number
  tags?: string[]
  timeToApprovalMs?: number
  generatedAt: number
  approvedAt?: number
}

export type DesignDecisionLog = {
  designId: string
  at: number
  revision: number
  brainVersion: string
  vlVersion: string
  alVersion: string
  compositionVersion: string
  path: 'overlay' | 'kit' | 'studio'
  brief: {
    sector: string
    subProduct?: string
    style?: string
    surface?: string
    positioning?: string
    /** Hashed brand key (brandScopeKey) — brand-scope learning without brand PII. */
    brandKey?: string
  }
  intent: {
    style: string
    character?: string
    positioning?: string
    density?: string
    cue?: string
  }
  selectedLanguage: string[]
  selectedConcept: { id: string; label?: string; family?: string }
  artDirection: { chrome?: string; vocabulary?: string }
  assetLanguage: { preferredRoles: string[]; avoid: string[]; languages: string[] }
  compositionStrategy?: string
  candidates: LoggedCandidate[]
  winner?: { id: string; score: number; why: WinnerWhy }
  criticHints: { action: string; topic: string }[]
  /** Structured critic findings for this revision. */
  critiques: DesignCritique[]
  preflightPass: boolean
  outcome: DesignOutcome
  feedback: StructuredFeedback[]
  /** Active knowledge version when generated and the rule ids that shaped the brief. */
  knowledgeVersion: number
  appliedKnowledge: string[]
  /** Model configuration in play; null when heuristics answered everything. */
  model: LlmModelConfig | null
  /** Which semantic steps actually used the model for this revision. */
  llmUsed: { briefExtract: boolean; feedback: boolean; critique: boolean; direction?: boolean }
  /** Per-field brief sources — inferred values stay distinguishable from user fact. */
  briefSources: Partial<Record<string, FieldSource>>
  /** Studio direction when the reference-level path painted this revision. */
  studio?: StudioDecision
}

/** Closed-vocabulary studio choices — what the learning engine aggregates on. */
export type StudioDecision = {
  archetype: string
  background: string
  temperament: string
  typePairing: string
  source: 'heuristic' | 'llm' | 'knowledge' | 'user' | 'family'
  collisions: number
  minTextMm: number
}

let logs: DesignDecisionLog[] = []
const sessionOutcomes = new Map<string, DesignOutcome>()
const sessionFeedback = new Map<string, StructuredFeedback[]>()
let hydrated = false

async function hydrate(): Promise<void> {
  if (hydrated) return
  hydrated = true
  const stored = (await idbGetMemory(MEMORY_KEY)) as DesignDecisionLog[] | null
  if (!Array.isArray(stored) || stored.length === 0) return
  logs = stored.slice(-LIMIT)
  for (const entry of logs) {
    sessionOutcomes.set(entry.designId, entry.outcome)
    if (entry.feedback.length) sessionFeedback.set(entry.designId, entry.feedback)
  }
}

async function persist(): Promise<void> {
  await idbPutMemory(MEMORY_KEY, logs.slice(-LIMIT))
}

export function initDecisionLog(): void {
  void hydrate()
}

export function resetDecisionLogs(): void {
  logs = []
  sessionOutcomes.clear()
  sessionFeedback.clear()
  hydrated = true
  void persist()
}

export function lastDecisionLog(): DesignDecisionLog | undefined {
  return logs.at(-1)
}

export function decisionLogFor(designId: string): DesignDecisionLog | undefined {
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].designId === designId) return logs[i]
  }
  return undefined
}

export function decisionLogsFor(designId: string): DesignDecisionLog[] {
  return logs.filter((entry) => entry.designId === designId)
}

export function outcomeOf(designId: string): DesignOutcome | undefined {
  return sessionOutcomes.get(designId)
}

function round01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return Math.round(n * 100) / 100
}

function reasonsFromScore(score: CompositionScore): CandidateReason[] {
  return (Object.entries(score) as [string, number][])
    .filter(([axis]) => axis !== 'total')
    .map(([axis, value]) => ({ axis, score: value }))
}

function revisionTypesOf(input: {
  prev?: DesignSpec | null
  brief: DesignBrief
  overridePatch?: Partial<DesignOverrides>
  copyPatch?: Partial<DesignSpec['copy']>
  feedback?: StructuredFeedback[]
}): string[] {
  if (!input.prev) return []
  const types: string[] = []
  const o = input.overridePatch ?? {}
  if (o.logoScale != null && o.logoScale !== 1) types.push('hierarchy')
  if (o.titleScale != null && o.titleScale !== 1) types.push('typography')
  if (o.paletteShift && o.paletteShift !== 'default') types.push('color')
  if (o.directorCue && o.directorCue !== 'none') types.push('visual_language')
  if (o.printReady) types.push('technical')
  if (o.heroFamily) types.push('motif')
  if (input.brief.styleType && input.prev.brief.styleType !== input.brief.styleType) types.push('visual_language')
  if (input.copyPatch && Object.keys(input.copyPatch).length) types.push('concept')
  for (const item of input.feedback ?? []) types.push(item.type)
  return [...new Set(types)]
}

function bumpOutcome(
  designId: string,
  at: number,
  input: {
    prev?: DesignSpec | null
    brief: DesignBrief
    overridePatch?: Partial<DesignOverrides>
    copyPatch?: Partial<DesignSpec['copy']>
    feedback?: StructuredFeedback[]
    preflight: Pick<PreflightReport, 'blocking' | 'exportOk'>
  },
): DesignOutcome {
  const prev = sessionOutcomes.get(designId)
  const types = revisionTypesOf(input)
  const isRegen = !!input.prev
  const outcome: DesignOutcome = {
    generated: true,
    regeneratedCount: (prev?.regeneratedCount ?? 0) + (isRegen ? 1 : 0),
    revisionCount: (prev?.revisionCount ?? 0) + (types.length ? 1 : 0),
    revisionTypes: [...new Set([...(prev?.revisionTypes ?? []), ...types])],
    exported: prev?.exported ?? false,
    downloaded: prev?.downloaded ?? false,
    finalized: prev?.finalized ?? false,
    preflightPass: !input.preflight.blocking && !!input.preflight.exportOk,
    stars: prev?.stars,
    tags: prev?.tags,
    timeToApprovalMs: prev?.timeToApprovalMs,
    generatedAt: prev?.generatedAt ?? at,
    approvedAt: prev?.approvedAt,
  }
  sessionOutcomes.set(designId, outcome)
  return outcome
}

function mergeFeedback(designId: string, incoming: StructuredFeedback[] | undefined): StructuredFeedback[] {
  const prev = sessionFeedback.get(designId) ?? []
  if (!incoming?.length) return prev
  const next = [...prev, ...incoming]
  sessionFeedback.set(designId, next)
  return next
}

function kitCandidates(plan: DesignPlan, critique: CritiqueReport): LoggedCandidate[] {
  const card = critique.scorecard
  const reasons: CandidateReason[] = [
    { axis: 'hierarchy', score: card.hierarchy },
    { axis: 'densityFront', score: card.densityFront },
    { axis: 'sectorBlind', score: card.sectorBlind },
    { axis: 'lockupClearance', score: card.lockupClearance },
    { axis: 'honesty', score: card.honesty },
  ]
  const score = Math.round(reasons.reduce((sum, row) => sum + row.score, 0) / reasons.length)
  return [
    {
      id: plan.visualConcept.id || 'kit',
      strategy: plan.visualConcept.strategyBias?.[0],
      score,
      decision: 'ONLY',
      reasons,
      critic: critique.verdict,
    },
  ]
}

function overlayCandidates(search: CompositionSearchDebug): LoggedCandidate[] {
  return search.candidates.map((row) => ({
    id: row.strategy,
    strategy: row.strategy,
    score: row.total,
    decision: row.decision,
    reasons: reasonsFromScore(row.scores),
    critic: row.critic,
  }))
}

/** P1 candidate set is the D3 direction offer. Selected = decideDirection / user pin, not a kit ONLY row. */
function studioCandidates(offer: StudioDirectionOffer): LoggedCandidate[] {
  return offer.candidates.map((row) => ({
    id: row.family,
    strategy: `${row.archetype}/${row.background}`,
    score: Math.round(row.score * 100),
    decision: row.selected ? 'WINNER' : 'FINALIST',
    reasons: [{ axis: 'direction', score: Math.round(row.score * 100) }],
    critic: row.selected ? 'decideDirection' : 'offer',
  }))
}

function winnerWhy(
  plan: DesignPlan,
  critique: CritiqueReport,
  path: 'overlay' | 'kit' | 'studio',
  candidates: LoggedCandidate[],
  search?: CompositionSearchDebug,
  studio?: StudioDecision,
): WinnerWhy {
  const winner = candidates.find((row) => row.decision === 'WINNER') ?? candidates.find((row) => row.decision === 'ONLY') ?? candidates[0]
  const composition = winner ? winner.score / 100 : critique.scorecard.hierarchy / 100
  if (path === 'studio') {
    return {
      sectorCompatibility: round01(critique.scorecard.sectorBlind / 100),
      visualLanguageFit: 0,
      assetRoleFit: 0,
      compositionFit: round01(composition),
      novelty: round01(1 - (critique.scorecard.repetitionPenalty ?? 0) / 100),
      selectedLanguage: studio?.archetype,
      selectedConcept: winner?.id,
      selectedStrategy: winner?.strategy ?? studio?.archetype,
    }
  }
  const styleFit =
    search?.concept?.styleConsistency != null ? search.concept.styleConsistency / 100 : plan.visualLanguage.length ? 0.9 : 0.5
  const assetFit = winner?.reasons.find((row) => row.axis === 'assetCompatibility')?.score
  return {
    sectorCompatibility: round01(critique.scorecard.sectorBlind / 100),
    visualLanguageFit: round01(styleFit),
    assetRoleFit: round01(assetFit != null ? assetFit / 100 : path === 'kit' ? 0.5 : 0.7),
    compositionFit: round01(composition),
    novelty: round01(1 - (critique.scorecard.repetitionPenalty ?? 0) / 100),
    selectedLanguage: plan.visualLanguage[0],
    selectedConcept: plan.visualConcept.id,
    selectedStrategy: winner?.strategy ?? plan.visualConcept.strategyBias?.[0],
  }
}

export type CaptureGenerateInput = {
  designId: string
  revision: number
  brief: DesignBrief
  plan: DesignPlan
  critique: CritiqueReport
  preflight: Pick<PreflightReport, 'blocking' | 'exportOk'>
  prev?: DesignSpec | null
  overridePatch?: Partial<DesignOverrides>
  copyPatch?: Partial<DesignSpec['copy']>
  feedback?: StructuredFeedback[]
  search?: CompositionSearchDebug
  /** Full preflight when available — the critic reads fail/warn items. */
  preflightReport?: PreflightReport
  knowledgeVersion?: number
  appliedKnowledge?: string[]
  /** True when the LLM classified this turn's feedback (heuristics otherwise). */
  feedbackFromLlm?: boolean
  /** Studio direction summary when overrides.studio painted this revision. */
  studio?: StudioDecision
  /** D3 offer — logged as the P1 candidate set instead of kit ONLY. */
  studioOffer?: StudioDirectionOffer
  /** Ledger evidence for the studio critic (kit hints are skipped when this is set). */
  studioLedger?: StudioLedgerEvidence
  /** True when the LLM art director proposed the studio direction. */
  directionFromLlm?: boolean
}

function briefSourcesOf(brief: DesignBrief): Partial<Record<string, FieldSource>> {
  const out: Partial<Record<string, FieldSource>> = {}
  for (const [key, row] of Object.entries(brief.provenance ?? {})) if (row) out[key] = row.source
  return out
}

export function captureGenerateDecision(input: CaptureGenerateInput): DesignDecisionLog | undefined {
  try {
    void hydrate()
    const at = Date.now()
    const plan = input.plan
    const skipOverlay = kitGradeSkipsOverlay(plan.style)
    const search = skipOverlay ? undefined : (input.search ?? lastCompositionSearch())
    const overlayPath = search && (search.candidates.length > 0 || search.winner)
    const path: 'overlay' | 'kit' | 'studio' =
      input.studio && input.studioOffer?.candidates.length ? 'studio' : overlayPath ? 'overlay' : 'kit'
    const candidates =
      path === 'studio' && input.studioOffer
        ? studioCandidates(input.studioOffer)
        : path === 'overlay' && search
          ? overlayCandidates(search)
          : kitCandidates(plan, input.critique)
    const winnerRow = candidates.find((row) => row.decision === 'WINNER' || row.decision === 'ONLY') ?? candidates[0]
    const assets = assetLanguageFor(plan)
    const outcome = bumpOutcome(input.designId, at, input)
    const feedback = mergeFeedback(input.designId, input.feedback)
    const preflightReport: PreflightReport =
      input.preflightReport ?? ('items' in input.preflight ? (input.preflight as PreflightReport) : { items: [], ...input.preflight, collisions: false })
    const critiques = critiqueDesign({
      plan,
      critique: input.critique,
      preflight: preflightReport,
      search: path === 'overlay' && !input.studioLedger ? search : undefined,
      studioLedger: input.studioLedger,
    })
    const entry: DesignDecisionLog = {
      designId: input.designId,
      at,
      revision: input.revision,
      brainVersion: DESIGN_BRAIN_VERSION,
      vlVersion: VISUAL_LANGUAGE_VERSION,
      alVersion: ASSET_LANGUAGE_VERSION,
      compositionVersion: COMPOSITION_VERSION,
      path,
      brief: {
        sector: plan.sector,
        subProduct: plan.subProduct,
        style: plan.style,
        surface: plan.surface,
        positioning: plan.positioning,
        brandKey: brandScopeKey(input.brief.brandName) || undefined,
      },
      intent: {
        style: plan.designIntent.style,
        character: plan.designIntent.character,
        positioning: plan.designIntent.positioning,
        density: plan.designIntent.density,
        cue: plan.designIntent.cue,
      },
      selectedLanguage: path === 'studio' && input.studio ? [input.studio.archetype] : plan.visualLanguage,
      selectedConcept:
        path === 'studio' && winnerRow
          ? { id: winnerRow.id, family: winnerRow.id, label: winnerRow.strategy }
          : {
              id: plan.visualConcept.id,
              label: plan.visualConcept.label,
              family: plan.visualConcept.family,
            },
      artDirection: {
        chrome: plan.artDirection.chrome,
        vocabulary: plan.artDirection.vocabulary,
      },
      assetLanguage: {
        preferredRoles: assets.preferred.roles,
        avoid: assets.avoid,
        languages: assets.languages,
      },
      compositionStrategy: winnerRow?.strategy ?? plan.visualConcept.strategyBias?.[0],
      candidates,
      winner: winnerRow
        ? {
            id: winnerRow.id,
            score: winnerRow.score,
            why: winnerWhy(plan, input.critique, path, candidates, search, input.studio),
          }
        : undefined,
      criticHints: input.critique.hints.map((hint) => ({ action: hint.action, topic: hint.topic })),
      critiques,
      preflightPass: outcome.preflightPass,
      outcome,
      feedback,
      knowledgeVersion: input.knowledgeVersion ?? 0,
      appliedKnowledge: [...(input.appliedKnowledge ?? [])],
      model: activeModelConfig(),
      llmUsed: {
        briefExtract: briefUsedLlm(input.brief),
        feedback: !!input.feedbackFromLlm,
        critique: false,
        direction: !!input.directionFromLlm,
      },
      briefSources: briefSourcesOf(input.brief),
      studio: input.studio,
    }
    logs = [...logs, entry].slice(-LIMIT)
    void persist()
    return entry
  } catch {
    return undefined
  }
}

export function patchLatestLog(
  designId: string,
  patch: Partial<Pick<DesignDecisionLog, 'outcome' | 'feedback' | 'critiques' | 'llmUsed'>>,
): void {
  try {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].designId !== designId) continue
      const nextOutcome = patch.outcome ?? logs[i].outcome
      const nextFeedback = patch.feedback ?? logs[i].feedback
      logs[i] = {
        ...logs[i],
        outcome: nextOutcome,
        feedback: nextFeedback,
        critiques: patch.critiques ?? logs[i].critiques,
        llmUsed: patch.llmUsed ?? logs[i].llmUsed,
        preflightPass: nextOutcome.preflightPass,
      }
      sessionOutcomes.set(designId, nextOutcome)
      sessionFeedback.set(designId, nextFeedback)
      void persist()
      return
    }
  } catch {
    /* best-effort */
  }
}
