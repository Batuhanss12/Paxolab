/**
 * Phase 2 — candidate critic.
 * Does not replace CritiqueEngine.critiquePlan (post-artwork KEEP/MODIFY).
 * Structured KEEP | MODIFY | REJECT for composition candidates only.
 */
import type { DesignPlan } from '../brain/DesignPlan'
import { boxesCollide, slotKindToRegion, type DesignRegion, type SlotKind } from './artDesignRegions'
import type { MotifSlot } from './artMotifCompose'
import { atomFitsConceptFamily, motifFamilyOf } from './artMotifFamily'
import { atomRegionAllowed, visualWeightOf } from './artMotifMeta'
import type { CompositionScore, CompositionTargets } from './compositionStrategy'
import { atomAvoided, avoidOf, conceptFidelityOf, lockupOverlapVerdict } from './visualLanguage'

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

function regionOfSlot(slot: MotifSlot, panel?: { x: number; w: number; y: number; h: number }): ReturnType<typeof slotKindToRegion> {
  if (!panel) {
    const kind: SlotKind = slot.role === 'frame' ? 'frame' : slot.role === 'band' ? 'band-bottom' : 'nw'
    return slotKindToRegion(kind)
  }
  const cx = (slot.box.x + slot.box.w / 2 - panel.x) / Math.max(1, panel.w)
  const cy = (slot.box.y + slot.box.h / 2 - panel.y) / Math.max(1, panel.h)
  if (slot.role === 'frame' || (slot.box.w > panel.w * 0.7 && slot.box.h > panel.h * 0.7)) return 'field'
  if (cy < 0.38) return cx < 0.38 ? 'nw' : cx > 0.62 ? 'ne' : 'top'
  if (cy > 0.62) return cx < 0.38 ? 'sw' : cx > 0.62 ? 'se' : 'bottom'
  return cx < 0.38 ? 'left' : cx > 0.62 ? 'right' : 'center'
}

export function critiqueCandidate(input: {
  slots: MotifSlot[]
  lockup?: { x: number; y: number; w: number; h: number }
  heroBox?: { x: number; y: number; w: number; h: number }
  targets: CompositionTargets
  score: CompositionScore
  regions?: DesignRegion[]
  plan?: Pick<DesignPlan, 'visualConcept' | 'visualIntent'>
  panel?: { x: number; y: number; w: number; h: number }
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
    const region = regionOfSlot(slot, input.panel)
    if (!atomRegionAllowed(slot.atom, region)) {
      issues.push({ topic: 'REGION_VIOLATION', note: `${slot.atom.sourceName} ${region} bölgesinde yasak.` })
      scoreAdjustments.push({ topic: 'alignment', delta: -28 })
      reject = true
    }
    const lock = lockupOverlapVerdict(slot, input.lockup)
    if (lock.verdict === 'reject') {
      issues.push({ topic: 'LOCKUP_OVERLAP', note: 'Dolu motif lockup alanının içinden geçiyor.' })
      scoreAdjustments.push({ topic: 'collisionSafety', delta: -40 })
      reject = true
    } else if (lock.verdict === 'modify') {
      issues.push({ topic: 'LOCKUP_OVERLAP', note: 'Motif lockup’a fazla yaklaştı.' })
      scoreAdjustments.push({ topic: 'collisionSafety', delta: -18 })
    }
    if (input.heroBox && input.heroBox.w > 0 && boxesCollide(slot.box, input.heroBox, 0.4)) {
      issues.push({ topic: 'collision', note: 'Motif hero ile çakışıyor.' })
      scoreAdjustments.push({ topic: 'collisionSafety', delta: -35 })
      reject = true
    }
  }

  const decoWeight = input.slots.reduce((n, s) => Math.max(n, visualWeightOf(s.atom) * s.opacity), 0)
  if (decoWeight >= 0.72 && input.targets.decorationLevel < 0.5) {
    issues.push({ topic: 'DECORATION_OVERLOAD', note: 'Dekor marka/ürün hiyerarşisini eziyor.' })
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
    issues.push({ topic: 'DECORATION_OVERLOAD', note: 'Dekor yoğunluğu brief için fazla.' })
    scoreAdjustments.push({ topic: 'decorationDensity', delta: -10 })
  }

  if (input.plan) {
    const avoided = input.slots.filter((s) => atomAvoided(s.atom, avoidOf(input.plan!)))
    if (avoided.length) {
      issues.push({ topic: 'AVOID_VIOLATION', note: 'Concept’in kaçındığı motif dili kullanıldı.' })
      scoreAdjustments.push({ topic: 'conceptFidelity', delta: -12 })
    }
    const fidelity = input.score.conceptFidelity ?? conceptFidelityOf(input.slots, input.plan)
    if (input.targets.visualLanguage && fidelity < 42) {
      issues.push({ topic: 'CONCEPT_MISMATCH', note: 'Görsel dil concept ile zayıf örtüşüyor.' })
      scoreAdjustments.push({ topic: 'conceptFidelity', delta: -22 })
      scoreAdjustments.push({ topic: 'assetCompatibility', delta: -12 })
    } else if (input.targets.visualLanguage && fidelity < 58) {
      issues.push({ topic: 'VISUAL_LANGUAGE_MISMATCH', note: 'Asset görsel dili concept’ten sapıyor.' })
      scoreAdjustments.push({ topic: 'conceptFidelity', delta: -10 })
    }
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
