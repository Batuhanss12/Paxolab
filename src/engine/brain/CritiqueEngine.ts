import { densityCap } from './CompositionGrammar'
import type { DesignScorecard } from './DesignScore'
import type { DesignPlan } from './DesignPlan'

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
export function critiquePlan(plan: DesignPlan, scorecard: DesignScorecard): CritiqueReport {
  const hints: CritiqueHint[] = [
    { action: 'KEEP', topic: 'hierarchy', note: 'Marka lockup’ta birincil kalsın.' },
    { action: 'KEEP', topic: 'lockup', note: 'Lockup clearance / knockout korunmalı.' },
  ]

  if (plan.style === 'luxury' && plan.decor.density === 'dense' && !plan.decor.restrainExtras) {
    hints.push({
      action: 'MODIFY',
      topic: 'density',
      note: 'Lüks sıkılaştırmak için “daha lüks yap” — daha az motif, daha çok hava.',
    })
  }
  if (plan.decor.restrainExtras) {
    hints.push({ action: 'KEEP', topic: 'restraint', note: 'Ek köşe/tick baskısı düşürüldü; foil lockup’ı kesmesin.' })
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

  const needsRepair = densityFail || lockupFail || hierarchyFail || sectorFail || repetitionFail || sideFail
  return {
    verdict: needsRepair ? 'modify' : 'keep',
    hints,
    scorecard,
    needsRepair,
  }
}
