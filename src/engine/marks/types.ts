export type MarkId =
  | 'pao'
  | 'leaflet'
  | 'recycle'
  | 'greendot'
  | 'pap21'
  | 'emark'
  | 'flammable'
  | 'keepaway'
  | 'weee'
  | 'thiswayup'
  | 'keepdry'
  | 'glassfork'

export type PerfumeAssetId = 'ic1' | 'ic2' | 'ic3' | 'ic4'

export type MarkPlacement = {
  panel: 'back' | 'side' | 'top' | 'label'
  minMm: number
  gapMm: number
  maxIcons: number
}

export type MarkRecipe = {
  key: string
  requiredMarks: MarkId[]
  optionalMarks: MarkId[]
  requiredTextWarnings: string[]
  placement: MarkPlacement
  paoMonths: string
  sampleLegal: true
  perfumeAssets: Partial<Record<MarkId, PerfumeAssetId>>
}

export type ResolvedMarks = {
  recipe: MarkRecipe
  strip: MarkId[]
  labelStrip: MarkId[]
  warnings: string
  sampleLegal: true
}
