import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlan, resetArtMemory, visualConceptFor } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import type { MotifSlot } from './artMotifCompose'
import {
  chooseCompositionWinner,
  lastCompositionSearch,
  scoreCompositionSlots,
  selectMotifComposition,
  type CompositionCandidate,
} from './compositionCandidates'
import { critiqueCandidate } from './compositionCritic'
import { allowedStrategies, compositionTargets, recipeForStrategy, strategyUsesStockRecipe, type CompositionScore } from './compositionStrategy'
import { loadAtomicFamilyAtoms } from './assetCatalog/familyAssets'
import { markupFamilyGate } from './assetCatalog/constraints'
import { conceptFidelityOf } from './visualLanguage'
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

function planOf(slug: string, style: 'luxury' | 'minimal' | 'modern' | 'classic' = 'luxury'): DesignPlan {
  return createPlan({ brief: briefFrom(jobOf(slug)), style, blankCanvas: true })
}

describe('Phase 22 concept SoT / strategy≠recipe / asset relationships', () => {
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

  it('EARTHEN PREMIUM: languages/avoid/lexicon; framed-content is not allowed; editorial is not a stock recipe', () => {
    const concept = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı')
    expect(concept.id).toBe('earthen-premium')
    expect(concept.languages).toEqual(['botanical', 'organic'])
    expect(concept.avoid).toEqual(expect.arrayContaining(['heavy-frame', 'ornate-seal', 'dense-pattern']))
    expect(concept.motifLexicon).toEqual(expect.arrayContaining(['olive-branch', 'botanical-corner', 'botanical-accent']))
    const plan = planOf('08-zeytinyagi-tuck-luxury')
    const strategies = allowedStrategies(plan)
    expect(strategies[0]).toBe('asymmetric-editorial')
    expect(strategies).not.toContain('framed-content')
    expect(strategies).not.toContain('pattern-field')
    expect(strategies.length).toBeGreaterThanOrEqual(3)
    expect(recipeForStrategy('asymmetric-editorial')).toBe('corner-deco')
    expect(strategyUsesStockRecipe('asymmetric-editorial')).toBe(false)
    expect(compositionTargets(plan).compositionBias).toBe('asymmetric-editorial')
  })

  it('SOFT OVAL: oval is primary; generic ticks cannot beat the ring', () => {
    const concept = visualConceptFor('luxury', 'cream', 'oval')
    expect(concept.id).toBe('soft-oval')
    expect(concept.languages?.[0]).toBe('oval')
    expect(concept.avoid).toEqual(expect.arrayContaining(['heavy-frame', 'generic-ticks', 'sharp-corner']))
    const plan = planOf('03-krem-tuck-luxury')
    const targets = compositionTargets(plan)
    expect(targets.visualLanguage).toBe('oval')
    expect(targets.languages).toEqual(['oval', 'quiet-line'])
    expect(allowedStrategies(plan)).not.toContain('framed-content')
    const oval = stubAtom({
      id: 'soft-oval-ring',
      sourceName: 'soft-oval-ring.svg',
      tags: ['oval'],
      roleGuess: 'stamp',
      design: { family: 'quiet-line', subfamily: 'oval', styleTags: ['oval'] },
    })
    const ticks = stubAtom({
      id: 'quiet-ticks',
      sourceName: 'quiet-ticks.svg',
      tags: ['ticks'],
      roleGuess: 'corner',
      design: { family: 'quiet-line', subfamily: 'corner-mark' },
    })
    const ovalSlots = [asSlot(oval, { x: 24, y: 18, w: 20, h: 20 }, { role: 'stamp' })]
    const tickSlots = [asSlot(ticks, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' })]
    expect(conceptFidelityOf(ovalSlots, plan)).toBeGreaterThan(conceptFidelityOf(tickSlots, plan))
    const ovalScore = scoreCompositionSlots('hero-with-support', ovalSlots, frontPanel(), plan, { style: 'luxury' }, targets)
    const tickScore = scoreCompositionSlots('balanced-corners', tickSlots, frontPanel(), plan, { style: 'luxury' }, targets)
    expect(ovalScore.familyConsistency).toBe(100)
    expect(tickScore.familyConsistency).toBe(100)
    expect(tickScore.conceptFidelity).toBeLessThanOrEqual(40)
    expect(chooseCompositionWinner(
      [
        {
          id: 'ticks',
          strategy: 'balanced-corners',
          plan,
          slots: tickSlots,
          recipeId: 'corner-deco',
          fingerprint: 'ticks',
          placements: [],
          preScore: tickScore,
          critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
        },
        {
          id: 'oval',
          strategy: 'hero-with-support',
          plan,
          slots: ovalSlots,
          recipeId: 'stamp-field',
          fingerprint: 'oval',
          placements: [],
          preScore: ovalScore,
          critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
        },
      ],
      0,
      plan,
    )?.id).toBe('oval')
  })

  it('AIR PAPER: quiet-line SoT; heavy-frame/ornate stay avoided; ticks remain legal lexicon', () => {
    const concept = visualConceptFor('minimal', 'serum', 'none')
    expect(concept.id).toBe('air-paper')
    expect(concept.languages).toEqual(['quiet-line'])
    expect(concept.avoid).toEqual(expect.arrayContaining(['heavy-frame', 'ornate-seal', 'dense-pattern']))
    expect(concept.motifLexicon).toEqual(expect.arrayContaining(['hairline', 'quiet-rule', 'ticks']))
    const plan = planOf('04-serum-tuck-minimal', 'minimal')
    expect(allowedStrategies(plan)).not.toContain('pattern-field')
    expect(allowedStrategies(plan)).not.toContain('framed-content')
    expect(compositionTargets(plan).visualLanguage).toBe('quiet-line')
    const ticks = stubAtom({
      id: 'quiet-ticks',
      sourceName: 'quiet-ticks.svg',
      tags: ['ticks'],
      roleGuess: 'corner',
      design: { family: 'quiet-line', subfamily: 'corner-mark' },
    })
    expect(conceptFidelityOf([asSlot(ticks, { x: 4, y: 4, w: 10, h: 10 }, { role: 'corner' })], plan)).toBeGreaterThan(50)
  })

  it('NOCTURNE: crest lexicon beats corner-only pack; crest as frame still rejects', () => {
    const concept = visualConceptFor('luxury', 'perfume', 'crest')
    expect(concept.id).toBe('nocturne-crest')
    expect(concept.languages).toEqual(['heraldic'])
    expect(concept.avoid).toContain('generic-corners')
    expect(concept.motifLexicon).toEqual(expect.arrayContaining(['crest', 'ribbon', 'cartouche']))
    const plan = planOf('01-parfum-tuck-luxury')
    expect(allowedStrategies(plan)).not.toContain('balanced-corners')
    expect(allowedStrategies(plan)).toContain('hero-with-support')
    expect(allowedStrategies(plan).length).toBeGreaterThanOrEqual(3)
    const targets = compositionTargets(plan)
    const crest = stubAtom({
      id: 'crest-spot',
      sourceName: 'crest-spot.svg',
      roleGuess: 'stamp',
      design: { family: 'heraldic', subfamily: 'crest', styleTags: ['heraldic'] },
    })
    const ribbon = stubAtom({
      id: 'ribbon-corner',
      sourceName: 'ribbon-corner.svg',
      roleGuess: 'corner',
      design: { family: 'heraldic', subfamily: 'ribbon' },
    })
    const corner = stubAtom({
      id: 'double-line-corner',
      sourceName: 'double-line-corner.svg',
      roleGuess: 'corner',
      design: { family: 'heraldic', subfamily: 'frame' },
    })
    const crestSlots = [
      asSlot(crest, { x: 26, y: 8, w: 16, h: 16 }, { role: 'stamp' }),
      asSlot(ribbon, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' }),
    ]
    const cornerSlots = [
      asSlot(corner, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' }),
      asSlot(ribbon, { x: 54, y: 4, w: 12, h: 12 }, { role: 'corner' }),
    ]
    expect(conceptFidelityOf(crestSlots, plan)).toBeGreaterThan(conceptFidelityOf(cornerSlots, plan))
    const crestScore = scoreCompositionSlots('hero-with-support', crestSlots, frontPanel(), plan, { style: 'luxury' }, targets)
    const cornerScore = scoreCompositionSlots('balanced-corners', cornerSlots, frontPanel(), plan, { style: 'luxury' }, targets)
    expect(crestScore.total).toBeGreaterThan(cornerScore.total)
    const lockup = { x: 12, y: 48, w: 46, h: 40 }
    const through = asSlot(
      stubAtom({
        id: 'crest-spot',
        sourceName: 'crest-spot.svg',
        roleGuess: 'frame',
        design: { family: 'heraldic', subfamily: 'crest', visualWeight: 0.32 },
      }),
      { x: 8, y: 20, w: 54, h: 100 },
      { role: 'frame' },
    )
    expect(critiqueCandidate({ slots: [through], lockup, targets, score: fullScore(80), plan }).status).toBe('REJECT')
  })

  it('TECH GLYPH: linear language + grid/glyph lexicon; family lock stays', () => {
    const concept = visualConceptFor('modern', 'electronics', 'tech')
    expect(concept.id).toBe('tech-glyph')
    expect(concept.languages).toEqual(['linear', 'geometric'])
    expect(concept.avoid).toEqual(expect.arrayContaining(['heavy-frame', 'ornate-seal']))
    expect(concept.motifLexicon).toEqual(expect.arrayContaining(['grid', 'glyph', 'pattern16']))
    const plan = planOf('14-kulaklik-tuck-modern', 'modern')
    expect(plan.visualConcept.family).toBe('linear-tech')
    expect(compositionTargets(plan).visualLanguage).toBe('linear')
    expect(allowedStrategies(plan)).not.toContain('framed-content')
    expect(allowedStrategies(plan)).not.toContain('balanced-corners')
    const grid = stubAtom({
      id: 'pattern16',
      sheetId: 'pattern16',
      sourceName: 'pattern16.svg',
      tags: ['grid', 'tech'],
      roleGuess: 'field-fill',
      design: { family: 'linear-tech', subfamily: 'geometric-grid' },
    })
    const leaf = stubAtom({
      id: 'olive-branch-corner',
      sourceName: 'olive-branch-corner.svg',
      tags: ['leaf'],
      roleGuess: 'corner',
      design: { family: 'botanical', subfamily: 'olive-branch' },
    })
    expect(conceptFidelityOf([asSlot(grid, { x: 8, y: 8, w: 20, h: 20 })], plan)).toBeGreaterThan(
      conceptFidelityOf([asSlot(leaf, { x: 8, y: 8, w: 20, h: 20 })], plan),
    )
  })

  it('family EXACT still loses when lexicon/language miss', () => {
    const plan = planOf('03-krem-tuck-luxury')
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
      frontPanel(),
      plan,
      { style: 'luxury' },
      targets,
    )
    const tickScore = scoreCompositionSlots(
      'balanced-corners',
      [asSlot(ticks, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' })],
      frontPanel(),
      plan,
      { style: 'luxury' },
      targets,
    )
    expect(ovalScore.familyConsistency).toBe(100)
    expect(tickScore.familyConsistency).toBe(100)
    expect(chooseCompositionWinner(
      [
        {
          id: 'ticks',
          strategy: 'balanced-corners',
          plan,
          slots: [asSlot(ticks, { x: 4, y: 4, w: 12, h: 12 }, { role: 'corner' })],
          recipeId: 'corner-deco',
          fingerprint: 'ticks',
          placements: [],
          preScore: tickScore,
          critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
        } satisfies CompositionCandidate,
        {
          id: 'oval',
          strategy: 'hero-with-support',
          plan,
          slots: [asSlot(oval, { x: 24, y: 18, w: 20, h: 20 }, { role: 'stamp' })],
          recipeId: 'stamp-field',
          fingerprint: 'oval',
          placements: [],
          preScore: ovalScore,
          critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
        },
      ],
      0,
      plan,
    )?.id).toBe('oval')
  })

  it('five-concept live generate: SoT + before/after winners', () => {
    const engine = new FormaLocalEngine()
    const earthen = engine.generate({
      brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const earthenSearch = lastCompositionSearch()
    expect(earthen.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(earthen.designPlan?.artDirection.vocabulary).toBe('earthen-premium')
    expect(earthenSearch?.winner).toBe('asymmetric-editorial')
    expect(earthenSearch?.concept?.languages).toEqual(['botanical', 'organic'])
    expect(earthenSearch?.concept?.avoid).toContain('heavy-frame')
    expect(earthenSearch?.concept?.familyMatch).toBe('EXACT')
    expect(earthenSearch?.candidates.some((c) => c.strategy === 'framed-content')).toBe(false)
    expect((earthenSearch?.concept?.winnerAssetId ?? '').toLowerCase()).toMatch(/olive|botanic|organic/)

    const oval = engine.generate({
      brief: briefFrom(jobOf('03-krem-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const ovalSearch = lastCompositionSearch()
    expect(oval.designPlan?.visualConcept.id).toBe('soft-oval')
    expect(ovalSearch?.concept?.visualLanguage).toBe('oval')
    expect(['hero-with-support', 'asymmetric-editorial', 'minimal-accent']).toContain(ovalSearch?.winner)
    expect(ovalSearch?.concept?.winnerAssetId).toMatch(/soft-oval|oval|ring|capsule/)
    expect(ovalSearch?.concept?.winnerAssetId).not.toMatch(/quiet-ticks/)

    const air = engine.generate({
      brief: briefFrom(jobOf('04-serum-tuck-minimal')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const airSearch = lastCompositionSearch()
    expect(air.designPlan?.visualConcept.id).toBe('air-paper')
    expect(airSearch?.concept?.visualLanguage).toBe('quiet-line')
    expect(airSearch?.concept?.avoid).toContain('heavy-frame')
    expect(face(air)).not.toMatch(/islamic-border/)

    const night = engine.generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const nightSearch = lastCompositionSearch()
    expect(night.designPlan?.visualConcept.id).toBe('nocturne-crest')
    expect(nightSearch?.winner).not.toBe('balanced-corners')
    expect(nightSearch?.candidates.some((c) => c.strategy === 'balanced-corners')).toBe(false)
    const nightAssets = (nightSearch?.candidates.find((c) => c.decision === 'WINNER')?.assets ?? []).join(' ')
    expect(nightAssets.toLowerCase()).toMatch(/crest|ribbon|cartouche/)
    if (nightSearch?.concept?.roles) {
      nightSearch.candidates
        .find((c) => c.decision === 'WINNER')
        ?.assets.forEach((id, i) => {
          if (/crest-spot|seal/.test(id)) expect(nightSearch.concept?.roles?.[i]).not.toBe('frame')
        })
    }

    const tech = engine.generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const techSearch = lastCompositionSearch()
    expect(tech.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(techSearch?.concept?.visualLanguage).toBe('linear')
    expect(techSearch?.concept?.hardConstraint).not.toBe('FAILURE')
    if (techSearch?.concept?.winnerAssetId) {
      expect(techSearch.concept.familyMatch).not.toBe('NONE')
      expect(techSearch.concept.winnerFamily).toBe('linear-tech')
    }
    expect(markupFamilyGate(face(tech), tech.designPlan!).ok).toBe(true)
    expect(face(tech)).not.toMatch(/islamic-border/)
  })

  it('same brief + seed is deterministic; kit/NOX contracts hold', () => {
    const plan = planOf('03-krem-tuck-luxury')
    const atoms = loadAtomicFamilyAtoms().filter((a) => motifFamilyOf(a) === 'quiet-line')
    const first = selectMotifComposition({ panel: frontPanel(), palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    const debugA = lastCompositionSearch()
    const second = selectMotifComposition({ panel: frontPanel(), palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    expect(second.markup).toBe(first.markup)
    expect(second.winner?.strategy).toBe(first.winner?.strategy)
    expect(lastCompositionSearch()?.winner).toBe(debugA?.winner)

    const kit = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: false, variationIndex: 0 },
    })
    expect(face(kit)).not.toContain('data-face="blank-canvas"')
    expect(face(kit)).toContain('data-art="gold-bar"')
    expect(kit.preflight.exportOk).toBe(true)

    const nox = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(nox.designPlan?.visualConcept.family).toBe('linear-tech')
    expect(markupFamilyGate(face(nox), nox.designPlan!).ok).toBe(true)
    expect(nox.preflight.exportOk).toBe(true)
  })
})
