import type { DielineModel, DimensionsMm, StructureId } from '../../types'
import { applyAuxiliaryDevice, classifyAuxDevice } from './matbixx/auxiliaryDevices'
import { registry } from './matbixx/registry'
import { toDielineModel } from './matbixxAdapter'

export const MATBIXX_ROUTED = new Set<string>([
  'mailer-box',
  'sleeve',
  'pillow-box',
  'snap-lock-box',
  'tray-box',
  'rigid-gift-box',
  'polygon-box',
  'product-carrier-tray',
  'reverse-tuck-end-box',
])

export function isMatbixxStructure(id: string): boolean {
  return MATBIXX_ROUTED.has(id)
}

function failedModel(structureId: StructureId, dimensions: DimensionsMm, issues: string[]): DielineModel {
  return {
    structureId,
    unit: 'mm',
    width: 0,
    height: 0,
    dimensions,
    panels: [],
    cut: [],
    crease: [],
    glueIds: [],
    consistent: false,
    issues,
  }
}

export function generateMatbixxModel(
  structureId: StructureId,
  dimensions: DimensionsMm,
  engineParams?: Record<string, number>,
  auxDevice?: string,
): DielineModel {
  const classified = auxDevice ? classifyAuxDevice(Number(auxDevice)) : null
  const engineId = auxDevice
    ? structureId === 'mailer-box' || structureId === 'tuck-end-box'
      ? structureId
      : classified?.host || 'tuck-end-box'
    : structureId

  const structure = registry.get(engineId)
  if (!structure) return failedModel(structureId, dimensions, [`MatBixx motor yok: ${engineId}`])

  const defaults = structure.getDefaultParameters()
  const params: Record<string, number> = {
    ...defaults,
    length: dimensions.L || defaults.length || 80,
    width: dimensions.W || defaults.width || 40,
    height: dimensions.H || defaults.height || 120,
    sideLength: dimensions.L || defaults.sideLength || 60,
    ...engineParams,
  }

  const raw = structure.generateDieline(params)
  if (!auxDevice || !classified) return toDielineModel(raw, dimensions, structureId)

  const hostCut = raw.paths.cut.length
  const hostPerf = raw.paths.perf.length
  const withAux = applyAuxiliaryDevice(raw, classified.category, auxDevice)
  return toDielineModel(withAux, dimensions, structureId, {
    cut: withAux.paths.cut.slice(hostCut),
    perf: withAux.paths.perf.slice(hostPerf),
  })
}
