/**
 * Hero kit dispatch — maps decor families to hero paint functions.
 * Extracted from frontPanel.ts to isolate the hero rendering decision logic.
 */
import type { Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import { heroPaintScale, heroYFrac, paintBadge, paintCrest, paintDrop, paintHeroGraphic, paintOval, paintSeal, wrapHero } from '../heroGraphics'
import { kitHeroFamily } from '../heroGraphics'

// --- Kit hero painters ---

function perfumeCrest(panel: Panel, p: Palette, dense: boolean, yFrac = 0.148, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * (dense ? 0.082 : 0.062) * scale
  return paintCrest(cx, cy, r, p.accent, dense)
}

function classicCartouche(panel: Panel, p: Palette, yFrac = 0.16, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(8.4, panel.w * 0.16) * scale
  return paintSeal(cx, cy, r, p.accent)
}

function ecoLeaf(panel: Panel, p: Palette, yFrac = 0.17, scale = 1, xFrac = 0.5): string {
  return paintHeroGraphic('botanical', panel, p, scale, yFrac, xFrac)
}

function playfulBadge(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.09 * scale
  return paintBadge(cx, cy, r, p.accent)
}

function creamMotif(panel: Panel, p: Palette, yFrac = 0.18, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(7.2, panel.w * 0.14) * scale
  return paintOval(cx, cy, r, p.accent)
}

function serumMotif(panel: Panel, p: Palette, yFrac = 0.14, scale = 1, xFrac = 0.5): string {
  const cx = panel.x + panel.w * xFrac
  const cy = panel.y + panel.h * yFrac
  const r = Math.min(panel.w, panel.h) * 0.07 * scale
  return paintDrop(cx, cy, r, p.accent)
}

function oliveWreath(panel: Panel, p: Palette, yFrac = 0.165, scale = 1, xFrac = 0.5): string {
  return paintHeroGraphic('harvest', panel, p, scale, yFrac, xFrac)
}

function metalPlaque(panel: Panel, p: Palette, xFrac = 0.5): string {
  const { x, y, w, h } = panel
  const cx = x + w * xFrac
  const pw = w * 0.72
  const px = cx - pw / 2
  const py = y + h * 0.34
  const ph = h * 0.22
  return `
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    <line x1="${px + 1.2}" y1="${py + 1.1}" x2="${px + pw - 1.2}" y2="${py + 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
    <line x1="${px + 1.2}" y1="${py + ph - 1.1}" x2="${px + pw - 1.2}" y2="${py + ph - 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
  `
}

function techSlab(panel: Panel, p: Palette, _dense: boolean): string {
  const { x, y, h } = panel
  return `<rect x="${x}" y="${y}" width="2.4" height="${h}" fill="${p.accent}" />`
}

// --- Kit dispatch ---

/** Render the kit hero markup for a given decor family. */
export function kitHeroMarkup(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const { decor, style } = system
  // P2-A: minimal heroes are micro — scale down 0.5× to stay as quiet signal.
  const scale = heroPaintScale(plan) * (style === 'minimal' ? 0.5 : 1)
  const xFrac = plan?.composition.heroZone.x ?? 0.5
  if (decor === 'crest') return perfumeCrest(panel, p, true, heroYFrac(plan, 0.148), scale, xFrac)
  if (decor === 'cartouche') return classicCartouche(panel, p, heroYFrac(plan, 0.16), scale, xFrac)
  if (decor === 'leaf') return ecoLeaf(panel, p, heroYFrac(plan, 0.17), scale, xFrac)
  if (decor === 'badge') return playfulBadge(panel, p, heroYFrac(plan, 0.18), scale, xFrac)
  if (decor === 'olive' || decor === 'harvest') return oliveWreath(panel, p, heroYFrac(plan, 0.165), scale, xFrac)
  if (decor === 'drop') return serumMotif(panel, p, heroYFrac(plan, 0.14), scale, xFrac)
  if (decor === 'oval') return creamMotif(panel, p, heroYFrac(plan, 0.18), scale, xFrac)
  if (decor === 'grid' && style === 'luxury') return metalPlaque(panel, p, xFrac)
  if (decor === 'grid') return techSlab(panel, p, system.density !== 'sparse')
  return ''
}

/** Render the plan hero — library hero if family differs from kit, otherwise kit hero. */
export function paintPlanHero(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan): string {
  const kitFamily = kitHeroFamily(system.decor)
  const family = plan?.heroGraphic.family ?? kitFamily
  const label = system.grammar === 'label'
  const libY = label ? Math.min(0.12, plan?.composition.heroZone.y ?? 0.11) : (plan?.composition.heroZone.y ?? 0.148)
  // P2-A: minimal heroes are micro — scale down 0.5× to stay as quiet signal, not full botanical.
  const minimalHeroScale = system.style === 'minimal' ? 0.5 : 1
  const libScale = ((plan?.heroGraphic.scale ?? 1) * (plan?.crop.heroCrop ?? 1)) * (label ? 0.82 : 1) * minimalHeroScale
  const libX = plan?.composition.heroZone.x ?? 0.5
  if (family !== 'none' && family !== kitFamily) {
    return wrapHero(family, paintHeroGraphic(family, panel, p, libScale, libY, libX))
  }
  const kit = kitHeroMarkup(panel, system, p, plan)
  if (kit) return wrapHero(kitFamily === 'none' ? family : kitFamily, kit)
  if (family !== 'none') return wrapHero(family, paintHeroGraphic(family, panel, p, libScale, libY, libX))
  return ''
}
