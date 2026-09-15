import { describe, expect, it } from 'vitest'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { createPlan, resetArtMemory } from '../brain'
import type { MotifAtom } from './artMotifAtomizer'
import type { MotifSlot } from './artMotifCompose'
import {
  assetLanguageFor,
  compareAssetPick,
  constrainAssetPool,
  customSlotCap,
  forbiddenStrategiesFor,
  roleFitOf,
} from './assetLanguage'
import { critiqueCandidate } from './compositionCritic'
import { lookupAssetRecord } from './assetCatalog/catalog'
import { chooseCompositionWinner, scoreCompositionSlots, type CompositionCandidate } from './compositionCandidates'
import { allowedStrategies, compositionTargets, type CompositionScore } from './compositionStrategy'
import { preferredRolesForLanguage, preferredRolesForLanguages } from './visualLanguage'
import type { Panel } from '../../types'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function planOf(job: Job) {
  resetArtMemory()
  return createPlan({
    brief: briefFrom(job),
    style: job.styleType,
    blankCanvas: false,
    variationIndex: 0,
  })
}

function frontPanel(): Panel {
  const w = 70
  const h = 140
  return {
    id: 'front',
    role: 'body',
    x: 0,
    y: 0,
    w,
    h,
    polygon: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  }
}

function stubAtom(partial: Partial<MotifAtom> & Pick<MotifAtom, 'id'>): MotifAtom {
  return {
    sheetId: 'stub',
    sourceName: 'stub.svg',
    bbox: { x: 0, y: 0, w: 20, h: 20 },
    viewBox: '0 0 20 20',
    markup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect width="20" height="20" fill="#111"/></svg>',
    bytes: 120,
    tags: [],
    roleGuess: 'stamp',
    complexity: 4,
    ...partial,
  }
}

function asSlot(atom: MotifAtom, extra: Partial<MotifSlot> = {}): MotifSlot {
  return {
    atom,
    box: extra.box ?? { x: 8, y: 8, w: 12, h: 12 },
    opacity: extra.opacity ?? 0.7,
    par: 'xMidYMid meet',
    lockout: extra.lockout ?? false,
    role: extra.role ?? atom.roleGuess,
  }
}

function candidate(
  id: string,
  plan: ReturnType<typeof planOf>,
  slots: MotifSlot[],
  score: CompositionScore,
): CompositionCandidate {
  return {
    id,
    strategy: 'minimal-accent',
    plan,
    placements: [],
    slots,
    recipeId: 'stamp-field',
    fingerprint: id,
    preScore: score,
    postScore: score,
  }
}

