/**
 * Hero registry — modular dispatch.
 * Each hero family lives in its own module. This file wires them together.
 */
import type { Palette, Panel } from '../../../types'
import type { HeroFamily } from '../../brain/DesignPlan'
import { paintCrest } from './crestMark'
import { paintOval } from './ovalMark'
import { paintBadge } from './badgeMark'
import { paintBotanical } from './botanicalMark'
import { paintHarvest } from './harvestMark'
import { paintTech } from './techMark'
import { paintMonstera } from './monsteraMark'
import { paintPalm } from './palmMark'
import { paintLineScene } from './lineSceneMark'

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
export { paintLineScene } from './lineSceneMark'

export { heroPaintScale, heroYFrac, kitHeroFamily } from './heroScale'

function origin(panel: Panel, scale: number, yFrac = 0.148, xFrac = 0.5): { cx: number; cy: number; r: number } {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.095 * scale
  return { cx, cy, r }
}

/** Library heroes only. Crest / oval / harvest kit paths stay in composeArtwork. */
export function paintHeroGraphic(family: HeroFamily, panel: Panel, p: Palette, scale = 1, yFrac = 0.148, xFrac = 0.5): string {
  const { cx, cy, r } = origin(panel, scale, yFrac, xFrac)
  if (family === 'crest' || family === 'seal') return paintCrest(cx, cy, r, p.accent, false)
  if (family === 'botanical') return paintBotanical(cx, cy, r, p.accent)
  if (family === 'emblem') return paintBadge(cx, cy, r, p.accent)
  if (family === 'harvest') return paintHarvest(cx, cy, r, p.accent)
  if (family === 'tech') return paintTech(cx, cy, r, p.accent)
  if (family === 'oval') return paintOval(cx, cy, r, p.accent)
  if (family === 'monstera') return paintMonstera(cx, cy, r, p.accent)
  if (family === 'palm') return paintPalm(cx, cy, r, p.accent)
  if (family === 'organic-wave') return paintOval(cx, cy, r, p.accent)
  if (family === 'zebra') return paintBadge(cx, cy, r, p.accent)
  if (family === 'line-scene') return paintLineScene(cx, cy, r, p.accent)
  return ''
}

export function wrapHero(family: HeroFamily, markup: string, place?: { xFrac: number; yFrac: number }): string {
  if (!markup) return ''
  const live = family === 'seal' ? 'crest' : family
  const axis = place
    ? ` data-hero-x="${place.xFrac.toFixed(3)}" data-hero-y="${place.yFrac.toFixed(3)}"`
    : ''
  return `<g data-art="hero" data-hero="${live}"${axis}>${markup}</g>`
}
