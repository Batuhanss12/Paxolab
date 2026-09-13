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
  // New intents (diagonal, editorial, floating, full-bleed) activate at variation >= 2.
  const baseIntent: DesignPlan['composition']['intent'] =
    input.style === 'modern' ? 'grid' :
    input.style === 'minimal' ? 'symmetric' :
    input.style === 'eco' || input.style === 'playful' ? 'offset' :
    'symmetric'
  let intent: DesignPlan['composition']['intent'] = baseIntent
  if (variation > 0 && (input.style === 'modern' || input.style === 'playful')) intent = 'asymmetric'
  // P2-D: minimal set1 shifts to asymmetric (opticalCenter shift for visible delta).
  if (variation === 1 && input.style === 'minimal') intent = 'asymmetric'
  // Variation >= 2: new composition intents from GraphicLibrary grammar
  if (variation >= 2) {
    if (input.style === 'luxury' || input.style === 'classic') intent = variation % 2 === 0 ? 'diagonal' : 'editorial'
    else if (input.style === 'modern') intent = variation % 2 === 0 ? 'diagonal' : 'editorial'
    else if (input.style === 'eco' || input.style === 'playful') intent = 'full-bleed'
    else if (input.style === 'minimal') intent = 'floating'
  }

  // P2-D: minimal set1 opticalCenter shift ±0.04 for visible lockup delta.
  const opticalCenterShift = input.style === 'minimal' && variation === 1 ? 0.04 : 0

  // Hero horizontal offset: asymmetric/grid push hero off-center; offset nudges for organic.
  // New intents: diagonal pushes hero right, editorial pushes hero top-right,
  // floating lifts hero up, full-bleed keeps hero centered.
  const heroX =
    intent === 'asymmetric' ? 0.62 :
    intent === 'grid' ? 0.5 :
    intent === 'offset' ? 0.32 + (variation % 2) * 0.36 :
    intent === 'diagonal' ? 0.58 :
    intent === 'editorial' ? 0.68 :
    intent === 'floating' ? 0.5 :
    intent === 'full-bleed' ? 0.5 :
    undefined

  // Hero Y: floating lifts hero up, full-bleed keeps it standard
  const heroY =
    intent === 'floating' ? (air ? 0.08 : 0.1) :
    intent === 'editorial' ? (air ? 0.1 : 0.12) :
    air ? 0.12 : 0.148

  return {
    lockup: input.lockup,
    negativeSpace: input.negativeSpace,
    opticalCenter: (input.wrap ? 0.46 : opticalCenter) + opticalCenterShift,
    focal: input.lockup,
    intent,
    heroZone: { y: heroY, h: air ? 0.14 : 0.16, x: heroX },
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
