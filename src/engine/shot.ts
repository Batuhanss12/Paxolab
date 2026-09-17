/**
 * A "shot": the unit a credit buys.
 *
 * One credit does not buy one image, it buys one *decision* rendered several ways. A customer who
 * is charged per click stops exploring, and nobody gets a packaging brief right on the first frame
 * — so browsing the variations of something already paid for has to be free, and only a genuinely
 * new decision costs.
 *
 * The shot key is the fingerprint of that decision: every brief field the design is derived from,
 * with `directionVariation` deliberately left out. Change the brief, the mood or the direction and
 * the key moves, which the client reads as "this is new, reserve again". Step through variations
 * and the key holds, so the same reservation is reused and nothing further is charged.
 *
 * The client only *proposes* this; `SHOT_VARIATIONS` in `server/credits.ts` is what enforces the
 * allowance, because the balance lives there and this file does not.
 */
import type { DesignBrief } from '../types'

/**
 * Brief fields the design is derived from.
 *
 * Listed explicitly rather than spread-and-delete: a field added to `DesignBrief` later should not
 * silently start or stop costing money because of how an object was copied. Anything absent here is
 * a field that does not change the design — provenance, bookkeeping, the variation step itself.
 */
const PRICED_FIELDS = [
  'brandName',
  'productName',
  'sector',
  'subProduct',
  'packagingMode',
  'templateId',
  'styleType',
  'colors',
  'story',
  'volume',
  'barcode',
  'bottleShape',
  'studioFamily',
  'studioTemperament',
  'directorCue',
] as const satisfies readonly (keyof DesignBrief)[]

export function shotKeyOf(brief: DesignBrief): string {
  const parts = PRICED_FIELDS.map((key) => {
    const value = brief[key]
    return `${key}=${value == null ? '' : String(value)}`
  })
  const dims = brief.dimensionsMm
  parts.push(`dims=${dims ? `${dims.L}x${dims.W}x${dims.H}` : ''}`)
  // A vetoed family changes what the engine may pick, so it is part of the decision.
  parts.push(`avoid=${(brief.avoidStudioFamilies ?? []).slice().sort().join(',')}`)
  parts.push(`motifs=${(brief.avoidMotifs ?? []).slice().sort().join(',')}`)
  return parts.join('|')
}
