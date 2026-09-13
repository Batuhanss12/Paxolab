import type { PackagingMode, StyleType } from '../../types'
import type { NegativeSpace } from './DesignPlan'
import type { DesignPlan } from './DesignPlan'

export type GrammarInput = {
  style: StyleType
  surface: PackagingMode
  lockup: 'center' | 'left'
  negativeSpace: NegativeSpace
  wrap?: boolean
  variationIndex?: number
}

/** Zones only. Painters already clip to the panel polygon. */
export function composeGrammar(input: GrammarInput): DesignPlan['composition'] {
  const label = input.surface === 'label'
  const air = input.negativeSpace === 'high'
  const opticalCenter = air ? 0.38 : input.negativeSpace === 'low' ? 0.42 : 0.4
  const variation = input.variationIndex ?? 0

  // Composition intent: modern/tech lean asymmetric or grid; luxury/classic stay symmetric;
  // eco/playful use offset for organic feel. Variation index rotates intent for variety.
  const baseIntent: DesignPlan['composition']['intent'] =
    input.style === 'modern' ? 'grid' :
    input.style === 'minimal' ? 'symmetric' :
    input.style === 'eco' || input.style === 'playful' ? 'offset' :
    'symmetric'
  const intent: DesignPlan['composition']['intent'] =
    variation > 0 && (input.style === 'modern' || input.style === 'playful')
      ? 'asymmetric'
      : baseIntent

  // Hero horizontal offset: asymmetric/grid push hero off-center; offset nudges for organic.
  const heroX =
    intent === 'asymmetric' ? 0.62 :
    intent === 'grid' ? 0.5 :
    intent === 'offset' ? 0.32 + (variation % 2) * 0.36 :
    undefined

  return {
    lockup: input.lockup,
    negativeSpace: input.negativeSpace,
    opticalCenter: input.wrap ? 0.46 : opticalCenter,
    focal: input.lockup,
    intent,
    heroZone: { y: air ? 0.12 : 0.148, h: air ? 0.14 : 0.16, x: heroX },
    lockupBand: { y: opticalCenter - 0.08, h: 0.28 },
    legalZone: label ? 'label-back' : 'back',
    marksZone: label ? 'label-back' : 'back',
  }
}

export function densityCap(style: StyleType, overall: 'sparse' | 'balanced' | 'dense'): number {
  if (style === 'luxury' || style === 'minimal') {
    return overall === 'dense' ? 4 : 2
  }
  if (style === 'playful') return overall === 'sparse' ? 3 : 6
  return overall === 'sparse' ? 2 : overall === 'balanced' ? 4 : 6
}
