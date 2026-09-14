import type { PackagingMode, StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'

export type Positioning = 'luxury' | 'premium' | 'mass' | 'technical' | 'natural' | 'playful'
export type VisualIntent = 'elegant' | 'restrained' | 'high-contrast' | 'air' | 'warm' | 'graphic'
export type NegativeSpace = 'high' | 'med' | 'low'
export type TypeAuthority = 'display' | 'balanced' | 'quiet'
export type MetallicRole = 'foil' | 'restrained' | 'off'
export type DirectorCue =
  | 'none'
  | 'luxury-arrive'
  | 'luxury-tighten'
  | 'open-air'
  | 'warm-natural'
  | 'graphic-push'
  | 'force-overload'

export type HeroFamily = 'crest' | 'seal' | 'botanical' | 'emblem' | 'harvest' | 'tech' | 'oval' | 'monstera' | 'palm' | 'organic-wave' | 'zebra' | 'line-scene' | 'none'
export type PatternFamily = 'contour' | 'lattice' | 'stripe' | 'grain' | 'ornament' | 'capsule' | 'weave' | 'dotgrid' | 'wave' | 'hexagon' | 'none'
export type BackgroundTreatment = 'dark-field' | 'quiet-paper' | 'vignette' | 'dual-tone' | 'kraft'
export type PrimitiveId = 'leaf' | 'grain' | 'diamond' | 'rule' | 'wave' | 'arc' | 'dot' | 'tick'

export type ArtDirectionBlock = {
  vocabulary: string
  crop: 'tight' | 'open'
  chrome: 'full' | 'quiet'
  antiRepetition: { seed: number; forbidLastFamilies: string[] }
}

export type VisualConceptBlock = {
  id: string
  tags: string[]
}

export type HeroGraphicBlock = {
  family: HeroFamily
  placement: 'above-lockup' | 'behind-lockup' | 'none'
  scale: number
  clearance: true
}

export type IllustrationBlock = {
  primitives: PrimitiveId[]
  density: Density
}

export type PatternBlock = {
  family: PatternFamily
  opacity: number
  avoidLockup: true
  sideIntentional: boolean
}

export type DensityMap = {
  overall: Density
  front: Density
  side: Density
  back: Density
}

export type CropBlock = {
  heroCrop: number
  safeInsets: number
}

export type DesignPlan = {
  sector: SectorId
  subProduct: string
  /** Visual vocabulary id from SectorVisualVocabulary — NEVER inferred from style alone. */
  vocabularyId: string
  surface: PackagingMode
  style: StyleType
  cue: DirectorCue
  variationIndex: number
  positioning: Positioning
  visualIntent: VisualIntent
  hierarchy: {
    primary: 'brand'
    secondary: 'product' | 'category'
    tertiary: 'volume' | 'descriptor'
    order: string
  }
  typography: {
    displayFace: 'serif' | 'sans'
    productFace: 'serif' | 'sans'
    authority: TypeAuthority
    trackingIntent: 'wide' | 'medium' | 'tight'
  }
  composition: {
    lockup: 'center' | 'left'
    negativeSpace: NegativeSpace
    opticalCenter: number
    focal: 'center' | 'left'
    intent: 'symmetric' | 'asymmetric' | 'grid' | 'offset' | 'diagonal' | 'editorial' | 'floating' | 'full-bleed'
    heroZone: { y: number; h: number; x?: number }
    lockupBand: { y: number; h: number }
    legalZone: 'back' | 'label-back'
    marksZone: 'back' | 'label-back'
  }
  artDirection: ArtDirectionBlock
  visualConcept: VisualConceptBlock
  heroGraphic: HeroGraphicBlock
  illustrationSystem: IllustrationBlock
  patternSystem: PatternBlock
  backgroundTreatment: BackgroundTreatment
  density: DensityMap
  crop: CropBlock
  decor: {
    density: Density
    allowed: DecorFamily[]
    lockupClearance: true
    restrainExtras: boolean
  }
  color: {
    roles: { bg: 'ground'; fg: 'ink'; accent: 'signal' }
    metallic: MetallicRole
    followStyleBar: true
  }
  marks: {
    recipeKey: string
    frontClean: true
  }
  dielineBehavior: {
    frontClean: boolean
    spineBrandFirst: boolean
    backLegalStack: boolean
    tucksMinimal: boolean
    labelFrontDesign: boolean
    labelBackUtility: boolean
  }
  risks: string[]
  summaryTr: string
}

export function planSummaryTr(plan: DesignPlan): string {
  const density =
    plan.decor.density === 'sparse' ? 'düşük dekor yoğunluğu' : plan.decor.density === 'dense' ? 'yüksek dekor' : 'dengeli dekor'
  const space =
    plan.composition.negativeSpace === 'high' ? 'geniş negatif alan' : plan.composition.negativeSpace === 'low' ? 'sıkı doluluk' : 'orta boşluk'
  const hero = plan.heroGraphic?.family && plan.heroGraphic.family !== 'none' ? ` · ${plan.heroGraphic.family}` : ''
  const set = plan.variationIndex > 0 ? ` · set ${plan.variationIndex + 1}` : ''
  const vocab = plan.vocabularyId ? ` · ${plan.vocabularyId}` : ''
  return `Strateji: ${plan.positioning} · marka baskın · ${space} · ${density}${hero}${set}${vocab}`
}
