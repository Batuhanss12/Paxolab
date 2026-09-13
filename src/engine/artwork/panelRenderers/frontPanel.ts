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
import { paintBackgroundTreatment, paintSectorBackground, paintStyleBackground } from '../backgroundTreatments'
import { wrapContinuity } from '../motifs'
import { panelClip as clip } from '../svgGeometry'
import { lockoutClip } from './shared'
import { frontDecor } from './frontDecor'
import { renderFrontLockup } from './frontLockup'

/** Professional seam indicator: dashed registration line with tick marks. */
function wrapSeam(panel: Panel, p: Palette): string {
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
  return `
    <line x1="${sx}" y1="${top}" x2="${sx}" y2="${bot}" stroke="${p.accent}" stroke-opacity="0.3" stroke-width="0.12" stroke-dasharray="0.8 0.6" />
    ${tickMarks}
    <text x="${sx - 1.2}" y="${y + h * 0.5}" text-anchor="end" transform="rotate(-90 ${sx - 1.2} ${y + h * 0.5})" fill="${p.muted}" font-family="Inter, Arial, sans-serif" font-weight="500" font-size="1.4" letter-spacing="0.6">SEAM</text>
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

  let body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.bg}" />`
  if (lockup) body += lockoutClip(id, panel, lockup)

  body += paintBackgroundTreatment(panel, designPlan?.backgroundTreatment ?? 'quiet-paper', p)
  body += paintStyleBackground(panel, system.style, p)
  if (designPlan) body += paintSectorBackground(panel, system.sector, system.style, p)

  body += frontDecor(panel, system, p, lockup, designPlan)
  if (labelFace && system.wrapSeam) {
    body += wrapSeam(panel, p)
    body += wrapContinuity(panel, p.accent)
  }

  if (layout) {
    body += renderFrontLockup(panel, brief, copy, p, overrides, system, layout, logoHref)
  }

  return `<g clip-path="${clip(panel)}">${body}</g>`
}
