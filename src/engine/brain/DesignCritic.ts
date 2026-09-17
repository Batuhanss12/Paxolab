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
import { STUDIO_FLOOR_TEXT_MM, STUDIO_MIN_TEXT_MM } from '../studio/studioPreflight'
import { studioCriticActions } from '../studio/studioCritic'
import type { Temperament } from '../studio/types'
import type { CritiqueReport } from './CritiqueEngine'
import type { StructuredFeedback } from './DesignDecisionLog'
import type { DesignPlan } from './DesignPlan'
import type { VisualCraftScorecard } from './scoreVisualCraft'

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
  source: 'critiquePlan' | 'compositionCritic' | 'preflight' | 'llm' | 'studioLedger' | 'craftScore'
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

const STUDIO_PREFLIGHT_SKIP = new Set(['collision', 'type-fit', 'text-overflow'])

export type StudioLedgerEvidence = {
  collisions: string[]
  outOfBounds: string[]
  minTextMm: number
  temperament?: Temperament
}

/**
 * Craft dimensions that read the shipped markup, so they speak for both painters.
 * Advisory only: severity never rises to `error` and nothing here gates repair or export.
 */
const CRAFT_TOPICS: { key: keyof VisualCraftScorecard; below: number; map: TopicMap }[] = [
  { key: 'hierarchy', below: 55, map: { category: 'hierarchy', target: 'brand_lockup', severity: 'warn', direction: 'strengthen' } },
  { key: 'composition', below: 55, map: { category: 'composition', target: 'face', severity: 'warn', direction: 'rebalance' } },
  { key: 'typography', below: 55, map: { category: 'typography', target: 'type_scale', severity: 'warn', direction: 'refine' } },
  { key: 'sectorFit', below: 45, map: { category: 'sector_fit', target: 'front_panel', severity: 'warn', direction: 'sector_cue' } },
  { key: 'decoration', below: 45, map: { category: 'density', target: 'decor', severity: 'info', direction: 'adjust' } },
  { key: 'originality', below: 40, map: { category: 'motif', target: 'hero_family', severity: 'info', direction: 'diversify' } },
]

export function critiqueDesign(input: {
  plan: DesignPlan
  critique: CritiqueReport
  preflight: PreflightReport
  search?: CompositionSearchDebug
  /** Present when the studio painter ran — kit lockup/density hints do not apply. */
  studioLedger?: StudioLedgerEvidence
  /** Quality scorecard over the shipped markup. Gives the studio face critic coverage
   *  beyond geometry, without borrowing kit plan vocabulary. */
  craft?: VisualCraftScorecard
}): DesignCritique[] {
  const out: DesignCritique[] = []
  const push = (row: DesignCritique) => {
    if (out.some((c) => c.category === row.category && c.target === row.target && c.evidence.topic === row.evidence.topic)) return
    out.push(row)
  }

  if (!input.studioLedger) {
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
  } else {
    const ledger = input.studioLedger
    const c6 =
      studioCriticActions({
        collisions: ledger.collisions,
        outOfBounds: ledger.outOfBounds,
        temperament: ledger.temperament ?? 'dark-luxe',
      })[0]?.kind ?? 'vary'
    for (const hit of ledger.collisions.slice(0, 6)) {
      push({
        category: 'composition',
        target: 'placement',
        severity: 'error',
        issue: `Stüdyo ledger çarpışma: ${hit}`,
        suggestedDirection: c6,
        evidence: { source: 'studioLedger', topic: 'collision', detail: hit },
      })
    }
    for (const hit of ledger.outOfBounds.slice(0, 6)) {
      push({
        category: 'typography',
        target: 'fit',
        severity: 'error',
        issue: `Stüdyo ledger taşma: ${hit}`,
        suggestedDirection: c6,
        evidence: { source: 'studioLedger', topic: 'text-overflow', detail: hit },
      })
    }
    if (ledger.minTextMm > 0 && ledger.minTextMm < STUDIO_FLOOR_TEXT_MM) {
      push({
        category: 'typography',
        target: 'type_size',
        severity: 'error',
        issue: `En küçük metin ${ledger.minTextMm.toFixed(2)} mm — bası eşiğinin altında.`,
        suggestedDirection: 'preflight',
        evidence: { source: 'studioLedger', topic: 'type-fit', score: ledger.minTextMm },
      })
    } else if (ledger.minTextMm > 0 && ledger.minTextMm < STUDIO_MIN_TEXT_MM) {
      push({
        category: 'typography',
        target: 'type_size',
        severity: 'warn',
        issue: `En küçük metin ${ledger.minTextMm.toFixed(2)} mm — ${STUDIO_MIN_TEXT_MM} mm hedefin altında.`,
        suggestedDirection: 'preflight',
        evidence: { source: 'studioLedger', topic: 'type-fit', score: ledger.minTextMm },
      })
    }
  }

  if (input.craft) {
    const craft = input.craft
    for (const row of CRAFT_TOPICS) {
      const score = craft[row.key]
      if (typeof score !== 'number' || score >= row.below) continue
      push({
        category: row.map.category,
        target: row.map.target,
        severity: row.map.severity,
        issue: `Craft skoru ${row.key} ${Math.round(score)}/100 — ${row.below} eşiğinin altında.`,
        suggestedDirection: row.map.direction,
        evidence: { source: 'craftScore', topic: row.key, score },
      })
    }
  }

  for (const item of input.preflight.items) {
    if (item.status !== 'fail' && item.status !== 'warn') continue
    if (input.studioLedger && STUDIO_PREFLIGHT_SKIP.has(item.id)) continue
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

function feedbackStrength(severity: CritiqueSeverity): StructuredFeedback['strength'] {
  return severity === 'error' ? 'high' : 'medium'
}

/** A finding as StructuredFeedback so the Brain / learning loop treat it like a revision signal.
 *  Studio ledger rows only enter this channel when they map to a C6 button (quieter / vary). */
export function critiqueAsFeedback(critiques: DesignCritique[]): StructuredFeedback[] {
  const rows = critiques.flatMap((c) => {
    if (c.severity === 'info') return []
    if (c.evidence.source === 'studioLedger') {
      if (c.suggestedDirection === 'quieter') {
        return [
          {
            type: 'brand_fit' as const,
            target: 'character',
            direction: 'strengthen',
            strength: feedbackStrength(c.severity),
            raw: `critic:${c.evidence.source}/${c.evidence.topic}`,
          },
        ]
      }
      if (c.suggestedDirection === 'vary') {
        return [
          {
            type: 'composition' as const,
            target: 'layout',
            direction: 'vary',
            strength: feedbackStrength(c.severity),
            raw: `critic:${c.evidence.source}/${c.evidence.topic}`,
          },
        ]
      }
      return []
    }
    return [
      {
        type: c.category,
        target: c.target,
        direction: c.suggestedDirection,
        strength: feedbackStrength(c.severity),
        raw: `critic:${c.evidence.source}/${c.evidence.topic}`,
      },
    ]
  })
  return rows.filter((row, i) => rows.findIndex((other) => other.type === row.type && other.target === row.target && other.direction === row.direction) === i)
}

export function worstSeverity(critiques: DesignCritique[]): CritiqueSeverity | 'none' {
  if (critiques.some((c) => c.severity === 'error')) return 'error'
  if (critiques.some((c) => c.severity === 'warn')) return 'warn'
  if (critiques.length) return 'info'
  return 'none'
}
