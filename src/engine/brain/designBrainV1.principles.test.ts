import { describe, expect, it } from 'vitest'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { createPlan } from './DesignDirector'
import { principleForCriticTopic, principlesFor } from './DesignKnowledge'
import { critiquePlan } from './CritiqueEngine'
import { repairPlan } from './RepairPlanner'
import { mirrorDesignIntent } from './DesignPlan'
import type { DesignScorecard } from './DesignScore'
import { resetArtMemory } from './DesignMemory'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function planOf(slug: string) {
  resetArtMemory()
  const job = jobOf(slug)
  return createPlan({
    brief: briefFrom(job),
    style: job.styleType,
    blankCanvas: false,
    variationIndex: 0,
  })
}

function score(over: Partial<DesignScorecard> = {}): DesignScorecard {
  return {
    hierarchy: 80,
    density: 80,
    honesty: 90,
    notes: [],
    lockupClearance: 90,
    densityFront: 82,
    hierarchyStrength: 80,
    sectorBlind: 80,
    repetitionPenalty: 0,
    sideIntentionality: 88,
    ...over,
  }
}

function core(hints: { action: string; topic: string; note: string; principle?: string }[]) {
  return hints.map(({ action, topic, note }) => ({ action, topic, note }))
}

describe('Design Brain V1 principle checks (passive labels)', () => {
  it('maps only existing critic topics onto the 8 principle ids', () => {
    expect(principleForCriticTopic('hierarchy')).toBe('hierarchy-brand-first')
    expect(principleForCriticTopic('hierarchyStrength')).toBe('hierarchy-brand-first')
    expect(principleForCriticTopic('lockup')).toBe('lockup-is-sacred')
    expect(principleForCriticTopic('lockupClearance')).toBe('lockup-is-sacred')
    expect(principleForCriticTopic('sectorBlind')).toBe('sector-blind-front')
    expect(principleForCriticTopic('crossSectorBleed')).toBe('sector-blind-front')
    expect(principleForCriticTopic('honesty')).toBe('marks-not-on-hero')
    expect(principleForCriticTopic('density')).toBe('negative-space-is-luxury')
    expect(principleForCriticTopic('densityFront')).toBe('negative-space-is-luxury')
    expect(principleForCriticTopic('restraint')).toBe('negative-space-is-luxury')
    expect(principleForCriticTopic('styleLeakage')).toBe('one-motif-family')
    expect(principleForCriticTopic('sideIntentionality')).toBeUndefined()
    expect(principleForCriticTopic('repetitionPenalty')).toBeUndefined()
    expect(principleForCriticTopic('legal-belongs-back')).toBeUndefined()
  })

  it('labels hints only when the plan already carries that principle', () => {
    const luxury = planOf('01-parfum-tuck-luxury')
    const labeled = critiquePlan(luxury, score())
    expect(labeled.hints.find((h) => h.topic === 'hierarchy')?.principle).toBe('hierarchy-brand-first')
    expect(labeled.hints.find((h) => h.topic === 'lockup')?.principle).toBe('lockup-is-sacred')
    expect(labeled.hints.find((h) => h.topic === 'density')?.principle).toBe('negative-space-is-luxury')
    expect(labeled.hints.find((h) => h.topic === 'density')?.action).toBe('MODIFY')
    expect(labeled.needsRepair).toBe(false)

    const blank = critiquePlan({ ...luxury, principles: [] }, score())
    expect(blank.needsRepair).toBe(labeled.needsRepair)
    expect(blank.verdict).toBe(labeled.verdict)
    expect(core(blank.hints)).toEqual(core(labeled.hints))
    expect(blank.hints.every((h) => h.principle === undefined)).toBe(true)
  })

  it('does not stamp luxury air principle on a modern densityFront fail', () => {
    const modern = planOf('14-kulaklik-tuck-modern')
    expect(modern.principles).not.toContain('negative-space-is-luxury')
    const report = critiquePlan(modern, score({ densityFront: 10 }))
    const density = report.hints.find((h) => h.topic === 'densityFront')
    expect(density?.action).toBe('MODIFY')
    expect(density?.principle).toBeUndefined()
    expect(report.needsRepair).toBe(true)
  })

  it('does not change note strings or repair thresholds', () => {
    const cologne = planOf('02-kolonya-tuck-classic')
    const report = critiquePlan(cologne, score())
    expect(report.hints.find((h) => h.topic === 'hierarchy')?.note).toBe('Marka lockup\u2019ta birincil kals\u0131n.')
    expect(report.hints.find((h) => h.topic === 'lockup')?.note).toBe('Lockup clearance / knockout korunmal\u0131.')
    expect(report.hints.some((h) => h.topic === 'density')).toBe(false)
    expect(report.needsRepair).toBe(false)
    expect(cologne.principles).toEqual(principlesFor('classic', 'box'))
  })

  it('refreshs designIntent after density repair without inventing a new costume', () => {
    const plan = planOf('01-parfum-tuck-luxury')
    expect(plan.designIntent.density).toBe('dense')
    const report = critiquePlan(plan, score({ densityFront: 10 }))
    expect(report.needsRepair).toBe(true)
    const next = repairPlan(plan, report)
    expect(next.decor.density).toBe('sparse')
    expect(next.composition.negativeSpace).toBe('high')
    expect(next.decor.restrainExtras).toBe(true)
    expect(next.designIntent).toEqual(mirrorDesignIntent(next))
    expect(next.designIntent.density).toBe('sparse')
    expect(next.designIntent.negativeSpace).toBe('high')
    expect(next.designIntent.restrainExtras).toBe(true)
    expect(next.visualConcept.id).toBe(plan.visualConcept.id)
    expect(next.visualLanguage).toEqual(plan.visualLanguage)
    expect(next.heroGraphic.family).toBe(plan.heroGraphic.family)
    expect(next.artDirection.chrome).toBe(plan.artDirection.chrome)
  })
})
