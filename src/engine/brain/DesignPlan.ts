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

/** P10b — empty octagon/hex seal is retired. Keep the type for old plans; never paint it. */
/** User veto — oval flacon-medallion and bottle silhouettes never paint. */
export function remapBannedHero(family: HeroFamily, sector?: string): HeroFamily {
  if (family === 'oval' || family === 'organic-wave') return 'none'
  if (family !== 'seal') return family
  if (sector === 'perfume') return 'crest'
  if (sector === 'food' || sector === 'beverage') return 'harvest'
  return 'none'
}

export function withoutSeal(list: HeroFamily[], sector?: string): HeroFamily[] {
  const next = list.filter((h) => h !== 'seal')
  return next.length ? next : [remapBannedHero('seal', sector)]
}
export type PatternFamily = 'contour' | 'lattice' | 'stripe' | 'grain' | 'ornament' | 'capsule' | 'weave' | 'dotgrid' | 'wave' | 'hexagon' | 'none'
export type BackgroundTreatment = 'dark-field' | 'quiet-paper' | 'vignette' | 'dual-tone' | 'kraft'
export type PrimitiveId = 'leaf' | 'grain' | 'diamond' | 'rule' | 'wave' | 'arc' | 'dot' | 'tick'

export type ArtDirectionBlock = {
  vocabulary: string
  crop: 'tight' | 'open'
  chrome: 'full' | 'quiet'
  antiRepetition: { seed: number; forbidLastFamilies: string[] }
}

export type MotifFamilyId =
  | 'botanical'
  | 'geometric-deco'
  | 'heraldic'
  | 'harvest'
  | 'linear-tech'
  | 'mineral-frame'
  | 'quiet-line'
  | 'ornate-stamp'

export type ConceptLanguageId = 'oval' | 'organic' | 'geometric' | 'linear' | 'botanical' | 'heraldic' | 'art-deco' | 'quiet-line'

export type VisualConceptBlock = {
  id: string
  tags: string[]
  /** Human concept name, e.g. EARTHEN PREMIUM. */
  label?: string
  family?: MotifFamilyId
  supportFamily?: MotifFamilyId
  /** 0–1 decoration spend cap (weight × area × opacity × complexity). */
  decorationBudget?: number
  /** Preferred composition strategies; artwork layer reads these names. */
  strategyBias?: string[]
  /** Motif-path art direction. Not a second vocabulary table. */
  languages?: ConceptLanguageId[]
  /** Tokens: heavy-frame, ornate-seal, dense-pattern, sharp-corner, generic-ticks. */
  avoid?: string[]
  /** Preferred subfamily / atom-id tokens (olive-branch, crest, soft-oval…). */
  motifLexicon?: string[]
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
