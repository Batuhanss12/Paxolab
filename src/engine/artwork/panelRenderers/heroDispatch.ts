/**
 * Hero kit dispatch — maps decor families to hero paint functions.
 * Extracted from frontPanel.ts to isolate the hero rendering decision logic.
 */
import type { DesignOverrides, Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import type { LockupCopy } from '../../designSystem/lockupLayout'
import {
  kitHeroFamily,
  paintBadge,
  paintCrest,
  paintDrop,
  paintHeroGraphic,
  paintOval,
  paintSeal,
  wrapHero,
} from '../heroGraphics'
import { resolveHeroPlacement, type HeroPlacement } from '../heroes/heroPlacement'

export type HeroPaintCtx = {
  copy?: LockupCopy
  overrides?: Pick<DesignOverrides, 'titleScale'>
  ingredientClaims?: string
}

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

function metalPlaque(panel: Panel, p: Palette, xFrac = 0.5, yFrac = 0.148, scale = 1): string {
  const { x, y, w, h } = panel
  const cx = x + w * xFrac
  const pw = w * 0.72 * Math.min(1, scale)
  const ph = h * 0.22 * Math.min(1, scale)
  const px = cx - pw / 2
  const py = y + h * yFrac - ph / 2
  return `
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${p.accent}" stroke-width="0.28" />
    <line x1="${px + 1.2}" y1="${py + 1.1}" x2="${px + pw - 1.2}" y2="${py + 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
    <line x1="${px + 1.2}" y1="${py + ph - 1.1}" x2="${px + pw - 1.2}" y2="${py + ph - 1.1}" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="0.12" />
  `
}

function techSlab(panel: Panel, p: Palette, xFrac = 0.5, yFrac = 0.148, kind?: HeroPlacement['kind']): string {
  const { x, y, w, h } = panel
  const side = kind ?? (xFrac < 0.4 ? 'slab-left' : xFrac > 0.6 ? 'slab-right' : 'slab-top')
  if (side === 'slab-right') return `<rect x="${x + w - 2.4}" y="${y}" width="2.4" height="${h}" fill="${p.accent}" />`
  if (side === 'slab-top') return `<rect x="${x}" y="${y + h * yFrac}" width="${w}" height="2" fill="${p.accent}" />`
  return `<rect x="${x}" y="${y}" width="2.4" height="${h}" fill="${p.accent}" />`
}

/** Render the kit hero markup for a given decor family. */
export function kitHeroMarkup(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan, place?: HeroPlacement): string {
  const { decor, style } = system
  const scale = place?.scale ?? 1
  const xFrac = place?.xFrac ?? 0.5
  const y = (kitY: number) => place?.yFrac ?? kitY
  if (decor === 'crest') return perfumeCrest(panel, p, true, y(0.148), scale, xFrac)
  if (decor === 'cartouche') return classicCartouche(panel, p, y(0.16), scale, xFrac)
  if (decor === 'leaf') return ecoLeaf(panel, p, y(0.17), scale, xFrac)
  if (decor === 'badge') return playfulBadge(panel, p, y(0.18), scale, xFrac)
  if (decor === 'olive' || decor === 'harvest') return oliveWreath(panel, p, y(0.165), scale, xFrac)
  if (decor === 'drop') return serumMotif(panel, p, y(0.14), scale, xFrac)
  if (decor === 'oval') return creamMotif(panel, p, y(0.18), scale, xFrac)
  if (decor === 'grid' && style === 'luxury') return metalPlaque(panel, p, xFrac, y(0.148), scale)
  if (decor === 'grid') return techSlab(panel, p, xFrac, y(0.148), place?.kind)
  return ''
}

/** Render the plan hero — library hero if family differs from kit, otherwise kit hero. */
export function paintPlanHero(panel: Panel, system: DesignSystem, p: Palette, plan?: DesignPlan, ctx?: HeroPaintCtx): string {
  const kitFamily = kitHeroFamily(system.decor)
  const family = plan?.heroGraphic.family ?? kitFamily
  const useLib = family !== 'none' && family !== kitFamily
  const mode = useLib || kitFamily === 'none' ? 'lib' : 'kit'
  const place = resolveHeroPlacement({
    panel,
    system,
    plan,
    family: family === 'none' ? kitFamily : family,
    mode,
    copy: ctx?.copy,
    overrides: ctx?.overrides,
    ingredientClaims: ctx?.ingredientClaims,
  })
  if (place.omitted) {
    if (plan && place.reason === 'hero-omitted-lockup' && !plan.risks.includes('hero-omitted-lockup')) {
      plan.risks.push('hero-omitted-lockup')
    }
    return ''
  }

  if (useLib) {
    return wrapHero(family, paintHeroGraphic(family, panel, p, place.scale, place.yFrac, place.xFrac), place)
  }
  const kit = kitHeroMarkup(panel, system, p, plan, place)
  if (kit) return wrapHero(kitFamily === 'none' ? family : kitFamily, kit, place)
  if (family !== 'none') {
    return wrapHero(family, paintHeroGraphic(family, panel, p, place.scale, place.yFrac, place.xFrac), place)
  }
  return ''
}
