import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { resolveDesignRegion, scoreAtomForRegion } from './artDesignRegions'
import type { MotifSlot } from './artMotifCompose'
import {
  chooseCompositionWinner,
  compositionLayoutFingerprint,
  lastCompositionSearch,
  scoreCompositionSlots,
  selectMotifComposition,
  type CompositionCandidate,
} from './compositionCandidates'
import { critiqueCandidate } from './compositionCritic'
import { compositionTargets, type CompositionScore } from './compositionStrategy'
import { atomRegionAllowed } from './artMotifMeta'
import { loadAtomicFamilyAtoms } from './assetCatalog/familyAssets'
import { markupFamilyGate } from './assetCatalog/constraints'
import { conceptFidelityOf, lockupOverlapVerdict } from './visualLanguage'
import { motifFamilyOf } from './artMotifFamily'
import type { Panel } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function frontPanel(): Panel {
  const w = 70
  const h = 140
  return { id: 'front', role: 'body', x: 0, y: 0, w, h, polygon: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }] }
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

function asSlot(atom: MotifAtom, box: MotifSlot['box'], extra: Partial<MotifSlot> = {}): MotifSlot {
  return {
    atom,
    box,
    opacity: extra.opacity ?? 0.7,
    par: 'xMidYMid meet',
    lockout: extra.lockout ?? false,
    role: extra.role ?? atom.roleGuess,
  }
}

function fullScore(n: number): CompositionScore {
  return {
    hierarchy: n,
    balance: n,
    whitespace: n,
    styleConsistency: n,
    familyConsistency: n,
    decorationDensity: n,
    assetCompatibility: n,
    conceptFidelity: n,
    alignment: n,
    rhythm: n,
    collisionSafety: n,
    productionSafety: n,
    total: n,
  }
}

const PALETTE = { bg: '#1a0a0a', fg: '#f5f0e8', accent: '#c9a227', muted: '#8a7a4a', paper: '#f5f0e8' }

function creamPlan(): DesignPlan {
  return createPlan({ brief: briefFrom(jobOf('03-krem-tuck-luxury')), style: 'luxury', blankCanvas: true })
}

function lucentPlan(): DesignPlan {
  return createPlan({ brief: briefFrom(jobOf('02-kolonya-tuck-classic')), style: 'classic', blankCanvas: true })
}

