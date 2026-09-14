/**
 * Phase 2 — candidate critic.
 * Does not replace CritiqueEngine.critiquePlan (post-artwork KEEP/MODIFY).
 * Structured KEEP | MODIFY | REJECT for composition candidates only.
 */
import type { DesignPlan } from '../brain/DesignPlan'
import { boxesCollide, type DesignRegion } from './artDesignRegions'
import type { MotifSlot } from './artMotifCompose'
import { atomFitsConceptFamily, motifFamilyOf } from './artMotifFamily'
import { visualWeightOf } from './artMotifMeta'
import type { CompositionScore, CompositionTargets } from './compositionStrategy'

export type CandidateCritiqueStatus = 'KEEP' | 'MODIFY' | 'REJECT'

export type CandidateCritiqueIssue = {
  topic: string
  note: string
}

export type CandidateCritique = {
  status: CandidateCritiqueStatus
  issues: CandidateCritiqueIssue[]
  scoreAdjustments: { topic: string; delta: number }[]
}

export function critiqueCandidate(input: {
  slots: MotifSlot[]
  lockup?: { x: number; y: number; w: number; h: number }
  heroBox?: { x: number; y: number; w: number; h: number }
  targets: CompositionTargets
  score: CompositionScore
  regions?: DesignRegion[]
  plan?: Pick<DesignPlan, 'visualConcept'>
}): CandidateCritique {
  const issues: CandidateCritiqueIssue[] = []
  const scoreAdjustments: { topic: string; delta: number }[] = []
  let reject = false
  const wanted = input.plan?.visualConcept.family
  if (wanted && input.slots.length) {
    const bad = input.slots.filter(
      (s) => !atomFitsConceptFamily(s.atom, wanted, input.plan?.visualConcept.supportFamily),
    )
    if (bad.length) {
      issues.push({
        topic: 'family',
        note: `HARD CONSTRAINT FAILURE: ${wanted} yüzünde ${motifFamilyOf(bad[0].atom)} asset.`,
      })
      scoreAdjustments.push({ topic: 'familyConsistency', delta: -1000 })
      reject = true
    }
  }

  for (const slot of input.slots) {
    if (slot.role !== 'frame' && input.lockup && boxesCollide(slot.box, input.lockup, 0.4)) {
      issues.push({ topic: 'collision', note: 'Motif lockup alanına biniyor.' })
      scoreAdjustments.push({ topic: 'collisionSafety', delta: -40 })
      reject = true
    }
    if (input.heroBox && input.heroBox.w > 0 && boxesCollide(slot.box, input.heroBox, 0.4)) {
      issues.push({ topic: 'collision', note: 'Motif hero ile çakışıyor.' })
      scoreAdjustments.push({ topic: 'collisionSafety', delta: -35 })
      reject = true
    }
  }

  const decoWeight = input.slots.reduce((n, s) => Math.max(n, visualWeightOf(s.atom) * s.opacity), 0)
  if (decoWeight >= 0.72 && input.targets.decorationLevel < 0.5) {
    issues.push({ topic: 'hierarchy', note: 'Dekor marka/ürün hiyerarşisini eziyor.' })
    scoreAdjustments.push({ topic: 'hierarchy', delta: -22 })
  }

  if (input.score.whitespace + 18 < input.targets.whitespaceTarget * 100) {
    issues.push({ topic: 'whitespace', note: 'Negatif alan hedefinin altında.' })
    scoreAdjustments.push({ topic: 'whitespace', delta: -12 })
  }

  if (input.score.styleConsistency < 42) {
    issues.push({ topic: 'style', note: 'Asset stili brief ile uyumsuz.' })
    scoreAdjustments.push({ topic: 'styleConsistency', delta: -16 })
  }

  if (input.score.decorationDensity < 40 && input.targets.densityTarget <= 0.28) {
    issues.push({ topic: 'density', note: 'Dekor yoğunluğu brief için fazla.' })
    scoreAdjustments.push({ topic: 'decorationDensity', delta: -10 })
  }

  const protectedHit = (input.regions ?? []).some((r) => r.protected && r.id === 'center' && input.slots.some((s) => s.role !== 'frame' && boxesCollide(s.box, r.rect, 0)))
  if (protectedHit) {
    issues.push({ topic: 'region', note: 'Korumalı merkez region dekorasyona açıldı.' })
    reject = true
  }

  if (input.score.collisionSafety < 20 || input.score.productionSafety < 20) reject = true

  const familyFail = issues.some((i) => i.topic === 'family')
  if (familyFail) reject = true
  const status: CandidateCritiqueStatus = reject ? 'REJECT' : issues.length ? 'MODIFY' : 'KEEP'
  return { status, issues, scoreAdjustments }
}
