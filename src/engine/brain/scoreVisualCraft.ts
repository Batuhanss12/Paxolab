/**
 * Visual craft scoring — facade orchestrating individual dimension scores.
 * Score components extracted to visualCraftScores.ts; the studio readings live in studioCraft.ts.
 * This file preserves the public VisualCraftScorecard + scoreVisualCraft API.
 */
import { SECTOR_AFFINITY_FLOOR } from '../studio/direction'
import type { DesignBlocker } from './designBlockers'
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
  /**
   * Broken promises, not points. Empty on every one of the 558 faces measured before this shipped;
   * see `designBlockers.ts` for why a score floor could not do this job.
   */
  blockers: DesignBlocker[]
  /** The design half of the export decision. `preflight.exportOk` stays the technical half. */
  exportAllowed: boolean
  /**
   * Which measured-but-unweighted axis is weakest, for the repair route to aim at. `focal`,
   * `categoryFit` and `distinctiveness` are read on every studio face and then left out of the
   * weighted total; before this they changed nothing at all.
   */
  repairSignals: RepairSignal[]
  notes: string[]
}

/** An axis worth re-rolling a candidate for, weakest first. */
export type RepairSignal = { axis: 'focal' | 'categoryFit' | 'distinctiveness'; score: number }

/**
 * When a reading is weak enough to be worth aiming a repair candidate at.
 *
 * One number for all three was wrong, and measurably so: 50 sat on `distinctiveness`'s mathematical
 * ceiling and above `categoryFit`'s admissible floor, so both signalled on faces the engine had
 * produced exactly as designed. Each threshold now comes from the producer of that reading.
 */
const REPAIR_THRESHOLD: Record<RepairSignal['axis'], number> = {
  /* `studioFocal`'s own bands: 85 and 60 are healthy, 45/40/35 each name a real defect. */
  focal: 50,
  /*
   * The chooser admits any archetype at or above `SECTOR_AFFINITY_FLOOR`, so the bottom of the
   * band is not a fault. Below it means the family was pinned or spoken for against the sector's
   * own reference — the only case worth routing.
   */
  categoryFit: Math.round(SECTOR_AFFINITY_FLOOR * 100),
  /*
   * The roadmap's target is "each pair differs on at least 2 of the composition axes". With four
   * live axes that is 50 — a target the score can now actually pass, which it could not while half
   * the axes were structurally constant.
   */
  distinctiveness: 50,
}

export type CraftSpec = Pick<DesignSpec, 'artwork' | 'preflight' | 'copy' | 'kind'> & StudioCraftSpec

/** Design-quality score. Separate from "code ran". Evidence is face / back markup + preflight, and the studio ledger when there is one. */
export function scoreVisualCraft(spec: CraftSpec, plan: DesignPlan): VisualCraftScorecard {
  const ctx = makeScoreCtx(spec, plan)
  const notes: string[] = []
  const blockers: DesignBlocker[] = []

  const hero = scoreHero(ctx, notes)
  const composition = scoreComposition(ctx, notes)
  const hierarchy = scoreHierarchy(ctx, notes, blockers)
  const typography = scoreTypography(ctx, notes)
  const decoration = scoreDecoration(ctx, notes, blockers)
  const sectorFit = scoreSectorFit(ctx)
  const productFit = scoreProductFit(ctx)
  const informationDesign = scoreInformationDesign(ctx, notes, blockers)
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
    blockers,
    /*
     * The design half only. `FormaLocalEngine` ANDs this with `preflight.exportOk` — putting the
     * design gate inside preflight would be a cycle, because `production` above already reads
     * preflight's verdict.
     */
    exportAllowed: blockers.length === 0,
    repairSignals: [],
    notes,
  }
  if (ctx.studio) {
    card.focal = clampScore(studioFocal(ctx.studio))
    card.categoryFit = clampScore(studioCategoryFit(ctx.studio))
    const distinct = studioDistinctiveness(ctx.studio.report)
    if (distinct != null) card.distinctiveness = clampScore(distinct)
    const readings: RepairSignal[] = [
      { axis: 'focal', score: card.focal },
      { axis: 'categoryFit', score: card.categoryFit },
      ...(card.distinctiveness == null ? [] : [{ axis: 'distinctiveness' as const, score: card.distinctiveness }]),
    ]
    card.repairSignals = readings.filter((r) => r.score < REPAIR_THRESHOLD[r.axis]).sort((a, b) => a.score - b.score)
  }
  return card
}
