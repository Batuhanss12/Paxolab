import type { DesignSystem } from '../designSystem/types'
import type { DesignPlan } from './DesignPlan'

/** Thin adapter: plan refines the resolved kit. Does not pick a new lockup family. */
export function applyPlanToSystem(system: DesignSystem, plan: DesignPlan): DesignSystem {
  const tighten = plan.decor.restrainExtras
  const air = plan.composition.negativeSpace === 'high' ? 1.28 : plan.composition.negativeSpace === 'low' ? 0.92 : 1
  return {
    ...system,
    density: plan.decor.density,
    type: {
      ...system.type,
      lockupPadX: tighten ? system.type.lockupPadX * air : system.type.lockupPadX,
      lockupPadY: tighten ? system.type.lockupPadY * air : system.type.lockupPadY,
      opticalCenter: tighten ? plan.composition.opticalCenter : system.type.opticalCenter,
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
