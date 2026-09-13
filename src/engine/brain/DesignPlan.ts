import type { PackagingMode, StyleType } from '../../types'
import type { DecorFamily, Density, SectorId } from '../designSystem/types'

export type Positioning = 'luxury' | 'premium' | 'mass' | 'technical' | 'natural' | 'playful'
export type VisualIntent = 'elegant' | 'restrained' | 'high-contrast' | 'air' | 'warm' | 'graphic'
export type NegativeSpace = 'high' | 'med' | 'low'
export type TypeAuthority = 'display' | 'balanced' | 'quiet'
export type MetallicRole = 'foil' | 'restrained' | 'off'
export type DirectorCue = 'none' | 'luxury-arrive' | 'luxury-tighten' | 'open-air' | 'warm-natural' | 'graphic-push'

export type DesignPlan = {
  sector: SectorId
  subProduct: string
  surface: PackagingMode
  style: StyleType
  cue: DirectorCue
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
  }
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
  return `Strateji: ${plan.positioning} · marka baskın · ${space} · ${density}`
}
