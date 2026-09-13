import type { DesignBrief, DielineModel } from '../../../types'
import { artworkZonesFromModel } from './artworkZones'
import { buildPanelEdges, glueAreasFromModel, solveFlaps, structuralPanelsFromModel } from './graph'
import { boxFromMm, classifyGrammar, resolveMaterial, solveDimensions } from './solver'
import type { StructuralSolution, TaggedPath } from './types'
import { releaseReady, validateProduction } from './validate'

function taggedCuts(model: DielineModel): TaggedPath[] {
  return model.cut.map((points, i) => ({ id: `cut-${i}`, type: 'cut' as const, points }))
}

function taggedCreases(model: DielineModel): TaggedPath[] {
  return model.crease.map(([a, b], i) => ({
    id: `crease-${i}`,
    type: 'crease' as const,
    points: [a, b],
  }))
}

export function attachStructuralSolution(model: DielineModel, brief?: DesignBrief): DielineModel {
  const { grammar, ecmaCode } = classifyGrammar(model.structureId)
  const material = resolveMaterial(model.structureId === 'tuck-top-auto-bottom' ? 'carton-300' : undefined)
  const dimensions = boxFromMm(model.dimensions.L, model.dimensions.W, model.dimensions.H)
  const solved = solveDimensions(grammar, dimensions, material)
  const panels = structuralPanelsFromModel(model)
  const edges = buildPanelEdges(model)
  const flaps = solveFlaps(model)
  const glueAreas = glueAreasFromModel(model)
  const artworkZones = artworkZonesFromModel(model, solved.bleed, solved.safeInset, brief)
  const findings = validateProduction({ model, edges, flaps, glueAreas })
  const structural: StructuralSolution = {
    grammar,
    ecmaCode,
    dimensions,
    material,
    solved,
    panels,
    flaps,
    edges,
    glueAreas,
    cutPaths: taggedCuts(model),
    creasePaths: taggedCreases(model),
    perforationPaths: [],
    artworkZones,
    findings,
    releaseReady: releaseReady(findings) && model.consistent && model.cut.length > 0,
  }

  const fatal = findings.filter((f) => f.severity === 'FATAL')
  const production = model.structureId === 'tuck-top-auto-bottom' || model.structureId === 'rsc-carton'
  if (!production || fatal.length === 0) {
    return { ...model, structural }
  }
  return {
    ...model,
    structural,
    consistent: false,
    issues: [...model.issues, ...fatal.map((f) => f.message)],
  }
}
