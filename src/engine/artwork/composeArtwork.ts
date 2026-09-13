import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import type { DesignSystem } from '../designSystem/types'
import { resolveDesignSystem } from '../designSystem/resolve'
import type { CraftPlan } from './craft'
import { buildCraftPlan } from './craft'
import { languageId } from './languages'
import { panelClip as clip } from './svgGeometry'
import { flapGround, glueOnly, labelBackArt, renderBackPanel, renderFrontPanel, renderSidePanel, renderTopPanel } from './panelRenderers'

export { artworkMarkup, clipDefs, renderArtNetSvg, renderArtworkDoc, renderFrontSvg } from './renderArtwork'

/** Dispatch a single panel to its specialized renderer. */
function panelArt(
  panel: Panel,
  brief: DesignBrief,
  copy: DesignSpec['copy'],
  p: Palette,
  overrides: DesignOverrides,
  system: DesignSystem,
  plan: CraftPlan,
  logoHref?: string,
  designPlan?: DesignPlan,
): string {
  const id = panel.id

  // Label back / warning label
  if (id === 'labelBack' || id === 'warnLabel') {
    return labelBackArt(panel, copy, p, system, brief)
  }
  // Glue / overlap panels
  if (panel.role === 'glue' || id === 'glue' || id === 'overlap') {
    return glueOnly(panel, p)
  }
  // Tuck / dust flaps
  if (panel.role === 'tuck' || id.includes('Dust')) {
    return flapGround(panel, p, false, '')
  }

  const isFront = id === 'front' || id === 'label' || id === 'trayFront'
  const isBack = id === 'back' || id === 'trayBack'
  const isSide = id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight'
  const isTop = id === 'top' || id === 'bottom' || id === 'trayBottom'

  if (isFront) return renderFrontPanel(panel, brief, copy, p, overrides, system, designPlan, logoHref)
  if (isBack) return renderBackPanel(panel, brief, copy, p, system, plan)
  if (isSide) return renderSidePanel(panel, copy, p, system, designPlan)
  if (isTop) return renderTopPanel(panel, copy, p, system)

  // Fallback: plain background
  return `<g clip-path="${clip(panel)}"><rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" fill="${p.bg}" /></g>`
}

export function composeArtwork(
  brief: DesignBrief,
  dieline: DielineModel,
  copy: DesignSpec['copy'],
  palette: Palette,
  overrides: DesignOverrides,
  logoHref?: string,
  system = resolveDesignSystem(brief, dieline.structureId),
  designPlan?: DesignPlan,
): ArtworkModel {
  const plan = buildCraftPlan(brief, dieline, copy, system)
  const layers = dieline.panels.map((panel) => ({
    panelId: panel.id,
    markup: panelArt(panel, brief, copy, palette, overrides, system, plan, logoHref, designPlan),
  }))
  const frontPanelId =
    dieline.panels.find((p) => p.id === 'front' || p.id === 'label' || p.id === 'trayFront')?.id ??
    dieline.panels[0].id
  return {
    layers,
    frontPanelId,
    language: languageId(brief),
    systemKey: system.key,
  }
}
