/**
 * Phase 2 — single composition-strategy layer for motif search.
 *
 * Role split (do not grow a third grammar):
 * - DesignRules: style costume (type, default density, lockup side)
 * - CompositionGrammar: lockup/hero zones + composition.intent
 * - moodPriors: soft density / ornament / whitespace weights
 * - graphicLibrary/grammar: kit-face graphic picks (frontDecor), not motif search
 * - CompositionStrategy: which motif layout family to try on blank/compose faces
 */
import type { StyleType } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import { decorationBudgetOf } from '../brain/VisualConcept'
import { moodPrior } from '../brain/moodPriors'
import type { MotifRecipeId } from './artMotifCompose'

export type CompositionStrategy =
  | 'framed-content'
  | 'balanced-corners'
  | 'top-bottom-balance'
  | 'pattern-field'
  | 'minimal-accent'
  | 'asymmetric-editorial'
  | 'hero-with-support'

export type CompositionTargets = {
  densityTarget: number
  whitespaceTarget: number
  symmetryTarget: number
  decorationLevel: number
  focalStrength: number
  balanceTarget: number
  compositionBias: CompositionStrategy
  framePreference: number
  ornamentPreference: number
}

/** Design-intent layer for Phase 2. Not a second DesignPlan contract. */
export type DesignIntent = CompositionTargets

/** Custom (non-stock-recipe) strategies clamp atom scale to this range. */
export const CUSTOM_STRATEGY_SCALE: Partial<Record<CompositionStrategy, { min: number; max: number }>> = {
  'minimal-accent': { min: 0.4, max: 0.72 },
  'asymmetric-editorial': { min: 0.42, max: 0.9 },
  'hero-with-support': { min: 0.48, max: 1.05 },
}

export type CompositionScore = {
  hierarchy: number
  balance: number
  whitespace: number
  styleConsistency: number
  familyConsistency: number
  decorationDensity: number
  assetCompatibility: number
  alignment: number
  rhythm: number
  collisionSafety: number
  productionSafety: number
  total: number
}

/** Weights sum to 1. Reuses existing craft axes rather than a third scorecard. */
export const COMPOSITION_SCORE_WEIGHTS: Record<keyof Omit<CompositionScore, 'total'>, number> = {
  hierarchy: 0.16,
  balance: 0.12,
  whitespace: 0.12,
  styleConsistency: 0.1,
  familyConsistency: 0.16,
  decorationDensity: 0.08,
  assetCompatibility: 0.08,
  alignment: 0.06,
  rhythm: 0.05,
  collisionSafety: 0.04,
  productionSafety: 0.03,
}

const RECIPE_OF: Record<CompositionStrategy, MotifRecipeId> = {
  'framed-content': 'luxury-frame',
  'balanced-corners': 'corner-deco',
  'top-bottom-balance': 'band-story',
  'pattern-field': 'stamp-field',
  'minimal-accent': 'stamp-field',
  'asymmetric-editorial': 'corner-deco',
  'hero-with-support': 'stamp-field',
}

export function recipeForStrategy(strategy: CompositionStrategy): MotifRecipeId {
  return RECIPE_OF[strategy]
}

export function strategyUsesStockRecipe(strategy: CompositionStrategy): boolean {
  return (
    strategy === 'framed-content' ||
    strategy === 'balanced-corners' ||
    strategy === 'top-bottom-balance' ||
    strategy === 'pattern-field'
  )
}

export function strategyForRecipe(recipe: MotifRecipeId): CompositionStrategy {
  if (recipe === 'luxury-frame') return 'framed-content'
  if (recipe === 'corner-deco') return 'balanced-corners'
  if (recipe === 'band-story') return 'top-bottom-balance'
  return 'pattern-field'
}

