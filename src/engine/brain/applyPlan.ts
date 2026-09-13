import type { DesignSystem } from '../designSystem/types'
import type { DesignPlan } from './DesignPlan'
import { studioRecipe } from './VariationRecipes'

/** Thin adapter: plan refines the resolved kit. Does not pick a new lockup family. */
export function applyPlanToSystem(system: DesignSystem, plan: DesignPlan): DesignSystem {
  const tighten = plan.decor.restrainExtras
  const vary = plan.variationIndex > 0
  const air = plan.composition.negativeSpace === 'high' ? 1.28 : plan.composition.negativeSpace === 'low' ? 0.92 : 1
  const openCrop = plan.artDirection.crop === 'open'
  const recipe = studioRecipe(plan.variationIndex)
  const typeScale = recipe?.typeScale ?? 1
  const trackingScale = recipe?.trackingScale ?? 1
  return {
    ...system,
    density: plan.decor.density,
    align: system.wrapSeam ? 'left' : plan.composition.lockup,
    type: {
      ...system.type,
      brandMm: system.type.brandMm * typeScale,
      productMm: system.type.productMm * typeScale,
      displayMm: system.type.displayMm * typeScale,
      lockupPadX: tighten || (vary && openCrop) ? system.type.lockupPadX * (tighten ? air : 1.12) : system.type.lockupPadX,
      lockupPadY: tighten || (vary && openCrop) ? system.type.lockupPadY * (tighten ? air : 1.1) : system.type.lockupPadY,
      opticalCenter:
        tighten || vary || (plan.style === 'luxury' && plan.surface !== 'label')
          ? plan.composition.opticalCenter
          : system.type.opticalCenter,
      trackingDisplay:
        (tighten && plan.typography.trackingIntent === 'wide'
          ? Math.max(system.type.trackingDisplay, 0.7)
          : system.type.trackingDisplay) * trackingScale,
      trackingProduct: system.type.trackingProduct * trackingScale,
    },
    director: {
      restrainDecor: plan.decor.restrainExtras,
      lockupClearance: plan.decor.lockupClearance,
      cue: plan.cue,
    },
  }
}
