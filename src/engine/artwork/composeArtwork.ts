import type { ArtworkModel, DesignBrief, DesignOverrides, DesignSpec, DielineModel, Palette, Panel } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import type { DesignSystem } from '../designSystem/types'
import { resolveDesignSystem } from '../designSystem/resolve'
import type { CraftPlan } from './craft'
import { buildCraftPlan } from './craft'
import { languageId } from './languages'
import { panelClip as clip } from './svgGeometry'
import { findHeroPanel, nativeKindFor } from '../dieline/panelKind'
import { deviceOverlayArt, flapGround, glueOnly, labelBackArt, polygonWallArt, productWindowArt, renderBackPanel, renderFrontPanel, renderSidePanel, renderTopPanel } from './panelRenderers'

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
  const kind = nativeKindFor(panel)

  if (id === 'labelBack' || id === 'warnLabel') {
    return labelBackArt(panel, copy, p, system, brief)
  }
  if (kind === 'glue' || panel.role === 'glue' || id === 'glue' || id === 'overlap') {
    return glueOnly(panel, p)
  }
  if (kind === 'tuck-flap' || panel.role === 'tuck' || id.includes('Dust')) {
    return flapGround(panel, p, false, '')
  }
  if (kind === 'device-overlay') return deviceOverlayArt(panel, p)
  if (kind === 'product-window') return productWindowArt(panel, p)
  if (kind === 'polygon-wall') return polygonWallArt(panel, copy, p)
  if (kind === 'hero-front' || id === 'front' || id === 'label' || id === 'trayFront') {
    return renderFrontPanel(panel, brief, copy, p, overrides, system, designPlan, logoHref)
  }
  if (kind === 'legal-back' || id === 'back' || id === 'trayBack') {
    return renderBackPanel(panel, brief, copy, p, system, plan)
  }
  if (kind === 'side-spine' || id === 'left' || id === 'right' || id === 'trayLeft' || id === 'trayRight') {
    return renderSidePanel(panel, copy, p, system, designPlan)
  }
  if (id === 'top' || id === 'bottom' || id === 'trayBottom') {
    return renderTopPanel(panel, copy, p, system)
  }

  return `<g clip-path="${clip(panel)}" data-art="plain"><rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" fill="${p.bg}" /></g>`
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
  const frontPanelId = findHeroPanel(dieline.panels)?.id ?? dieline.panels[0].id
  return {
    layers,
    frontPanelId,
    language: languageId(brief),
    systemKey: system.key,
  }
}
