import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { matchMotifs, scoreAtom } from './artMotifMatch'
import { motifFamilyOf, selectFamilyPool } from './artMotifFamily'
import {
  applyDecorationBudget,
  lastCompositionSearch,
  selectMotifComposition,
  slotsPassFamilyConstraint,
} from './compositionCandidates'
import { critiqueCandidate } from './compositionCritic'
import { compositionTargets } from './compositionStrategy'
import { allowedFamiliesForConcept, FAMILY_COMPAT } from './assetCatalog/familyMatrix'
import { validateAssetLibrary } from './assetCatalog/validate'
import { reportAssetCoverage } from './assetCatalog/coverage'
import { markupFamilyGate } from './assetCatalog/constraints'
import type { Panel } from '../../types'
import type { DesignPlan } from '../brain/DesignPlan'
import type { MotifSlot } from './artMotifCompose'

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

function frontPanel(): Panel {
  const w = 70
  const h = 140
  return { id: 'front', role: 'body', x: 0, y: 0, w, h, polygon: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }] }
}

function asSlot(atom: MotifAtom, box: MotifSlot['box'] = { x: 4, y: 4, w: 12, h: 12 }): MotifSlot {
  return { atom, box, opacity: 0.7, par: 'xMidYMid meet', lockout: false, role: atom.roleGuess }
}

function oilPlan(): DesignPlan {
  const job = JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury') as Job
  return createPlan({ brief: briefFrom(job), style: 'luxury', blankCanvas: true })
}

const PALETTE = { bg: '#3f4a32', fg: '#f5f0e8', accent: '#c9a227', muted: '#8a7a4a', paper: '#f5f0e8' }

