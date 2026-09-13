/**
 * Forxa structural pipeline types.
 * Geometry lives here; SVG/PDF only render a finished solution.
 *
 * This repo has no runPaxolabWorkflow / Packify / Intent solver.
 * The live seam is FormaLocalEngine → buildDieline.
 */
import type { Point } from '../../../types'

export type BoxDimensions = {
  width: number
  depth: number
  height: number
  units: 'mm'
}

export type GrammarId =
  | 'straight-tuck-end'
  | 'reverse-tuck-end'
  | 'tuck-top-auto-bottom'
  | 'rsc'
  | 'mailer'
  | 'sleeve'
  | 'snap-lock'
  | 'polygon'
  | 'carrier-tray'
  | 'tray'
  | 'pillow'
  | 'rigid-gift'
  | 'label'
  | 'unknown'

export type LineType = 'cut' | 'crease' | 'perforation'

export type CollisionSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'FATAL'

export type MaterialProfile = {
  id: string
  label: string
  thicknessMm?: number
  gsm?: number
  source: 'declared' | 'engine-default' | 'reference-drawing'
}

export type BleedConfig = {
  amount: number
  unit: 'mm'
}

export type StructuralDims = {
  panelWidth: number
  panelHeight: number
  flapDepth: number
  tuckLength: number
  dustFlapLength: number
  glueWidth: number
  foldClearance: number
  slotWidth: number
  lockDepth: number
  cornerRadius: number
  tuckHead: number
  tuckInset: number
  bleed: BleedConfig
  safeInset: number
}

export type StructuralPanel = {
  id: string
  type: 'front' | 'back' | 'side' | 'glue' | 'top' | 'bottom' | 'lid' | 'other'
  width: number
  height: number
  origin: Point
  polygon: Point[]
}

export type PanelEdge = {
  from: string
  to: string
  type: 'crease' | 'cut'
  angle: number
}

export type StructuralFlap = {
  id: string
  parentPanel: string
  type: 'tuck' | 'dust' | 'locking' | 'major' | 'minor' | 'lid' | 'auto-bottom'
  width: number
  length: number
  angle: number
  clearance: number
  polygon: Point[]
}

export type GlueArea = {
  panelId: string
  width: number
  height: number
  polygon: Point[]
}

export type ArtworkZone = {
  panelId: string
  face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'other'
  bleedPolygon: Point[]
  safePolygon: Point[]
  printablePolygon: Point[]
  barcodeZone?: Point[]
  ingredientsZone?: Point[]
  warningZone?: Point[]
  manufacturerZone?: Point[]
  netWeightZone?: Point[]
  placeholder?: boolean
}

export type ValidationFinding = {
  code: string
  severity: CollisionSeverity
  message: string
}

export type TaggedPath = {
  id: string
  type: LineType
  points: Point[]
}

export type StructuralSolution = {
  grammar: GrammarId
  ecmaCode?: string
  dimensions: BoxDimensions
  material: MaterialProfile
  solved: StructuralDims
  panels: StructuralPanel[]
  flaps: StructuralFlap[]
  edges: PanelEdge[]
  glueAreas: GlueArea[]
  cutPaths: TaggedPath[]
  creasePaths: TaggedPath[]
  perforationPaths: TaggedPath[]
  artworkZones: ArtworkZone[]
  findings: ValidationFinding[]
  releaseReady: boolean
}
