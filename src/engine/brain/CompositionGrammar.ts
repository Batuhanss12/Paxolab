import type { PackagingMode, StyleType } from '../../types'
import type { NegativeSpace } from './DesignPlan'
import type { DesignPlan } from './DesignPlan'

export type GrammarInput = {
  style: StyleType
  surface: PackagingMode
  lockup: 'center' | 'left'
  negativeSpace: NegativeSpace
  wrap?: boolean
}

/** Zones only. Painters already clip to the panel polygon. */
export function composeGrammar(input: GrammarInput): DesignPlan['composition'] {
  const label = input.surface === 'label'
  const air = input.negativeSpace === 'high'
  const opticalCenter = air ? 0.38 : input.negativeSpace === 'low' ? 0.42 : 0.4
  return {
    lockup: input.lockup,
    negativeSpace: input.negativeSpace,
    opticalCenter: input.wrap ? 0.46 : opticalCenter,
    focal: input.lockup,
    heroZone: { y: air ? 0.1 : 0.08, h: air ? 0.14 : 0.18 },
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
