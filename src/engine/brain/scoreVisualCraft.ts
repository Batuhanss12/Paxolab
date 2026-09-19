/**
 * Visual craft scoring — facade orchestrating individual dimension scores.
 * Score components extracted to visualCraftScores.ts; the studio readings live in studioCraft.ts.
 * This file preserves the public VisualCraftScorecard + scoreVisualCraft API.
 */
import type { DesignSpec } from '../../types'
import type { DesignPlan } from './DesignPlan'
import { weightedCraftScore } from './scoreConfig'
import { studioCategoryFit, studioDistinctiveness, studioFocal, type StudioCraftSpec } from './studioCraft'
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
  /*
   * Design quality is not one number. `visualCraft` stays the weighted craft total the F-8 gate
   * reads; the three below are separate readings the audit asked for, kept out of the total so
   * that a face is not scored twice for the same fact. All three are studio-only for now.
   */
  /** Where the eye lands: a real focal element, or the field carrying the face. */
  focal?: number
  /** The archetype's own sector fit, from its DNA — "does this skeleton belong on this shelf". */
  categoryFit?: number
  /** Mean composition distance to the other candidates that were offered. Phase 3 moves this. */
  distinctiveness?: number
  /** Personality fit — arrives with Phase 3's BrandPersonality; absent until then. */
  brandFit?: number
  notes: string[]
}

export type CraftSpec = Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'> & StudioCraftSpec

/** Design-quality score. Separate from "code ran". Evidence is face / back markup + preflight, and the studio ledger when there is one. */
export function scoreVisualCraft(spec: CraftSpec, plan: DesignPlan): VisualCraftScorecard {
  const ctx = makeScoreCtx(spec, plan)
  const notes: string[] = []

  const hero = scoreHero(ctx, notes)
  const composition = scoreComposition(ctx, notes)
  const hierarchy = scoreHierarchy(ctx, notes)
  const typography = scoreTypography(ctx, notes)
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

  const card: VisualCraftScorecard = {
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
  if (ctx.studio) {
    card.focal = clampScore(studioFocal(ctx.studio))
    card.categoryFit = clampScore(studioCategoryFit(ctx.studio))
    const distinct = studioDistinctiveness(ctx.studio.report)
    if (distinct != null) card.distinctiveness = clampScore(distinct)
  }
  return card
}
