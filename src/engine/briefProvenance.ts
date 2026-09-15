/**
 * Brief provenance — source + confidence per field, and KNOWN / INFERRED / UNKNOWN
 * classification for intelligent questioning. Pure functions; no LLM, no painting.
 */
import type { AwaitingKey, DesignBrief, FieldProvenance, FieldSource } from '../types'

const SOURCE_RANK: Record<FieldSource, number> = {
  USER_EXPLICIT: 5,
  HEURISTIC_INFERRED: 4,
  LLM_INFERRED: 3,
  KNOWLEDGE_DERIVED: 2,
  SYSTEM_DEFAULT: 1,
}

export function sourceRank(source: FieldSource): number {
  return SOURCE_RANK[source]
}

/** True when `incoming` may replace `existing`. Missing provenance keeps legacy overwrite behaviour. */
export function sourceMayOverride(existing: FieldProvenance | undefined, incoming: FieldProvenance | undefined): boolean {
  if (!incoming || !existing) return true
  return sourceRank(incoming.source) >= sourceRank(existing.source)
}

export function confidenceNumber(level: 'high' | 'medium' | 'low' | undefined): number {
  if (level === 'high') return 1
  if (level === 'medium') return 0.75
  if (level === 'low') return 0.5
  return 0.75
}

/** Stamp every value-bearing key of `patch` with the same source. */
export function withProvenance(
  patch: Partial<DesignBrief>,
  source: FieldSource,
  confidence: number | Partial<Record<string, number>> = 1,
): Partial<DesignBrief> {
  const provenance: Partial<Record<string, FieldProvenance>> = { ...(patch.provenance ?? {}) }
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'provenance') continue
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    if (key === 'dimensionsMm' && typeof value === 'object' && !(value as { L: number }).L && !(value as { H: number }).H) continue
    const c = typeof confidence === 'number' ? confidence : confidence[key] ?? 0.75
    provenance[key] = { source, confidence: Math.max(0, Math.min(1, c)) }
  }
  return Object.keys(provenance).length ? { ...patch, provenance } : patch
}

export function provenanceOf(brief: DesignBrief, key: string): FieldProvenance | undefined {
  return brief.provenance?.[key]
}

export type FieldStatus = 'KNOWN' | 'INFERRED' | 'UNKNOWN'
export type FieldNecessity = 'REQUIRED' | 'OPTIONAL'

/** Fields that block a first deterministic design. Mirrors conversationAsk ASK_CRITICAL. */
export const REQUIRED_FIELDS: AwaitingKey[] = ['packagingMode', 'sector', 'brandName', 'dimensionsMm']
export const OPTIONAL_FIELDS: AwaitingKey[] = ['productName', 'styleType', 'colors', 'volume', 'barcode', 'manufacturerName', 'copyLocale']

function hasValue(brief: DesignBrief, key: AwaitingKey): boolean {
  if (key === 'dimensionsMm') return (brief.dimensionsMm.L > 0 && brief.dimensionsMm.H > 0) || !!brief.dimsDefaulted
  if (key === 'templateId') return !!brief.templateId
  const value = (brief as Record<string, unknown>)[key]
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return !!value
}

export function fieldStatus(brief: DesignBrief, key: AwaitingKey): FieldStatus {
  if (!hasValue(brief, key)) return 'UNKNOWN'
  const source = provenanceOf(brief, key)?.source
  if (!source || source === 'USER_EXPLICIT') return 'KNOWN'
  return 'INFERRED'
}

export function fieldNecessity(key: AwaitingKey): FieldNecessity {
  return REQUIRED_FIELDS.includes(key) ? 'REQUIRED' : 'OPTIONAL'
}

export type BriefClassification = {
  known: AwaitingKey[]
  inferred: AwaitingKey[]
  unknown: AwaitingKey[]
  /** Required and still unknown — the only questions worth asking before the first design. */
  blocking: AwaitingKey[]
}

export function classifyBriefFields(brief: DesignBrief): BriefClassification {
  const out: BriefClassification = { known: [], inferred: [], unknown: [], blocking: [] }
  for (const key of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    const status = fieldStatus(brief, key)
    if (status === 'KNOWN') out.known.push(key)
    else if (status === 'INFERRED') out.inferred.push(key)
    else {
      out.unknown.push(key)
      if (fieldNecessity(key) === 'REQUIRED') out.blocking.push(key)
    }
  }
  return out
}

/** True when any brief value was produced by the LLM (for model-version bookkeeping). */
export function briefUsedLlm(brief: DesignBrief): boolean {
  return Object.values(brief.provenance ?? {}).some((p) => p?.source === 'LLM_INFERRED')
}
