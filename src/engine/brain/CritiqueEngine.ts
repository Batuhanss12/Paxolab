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
}

/** v3 report-only. Do not auto-rewrite SVG (v4). */
export function critiquePlan(plan: DesignPlan, scorecard: DesignScorecard): CritiqueReport {
  const hints: CritiqueHint[] = [
    { action: 'KEEP', topic: 'hierarchy', note: 'Marka lockup’ta birincil kalsın.' },
    { action: 'KEEP', topic: 'lockup', note: 'Lockup clearance / knockout korunmalı.' },
  ]

  if (plan.style === 'luxury' && plan.decor.density === 'dense') {
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

  const verdict = hints.some((h) => h.action === 'MODIFY' && h.topic === 'honesty') ? 'modify' : 'keep'
  return { verdict, hints, scorecard }
}
