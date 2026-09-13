import { densityCap } from './CompositionGrammar'
import type { DesignScorecard } from './DesignScore'
import type { DesignPlan } from './DesignPlan'
import { detectCrossSectorBleed, lookupVocabulary, resolveSubProduct } from './SectorVisualVocabulary'

export type CritiqueHint = {
  action: 'KEEP' | 'MODIFY'
  topic: string
  note: string
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

  const densityFail = failed(scorecard.densityFront, 50)
  const lockupFail = failed(scorecard.lockupClearance, 45)
  const hierarchyFail = failed(scorecard.hierarchyStrength ?? scorecard.hierarchy, 50)
  const sectorFail = failed(scorecard.sectorBlind, 40)
  const sideFail = failed(scorecard.sideIntentionality, 35)
  const repetitionFail = (scorecard.repetitionPenalty ?? 0) > 55
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

  const needsRepair = densityFail || lockupFail || hierarchyFail || sectorFail || repetitionFail || sideFail || crossBleed
  return {
    verdict: needsRepair ? 'modify' : 'keep',
    hints,
    scorecard,
    needsRepair,
  }
}
