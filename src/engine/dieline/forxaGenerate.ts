import type { DesignBrief, DielineModel, DimensionsMm, StructureId } from '../../types'
import { applyAuxiliaryDevice, classifyAuxDevice } from './forxa/auxiliaryDevices'
import { registry } from './forxa/registry'
import { toDielineModel } from './forxaAdapter'
import { attachStructuralSolution } from './structure/solve'
import { boxFromMm, classifyGrammar, resolveMaterial, solveDimensions, solvedEngineParams } from './structure/solver'

export const FORXA_ROUTED = new Set<string>([
  'mailer-box',
  'sleeve',
  'pillow-box',
  'snap-lock-box',
  'tray-box',
  'rigid-gift-box',
  'polygon-box',
  'product-carrier-tray',
  'reverse-tuck-end-box',
  'tuck-top-auto-bottom',
  'rsc-carton',
])

export function isForxaStructure(id: string): boolean {
  return FORXA_ROUTED.has(id)
}

/**
 * Paxolab brief: L = front width, W = depth, H = standing height.
 * Most Forxa engines use length/width/height. Pillow uses width as panel height and depth as flap.
 */
export function briefToEngineParams(
  engineId: string,
  dimensions: DimensionsMm,
  defaults: Record<string, number> = {},
): Record<string, number> {
  const L = dimensions.L || defaults.length || defaults.sideLength || 80
  const W = dimensions.W || defaults.width || 40
  const H = dimensions.H || defaults.height || 120
  const base = {
    length: L,
    width: W,
    height: H,
    sideLength: L,
  }
  if (engineId === 'pillow-box') {
    const panelH = dimensions.H || defaults.width || 80
    const depth = dimensions.W || defaults.depth || 40
    return { ...base, length: L, width: panelH, height: panelH, depth }
  }
  return base
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
    perf: [],
    glueIds: [],
    consistent: false,
    issues,
  }
}

export function generateForxaModel(
  structureId: StructureId,
  dimensions: DimensionsMm,
  engineParams?: Record<string, number>,
  auxDevice?: string,
  brief?: DesignBrief,
): DielineModel {
  const classifiedAux = auxDevice ? classifyAuxDevice(Number(auxDevice)) : null
  const engineId = auxDevice
    ? structureId === 'mailer-box' || structureId === 'tuck-end-box'
      ? structureId
      : classifiedAux?.host || 'tuck-end-box'
    : structureId

  const structure = registry.get(engineId)
  if (!structure) return failedModel(structureId, dimensions, [`Forxa motor yok: ${engineId}`])

  const { grammar } = classifyGrammar(engineId)
  const material = resolveMaterial(
    engineId === 'tuck-top-auto-bottom' ? 'carton-300' : undefined,
    engineParams?.materialThickness,
  )
  const solved = solveDimensions(grammar, boxFromMm(dimensions.L, dimensions.W, dimensions.H), material)
  const useSolved = grammar === 'tuck-top-auto-bottom' || grammar === 'rsc'

  const defaults = structure.getDefaultParameters()
  const params: Record<string, number> = {
    ...defaults,
    ...briefToEngineParams(engineId, dimensions, defaults),
    ...(useSolved ? solvedEngineParams(solved) : {}),
    ...engineParams,
  }

  const raw = structure.generateDieline(params)
  const model =
    !auxDevice || !classifiedAux
      ? toDielineModel(raw, dimensions, structureId)
      : (() => {
          const hostCut = raw.paths.cut.length
          const hostPerf = raw.paths.perf.length
          const withAux = applyAuxiliaryDevice(raw, classifiedAux.category, auxDevice)
          return toDielineModel(withAux, dimensions, structureId, {
            cut: withAux.paths.cut.slice(hostCut),
            perf: withAux.paths.perf.slice(hostPerf),
          })
        })()

  return attachStructuralSolution(model, brief)
}
