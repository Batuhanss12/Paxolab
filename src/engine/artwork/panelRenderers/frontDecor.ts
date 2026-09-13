/**
 * Front decor assembly — background decor, hero, pattern, lockup window, primitives.
 * Extracted from frontPanel.ts to isolate decor composition from lockup rendering.
 * GraphicLibrary bridge: when variation >= 1, the library provides pattern/primitive picks.
 * Heroes stay with the motor's paintPlanHero (kit-specific positioning + composition zone aware).
 */
import type { Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import { paintPrimitives } from '../illustrationPrimitives'
import { lockupWindow, type SafeRect } from '../motifs'
import { paintPatternFamily, wrapPattern } from '../patternFamilies'
import { labelDecor, modernStripe, sectorFrame } from './shared'
import { paintPlanHero } from './heroDispatch'
import { bridgePicks, bridgePattern, bridgePrimitive, bridgeCtx } from '../../graphicLibrary/bridge'

export function frontDecor(panel: Panel, system: DesignSystem, p: Palette, safe?: SafeRect, plan?: DesignPlan): string {
  const { style, grammar } = system
  let out = ''

  // GraphicLibrary bridge — opt-in at variation >= 1 (pattern + primitive; hero stays with motor)
  const libPicks = bridgePicks(plan, system)
  const useLibrary = libPicks !== null

  if (grammar === 'label') {
    out += labelDecor(panel, system, p)
    out += paintPlanHero(panel, system, p, plan)
  } else {
    const sector = system.sector
    if (style === 'luxury' || style === 'classic') {
      out += sectorFrame(panel, p, sector, style)
    } else if (style === 'modern') {
      if (sector === 'electronics') out += sectorFrame(panel, p, sector, style)
      else out += modernStripe(panel, p)
    } else if (style === 'eco' || style === 'playful') {
      out += sectorFrame(panel, p, sector, style)
    } else if (style === 'minimal') {
      // P2-B: optional single top hairline only if no pattern will paint (max one chrome element).
      // Sector bg accent (cleaning/food/electronics) already provides the signal;
      // top hairline only for sectors without bg accent (perfume/cream/serum/generic).
      const hasSectorBg = sector === 'cleaning' || sector === 'food' || sector === 'beverage' || sector === 'electronics'
      const patternFamily = plan?.patternSystem?.family ?? 'none'
      const patternWillPaint = patternFamily !== 'none'
      if (!hasSectorBg && !patternWillPaint) {
        const { x, y, w } = panel
        out += `<line x1="${x + w * 0.15}" y1="${y + 2.2}" x2="${x + w * 0.85}" y2="${y + 2.2}" stroke="${p.accent}" stroke-opacity="0.1" stroke-width="0.18" />`
      }
    }
    if (plan?.composition.intent === 'grid' && style === 'modern') {
      const { x, y, w, h } = panel
      const cols = 3
      for (let i = 1; i < cols; i++) {
        const gx = x + (w / cols) * i
        out += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="${p.accent}" stroke-opacity="0.06" stroke-width="0.1" />`
      }
    }
    out += paintPlanHero(panel, system, p, plan)
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

  // P2-B: forbid lockupWindow chrome=full on minimal (air intent).
  if (plan?.artDirection.chrome === 'full' && safe && grammar !== 'label' && style !== 'minimal') {
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
