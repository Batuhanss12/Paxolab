import type { PackagingMode, StyleType } from '../../types'
import type { MarkRecipe } from '../marks/types'

export type SectorId = 'perfume' | 'cream' | 'serum' | 'food' | 'electronics' | 'cleaning' | 'generic'
export type SurfaceMode = PackagingMode
export type Grammar = 'box' | 'label'
export type DecorFamily =
  | 'crest'
  | 'cartouche'
  | 'leaf'
  | 'badge'
  | 'stripe'
  | 'olive'
  | 'harvest'
  | 'grid'
  | 'drop'
  | 'oval'
  | 'plaque'
  | 'none'
export type LockupId =
  | 'centered-crest'
  | 'harvest-seal'
  | 'metal-plaque'
  | 'soft-oval'
  | 'left-index'
  | 'tech-grid'
  | 'air-rule'
  | 'stamp-center'
  | 'badge-capsule'
  | 'serif-cartouche'
  | 'label-stack'
  | 'label-wrap'
export type MarkSet = 'cosmetics' | 'food' | 'electronics' | 'generic'
export type Density = 'sparse' | 'balanced' | 'dense'

export type TypeScale = {
  displayMm: number
  productMm: number
  metaMm: number
  legalMm: number
  brandMm: number
  categoryMm: number
  taglineMm: number
  volumeMm: number
  minMm: number
  trackingDisplay: number
  trackingProduct: number
  trackingMeta: number
  trackingLegal: number
  volumeCase: 'upper' | 'smallcaps'
  opticalLift: number
}

export type LegalBlockDef = {
  id: string
  title: string
  source: 'ingredients' | 'warnings'
}

export type DesignSystem = {
  key: string
  surfaceMode: SurfaceMode
  grammar: Grammar
  sector: SectorId
  style: StyleType
  lockup: LockupId
  decor: DecorFamily
  density: Density
  type: TypeScale
  marks: MarkSet
  markRecipe: MarkRecipe
  legal: LegalBlockDef[]
  category: string
  flammable: boolean
  pao: boolean
  goldBar: boolean
  serif: boolean
  align: 'center' | 'left'
  wrapSeam: boolean
  brandOnSides: boolean
  brandOnTucks: boolean
  brandOnTop: boolean
  fullDecorOnFrontOnly: boolean
}
