import type { DesignSystem } from '../designSystem/types'
import type { DesignPlan } from './DesignPlan'

/** Thin adapter: plan refines the resolved kit. Does not pick a new lockup family. */
export function applyPlanToSystem(system: DesignSystem, plan: DesignPlan): DesignSystem {
  const tighten = plan.decor.restrainExtras
  const vary = plan.variationIndex > 0
  const air = plan.composition.negativeSpace === 'high' ? 1.28 : plan.composition.negativeSpace === 'low' ? 0.92 : 1
  const openCrop = plan.artDirection.crop === 'open'
  return {
    ...system,
    density: plan.decor.density,
    type: {
      ...system.type,
      lockupPadX: tighten || (vary && openCrop) ? system.type.lockupPadX * (tighten ? air : 1.12) : system.type.lockupPadX,
      lockupPadY: tighten || (vary && openCrop) ? system.type.lockupPadY * (tighten ? air : 1.1) : system.type.lockupPadY,
      opticalCenter: tighten || vary ? plan.composition.opticalCenter : system.type.opticalCenter,
      trackingDisplay:
        tighten && plan.typography.trackingIntent === 'wide'
          ? Math.max(system.type.trackingDisplay, 0.7)
          : system.type.trackingDisplay,
    },
    director: {
      restrainDecor: plan.decor.restrainExtras,
      lockupClearance: plan.decor.lockupClearance,
      cue: plan.cue,
    },
  }
}
