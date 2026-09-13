import { allowedHeroes } from './ArtDirection'
import { densityCap } from './CompositionGrammar'
import type { CritiqueReport } from './CritiqueEngine'
import { planSummaryTr, type DesignPlan, type HeroFamily, type PrimitiveId } from './DesignPlan'

const QUIET_PRIMS: PrimitiveId[] = ['rule', 'tick']

function topicFailed(report: CritiqueReport, topic: string): boolean {
  return report.hints.some((hint) => hint.action === 'MODIFY' && hint.topic === topic)
}

/** Map critique → plan numbers/families. Never edits SVG. */
export function repairPlan(plan: DesignPlan, report: CritiqueReport): DesignPlan {
  if (!report.needsRepair && report.verdict !== 'modify') return plan

  let next: DesignPlan = {
    ...plan,
    decor: { ...plan.decor },
    composition: { ...plan.composition },
    heroGraphic: { ...plan.heroGraphic },
    illustrationSystem: { ...plan.illustrationSystem, primitives: [...plan.illustrationSystem.primitives] },
    patternSystem: { ...plan.patternSystem },
    density: { ...plan.density },
    crop: { ...plan.crop },
    artDirection: {
      ...plan.artDirection,
      antiRepetition: { ...plan.artDirection.antiRepetition },
    },
  }

  if (topicFailed(report, 'densityFront') || topicFailed(report, 'density') || next.cue === 'force-overload') {
    next.cue = next.cue === 'force-overload' ? 'none' : next.cue
    next.decor.density = 'sparse'
    next.decor.restrainExtras = true
    next.composition.negativeSpace = 'high'
    next.composition.opticalCenter = 0.38
    next.illustrationSystem.density = 'sparse'
    next.illustrationSystem.primitives = next.illustrationSystem.primitives
      .filter((id) => QUIET_PRIMS.includes(id))
      .slice(0, densityCap(next.style, 'sparse'))
    next.density = { overall: 'sparse', front: 'sparse', side: 'sparse', back: 'sparse' }
    next.patternSystem.opacity = Math.min(next.patternSystem.opacity, 0.12)
    next.heroGraphic.scale = Math.min(next.heroGraphic.scale, 0.92)
    next.crop = { heroCrop: 0.9, safeInsets: Math.max(next.crop.safeInsets, 3.1) }
    next.artDirection.crop = 'open'
  }

  if (topicFailed(report, 'lockupClearance')) {
    next.decor.lockupClearance = true
    next.crop.safeInsets = Math.max(next.crop.safeInsets, 3.4)
    next.heroGraphic.clearance = true
    next.patternSystem.avoidLockup = true
  }

  if (topicFailed(report, 'repetitionPenalty') || topicFailed(report, 'repetition')) {
    const allowed = allowedHeroes(next.style, next.sector)
    const current = next.heroGraphic.family
    const swap = allowed.find((family) => family !== current) as HeroFamily | undefined
    if (swap) next.heroGraphic.family = swap
  }

  if (topicFailed(report, 'sideIntentionality')) {
    next.patternSystem.sideIntentional = true
  }

  if (topicFailed(report, 'hierarchy') || topicFailed(report, 'hierarchyStrength')) {
    next.hierarchy = {
      primary: 'brand',
      secondary: next.hierarchy.secondary,
      tertiary: 'volume',
      order: 'brand > product > volume/descriptor',
    }
  }

  next.summaryTr = planSummaryTr(next)
  return next
}
