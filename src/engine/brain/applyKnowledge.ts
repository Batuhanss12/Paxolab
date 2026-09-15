/**
 * Knowledge → Design Brain hook. Active rules become KNOWLEDGE_DERIVED brief inputs
 * (avoidMotifs union, directorCue when the user gave none). createPlan already consumes
 * both, so no painter or ranking code changes. Empty store → identical brief.
 */
import type { DesignBrief } from '../../types'
import { resolveSector } from '../designSystem/sector'
import { mergeBrief } from '../fields'
import { activeKnowledge, brandScopeKey, knowledgeVersion, type DesignKnowledgeRule } from './DesignKnowledgeStore'

const LEVEL_RANK = { user: 0, brand: 1, global: 2 } as const

export type AppliedKnowledge = {
  brief: DesignBrief
  applied: string[]
  version: number
}

export function matchingKnowledge(brief: DesignBrief, ctx: { userId?: string } = {}): DesignKnowledgeRule[] {
  const brandKey = brandScopeKey(brief.brandName)
  const sector = resolveSector(brief)
  const surface = brief.packagingMode === 'label' ? 'label' : 'box'
  return activeKnowledge()
    .filter((rule) => {
      if (rule.scope.level === 'brand' && (!brandKey || rule.scope.brandKey !== brandKey)) return false
      if (rule.scope.level === 'user' && (rule.scope.userId ?? 'local') !== (ctx.userId ?? 'local')) return false
      if (rule.condition.sector && rule.condition.sector !== sector) return false
      if (rule.condition.style && rule.condition.style !== brief.styleType) return false
      if (rule.condition.surface && rule.condition.surface !== surface) return false
      return true
    })
    .sort((a, b) => LEVEL_RANK[a.scope.level] - LEVEL_RANK[b.scope.level] || b.confidence - a.confidence || a.id.localeCompare(b.id))
}

export function applyKnowledgeToBrief(brief: DesignBrief, ctx: { userId?: string } = {}): AppliedKnowledge {
  const version = knowledgeVersion()
  try {
    const rules = matchingKnowledge(brief, ctx)
    if (!rules.length) return { brief, applied: [], version }
    let next = brief
    const applied: string[] = []
    for (const rule of rules) {
      if (rule.recommendation.kind === 'avoid-motif') {
        const fresh = rule.recommendation.tokens.filter((token) => !(next.avoidMotifs ?? []).includes(token))
        if (!fresh.length) continue
        next = mergeBrief(next, {
          avoidMotifs: fresh,
          provenance: { avoidMotifs: { source: 'KNOWLEDGE_DERIVED', confidence: rule.confidence } },
        })
        applied.push(rule.id)
      } else if (rule.recommendation.kind === 'director-cue') {
        if (next.directorCue) continue
        next = mergeBrief(next, {
          directorCue: rule.recommendation.cue,
          provenance: { directorCue: { source: 'KNOWLEDGE_DERIVED', confidence: rule.confidence } },
        })
        applied.push(rule.id)
      }
    }
    return { brief: next, applied, version }
  } catch {
    return { brief, applied: [], version }
  }
}
