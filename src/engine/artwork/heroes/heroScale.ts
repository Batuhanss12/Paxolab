import type { DesignPlan, HeroFamily } from '../../brain/DesignPlan'
import type { DecorFamily } from '../../designSystem/types'

/** Plan zone Y on every set. kitY is fallback only when the plan has no zone. */
export function heroYFrac(plan: DesignPlan | undefined, kitY: number): number {
  const y = plan?.composition.heroZone.y
  return typeof y === 'number' ? y : kitY
}

/** Plan scale × crop on every set. Kit painters clamp 0.75–1.15. */
export function heroPaintScale(plan: DesignPlan | undefined, kitScale = 1): number {
  if (!plan) return kitScale
  const raw = kitScale * (plan.heroGraphic.scale ?? 1) * (plan.crop.heroCrop ?? 1)
  return Math.min(1.15, Math.max(0.75, raw))
}

export function kitHeroFamily(decor: DecorFamily): HeroFamily {
  if (decor === 'crest') return 'crest'
  if (decor === 'cartouche') return 'seal'
  if (decor === 'leaf' || decor === 'drop') return 'botanical'
  if (decor === 'badge') return 'emblem'
  if (decor === 'olive' || decor === 'harvest') return 'harvest'
  if (decor === 'oval') return 'oval'
  if (decor === 'grid' || decor === 'plaque') return 'tech'
  return 'none'
}
