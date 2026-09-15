/**
 * Front decor assembly — background decor, hero, pattern, lockup window, primitives.
 * Extracted from frontPanel.ts to isolate decor composition from lockup rendering.
 * GraphicLibrary bridge: when variation >= 1, the library provides pattern/primitive picks.
 * Heroes stay with the motor's paintPlanHero (kit-specific positioning + composition zone aware).
 */
import type { Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import {
  shouldPaintLockupWindow,
  shouldPaintModernGrid,
  shouldPaintSectorFrame,
} from '../../designSystem/conceptKitAlignment'
import { lockupOwnsRule } from './lockupChrome'
import type { DesignSystem } from '../../designSystem/types'
import { paintPrimitives } from '../illustrationPrimitives'
import { lockupWindow, type SafeRect } from '../motifs'
import { paintPatternFamily, wrapPattern } from '../patternFamilies'
import { labelDecor, sectorFrame } from './shared'
import { paintPlanHero, type HeroPaintCtx } from './heroDispatch'
import { bridgePicks, bridgePattern, bridgePrimitive, bridgeCtx } from '../../graphicLibrary/bridge'
import { foodBoxTheatre, landscapeHeroBand } from '../foodLandscape'
import { foodFamilyFromCategory } from '../foodFamily'

export function frontDecor(panel: Panel, system: DesignSystem, p: Palette, safe?: SafeRect, plan?: DesignPlan, ctx?: HeroPaintCtx): string {
  const { style, grammar } = system
  let out = ''
  if (foodBoxTheatre(system, panel, grammar === 'label')) {
    out += landscapeHeroBand(panel, p, foodFamilyFromCategory(system.category), {
      density: plan ? undefined : 0,
      variationIndex: plan?.variationIndex,
      safe,
    })
  }

  // GraphicLibrary bridge — opt-in at variation >= 1 (pattern + primitive; hero stays with motor)
  const libPicks = bridgePicks(plan, system)
  const useLibrary = libPicks !== null

  if (grammar === 'label') {
    out += labelDecor(panel, system, p, plan?.visualConcept)
    if (shouldPaintModernGrid(plan?.visualConcept, style)) {
      const { x, y, w, h } = panel
      for (let i = 1; i < 3; i++) {
        const gx = x + (w / 3) * i
        out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="${p.accent}" stroke-opacity="0.14" stroke-width="0.16" data-art="modern-grid" />`
      }
    }
    out += paintPlanHero(panel, system, p, plan, ctx)
  } else {
    const sector = system.sector
    if (shouldPaintSectorFrame(plan?.visualConcept, style, sector)) {
      out += sectorFrame(panel, p, sector, style)
    }
    if (shouldPaintModernGrid(plan?.visualConcept, style)) {
      const { x, y, w, h } = panel
      const cols = 3
      for (let i = 1; i < cols; i++) {
        const gx = x + (w / cols) * i
        out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="${p.accent}" stroke-opacity="0.14" stroke-width="0.16" data-art="modern-grid" />`
      }
    }
    out += paintPlanHero(panel, system, p, plan, ctx)
  }

  // Pattern: library or motor
  if (useLibrary) {
    const libPattern = bridgePattern(libPicks, bridgeCtx(panel, p, plan?.patternSystem.opacity ?? 0.18, safe, plan?.artDirection.antiRepetition.seed ?? 7))
    if (libPattern) {
      out += libPattern
    } else if (plan?.patternSystem && plan.patternSystem.family !== 'none') {
      // P2-D: library returned empty — fall back to motor pattern (no-paint must not count as variety).
      const pattern = plan.patternSystem
      const patternSafe = pattern.avoidLockup ? safe : undefined
      const markup = paintPatternFamily(pattern.family, panel, p.accent, pattern.opacity, patternSafe)
      out += wrapPattern(pattern.family, markup)
    }
  } else {
    const pattern = plan?.patternSystem
    if (pattern && pattern.family !== 'none') {
      const patternSafe = pattern.avoidLockup ? safe : undefined
      const markup = paintPatternFamily(pattern.family, panel, p.accent, pattern.opacity, patternSafe)
      out += wrapPattern(pattern.family, markup)
    }
  }

  if (
    shouldPaintLockupWindow(plan?.visualConcept, plan?.artDirection.chrome, style, grammar) &&
    safe &&
    !lockupOwnsRule(system.lockup)
  ) {
    out += lockupWindow(safe, p.accent)
  }

  // Primitives: library or motor
  if (useLibrary) {
    const libPrim = bridgePrimitive(libPicks, bridgeCtx(panel, p, 0.22, safe, plan?.artDirection.antiRepetition.seed ?? 7))
    if (libPrim) out += libPrim
  } else {
    const prims = plan?.illustrationSystem.primitives ?? []
    if (prims.length) {
      const filtered =
        system.decor === 'leaf' || system.decor === 'olive' ? prims.filter((id) => id !== 'leaf') : prims
      if (filtered.length) out += paintPrimitives(panel, p, filtered, 0.22, safe)
    }
  }

  return out
}
