import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import type { DesignPlan } from '../brain/DesignPlan'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache, ingestArtPatternLibrary } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { slotBox } from './artDesignRegions'
import type { MotifSlot } from './artMotifCompose'
import {
  chooseCompositionWinner,
  clearCompositionSearch,
  compositionLayoutFingerprint,
  generateCompositionCandidates,
  lastCompositionSearch,
  scoreCompositionSlots,
  selectMotifComposition,
  type CompositionCandidate,
} from './compositionCandidates'
import { critiqueCandidate } from './compositionCritic'
import {
  CUSTOM_STRATEGY_SCALE,
  allowedStrategies,
  compositionTargets,
  type CompositionScore,
} from './compositionStrategy'
import type { Panel } from '../../types'

function jobSpec(slug: string, blankCanvas = false) {
  const job = JOBS.find((j) => j.slug === slug) as Job
  return new FormaLocalEngine().generate({
    brief: briefFrom(job),
    overridePatch: { variationIndex: 0, blankCanvas },
  })
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

function stubPlan(over: Partial<DesignPlan> = {}): DesignPlan {
  const base: DesignPlan = {
    sector: 'perfume',
    subProduct: 'eau de parfum',
    vocabularyId: 'perfume',
    surface: 'box',
    style: 'luxury',
    cue: 'none',
    variationIndex: 0,
    positioning: 'luxury',
    visualIntent: 'elegant',
    hierarchy: { primary: 'brand', secondary: 'product', tertiary: 'volume', order: 'brand > product > volume' },
    typography: { displayFace: 'serif', productFace: 'sans', authority: 'display', trackingIntent: 'wide' },
    composition: {
      lockup: 'center',
      negativeSpace: 'high',
      opticalCenter: 0.38,
      focal: 'center',
      intent: 'symmetric',
      heroZone: { y: 0.135, h: 0.15, x: 0.5 },
      lockupBand: { y: 0.3, h: 0.28 },
      legalZone: 'back',
      marksZone: 'back',
    },
    artDirection: { vocabulary: 'perfume', crop: 'open', chrome: 'quiet', antiRepetition: { seed: 0, forbidLastFamilies: [] } },
    visualConcept: { id: 'lux', tags: [] },
    heroGraphic: { family: 'crest', placement: 'above-lockup', scale: 1, clearance: true },
    illustrationSystem: { primitives: [], density: 'sparse' },
    patternSystem: { family: 'none', opacity: 0, avoidLockup: true, sideIntentional: false },
    backgroundTreatment: 'quiet-paper',
    density: { overall: 'sparse', front: 'sparse', side: 'sparse', back: 'sparse' },
    crop: { heroCrop: 1, safeInsets: 2 },
    decor: { density: 'sparse', allowed: ['crest'], lockupClearance: true, restrainExtras: true },
    color: { roles: { bg: 'ground', fg: 'ink', accent: 'signal' }, metallic: 'foil', followStyleBar: true },
    marks: { recipeKey: 'perfume', frontClean: true },
    dielineBehavior: {
      frontClean: true,
      spineBrandFirst: true,
      backLegalStack: true,
      tucksMinimal: true,
      labelFrontDesign: false,
      labelBackUtility: false,
    },
    risks: [],
    summaryTr: '',
  }
  return {
    ...base,
    ...over,
    composition: { ...base.composition, ...over.composition },
    decor: { ...base.decor, ...over.decor },
    heroGraphic: { ...base.heroGraphic, ...over.heroGraphic },
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

function poolAtoms(): MotifAtom[] {
  return [
    stubAtom({ id: 'frame-a', roleGuess: 'frame', sourceName: 'artdeco-frame.svg', tags: ['artdeco'], bbox: { x: 0, y: 0, w: 80, h: 80 } }),
    stubAtom({ id: 'corner-nw', roleGuess: 'corner', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }),
    stubAtom({ id: 'corner-ne', roleGuess: 'corner', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }),
    stubAtom({ id: 'corner-sw', roleGuess: 'corner', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }),
    stubAtom({ id: 'stamp-a', roleGuess: 'stamp', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }),
    stubAtom({ id: 'stamp-b', roleGuess: 'stamp', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }),
  ]
}

describe('Phase 17 composition candidates', () => {
  beforeEach(() => {
    resetArtMemory()
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
    clearCompositionSearch()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  afterEach(() => {
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
    clearCompositionSearch()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  it('TEST 1: same brief + seed → same winner + same SVG', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p17-det-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'artdeco-frame.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><path d="M8 8h28v28H8z" fill="#111"/></g>
        <g><path d="M164 8h28v28H164z" fill="#111"/></g>
        <g><path d="M8 164h28v28H8z" fill="#111"/></g>
        <g><path d="M164 164h28v28H164z" fill="#111"/></g>
      </svg>`,
      'utf8',
    )
    ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    const brief = {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box' as const,
      templateId: 'fm-cos-tuck-perfume',
      dimensionsMm: { L: 70, W: 40, H: 140 },
      volume: '50 ml',
      styleType: 'luxury' as const,
      colors: '#1a0a0a #c9a227',
    }
    const engine = new FormaLocalEngine()
    resetArtMemory()
    const a = engine.generate({ brief, overridePatch: { variationIndex: 0, blankCanvas: true } })
    const winnerA = lastCompositionSearch()?.winner
    resetArtMemory()
    clearCompositionSearch()
    const b = engine.generate({ brief, overridePatch: { variationIndex: 0, blankCanvas: true } })
    expect(face(a)).toBe(face(b))
    expect(lastCompositionSearch()?.winner).toBe(winnerA)
    expect(face(a)).not.toContain('"decision": "WINNER"')
    expect(a.preflight.exportOk).toBe(true)
  })

  it('TEST 2: 3 candidates use distinct composition strategies', () => {
    const panel = frontPanel()
    const plan = stubPlan({ composition: { ...stubPlan().composition, intent: 'editorial', heroZone: { y: 0.12, h: 0.15, x: 0.68 } } })
    expect(allowedStrategies(plan).length).toBeGreaterThanOrEqual(3)
    const cands = generateCompositionCandidates({
      panel,
      atoms: poolAtoms(),
      plan,
      opts: { style: 'luxury', seed: 0 },
      palette: PALETTE,
    })
    expect(cands.length).toBeGreaterThanOrEqual(3)
    expect(cands.length).toBeLessThanOrEqual(5)
    expect(new Set(cands.map((c) => c.strategy)).size).toBe(cands.length)
    expect(new Set(cands.map((c) => c.fingerprint)).size).toBe(cands.length)
  })

  it('TEST 3: asset swap alone is not candidate diversity', () => {
    const panel = frontPanel()
    const a = stubAtom({ id: 'ornament-a', roleGuess: 'corner' })
    const b = stubAtom({ id: 'ornament-b', roleGuess: 'corner' })
    const box = { x: 4, y: 4, w: 12, h: 12 }
    const slotsA = [asSlot(a, box, { role: 'corner' })]
    const slotsB = [asSlot(b, box, { role: 'corner' })]
    expect(compositionLayoutFingerprint('minimal-accent', slotsA, panel)).toBe(
      compositionLayoutFingerprint('minimal-accent', slotsB, panel),
    )
    expect(compositionLayoutFingerprint('minimal-accent', slotsA, panel)).not.toContain('ornament-a')
  })

  it('TEST 4: high-whitespace luxury penalizes dense composition', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    expect(targets.whitespaceTarget).toBeGreaterThanOrEqual(0.66)
    const atoms = poolAtoms()
    const airy = [asSlot(atoms[1], { x: 4, y: 4, w: 10, h: 10 }, { opacity: 0.4, role: 'corner' })]
    const dense = [
      asSlot(atoms[0], { x: 1, y: 1, w: 33, h: 68 }, { opacity: 0.85 }),
      asSlot(atoms[1], { x: 36, y: 1, w: 33, h: 68 }, { opacity: 0.85 }),
      asSlot(atoms[2], { x: 1, y: 71, w: 33, h: 68 }, { opacity: 0.85 }),
      asSlot(atoms[3], { x: 36, y: 71, w: 33, h: 68 }, { opacity: 0.85 }),
    ]
    const airScore = scoreCompositionSlots('minimal-accent', airy, panel, plan, { style: 'luxury' }, targets)
    const denseScore = scoreCompositionSlots('pattern-field', dense, panel, plan, { style: 'luxury' }, targets)
    expect(airScore.whitespace).toBeGreaterThan(denseScore.whitespace)
    expect(airScore.total).toBeGreaterThan(denseScore.total)
  })

  it('TEST 5: art deco brief penalizes botanical mismatch', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    const decoA = stubAtom({
      id: 'deco-a',
      roleGuess: 'frame',
      sourceName: 'artdeco-frame.svg',
      tags: ['artdeco', 'luxury'],
      design: { styleTags: ['artdeco', 'luxury', 'geometric'], compatibleStyles: ['luxury', 'classic'] },
    })
    const decoB = stubAtom({
      id: 'deco-b',
      roleGuess: 'corner',
      sourceName: 'artdeco-corner.svg',
      tags: ['artdeco', 'geometric'],
      design: { styleTags: ['artdeco', 'geometric'], compatibleStyles: ['luxury'] },
    })
    const flower = stubAtom({
      id: 'flower',
      roleGuess: 'ornament',
      sourceName: 'botanic-leaf.svg',
      tags: ['eco', 'botanic'],
      design: { styleTags: ['eco', 'botanic'], compatibleStyles: ['eco'] },
    })
    const box = { x: 8, y: 8, w: 14, h: 14 }
    const match = scoreCompositionSlots(
      'framed-content',
      [asSlot(decoA, box, { role: 'frame' }), asSlot(decoB, { x: 48, y: 8, w: 14, h: 14 }, { role: 'corner' })],
      panel,
      plan,
      { style: 'luxury' },
      targets,
    )
    const clash = scoreCompositionSlots(
      'framed-content',
      [asSlot(decoA, box, { role: 'frame' }), asSlot(flower, { x: 48, y: 8, w: 14, h: 14 }, { role: 'ornament' })],
      panel,
      plan,
      { style: 'luxury' },
      targets,
    )
    expect(match.styleConsistency).toBeGreaterThan(clash.styleConsistency)
    expect(match.assetCompatibility).toBeGreaterThan(clash.assetCompatibility)
  })

  it('TEST 6: decoration cannot outrank brand/product hierarchy', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    const box = { x: 8, y: 90, w: 18, h: 18 }
    const heavy = asSlot(
      stubAtom({ id: 'heavy', roleGuess: 'ornament', design: { visualWeight: 0.95, maxOpacity: 0.95 } }),
      box,
      { opacity: 0.95, role: 'ornament' },
    )
    const light = asSlot(
      stubAtom({ id: 'light', roleGuess: 'corner', design: { visualWeight: 0.22 } }),
      box,
      { opacity: 0.4, role: 'corner' },
    )
    const heavyScore = scoreCompositionSlots('minimal-accent', [heavy], panel, plan, { style: 'luxury' }, targets)
    const lightScore = scoreCompositionSlots('minimal-accent', [light], panel, plan, { style: 'luxury' }, targets)
    expect(heavyScore.hierarchy).toBeLessThan(lightScore.hierarchy)
    expect(heavyScore.hierarchy).toBeLessThan(70)
  })

  it('TEST 7: hero collision drops score or rejects the candidate', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    const heroBox = { x: 20, y: 10, w: 30, h: 24 }
    const hit = asSlot(stubAtom({ id: 'hit', roleGuess: 'stamp' }), { x: 22, y: 12, w: 16, h: 16 }, { role: 'stamp' })
    const score = scoreCompositionSlots('hero-with-support', [hit], panel, plan, { style: 'luxury', heroBox }, targets)
    const critic = critiqueCandidate({ slots: [hit], heroBox, targets, score })
    expect(score.collisionSafety).toBeLessThan(20)
    expect(critic.status).toBe('REJECT')
  })

  it('TEST 8: lockup collision rejects the candidate', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    const lockup = { x: 12, y: 48, w: 46, h: 40 }
    const hit = asSlot(stubAtom({ id: 'lock', roleGuess: 'corner' }), { x: 18, y: 52, w: 14, h: 14 }, { role: 'corner' })
    const score = scoreCompositionSlots('balanced-corners', [hit], panel, plan, { style: 'luxury', lockup }, targets)
    const critic = critiqueCandidate({ slots: [hit], lockup, targets, score })
    expect(critic.status).toBe('REJECT')
    expect(score.collisionSafety).toBeLessThan(20)
  })

  it('TEST 9: low-density brief penalizes extra assets', () => {
    const panel = frontPanel()
    const plan = stubPlan({ decor: { density: 'sparse', allowed: ['crest'], lockupClearance: true, restrainExtras: true } })
    const targets = compositionTargets(plan)
    const atoms = poolAtoms()
    const few = [asSlot(atoms[1], { x: 4, y: 4, w: 10, h: 10 }, { opacity: 0.45, role: 'corner' })]
    const many = atoms.slice(0, 5).map((atom, i) =>
      asSlot(atom, { x: 4 + (i % 2) * 28, y: 4 + Math.floor(i / 2) * 28, w: 22, h: 22 }, { opacity: 0.8 }),
    )
    const fewScore = scoreCompositionSlots('minimal-accent', few, panel, plan, { style: 'luxury' }, targets)
    const manyScore = scoreCompositionSlots('pattern-field', many, panel, plan, { style: 'luxury' }, targets)
    expect(fewScore.decorationDensity).toBeGreaterThan(manyScore.decorationDensity)
  })

  it('TEST 10: symmetric strategy scores bilateral corners higher', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const targets = compositionTargets(plan)
    const a = stubAtom({ id: 'c1', roleGuess: 'corner' })
    const b = stubAtom({ id: 'c2', roleGuess: 'corner' })
    const pair = [
      asSlot(a, { x: 3, y: 3, w: 12, h: 12 }, { role: 'corner' }),
      asSlot(b, { x: 55, y: 3, w: 12, h: 12 }, { role: 'corner' }),
    ]
    const one = [pair[0]]
    const pairScore = scoreCompositionSlots('balanced-corners', pair, panel, plan, { style: 'luxury' }, targets)
    const oneScore = scoreCompositionSlots('balanced-corners', one, panel, plan, { style: 'luxury' }, targets)
    expect(pairScore.rhythm).toBeGreaterThan(oneScore.rhythm)
  })

  it('TEST 11: asymmetric editorial does not force bilateral duplication', () => {
    const panel = frontPanel()
    const plan = stubPlan({
      composition: { ...stubPlan().composition, intent: 'editorial', heroZone: { y: 0.1, h: 0.14, x: 0.68 } },
    })
    const cands = generateCompositionCandidates({
      panel,
      atoms: poolAtoms(),
      plan,
      opts: { style: 'luxury', seed: 0 },
      palette: PALETTE,
    })
    const editorial = cands.find((c) => c.strategy === 'asymmetric-editorial')
    expect(editorial).toBeTruthy()
    const sideSlots = editorial!.slots.filter((s) => s.box.w < panel.w * 0.45)
    const left = sideSlots.some((s) => s.box.x < panel.x + panel.w * 0.4)
    const right = sideSlots.some((s) => s.box.x > panel.x + panel.w * 0.55)
    expect(left && right).toBe(false)
  })

  it('TEST 12: custom strategies stay inside scale constraints', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const cands = generateCompositionCandidates({
      panel,
      atoms: poolAtoms(),
      plan,
      opts: { style: 'luxury', seed: 0 },
      palette: PALETTE,
    })
    const accent = cands.find((c) => c.strategy === 'minimal-accent')
    expect(accent?.slots.length).toBeGreaterThan(0)
    const range = CUSTOM_STRATEGY_SCALE['minimal-accent']!
    const origin = slotBox(panel, 'ne')
    for (const slot of accent?.slots ?? []) {
      expect(slot.box.w).toBeLessThanOrEqual(origin.w * range.max + 0.35)
    }
  })

  it('TEST 13: production-fail candidate cannot win', () => {
    const plan = stubPlan()
    const reject: CompositionCandidate = {
      id: 'bad',
      strategy: 'pattern-field',
      plan,
      slots: [],
      recipeId: 'stamp-field',
      fingerprint: 'bad',
      placements: [],
      preScore: fullScore(99),
      critique: { status: 'REJECT', issues: [{ topic: 'collision', note: 'lockup' }], scoreAdjustments: [] },
    }
    const keep: CompositionCandidate = {
      id: 'ok',
      strategy: 'minimal-accent',
      plan,
      slots: [],
      recipeId: 'stamp-field',
      fingerprint: 'ok',
      placements: [],
      preScore: fullScore(51),
      critique: { status: 'KEEP', issues: [], scoreAdjustments: [] },
    }
    expect(chooseCompositionWinner([reject, keep], 0)?.id).toBe('ok')
  })

  it('TEST 14: generate with LLM off is deterministic', () => {
    const panel = frontPanel()
    const plan = stubPlan()
    const atoms = poolAtoms()
    const first = selectMotifComposition({ panel, palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    const debugA = lastCompositionSearch()
    const second = selectMotifComposition({ panel, palette: PALETTE, atoms, plan, opts: { style: 'luxury', seed: 0 } })
    expect(second.markup).toBe(first.markup)
    expect(second.winner?.strategy).toBe(first.winner?.strategy)
    expect(lastCompositionSearch()?.winner).toBe(debugA?.winner)
    expect(debugA?.perf.candidateCount).toBeGreaterThanOrEqual(3)
    expect(debugA?.perf.paintCount).toBeLessThanOrEqual(3)
    expect(debugA?.perf.generateMs).toBeLessThan(2000)
  })

  it('TEST 15: catalog kit faces keep the production contract', () => {
    const spec = jobSpec('01-parfum-tuck-luxury', false)
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
})
