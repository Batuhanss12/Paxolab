/**
 * Knowledge → studio direction hook. Active studio rules (prefer / avoid archetype or
 * background) become closed-vocabulary DirectionHints. Empty store → no hints.
 */
import type { DesignBrief } from '../../types'
import { isArchetype, isBackground } from '../studio/referenceDna'
import type { DirectionHints } from '../studio/types'
import { matchingKnowledge } from './applyKnowledge'

export type StudioKnowledge = { hints: DirectionHints[]; applied: string[] }

/** A preference needs this much confidence before it pins the archetype (below: only avoids bias). */
const PIN_CONFIDENCE = 0.6

export function studioHintsFromKnowledge(brief: DesignBrief, ctx: { userId?: string } = {}): StudioKnowledge {
  try {
    const rules = matchingKnowledge(brief, ctx)
    const hint: DirectionHints = { source: 'knowledge', avoidArchetypes: [], avoidBackgrounds: [], rationale: [] }
    const applied: string[] = []
    for (const rule of rules) {
      const rec = rule.recommendation
      if (rec.kind === 'studio-archetype' && isArchetype(rec.archetype)) {
        if (rec.prefer) {
          if (!hint.archetype && rule.confidence >= PIN_CONFIDENCE) {
            hint.archetype = rec.archetype
            hint.rationale?.push(`Bilgi tabanı: ${rec.archetype} arketipi bu kapsamda onaylandı (güven ${rule.confidence}).`)
            applied.push(rule.id)
          }
        } else {
          hint.avoidArchetypes?.push(rec.archetype)
          hint.rationale?.push(`Bilgi tabanı: ${rec.archetype} arketipinden kaçınıldı.`)
          applied.push(rule.id)
        }
      } else if (rec.kind === 'studio-background' && isBackground(rec.background)) {
        if (rec.prefer) {
          if (!hint.background && rule.confidence >= PIN_CONFIDENCE) {
            hint.background = rec.background
            applied.push(rule.id)
          }
        } else {
          hint.avoidBackgrounds?.push(rec.background)
          applied.push(rule.id)
        }
      }
    }
    // A pinned archetype that is also avoided → the avoid wins (newer evidence is negative).
    if (hint.archetype && hint.avoidArchetypes?.includes(hint.archetype)) delete hint.archetype
    if (hint.background && hint.avoidBackgrounds?.includes(hint.background)) delete hint.background
    if (!applied.length) return { hints: [], applied: [] }
    return { hints: [hint], applied }
  } catch {
    return { hints: [], applied: [] }
  }
}