describe('Asset Language decision policy', () => {
  it('compiles preferred / allowed / forbidden as identity of plan fields', () => {
    const plan = planOf(jobOf('01-parfum-tuck-luxury'))
    const assets = assetLanguageFor(plan)
    expect(assets.conceptId).toBe(plan.visualConcept.id)
    expect(assets.preferred.roles).toEqual(preferredRolesForLanguages(plan.visualLanguage))
    expect(assets.preferred.lexicon).toEqual(plan.visualConcept.motifLexicon)
    expect(assets.allowed.languages).toEqual(plan.visualLanguage)
    expect(assets.allowed.families).toContain('heraldic')
    expect(assets.forbidden.avoid).toEqual(plan.visualConcept.avoid)
    expect(assets.forbidden.strategies).toEqual(forbiddenStrategiesFor(assets.avoid, assets.languages))
    expect(allowedStrategies(plan).some((s) => (assets.forbidden.strategies as string[]).includes(s))).toBe(false)
  })

  it('playful organic+geometric prefers vintage-badge roles; quiet-line desync caps custom slots at 1', () => {
    const playful = planOf(jobOf('09-cikolata-tray-playful'))
    const assets = assetLanguageFor(playful)
    const badgeRole = lookupAssetRecord('vintage-badge')?.role
    expect(assets.languages).toEqual(['organic', 'geometric'])
    expect(preferredRolesForLanguage('organic')).toEqual(['stamp', 'ornament'])
    expect(preferredRolesForLanguage('geometric')).toEqual(['stamp', 'accent'])
    expect(assets.preferred.roles).toEqual(['stamp', 'ornament', 'accent'])
    expect(assets.preferred.roles).toEqual(preferredRolesForLanguages(['organic', 'geometric']))
    expect(badgeRole).toBe('stamp')
    expect(assets.preferred.roles).toContain(badgeRole)
    expect(customSlotCap(assets)).toBe(5)
    const quiet = assetLanguageFor({ ...playful, visualLanguage: ['quiet-line'] })
    expect(quiet.preferred.roles).toEqual(preferredRolesForLanguages(['quiet-line']))
    expect(customSlotCap(quiet)).toBe(1)
    expect(allowedStrategies({ ...playful, visualLanguage: ['linear'] })).not.toContain('balanced-corners')
  })

  it('constrainAssetPool drops forbidden frames then falls back if the pool would empty', () => {
    const plan = planOf(jobOf('09-cikolata-tray-playful'))
    const assets = assetLanguageFor(plan)
    expect(assets.forbidden.avoid).toContain('heavy-frame')
    const badge = stubAtom({
      id: 'vintage-badge',
      sourceName: 'vintage-badge.svg',
      roleGuess: 'stamp',
      design: { family: 'ornate-stamp', role: 'stamp' },
    })
    const frame = stubAtom({
      id: 'heavy-frame',
      sourceName: 'ornate-frame.svg',
      roleGuess: 'frame',
      design: { family: 'ornate-stamp', role: 'frame', visualWeight: 0.5 },
    })
    const kept = constrainAssetPool([badge, frame], assets)
    expect(kept.map((a) => a.id)).toEqual(['vintage-badge'])
    const onlyFrame = constrainAssetPool([frame], assets)
    expect(onlyFrame.map((a) => a.id)).toEqual(['heavy-frame'])
  })

  it('A (preferred lexicon+role) outranks B (allowed, wrong role) at equal geometry', () => {
    const plan = planOf(jobOf('01-parfum-tuck-luxury'))
    const panel = frontPanel()
    const targets = compositionTargets(plan)
    const a = stubAtom({
      id: 'pref-crest',
      sourceName: 'crest-ribbon.svg',
      roleGuess: 'stamp',
      design: { family: 'heraldic', role: 'stamp' },
    })
    const b = stubAtom({
      id: 'allowed-band',
      sourceName: 'generic-band.svg',
      roleGuess: 'band',
      design: { family: 'heraldic', role: 'band' },
    })
    const slotA = [asSlot(a, { role: 'stamp' })]
    const slotB = [asSlot(b, { role: 'band' })]
    const scoreA = scoreCompositionSlots('minimal-accent', slotA, panel, plan, { style: 'luxury' }, targets)
    const scoreB = scoreCompositionSlots('minimal-accent', slotB, panel, plan, { style: 'luxury' }, targets)
    expect(scoreA.assetCompatibility).toBeGreaterThan(scoreB.assetCompatibility)
    expect(scoreA.conceptFidelity).toBeGreaterThan(scoreB.conceptFidelity)
    expect(scoreA.total).toBeGreaterThan(scoreB.total)
    const winner = chooseCompositionWinner(
      [candidate('b', plan, slotB, scoreB), candidate('a', plan, slotA, scoreA)],
      0,
      plan,
    )
    expect(winner?.id).toBe('a')
  })

  it('playful A (lexicon+stamp) outranks B (lexicon, wrong role) at equal geometry', () => {
    const plan = planOf(jobOf('09-cikolata-tray-playful'))
    const assets = assetLanguageFor(plan)
    const panel = frontPanel()
    const targets = compositionTargets(plan)
    const a = stubAtom({
      id: 'vintage-badge',
      sourceName: 'vintage-badge.svg',
      roleGuess: 'stamp',
      tags: ['vintage', 'badge'],
      design: { family: 'ornate-stamp', role: 'stamp' },
    })
    const b = stubAtom({
      id: 'badge-vintage-band',
      sourceName: 'badge-vintage-band.svg',
      roleGuess: 'band',
      tags: ['vintage', 'badge'],
      design: { family: 'ornate-stamp', role: 'band' },
    })
    expect(compareAssetPick(a, b, assets, [])).toBeLessThan(0)
    const slotA = [asSlot(a, { role: 'stamp' })]
    const slotB = [asSlot(b, { role: 'band' })]
    const scoreA = scoreCompositionSlots('pattern-field', slotA, panel, plan, { style: 'playful' }, targets)
    const scoreB = scoreCompositionSlots('pattern-field', slotB, panel, plan, { style: 'playful' }, targets)
    expect(scoreA.assetCompatibility).toBeGreaterThan(scoreB.assetCompatibility)
    expect(scoreA.total).toBeGreaterThan(scoreB.total)
    const winner = chooseCompositionWinner(
      [candidate('b', plan, slotB, scoreB), candidate('a', plan, slotA, scoreA)],
      0,
      plan,
    )
    expect(winner?.id).toBe('a')
  })

  it('roleFit is a distinct axis; critic MODIFY on miss, avoid never REJECT', () => {
    const plan = planOf(jobOf('01-parfum-tuck-luxury'))
    const panel = frontPanel()
    const targets = compositionTargets(plan)
    expect(targets.preferredMotifRoles).toEqual(['stamp', 'corner', 'frame'])
    const stamp = stubAtom({
      id: 'heraldic-stamp',
      sourceName: 'heraldic-mark.svg',
      roleGuess: 'stamp',
      design: { family: 'heraldic', role: 'stamp' },
    })
    const band = stubAtom({
      id: 'heraldic-band',
      sourceName: 'heraldic-mark.svg',
      roleGuess: 'band',
      design: { family: 'heraldic', role: 'band' },
    })
    const slotStamp = [asSlot(stamp, { role: 'stamp' })]
    const slotBand = [asSlot(band, { role: 'band' })]
    expect(roleFitOf(slotStamp, targets.preferredMotifRoles ?? [])).toBe(100)
    expect(roleFitOf(slotBand, targets.preferredMotifRoles ?? [])).toBe(0)
    expect(roleFitOf(slotStamp, [])).toBe(50)

    const scoreStamp = scoreCompositionSlots('minimal-accent', slotStamp, panel, plan, { style: 'luxury' }, targets)
    const scoreBand = scoreCompositionSlots('minimal-accent', slotBand, panel, plan, { style: 'luxury' }, targets)
    expect(scoreStamp.assetCompatibility).toBeGreaterThan(scoreBand.assetCompatibility)

    const flipped = { ...targets, preferredMotifRoles: ['band' as const] }
    const scoreStampFlipped = scoreCompositionSlots('minimal-accent', slotStamp, panel, plan, { style: 'luxury' }, flipped)
    const scoreBandFlipped = scoreCompositionSlots('minimal-accent', slotBand, panel, plan, { style: 'luxury' }, flipped)
    expect(scoreBandFlipped.assetCompatibility).toBeGreaterThan(scoreStampFlipped.assetCompatibility)
    expect(scoreBandFlipped.total).toBeGreaterThan(scoreStampFlipped.total)

    const keep = critiqueCandidate({
      slots: slotStamp,
      targets,
      score: scoreStamp,
      plan,
      panel,
    })
    expect(keep.issues.some((i) => i.topic === 'ROLE_MISMATCH')).toBe(false)
    expect(keep.status).not.toBe('REJECT')

    const miss = critiqueCandidate({
      slots: slotBand,
      targets,
      score: scoreBand,
      plan,
      panel,
    })
    expect(miss.issues.some((i) => i.topic === 'ROLE_MISMATCH')).toBe(true)
    expect(miss.status).toBe('MODIFY')

    const playful = planOf(jobOf('09-cikolata-tray-playful'))
    const playfulTargets = compositionTargets(playful)
    const heavy = asSlot(
      stubAtom({
        id: 'heavy-frame',
        sourceName: 'ornate-frame.svg',
        roleGuess: 'frame',
        design: { family: 'ornate-stamp', role: 'frame', visualWeight: 0.5 },
      }),
      { role: 'frame' },
    )
    const avoid = critiqueCandidate({
      slots: [heavy],
      targets: playfulTargets,
      score: scoreCompositionSlots('framed-content', [heavy], panel, playful, { style: 'playful' }, playfulTargets),
      plan: playful,
      panel,
    })
    expect(avoid.issues.some((i) => i.topic === 'AVOID_VIOLATION')).toBe(true)
    expect(avoid.status).toBe('MODIFY')
  })
})
