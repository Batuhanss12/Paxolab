/**
 * Front panel renderer — facade combining decor, lockup, and seam.
 * Decor assembly extracted to frontDecor.ts.
 * Lockup rendering extracted to frontLockup.ts.
 * This file preserves the public renderFrontPanel API.
 */
import type { DesignBrief, DesignOverrides, DesignSpec, Palette, Panel } from '../../../types'
import type { DesignPlan } from '../../brain/DesignPlan'
import type { DesignSystem } from '../../designSystem/types'
import { layoutFrontLockup } from '../../designSystem/typeSystem'
import { expandKitSafe, kitLevel } from '../bgKits'
import { paintBackgroundTreatment, paintSectorBackground, paintStyleBackground } from '../backgroundTreatments'
import { foodBoxTheatre } from '../foodLandscape'
import { wrapContinuity } from '../motifs'
import { panelClip as clip } from '../svgGeometry'
import { lockoutClip } from './shared'
import { frontDecor } from './frontDecor'
import { renderFrontLockup } from './frontLockup'

/** Professional seam indicator: dashed registration line with tick marks. */
function wrapSeam(panel: Panel, p: Palette, printReady: boolean): string {
  const { x, y, w, h } = panel
  const sx = x + w - 1.6
  const top = y + 2.5
  const bot = y + h - 2.5
  const ticks = 5
  let tickMarks = ''
  for (let i = 0; i <= ticks; i++) {
    const ty = top + ((bot - top) / ticks) * i
    tickMarks += `<line x1="${sx - 0.8}" y1="${ty}" x2="${sx + 0.4}" y2="${ty}" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="0.1" />`
  }
  void printReady
  const label = ''
  return `
    <g data-art="seam">
    <line x1="${sx}" y1="${top}" x2="${sx}" y2="${bot}" stroke="${p.accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.8 0.6" />
    ${tickMarks}
    ${label}
    </g>
  `
}

export function renderFrontPanel(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  designPlan?: DesignPlan,
  logoHref?: string,
): string {
  const { x, y, w, h } = panel
  const id = panel.id
  const labelFace = system.grammar === 'label'

  const layout = layoutFrontLockup(panel, system, copy, overrides, labelFace)
  const lockup = layout?.rect
  const safe = expandKitSafe(lockup, system.style === 'eco' ? 3 : 2.4)
  const theatre = foodBoxTheatre(system, panel, labelFace)
  const density = kitLevel(designPlan?.variationIndex)

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  if (safe) body += lockoutClip(id, panel, safe)

  body += paintBackgroundTreatment(panel, designPlan?.backgroundTreatment ?? 'quiet-paper', p)
  body += paintStyleBackground(panel, system.style, p, {
    safe,
    density,
    sector: system.sector,
    grammar: system.grammar,
    theatre,
    variationIndex: designPlan?.variationIndex,
  })
  if (designPlan) body += paintSectorBackground(panel, system.sector, system.style, p)

  body += frontDecor(panel, system, p, lockup, designPlan, {
    copy,
    overrides,
    ingredientClaims: brief.ingredientClaims ?? '',
  })
  if (labelFace && system.wrapSeam) {
    body += wrapSeam(panel, p, overrides.printReady)
    body += wrapContinuity(panel, p.accent)
  }

  if (layout) {
    body += renderFrontLockup(panel, brief, copy, p, overrides, system, layout, logoHref)
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
