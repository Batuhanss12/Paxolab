/**
 * Design Critic — structured findings over the deterministic critics.
 *
 * Sources of evidence (nothing is invented):
 *   - critiquePlan hints (CritiqueEngine MODIFY topics)
 *   - composition search issues of the winning overlay candidate
 *   - preflight fail / warn items
 *
 * The critic never edits SVG. It talks to the Design Brain through StructuredFeedback
 * (`critiqueAsFeedback`) so a finding travels the same channel as a user revision.
 */
import type { PreflightReport } from '../../types'
import type { CompositionSearchDebug } from '../artwork/compositionCandidates'
import type { CritiqueReport } from './CritiqueEngine'
import type { StructuredFeedback } from './DesignDecisionLog'
import type { DesignPlan } from './DesignPlan'

export type CritiqueCategory =
  | 'hierarchy'
  | 'composition'
  | 'density'
  | 'whitespace'
  | 'visual_language'
  | 'concept'
  | 'motif'
  | 'sector_fit'
  | 'brand_fit'
  | 'typography'
  | 'color'
  | 'technical'

export type CritiqueSeverity = 'info' | 'warn' | 'error'

export type CritiqueEvidence = {
  source: 'critiquePlan' | 'compositionCritic' | 'preflight' | 'llm'
  topic: string
  score?: number
  detail?: string
}

export type DesignCritique = {
  category: CritiqueCategory
  target: string
  severity: CritiqueSeverity
  issue: string
  suggestedDirection: string
  evidence: CritiqueEvidence
}

type TopicMap = { category: CritiqueCategory; target: string; direction: string; severity: CritiqueSeverity }

/** Existing CritiqueEngine topics only. New topics fall back to `composition/plan`. */
const PLAN_TOPICS: Record<string, TopicMap> = {
  crossSectorBleed: { category: 'sector_fit', target: 'hero', severity: 'error', direction: 'swap_family' },
  density: { category: 'density', target: 'decor', severity: 'warn', direction: 'decrease' },
  densityFront: { category: 'density', target: 'front_panel', severity: 'warn', direction: 'decrease' },
  honesty: { category: 'technical', target: 'legal_marks', severity: 'warn', direction: 'fix' },
  lockupClearance: { category: 'hierarchy', target: 'brand_lockup', severity: 'error', direction: 'clear_window' },
  hierarchyStrength: { category: 'hierarchy', target: 'brand_lockup', severity: 'warn', direction: 'strengthen' },
  sectorBlind: { category: 'sector_fit', target: 'front_panel', severity: 'warn', direction: 'sector_cue' },
  repetitionPenalty: { category: 'motif', target: 'hero_family', severity: 'info', direction: 'diversify' },
  sideIntentionality: { category: 'composition', target: 'side_panel', severity: 'info', direction: 'intentional_pattern' },
  styleLeakage: { category: 'visual_language', target: 'pattern', severity: 'warn', direction: 'keep_dialect' },
}

/** Composition critic issue topics (compositionCritic.ts) → finding. */
const COMPOSITION_TOPICS: Record<string, TopicMap> = {
  lockupOverlap: { category: 'hierarchy', target: 'brand_lockup', severity: 'error', direction: 'move_motifs_away' },
  hierarchy: { category: 'hierarchy', target: 'brand_lockup', severity: 'warn', direction: 'strengthen' },
  balance: { category: 'composition', target: 'placement', severity: 'warn', direction: 'rebalance' },
  density: { category: 'density', target: 'motif_count', severity: 'warn', direction: 'decrease' },
  crowding: { category: 'whitespace', target: 'air', severity: 'warn', direction: 'increase' },
  whitespace: { category: 'whitespace', target: 'air', severity: 'info', direction: 'increase' },
  repetition: { category: 'motif', target: 'lexicon', severity: 'info', direction: 'diversify' },
  language: { category: 'visual_language', target: 'dialect', severity: 'warn', direction: 'keep_dialect' },
  role: { category: 'motif', target: 'slot_role', severity: 'info', direction: 'match_role' },
}

function topicMap(table: Record<string, TopicMap>, topic: string): TopicMap {
  if (table[topic]) return table[topic]
  const key = Object.keys(table).find((k) => topic.toLowerCase().includes(k.toLowerCase()))
  return key ? table[key] : { category: 'composition', target: 'plan', severity: 'info', direction: 'review' }
}

export function critiqueDesign(input: {
  plan: DesignPlan
  critique: CritiqueReport
  preflight: PreflightReport
  search?: CompositionSearchDebug
}): DesignCritique[] {
  const out: DesignCritique[] = []
  const push = (row: DesignCritique) => {
    if (out.some((c) => c.category === row.category && c.target === row.target && c.evidence.topic === row.evidence.topic)) return
    out.push(row)
  }

  for (const hint of input.critique.hints) {
    if (hint.action !== 'MODIFY') continue
    const map = topicMap(PLAN_TOPICS, hint.topic)
    push({
      category: map.category,
      target: map.target,
      severity: map.severity,
      issue: hint.note,
      suggestedDirection: map.direction,
      evidence: { source: 'critiquePlan', topic: hint.topic, detail: hint.principle },
    })
  }

  const winner = input.search?.candidates.find((c) => c.decision === 'WINNER')
  if (winner) {
    for (const topic of winner.issues) {
      const map = topicMap(COMPOSITION_TOPICS, topic)
      push({
        category: map.category,
        target: map.target,
        severity: winner.critic === 'REJECT' ? 'error' : map.severity,
        issue: `Kompozisyon kritiği: ${topic} (${winner.strategy}).`,
        suggestedDirection: map.direction,
        evidence: { source: 'compositionCritic', topic, score: winner.total, detail: winner.strategy },
      })
    }
  }

  for (const item of input.preflight.items) {
    if (item.status !== 'fail' && item.status !== 'warn') continue
    push({
      category: 'technical',
      target: item.id,
      severity: item.status === 'fail' ? 'error' : 'warn',
      issue: `${item.label}: ${item.detail}`.trim(),
      suggestedDirection: 'fix',
      evidence: { source: 'preflight', topic: item.id, detail: item.status },
    })
  }

  return out
}

/** A finding as StructuredFeedback so the Brain / learning loop treat it like a revision signal. */
export function critiqueAsFeedback(critiques: DesignCritique[]): StructuredFeedback[] {
  return critiques
    .filter((c) => c.severity !== 'info')
    .map((c) => ({
      type: c.category,
      target: c.target,
      direction: c.suggestedDirection,
      strength: c.severity === 'error' ? 'high' : 'medium',
      raw: `critic:${c.evidence.source}/${c.evidence.topic}`,
    }))
}

export function worstSeverity(critiques: DesignCritique[]): CritiqueSeverity | 'none' {
  if (critiques.some((c) => c.severity === 'error')) return 'error'
  if (critiques.some((c) => c.severity === 'warn')) return 'warn'
  if (critiques.length) return 'info'
  return 'none'
}
