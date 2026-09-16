/**
 * Learning UI copy + snapshot. Does not paint, score, or auto-activate.
 * Empty store = baseline. Global rules stay pending until a human approves.
 */
import type { DirectorCue } from './DesignPlan'
import {
  activeKnowledge,
  knowledgeRule,
  knowledgeRules,
  knowledgeVersion,
  knowledgeVersions,
  type DesignKnowledgeRule,
  type KnowledgeCondition,
  type KnowledgeRecommendation,
  type KnowledgeScope,
  type KnowledgeVersionEntry,
} from './DesignKnowledgeStore'
import { LEARNING_THRESHOLDS, listObservations } from './LearningEngine'

const CUE_TR: Record<DirectorCue, string> = {
  none: 'yön yok',
  'luxury-arrive': 'lüks giriş',
  'luxury-tighten': 'lüks sıkılaştır',
  'open-air': 'açık hava',
  'warm-natural': 'sıcak doğal',
  'graphic-push': 'grafik itiş',
  'force-overload': 'yoğun yük',
}

function pretty(token: string): string {
  return token.replace(/-/g, ' ')
}

export function describeRecommendation(rec: KnowledgeRecommendation): string {
  if (rec.kind === 'avoid-motif') return `${rec.tokens.map(pretty).join(', ')} motifinden kaçın`
  if (rec.kind === 'director-cue') return `${CUE_TR[rec.cue] ?? rec.cue} yönü`
  const verb = rec.prefer ? 'tercih' : 'kaçın'
  if (rec.kind === 'studio-archetype') return `${pretty(rec.archetype)} arketipi ${verb}`
  return `${pretty(rec.background)} dokusu ${verb}`
}

/** Studio painter consumes only archetype/background hints. Kit motif/cue recs do not paint P1. */
export function paintsStudioFace(rec: KnowledgeRecommendation): boolean {
  return rec.kind === 'studio-archetype' || rec.kind === 'studio-background'
}

export function describeCondition(condition: KnowledgeCondition): string {
  const surface = condition.surface === 'label' ? 'etiket' : condition.surface === 'box' ? 'kutu' : undefined
  const bits = [condition.sector, condition.style, surface].filter(Boolean)
  return bits.length ? bits.join(' · ') : 'tüm işler'
}

export function describeScope(scope: KnowledgeScope): string {
  if (scope.level === 'user') return 'sen'
  if (scope.level === 'brand') return 'bu marka'
  return 'global'
}

export function describeKnowledgeRule(rule: DesignKnowledgeRule): string {
  const core = `${describeScope(rule.scope)}: ${describeCondition(rule.condition)} — ${describeRecommendation(rule.recommendation)}`
  return paintsStudioFace(rule.recommendation) ? core : `${core} (kit; stüdyo yüzünü boyamaz)`
}

/** Spoken process note: "Öğrendim: kahvede marble frame arketipi tercih." */
export function learnedPreferenceLine(ids: string[] | undefined, opts: { studio?: boolean } = {}): string {
  if (!ids?.length) return ''
  const phrases = ids
    .map((id) => knowledgeRule(id))
    .filter((rule): rule is DesignKnowledgeRule => Boolean(rule))
    .filter((rule) => !opts.studio || paintsStudioFace(rule.recommendation))
    .map((rule) => {
      const rec = describeRecommendation(rule.recommendation)
      return rule.condition.sector ? `${rule.condition.sector}de ${rec}` : rec
    })
  if (!phrases.length) return ''
  return `Öğrendim: ${phrases.slice(0, 2).join('; ')}.`
}

export type LearningSnapshot = {
  version: number
  observations: number
  candidates: DesignKnowledgeRule[]
  pendingHuman: DesignKnowledgeRule[]
  pendingAuto: DesignKnowledgeRule[]
  active: DesignKnowledgeRule[]
  history: KnowledgeVersionEntry[]
  empty: boolean
}

export function learningSnapshot(): LearningSnapshot {
  const candidates = knowledgeRules({ state: 'candidate' })
  const validated = knowledgeRules({ state: 'validated' })
  const pendingHuman = validated.filter((rule) => !LEARNING_THRESHOLDS.autoApprove[rule.scope.level])
  const pendingAuto = validated.filter((rule) => LEARNING_THRESHOLDS.autoApprove[rule.scope.level])
  const active = activeKnowledge()
  return {
    version: knowledgeVersion(),
    observations: listObservations().length,
    candidates,
    pendingHuman,
    pendingAuto,
    active,
    history: knowledgeVersions(),
    empty: !candidates.length && !validated.length && !active.length,
  }
}