describe('Phase 19 family hard constraints', () => {
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

  it('TEST 1: family=botanical selects botanical assets', () => {
    const match = matchMotifs({
      mood: 'luxury',
      sector: 'food',
      colors: '#3f4a32 #c9a227',
      seed: 0,
      family: 'botanical',
      supportFamily: 'harvest',
      conceptId: 'earthen-premium',
    })
    expect(match.atoms.length).toBeGreaterThan(0)
    expect(match.atoms.every((a) => motifFamilyOf(a) === 'botanical')).toBe(true)
    expect(match.atoms.some((a) => /islamic/.test(a.id) || /islamic/.test(a.sheetId))).toBe(false)
    expect(match.matchLevel).toBe('EXACT')
  })

  it('TEST 2: botanical with no botanical atoms falls back to typography-only', () => {
    const islamic = stubAtom({
      id: 'islamic-border-new-2__atom-03',
      sheetId: 'islamic-border-new-2',
      sourceName: 'islamic-border-new-2.svg',
      design: { family: 'ornate-stamp', subfamily: 'islamic-border' },
    })
    const pool = selectFamilyPool([islamic], 'botanical', 'harvest', 'earthen-premium')
    expect(pool.atoms).toEqual([])
    expect(pool.fallbackMode).toBe('typography-only')
    const plan = oilPlan()
    const picked = selectMotifComposition({
      panel: frontPanel(),
      palette: PALETTE,
      atoms: [islamic],
      plan,
      opts: { style: 'luxury', seed: 0, sector: 'food' },
    })
    expect(picked.slots).toEqual([])
    expect(picked.markup).toBe('')
    expect(lastCompositionSearch()?.concept?.fallbackMode).toBe('typography-only')
    expect(lastCompositionSearch()?.concept?.hardConstraint).toBe('PASS')
  })

  it('TEST 3: islamic asset cannot win a botanical brief', () => {
    const leaf = stubAtom({
      id: 'olive-branch-corner__atom-01',
      sheetId: 'olive-branch-corner',
      sourceName: 'olive-branch-corner.svg',
      design: { family: 'botanical', subfamily: 'olive-branch' },
      tags: ['botanical'],
    })
    const islamic = stubAtom({
      id: 'islamic-border-new-2__atom-03',
      sheetId: 'islamic-border-new-2',
      sourceName: 'islamic-border-new-2.svg',
      design: { family: 'ornate-stamp', subfamily: 'islamic-border' },
    })
    const pool = selectFamilyPool([leaf, islamic], 'botanical', 'harvest', 'earthen-premium')
    expect(pool.atoms.map((a) => a.id)).toEqual([leaf.id])
    const vocab = { moods: ['luxury' as const], sectors: ['food'], tags: ['ornate'], color: 'ornate' as const }
    expect(scoreAtom(islamic, { mood: 'luxury', sector: 'food', colors: '', family: 'botanical' }, vocab, 'botanical')).toBeLessThan(-500)
    const plan = oilPlan()
    const critic = critiqueCandidate({
      slots: [asSlot(islamic)],
      targets: compositionTargets(plan),
      score: {
        hierarchy: 90,
        balance: 90,
        whitespace: 90,
        styleConsistency: 90,
        familyConsistency: 0,
        decorationDensity: 90,
        assetCompatibility: 90,
        alignment: 90,
        rhythm: 90,
        collisionSafety: 90,
        productionSafety: 90,
        total: 90,
      },
      plan,
    })
    expect(critic.status).toBe('REJECT')
    expect(critic.issues.some((i) => i.topic === 'family')).toBe(true)
    expect(slotsPassFamilyConstraint([asSlot(islamic)], plan)).toBe(false)
  })

  it('TEST 4: family=heraldic may pick heraldic or compatible crest/deco', () => {
    const match = matchMotifs({
      mood: 'luxury',
      sector: 'perfume',
      colors: '#1a0a0a #c9a227',
      seed: 0,
      family: 'heraldic',
      supportFamily: 'geometric-deco',
      conceptId: 'nocturne-crest',
    })
    const allowed = new Set(allowedFamiliesForConcept('nocturne-crest', 'heraldic', 'geometric-deco'))
    expect(match.atoms.every((a) => allowed.has(motifFamilyOf(a)))).toBe(true)
    expect(match.atoms.some((a) => /islamic/.test(a.sheetId) && motifFamilyOf(a) === 'ornate-stamp')).toBe(false)
  })

  it('TEST 5: family=linear-tech stays technical/geometric-compatible', () => {
    const match = matchMotifs({
      mood: 'modern',
      sector: 'electronics',
      colors: '#111111 #888888',
      seed: 0,
      family: 'linear-tech',
      supportFamily: 'quiet-line',
      conceptId: 'tech-glyph',
    })
    const allowed = new Set(allowedFamiliesForConcept('tech-glyph', 'linear-tech', 'quiet-line'))
    expect(match.fallbackMode === 'typography-only' || match.atoms.every((a) => allowed.has(motifFamilyOf(a)))).toBe(true)
    expect(FAMILY_COMPAT['linear-tech'].includes('ornate-stamp')).toBe(false)
  })

  it('TEST 6: low budget may drop complexity but not family', () => {
    const light = stubAtom({
      id: 'leaf-minimal__atom-01',
      sourceName: 'leaf-minimal.svg',
      design: { family: 'botanical', visualWeight: 0.12, complexity: 4 },
      roleGuess: 'accent',
    })
    const heavy = stubAtom({
      id: 'botanical-frame-asymmetric__atom-01',
      sourceName: 'botanical-frame-asymmetric.svg',
      design: { family: 'botanical', visualWeight: 0.55, complexity: 22 },
      roleGuess: 'frame',
    })
    const islamic = stubAtom({
      id: 'islamic-border-new-2__atom-12',
      sourceName: 'islamic-border-new-2.svg',
      design: { family: 'ornate-stamp', visualWeight: 0.1, complexity: 2 },
    })
    const capped = applyDecorationBudget(
      [asSlot(heavy, { x: 2, y: 2, w: 40, h: 40 }), asSlot(light, { x: 4, y: 80, w: 10, h: 10 })],
      frontPanel(),
      0.18,
    )
    expect(capped.every((s) => motifFamilyOf(s.atom) === 'botanical')).toBe(true)
    const pool = selectFamilyPool([light, heavy, islamic], 'botanical', undefined, 'earthen-premium')
    expect(pool.atoms.every((a) => motifFamilyOf(a) === 'botanical')).toBe(true)
    expect(pool.atoms.some((a) => a.id.startsWith('islamic'))).toBe(false)
  })

  it('TEST 7: concept change recomputes family compatibility', () => {
    const leaf = stubAtom({
      id: 'olive-branch-corner__atom-01',
      sourceName: 'olive-branch-corner.svg',
      design: { family: 'botanical' },
    })
    const deco = stubAtom({
      id: 'artdeco-frame__atom-01',
      sourceName: 'artdeco-frame.svg',
      design: { family: 'geometric-deco' },
    })
    const earth = selectFamilyPool([leaf, deco], 'botanical', 'harvest', 'earthen-premium')
    const night = selectFamilyPool([leaf, deco], 'heraldic', 'geometric-deco', 'nocturne-crest')
    expect(earth.atoms.map((a) => a.id)).toEqual([leaf.id])
    expect(night.atoms.map((a) => a.id)).toEqual([deco.id])
  })

  it('TERRA GROVE blank never paints islamic-border', () => {
    const job = JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury') as Job
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(job),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const face = spec.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
    expect(face).not.toMatch(/islamic-border/)
    expect(spec.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(spec.designPlan?.visualConcept.family).toBe('botanical')
    const search = lastCompositionSearch()
    expect(search?.concept?.family).toBe('botanical')
    if (search?.concept?.winnerAssetId) {
      expect(search.concept.winnerFamily).toBe('botanical')
      expect(search.concept.familyMatch).toBe('EXACT')
      expect(face).toMatch(/data-motif-family="botanical"/)
    }
    expect(search?.concept?.hardConstraint).toBe('PASS')
    expect(search?.concept?.critic).not.toBe('REJECT')
    expect(search?.concept?.styleConsistency ?? 80).toBeGreaterThan(18)
    expect(spec.preflight.exportOk).toBe(true)
    expect(spec.preflight.items.find((i) => i.id === 'asset-family')?.status).toBe('pass')
    const gate = markupFamilyGate(face, spec.designPlan!)
    expect(gate.ok).toBe(true)
  })

  it('validateAssetLibrary reports botanical assets and no SVG errors', () => {
    const report = validateAssetLibrary()
    expect(report.counts.BOTANICAL).toBeGreaterThanOrEqual(14)
    expect(report.issues.filter((i) => i.level === 'error')).toEqual([])
    if (report.counts.UNCLASSIFIED > 0) {
      expect(report.issues.some((i) => i.level === 'warning' && /UNCLASSIFIED/.test(i.message))).toBe(true)
    }
  })

  it('coverage INCOMPATIBLE WINNER COUNT is 0', () => {
    const report = reportAssetCoverage()
    expect(report.incompatibleWinnerCount).toBe(0)
    const terra = report.rows.find((r) => r.slug === '08-zeytinyagi-tuck-luxury')
    expect(terra?.family).toBe('botanical')
    expect(terra?.incompatibleWinner).toBe(false)
    if (terra?.winnerAsset) expect(terra.winnerFamily).toBe('botanical')
  })
})