describe('Phase 21 visual quality correction', () => {
  beforeEach(() => {
    resetArtMemory()
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  afterEach(() => {
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  it('TEST A: crest/frame through lockup is REJECT or MODIFY; decorative surround may KEEP', () => {
    const panel = frontPanel()
    const plan = lucentPlan()
    const targets = compositionTargets(plan)
    const lockup = { x: 12, y: 48, w: 46, h: 40 }
    const crest = stubAtom({
      id: 'crest-spot',
      sourceName: 'crest-spot.svg',
      roleGuess: 'frame',
      design: { family: 'heraldic', subfamily: 'crest', visualWeight: 0.32 },
    })
    const through = asSlot(crest, { x: 8, y: 20, w: 54, h: 100 }, { role: 'frame' })
    const score = scoreCompositionSlots('framed-content', [through], panel, plan, { style: 'classic', lockup }, targets)
    const critic = critiqueCandidate({ slots: [through], lockup, targets, score, plan, panel })
    expect(critic.issues.some((i) => i.topic === 'LOCKUP_OVERLAP')).toBe(true)
    expect(['REJECT', 'MODIFY']).toContain(critic.status)
    expect(lockupOverlapVerdict(through, lockup).verdict).toBe('reject')

    const hairline = stubAtom({
      id: 'hairline-frame',
      sourceName: 'hairline-frame.svg',
      roleGuess: 'frame',
      design: { family: 'quiet-line', subfamily: 'hairline', visualWeight: 0.18 },
    })
    const surround = asSlot(hairline, { x: 2, y: 2, w: 66, h: 136 }, { role: 'frame' })
    const surroundPlan = creamPlan()
    const surroundTargets = compositionTargets(surroundPlan)
    const keep = critiqueCandidate({
      slots: [surround],
      lockup,
      targets: surroundTargets,
      score: { ...fullScore(80), collisionSafety: 88, productionSafety: 88 },
      plan: surroundPlan,
      panel,
    })
    expect(lockupOverlapVerdict(surround, lockup).verdict).toBe('ok')
    expect(keep.status).not.toBe('REJECT')

    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('02-kolonya-tuck-classic')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const search = lastCompositionSearch()
    const winner = search?.candidates.find((c) => c.decision === 'WINNER')
    if (winner && search?.concept?.roles) {
      winner.assets.forEach((id, i) => {
        if (/crest-spot|seal/.test(id)) expect(search.concept?.roles?.[i]).not.toBe('frame')
      })
    }
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('TEST B: SOFT OVAL oval-language candidate beats generic quiet-corners on concept fidelity', () => {
    const panel = frontPanel()
    const plan = creamPlan()
    const targets = compositionTargets(plan)
    expect(targets.visualLanguage).toBe('oval')
    const oval = stubAtom({
      id: 'soft-oval-ring',
      sourceName: 'soft-oval-ring.svg',
      tags: ['oval', 'minimal'],
      roleGuess: 'stamp',
      design: { family: 'quiet-line', subfamily: 'oval', styleTags: ['oval', 'minimal'] },
    })
    const tick = stubAtom({
      id: 'quiet-ticks',
      sourceName: 'quiet-ticks.svg',
      tags: ['quiet', 'ticks'],
      roleGuess: 'corner',
      design: { family: 'quiet-line', subfamily: 'corner-mark', styleTags: ['minimal'] },
    })
    const corner = stubAtom({
      id: 'hairline-corner-l',
      sourceName: 'hairline-corner-l.svg',
      tags: ['quiet'],
      roleGuess: 'corner',
      design: { family: 'quiet-line', subfamily: 'corner-mark', styleTags: ['minimal'] },
    })
    const ovalSlots = [asSlot(oval, { x: 24, y: 18, w: 22, h: 22 }, { role: 'stamp' })]
    const tickSlots = [
      asSlot(tick, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' }),
      asSlot(corner, { x: 54, y: 4, w: 12, h: 12 }, { role: 'corner' }),
    ]
    const ovalScore = scoreCompositionSlots('hero-with-support', ovalSlots, panel, plan, { style: 'luxury' }, targets)
    const tickScore = scoreCompositionSlots('balanced-corners', tickSlots, panel, plan, { style: 'luxury' }, targets)
    expect(ovalScore.conceptFidelity).toBeGreaterThan(tickScore.conceptFidelity)
    expect(ovalScore.conceptFidelity).toBeGreaterThanOrEqual(70)
    expect(tickScore.familyConsistency).toBe(100)
    expect(ovalScore.familyConsistency).toBe(100)
  })

  it('TEST C: all-oval slots have high concept fidelity', () => {
    const plan = creamPlan()
    const ring = stubAtom({
      id: 'soft-oval-ring',
      sourceName: 'soft-oval-ring.svg',
      tags: ['oval'],
      design: { family: 'quiet-line', styleTags: ['oval'] },
      roleGuess: 'stamp',
    })
    const cap = stubAtom({
      id: 'quiet-capsule',
      sourceName: 'quiet-capsule.svg',
      tags: ['capsule'],
      design: { family: 'quiet-line', styleTags: ['oval'] },
      roleGuess: 'accent',
    })
    const slots = [
      asSlot(ring, { x: 24, y: 18, w: 20, h: 20 }, { role: 'stamp' }),
      asSlot(cap, { x: 8, y: 100, w: 14, h: 8 }, { role: 'accent' }),
    ]
    expect(conceptFidelityOf(slots, plan)).toBeGreaterThanOrEqual(90)
  })

  it('TEST D: bottom-accent cannot sit in NE / NW / hero-stamp', () => {
    const panel = frontPanel()
    const bottom = loadAtomicFamilyAtoms().find((a) => a.sheetId === 'botanical-accent-bottom' || a.id.startsWith('botanical-accent-bottom'))
    expect(bottom).toBeTruthy()
    expect(atomRegionAllowed(bottom!, 'ne')).toBe(false)
    expect(atomRegionAllowed(bottom!, 'nw')).toBe(false)
    expect(atomRegionAllowed(bottom!, 'top')).toBe(false)
    expect(resolveDesignRegion({ panel, kind: 'ne', atom: bottom }).rejected).toBe(true)
    expect(resolveDesignRegion({ panel, kind: 'nw', atom: bottom }).rejected).toBe(true)
    expect(resolveDesignRegion({ panel, kind: 'hero-stamp', atom: bottom }).rejected).toBe(true)
    expect(scoreAtomForRegion(bottom!, 'ne')).toBeLessThanOrEqual(-80)
  })

  it('TEST E: preferredRegions alone is not a hard reject; allowedRegions is', () => {
    const panel = frontPanel()
    const preferredOnly = stubAtom({
      id: 'pref-only',
      roleGuess: 'accent',
      design: { preferredRegions: ['bottom'] },
    })
    const allowed = stubAtom({
      id: 'allowed-bottom',
      roleGuess: 'accent',
      design: { preferredRegions: ['bottom'], allowedRegions: ['bottom', 'sw', 'se'] },
    })
    expect(atomRegionAllowed(preferredOnly, 'nw')).toBe(true)
    expect(scoreAtomForRegion(preferredOnly, 'nw')).toBeGreaterThan(-100)
    expect(resolveDesignRegion({ panel, kind: 'nw', atom: preferredOnly }).rejected).toBe(false)
    expect(atomRegionAllowed(allowed, 'nw')).toBe(false)
    expect(resolveDesignRegion({ panel, kind: 'nw', atom: allowed }).rejected).toBe(true)
    expect(atomRegionAllowed(allowed, 'bottom')).toBe(true)
  })

  it('TEST F: family EXACT does not auto-win a high concept mismatch', () => {
    const panel = frontPanel()
    const plan = creamPlan()
    const targets = compositionTargets(plan)
    const oval = stubAtom({
      id: 'soft-oval-ring',
      sourceName: 'soft-oval-ring.svg',
      tags: ['oval'],
      roleGuess: 'stamp',
      design: { family: 'quiet-line', styleTags: ['oval'] },
    })
    const ticks = stubAtom({
      id: 'quiet-ticks',
      sourceName: 'quiet-ticks.svg',
      tags: ['ticks'],
      roleGuess: 'corner',
      design: { family: 'quiet-line', subfamily: 'corner-mark' },
    })
    const ovalScore = scoreCompositionSlots(
      'hero-with-support',
      [asSlot(oval, { x: 24, y: 18, w: 20, h: 20 }, { role: 'stamp' })],
      panel,
      plan,
      { style: 'luxury' },
      targets,
    )
    const tickScore = scoreCompositionSlots(
      'balanced-corners',
      [asSlot(ticks, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' })],
      panel,
      plan,
      { style: 'luxury' },
      targets,
    )
    expect(ovalScore.familyConsistency).toBe(100)
    expect(tickScore.familyConsistency).toBe(100)
    expect(tickScore.conceptFidelity).toBeLessThan(ovalScore.conceptFidelity)
    const ovalCand: CompositionCandidate = {
      id: 'oval',
      strategy: 'hero-with-support',
      plan,
      slots: [asSlot(oval, { x: 24, y: 18, w: 20, h: 20 }, { role: 'stamp' })],
      recipeId: 'stamp-field',
      fingerprint: 'oval',
      placements: [],
      preScore: ovalScore,
      critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
    }
    const tickCand: CompositionCandidate = {
      id: 'ticks',
      strategy: 'balanced-corners',
      plan,
      slots: [asSlot(ticks, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' })],
      recipeId: 'corner-deco',
      fingerprint: 'ticks',
      placements: [],
      preScore: tickScore,
      critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
    }
    expect(chooseCompositionWinner([tickCand, ovalCand], 0, plan)?.id).toBe('oval')
  })

  it('TEST G: fewer relevant decorations can beat more irrelevant ones', () => {
    const panel = frontPanel()
    const plan = creamPlan()
    const targets = compositionTargets(plan)
    const oval = stubAtom({
      id: 'soft-oval-ring',
      sourceName: 'soft-oval-ring.svg',
      tags: ['oval'],
      roleGuess: 'stamp',
      design: { family: 'quiet-line', styleTags: ['oval'], visualWeight: 0.22 },
    })
    const mkTick = (id: string) =>
      stubAtom({
        id,
        sourceName: 'quiet-ticks.svg',
        tags: ['ticks'],
        roleGuess: 'corner',
        design: { family: 'quiet-line', subfamily: 'corner-mark', visualWeight: 0.2 },
      })
    const few = [asSlot(oval, { x: 24, y: 18, w: 18, h: 18 }, { role: 'stamp', opacity: 0.72 })]
    const many = [
      asSlot(mkTick('t1'), { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' }),
      asSlot(mkTick('t2'), { x: 54, y: 4, w: 12, h: 12 }, { role: 'corner' }),
      asSlot(mkTick('t3'), { x: 4, y: 120, w: 12, h: 12 }, { role: 'corner' }),
    ]
    const fewScore = scoreCompositionSlots('minimal-accent', few, panel, plan, { style: 'luxury' }, targets)
    const manyScore = scoreCompositionSlots('pattern-field', many, panel, plan, { style: 'luxury' }, targets)
    expect(fewScore.conceptFidelity).toBeGreaterThan(manyScore.conceptFidelity)
    expect(fewScore.total).toBeGreaterThan(manyScore.total)
  })

  it('TEST H: atom id swap does not change composition fingerprint', () => {
    const panel = frontPanel()
    const a = stubAtom({ id: 'ornament-a', roleGuess: 'corner' })
    const b = stubAtom({ id: 'ornament-b', roleGuess: 'corner' })
    const box = { x: 4, y: 4, w: 12, h: 12 }
    expect(compositionLayoutFingerprint('minimal-accent', [asSlot(a, box, { role: 'corner' })], panel)).toBe(
      compositionLayoutFingerprint('minimal-accent', [asSlot(b, box, { role: 'corner' })], panel),
    )
    expect(compositionLayoutFingerprint('minimal-accent', [asSlot(a, box, { role: 'corner' })], panel)).not.toContain('ornament-a')
  })

  it('TEST I: same brief + seed yields the same winner and SVG', () => {
    const panel = frontPanel()
    const plan = creamPlan()
    const atoms = loadAtomicFamilyAtoms().filter((a) => motifFamilyOf(a) === 'quiet-line')
    const first = selectMotifComposition({ panel, palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    const debugA = lastCompositionSearch()
    const second = selectMotifComposition({ panel, palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    expect(second.markup).toBe(first.markup)
    expect(second.winner?.strategy).toBe(first.winner?.strategy)
    expect(lastCompositionSearch()?.winner).toBe(debugA?.winner)
  })

  it('TEST J: catalog kit contract still holds', () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: false, variationIndex: 0 },
    })
    const svg = face(spec)
    expect(svg).not.toContain('data-face="blank-canvas"')
    expect(spec.preflight.exportOk).toBe(true)
    expect(svg).toContain('data-art="gold-bar"')
    const search = lastCompositionSearch()
    if (search?.concept?.winnerAssetId) {
      expect(search.concept.familyMatch).not.toBe('NONE')
      expect(svg).not.toMatch(/islamic-border/)
    }
  })

  it('TEST K: NOX family/gate is unchanged', () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(spec.designPlan?.visualConcept.family).toBe('linear-tech')
    expect(face(spec)).toContain('data-lockup-chrome="tech-grid"')
    expect(face(spec)).not.toContain('data-art="art-pattern-compose"')
    expect(markupFamilyGate(face(spec), spec.designPlan!).ok).toBe(true)
    expect(face(spec)).not.toMatch(/islamic-border/)
    expect(spec.preflight.exportOk).toBe(true)
  })
})
