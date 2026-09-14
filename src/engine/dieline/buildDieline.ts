/**
 * buildDieline — facade re-exporting the decomposed dieline modules.
 * Native FORMA nets stay on the four original generators.
 * Forxa engines (and tuck/mailer + X-device) go through the bleed-free adapter.
 */
import type { DesignBrief, DielineModel, DimensionsMm, StructureId } from '../../types'
import { getTemplate } from '../catalog/catalog'
import { estimateCartonMm } from '../catalog/volumeCarton'
import { flatLabel, simpleTray, tuckEnd, wrapLabel } from './dielineStructures'
import { generateForxaModel, isForxaStructure } from './forxaGenerate'
import { findHeroPanel, withPanelKinds } from './panelKind'
import { attachStructuralSolution } from './structure/solve'

export { outlineUnion } from './dielineGeometry'

export function resolveDimensions(brief: DesignBrief): DimensionsMm {
  const d = brief.dimensionsMm
  if (d.L > 0 && d.H > 0) {
    return {
      L: d.L,
      W: brief.packagingMode === 'label' ? 0 : d.W > 0 ? d.W : 40,
      H: d.H,
    }
  }
  const estimated = estimateCartonMm(brief.volume, brief, brief.templateId ? getTemplate(brief.templateId) : undefined)
  if (estimated) return estimated
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
  const routed = isForxaStructure(structureId) || !!auxDevice
  if (routed) return generateForxaModel(structureId, d, engineParams, auxDevice, brief)

  const native =
    structureId === 'simple-tray'
      ? withPanelKinds(simpleTray(d))
      : structureId === 'flat-label'
        ? withPanelKinds(flatLabel(d))
        : structureId === 'wrap-label'
          ? withPanelKinds(wrapLabel(d))
          : withPanelKinds(tuckEnd(d))
  return attachStructuralSolution(native, brief)
}

export function frontPanelId(structureId: StructureId, model?: DielineModel): string {
  if (model) return findHeroPanel(model.panels)?.id ?? model.panels[0]?.id ?? 'front'
  if (structureId === 'simple-tray') return 'trayFront'
  if (structureId === 'flat-label' || structureId === 'wrap-label') return 'label'
  return 'front'
}
