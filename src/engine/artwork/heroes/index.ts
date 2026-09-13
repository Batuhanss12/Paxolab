/**
 * Hero registry — modular dispatch.
 * Each hero family lives in its own module. This file wires them together.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignPlan, HeroFamily } from '../../brain/DesignPlan'
import type { DecorFamily } from '../../designSystem/types'
import { paintCrest } from './crestMark'
import { paintSeal } from './sealMark'
import { paintOval } from './ovalMark'
import { paintBadge } from './badgeMark'
import { paintBotanical } from './botanicalMark'
import { paintHarvest } from './harvestMark'
import { paintTech } from './techMark'
import { paintMonstera } from './monsteraMark'
import { paintPalm } from './palmMark'

export { paintCrest } from './crestMark'
export { paintSeal } from './sealMark'
export { paintOval } from './ovalMark'
export { paintBadge } from './badgeMark'
export { paintDrop } from './dropMark'
export { paintBotanical } from './botanicalMark'
export { paintHarvest } from './harvestMark'
export { paintTech } from './techMark'
export { paintMonstera } from './monsteraMark'
export { paintPalm } from './palmMark'

/** Set 0 keeps kit Y. Variation / library heroes consume the plan zone + crop. */
export function heroYFrac(plan: DesignPlan | undefined, kitY: number): number {
  if (!plan || (plan.variationIndex ?? 0) <= 0) return kitY
  return plan.composition.heroZone.y ?? kitY
}

export function heroPaintScale(plan: DesignPlan | undefined, kitScale = 1): number {
  if (!plan) return kitScale
  const crop = plan.crop.heroCrop ?? 1
  const graphic = plan.heroGraphic.scale ?? 1
  if ((plan.variationIndex ?? 0) <= 0) return kitScale
  return kitScale * graphic * crop
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

function origin(panel: Panel, scale: number, yFrac = 0.148, xFrac = 0.5): { cx: number; cy: number; r: number } {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.095 * scale
  return { cx, cy, r }
}

/** Library heroes only. Crest / oval / harvest kit paths stay in composeArtwork. */
export function paintHeroGraphic(family: HeroFamily, panel: Panel, p: Palette, scale = 1, yFrac = 0.148, xFrac = 0.5): string {
  const { cx, cy, r } = origin(panel, scale, yFrac, xFrac)
  if (family === 'crest') return paintCrest(cx, cy, r, p.accent, false)
  if (family === 'seal') return paintSeal(cx, cy, r, p.accent)
  if (family === 'botanical') return paintBotanical(cx, cy, r, p.accent)
  if (family === 'emblem') return paintBadge(cx, cy, r, p.accent)
  if (family === 'harvest') return paintHarvest(cx, cy, r, p.accent)
  if (family === 'tech') return paintTech(cx, cy, r, p.accent)
  if (family === 'oval') return paintOval(cx, cy, r, p.accent)
  if (family === 'monstera') return paintMonstera(cx, cy, r, p.accent)
  if (family === 'palm') return paintPalm(cx, cy, r, p.accent)
  if (family === 'organic-wave') return paintOval(cx, cy, r, p.accent)
  if (family === 'zebra') return paintBadge(cx, cy, r, p.accent)
  return ''
}

export function wrapHero(family: HeroFamily, markup: string): string {
  if (!markup) return ''
  return `<g data-art="hero" data-hero="${family}">${markup}</g>`
}