export function compositionTargets(plan: DesignPlan, style?: StyleType | string): CompositionTargets {
  const mood = (style || plan.style) as StyleType
  const prior = moodPrior(mood)
  const intent = plan.composition.intent
  const highAir = plan.composition.negativeSpace === 'high' || prior.fieldSparse >= 0.7 || plan.visualIntent === 'air'
  const whitespaceTarget =
    plan.composition.negativeSpace === 'high' ? 0.74 : highAir ? 0.66 : plan.composition.negativeSpace === 'low' ? 0.36 : 0.52
  const symmetric =
    intent === 'symmetric' || intent === 'grid' || intent === 'floating' || intent === 'full-bleed'
  const densityTarget =
    plan.decor.density === 'sparse' || prior.density === 'sparse' || plan.decor.restrainExtras
      ? 0.22
      : plan.decor.density === 'dense'
        ? 0.55
        : 0.38
  const compositionBias: CompositionStrategy = (asStrategy(plan.visualConcept.strategyBias?.[0]) ??
    (symmetric
      ? mood === 'luxury' || mood === 'classic'
        ? 'framed-content'
        : 'balanced-corners'
      : intent === 'editorial' || intent === 'diagonal' || intent === 'asymmetric'
        ? 'asymmetric-editorial'
        : 'top-bottom-balance'))

  const budget = decorationBudgetOf(plan)

  return {
    densityTarget: Math.min(densityTarget, Math.max(0.16, budget * 0.7)),
    whitespaceTarget,
    symmetryTarget: symmetric ? 0.88 : intent === 'offset' ? 0.4 : 0.28,
    decorationLevel: budget,
    focalStrength: plan.heroGraphic.family === 'none' ? 0.45 : 0.78,
    balanceTarget: symmetric ? 0.82 : 0.42,
    compositionBias,
    framePreference:
      plan.visualConcept.family === 'botanical' || plan.visualConcept.family === 'quiet-line'
        ? 0.28
        : mood === 'luxury' || mood === 'classic'
          ? 0.75
          : 0.25,
    ornamentPreference: budget,
  }
}

const STRATEGY_NAMES: CompositionStrategy[] = [
  'framed-content',
  'balanced-corners',
  'top-bottom-balance',
  'pattern-field',
  'minimal-accent',
  'asymmetric-editorial',
  'hero-with-support',
]

function asStrategy(raw?: string): CompositionStrategy | undefined {
  return STRATEGY_NAMES.find((s) => s === raw)
}

export function allowedStrategies(plan: DesignPlan): CompositionStrategy[] {
  const style = plan.style
  const intent = plan.composition.intent
  const sparse =
    plan.decor.density === 'sparse' ||
    plan.decor.restrainExtras ||
    moodPrior(style).fieldSparse >= 0.65 ||
    decorationBudgetOf(plan) <= 0.28
  const hasHero = plan.heroGraphic.family !== 'none'
  const editorial = intent === 'asymmetric' || intent === 'editorial' || intent === 'diagonal' || intent === 'offset'
  const out: CompositionStrategy[] = []
  const add = (s: CompositionStrategy) => {
    if (!out.includes(s)) out.push(s)
  }

  for (const raw of plan.visualConcept.strategyBias ?? []) {
    const s = asStrategy(raw)
    if (s) add(s)
  }

  if (style === 'luxury' || style === 'classic') {
    add('framed-content')
    if (plan.visualConcept.family !== 'botanical' && plan.visualConcept.family !== 'harvest') add('balanced-corners')
    add('minimal-accent')
    if (hasHero) add('hero-with-support')
    if (editorial || plan.visualConcept.family === 'botanical') add('asymmetric-editorial')
    else if (!sparse) add('top-bottom-balance')
    if (!sparse && plan.visualConcept.family !== 'botanical') add('pattern-field')
  } else if (style === 'minimal') {
    add('minimal-accent')
    add('balanced-corners')
    add('asymmetric-editorial')
    if (hasHero) add('hero-with-support')
    if (!sparse) add('pattern-field')
  } else if (style === 'modern') {
    add('pattern-field')
    add('top-bottom-balance')
    add('asymmetric-editorial')
    add('balanced-corners')
    if (!sparse) add('framed-content')
  } else {
    add('balanced-corners')
    add('top-bottom-balance')
    add('pattern-field')
    add(editorial ? 'asymmetric-editorial' : 'minimal-accent')
    if (hasHero) add('hero-with-support')
  }

  while (out.length < 3) {
    for (const fallback of ['balanced-corners', 'minimal-accent', 'framed-content'] as CompositionStrategy[]) {
      add(fallback)
      if (out.length >= 3) break
    }
    break
  }
  return out.slice(0, 5)
}

export function weightedTotal(score: Omit<CompositionScore, 'total'>): number {
  let sum = 0
  for (const [key, weight] of Object.entries(COMPOSITION_SCORE_WEIGHTS) as [keyof typeof COMPOSITION_SCORE_WEIGHTS, number][]) {
    sum += (score[key] ?? 0) * weight
  }
  return Math.round(sum * 10) / 10
}

export function clampScore(n: number): number {
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}
