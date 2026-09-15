import { densityCap } from './CompositionGrammar'
import type { DesignScorecard } from './DesignScore'
import type { DesignPlan } from './DesignPlan'
import { principleForCriticTopic, type PrincipleId } from './DesignKnowledge'
import { detectCrossSectorBleed, lookupVocabulary, resolveSubProduct } from './SectorVisualVocabulary'
import { CRITIQUE_THRESHOLDS } from './scoreConfig'

export type CritiqueHint = {
  action: 'KEEP' | 'MODIFY'
  topic: string
  note: string
  principle?: PrincipleId
}

export type CritiqueReport = {
  verdict: 'keep' | 'modify'
  hints: CritiqueHint[]
  scorecard: DesignScorecard
  needsRepair?: boolean
  repaired?: boolean
}

function failed(score: number | undefined, floor: number): boolean {
  return (score ?? 100) < floor
}

/** Scores decide KEEP / MODIFY. Luxury+dense remains a hint, not a repair. */
export function critiquePlan(plan: DesignPlan, scorecard: DesignScorecard, faceMarkup?: string): CritiqueReport {
  const hints: CritiqueHint[] = [
    { action: 'KEEP', topic: 'hierarchy', note: 'Marka lockup\u2019ta birincil kals\u0131n.' },
    { action: 'KEEP', topic: 'lockup', note: 'Lockup clearance / knockout korunmal\u0131.' },
  ]

  const vocab = lookupVocabulary(plan.sector, resolveSubProduct(plan.sector, plan.subProduct || plan.sector))
  const bleedFaults = detectCrossSectorBleed(
    vocab,
    plan.heroGraphic.family,
    plan.patternSystem.family,
    plan.backgroundTreatment,
    plan.sector,
    faceMarkup,
  )
  const crossBleed = bleedFaults.some((f) => f.severity === 'error')
  if (crossBleed) {
    hints.push({
      action: 'MODIFY',
      topic: 'crossSectorBleed',
      note: bleedFaults.map((f) => f.detail).join('; '),
    })
  }

  if (plan.style === 'luxury' && plan.decor.density === 'dense' && !plan.decor.restrainExtras) {
    hints.push({
      action: 'MODIFY',
      topic: 'density',
      note: 'Lüks sıkılaştırmak için "daha lüks yap" — daha az motif, daha çok hava.',
    })
  }
  if (plan.decor.restrainExtras) {
    hints.push({ action: 'KEEP', topic: 'restraint', note: 'Ek k\u00f6\u015fe/tick bask\u0131s\u0131 d\u00fc\u015f\u00fcr\u00fcld\u00fc; foil lockup\u2019\u0131 kesmesin.' })
  }
  if (scorecard.honesty < 80) {
    hints.push({ action: 'MODIFY', topic: 'honesty', note: scorecard.notes.join(' · ') || 'Örnek legal / barkod dürüstlüğü.' })
  }

  const densityFail = failed(scorecard.densityFront, CRITIQUE_THRESHOLDS.densityFront)
  const lockupFail = failed(scorecard.lockupClearance, CRITIQUE_THRESHOLDS.lockupClearance)
  const hierarchyFail = failed(
    scorecard.hierarchyStrength ?? scorecard.hierarchy,
    CRITIQUE_THRESHOLDS.hierarchyStrength,
  )
  const sectorFail = failed(scorecard.sectorBlind, CRITIQUE_THRESHOLDS.sectorBlind)
  const sideFail = failed(scorecard.sideIntentionality, CRITIQUE_THRESHOLDS.sideIntentionality)
  const repetitionFail = (scorecard.repetitionPenalty ?? 0) > CRITIQUE_THRESHOLDS.repetitionPenalty
  const cap = densityCap(plan.style, plan.decor.density)

  if (densityFail) {
    hints.push({
      action: 'MODIFY',
      topic: 'densityFront',
      note: `Dekor aşırı — tek kahraman, primitive tavan ${cap}.`,
    })
  }
  if (lockupFail) {
    hints.push({ action: 'MODIFY', topic: 'lockupClearance', note: 'Lockup penceresi / knockout eksik.' })
  }
  if (hierarchyFail) {
    hints.push({ action: 'MODIFY', topic: 'hierarchyStrength', note: 'Marka > ürün > hacim zayıf.' })
  }
  if (sectorFail) {
    hints.push({ action: 'MODIFY', topic: 'sectorBlind', note: 'Ön yüz sektörü yanlış okunuyor.' })
  }
  if (repetitionFail) {
    hints.push({ action: 'MODIFY', topic: 'repetitionPenalty', note: 'Aynı hero ailesi tekrar ediyor.' })
  }
  if (sideFail) {
    hints.push({ action: 'MODIFY', topic: 'sideIntentionality', note: 'Yan panel artık / gürültü değil, bilinçli pattern olmalı.' })
  }

  const leak = faceMarkup && plan.sector === 'serum' && /data-pattern="contour"|data-pattern="ornament"/.test(faceMarkup)
  if (leak || (plan.sector === 'serum' && (plan.patternSystem.family === 'contour' || plan.patternSystem.family === 'ornament'))) {
    hints.push({ action: 'MODIFY', topic: 'styleLeakage', note: 'Serum y\u00fczeyinde contour/ornament s\u0131z\u0131nt\u0131s\u0131.' })
  }

  const needsRepair =
    densityFail || lockupFail || hierarchyFail || sectorFail || repetitionFail || sideFail || crossBleed || !!leak ||
    (plan.sector === 'serum' && (plan.patternSystem.family === 'contour' || plan.patternSystem.family === 'ornament'))
  return {
    verdict: needsRepair ? 'modify' : 'keep',
    hints: hints.map((hint) => labelHint(plan, hint)),
    scorecard,
    needsRepair,
  }
}

function labelHint(plan: DesignPlan, hint: CritiqueHint): CritiqueHint {
  const principle = principleForCriticTopic(hint.topic)
  if (principle && plan.principles.includes(principle)) return { ...hint, principle }
  return hint
}
