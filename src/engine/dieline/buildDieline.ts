/**
 * buildDieline — facade re-exporting the decomposed dieline modules.
 * Native FORMA nets stay on the four original generators.
 * MatBixx engines (and tuck/mailer + X-device) go through the bleed-free adapter.
 */
import type { DesignBrief, DielineModel, DimensionsMm, StructureId } from '../../types'
import { getTemplate } from '../catalog/catalog'
import { flatLabel, simpleTray, tuckEnd, wrapLabel } from './dielineStructures'
import { generateMatbixxModel, isMatbixxStructure } from './matbixxGenerate'
import { findHeroPanel, withPanelKinds } from './panelKind'

export { outlineUnion } from './dielineGeometry'

export function resolveDimensions(brief: DesignBrief): DimensionsMm {
  const d = brief.dimensionsMm
  const L = d.L > 0 ? d.L : 80
  const W = brief.packagingMode === 'label' ? 0 : d.W > 0 ? d.W : 40
  const H = d.H > 0 ? d.H : brief.packagingMode === 'label' ? 90 : 120
  return { L, W, H }
}

export function buildDieline(structureId: StructureId, brief: DesignBrief): DielineModel {
  const d = resolveDimensions(brief)
  const template = brief.templateId ? getTemplate(brief.templateId) : undefined
  const auxDevice = template?.auxDevice
  const engineParams = template?.engineParams
  const routed = isMatbixxStructure(structureId) || !!auxDevice
  if (routed) return generateMatbixxModel(structureId, d, engineParams, auxDevice)

  if (structureId === 'simple-tray') return withPanelKinds(simpleTray(d))
  if (structureId === 'flat-label') return withPanelKinds(flatLabel(d))
  if (structureId === 'wrap-label') return withPanelKinds(wrapLabel(d))
  return withPanelKinds(tuckEnd(d))
}

export function frontPanelId(structureId: StructureId, model?: DielineModel): string {
  if (model) return findHeroPanel(model.panels)?.id ?? model.panels[0]?.id ?? 'front'
  if (structureId === 'simple-tray') return 'trayFront'
  if (structureId === 'flat-label' || structureId === 'wrap-label') return 'label'
  return 'front'
}
