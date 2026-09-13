/**
 * Visual craft scoring — facade orchestrating individual dimension scores.
 * Score components extracted to visualCraftScores.ts.
 * This file preserves the public VisualCraftScorecard + scoreVisualCraft API.
 */
import type { DesignSpec } from '../../types'
import type { DesignPlan } from './DesignPlan'
import { weightedCraftScore } from './scoreConfig'
import {
  clampScore,
  makeScoreCtx,
  scoreComposition,
  scoreDecoration,
  scoreHero,
  scoreHierarchy,
  scoreInformationDesign,
  scoreOriginality,
  scoreProductFit,
  scoreSectorFit,
  scoreTypography,
} from './visualCraftScores'

export type VisualCraftScorecard = {
  visualCraft: number
  composition: number
  hierarchy: number
  typography: number
  hero: number
  decoration: number
  sectorFit: number
  productFit: number
  informationDesign: number
  originality: number
  production: number
  notes: string[]
}

/** Design-quality score. Separate from "code ran". Evidence is face / back markup + preflight. */
export function scoreVisualCraft(
  spec: Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'>,
  plan: DesignPlan,
): VisualCraftScorecard {
  const ctx = makeScoreCtx(spec, plan)
  const notes: string[] = []

  const hero = scoreHero(ctx, notes)
  const composition = scoreComposition(ctx)
  const hierarchy = scoreHierarchy(ctx, notes)
  const typography = scoreTypography(ctx)
  const decoration = scoreDecoration(ctx, notes)
  const sectorFit = scoreSectorFit(ctx)
  const productFit = scoreProductFit(ctx)
  const informationDesign = scoreInformationDesign(ctx, notes)
  const originality = scoreOriginality(ctx)

  const production = spec.preflight.exportOk ? 88 : spec.preflight.blocking ? 22 : 48
  if (!spec.preflight.exportOk) notes.push('exportBLOCK')

  const visualCraft = weightedCraftScore({
    hero,
    composition,
    hierarchy,
    informationDesign,
    decoration,
    typography,
    sectorFit,
    productFit,
    originality,
  })

  return {
    visualCraft: clampScore(visualCraft),
    composition: clampScore(composition),
    hierarchy: clampScore(hierarchy),
    typography: clampScore(typography),
    hero: clampScore(hero),
    decoration: clampScore(decoration),
    sectorFit: clampScore(sectorFit),
    productFit: clampScore(productFit),
    informationDesign: clampScore(informationDesign),
    originality: clampScore(originality),
    production: clampScore(production),
    notes,
  }
}
