import type { MotifFamilyId } from '../../brain/DesignPlan'
import type { MotifRole } from '../artMotifMeta'

export type AssetMode = 'none' | 'compatible-family' | 'typography-only' | 'minimal-decoration'

export type CanonicalAssetRecord = {
  id: string
  family: MotifFamilyId
  subfamily: string
  style: string[]
  sectorCompatibility: string[]
  conceptCompatibility: string[]
  complexity: number
  visualWeight: number
  preferredPlacement: string[]
  allowedPlacement?: string[]
  forbiddenPlacement?: string[]
  allowedColors: string[]
  role?: MotifRole
  /** Path relative to assets/motif-families. Missing = metadata-only (existing library sheet). */
  file?: string
  sheetId?: string
  classified?: boolean
  /** Overlay never paints this file. Kit chrome / disk geometry tests still use it. */
  retired?: boolean
}

export type AssetCatalogFile = {
  version: number
  assets: CanonicalAssetRecord[]
}
