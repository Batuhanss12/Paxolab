/**
 * buildDieline — facade re-exporting the decomposed dieline modules.
 * Geometry and structure definitions now live in their own modules.
 * This file preserves the public API.
 */
import type { DesignBrief, DielineModel, DimensionsMm, StructureId } from '../../types'
import { flatLabel, simpleTray, tuckEnd, wrapLabel } from './dielineStructures'

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
  if (structureId === 'simple-tray') return simpleTray(d)
  if (structureId === 'flat-label') return flatLabel(d)
  if (structureId === 'wrap-label') return wrapLabel(d)
  return tuckEnd(d)
}

export function frontPanelId(structureId: StructureId): string {
  if (structureId === 'simple-tray') return 'trayFront'
  if (structureId === 'flat-label' || structureId === 'wrap-label') return 'label'
  return 'front'
}
