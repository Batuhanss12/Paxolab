import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlan, resetArtMemory, visualConceptFor, decorationBudgetOf } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache, ingestArtPatternLibrary } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { matchMotifs } from './artMotifMatch'
import { applyDecorationBudget, scoreCompositionSlots } from './compositionCandidates'
import { compositionTargets } from './compositionStrategy'
import { allowedStrategies } from './compositionStrategy'
import { motifFamilyOf } from './artMotifFamily'
import { paletteFromBrief, parseBriefColors } from './briefPalette'
import type { Panel } from '../../types'
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

function asSlot(atom: MotifAtom, box: MotifSlot['box'], extra: Partial<MotifSlot> = {}): MotifSlot {
  return {
    atom,
    box,
    opacity: extra.opacity ?? 0.8,
    par: 'xMidYMid meet',
    lockout: false,
    role: extra.role ?? atom.roleGuess,
  }
}

describe('Phase 18 visual concept / art direction', () => {
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

  it('keeps existing perfume luxury concept id', () => {
    const concept = visualConceptFor('luxury', 'perfume', 'crest')
    expect(concept.id).toBe('nocturne-crest')
    expect(concept.family).toBe('heraldic')
    expect(concept.decorationBudget).toBeLessThan(0.4)
  })

  it('oil luxury resolves EARTHEN PREMIUM botanical, not a generic corner recipe', () => {
    const concept = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı')
    expect(concept.id).toBe('earthen-premium')
    expect(concept.label).toBe('EARTHEN PREMIUM')
    expect(concept.family).toBe('botanical')
    expect(concept.decorationBudget).toBeCloseTo(0.42)
    expect(concept.strategyBias).toContain('asymmetric-editorial')
    expect(concept.strategyBias?.[0]).not.toBe('balanced-corners')
  })

  it('createPlan for TERRA GROVE carries the concept into the design plan', () => {
    const job = JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury') as Job
    const plan = createPlan({
      brief: briefFrom(job),
      style: 'luxury',
      blankCanvas: true,
    })
    expect(plan.visualConcept.id).toBe('earthen-premium')
    expect(plan.visualConcept.family).toBe('botanical')
    expect(decorationBudgetOf(plan)).toBeCloseTo(0.42)
    const strategies = allowedStrategies(plan)
    expect(strategies[0]).toBe('asymmetric-editorial')
    expect(strategies).toContain('hero-with-support')
    expect(strategies).not.toContain('pattern-field')
  })

  it('zeytin altın is olive + gold, not gold-on-gold', () => {
    const hexes = parseBriefColors('zeytin altın')
    expect(hexes.length).toBeGreaterThanOrEqual(2)
    expect(hexes[0].toLowerCase()).not.toBe(hexes[1].toLowerCase())
    const pal = paletteFromBrief({ ...emptyBrief(), colors: 'zeytin altın', styleType: 'luxury' }, 'luxury')
    expect(pal.bg.toLowerCase()).not.toBe(pal.accent.toLowerCase())
  })

  it('art deco sheet loses to botanical on an oil brief when both exist', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p18-'))
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
    writeFileSync(
      path.join(dir, 'botanic-leaf.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><circle cx="24" cy="24" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="176" cy="24" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="24" cy="176" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="176" cy="176" r="10" fill="#2d6a4f"/></g>
      </svg>`,
      'utf8',
    )
    ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    clearMotifBankCache()
    const match = matchMotifs({
      mood: 'luxury',
      sector: 'food',
      colors: 'zeytin altın',
      seed: 0,
      family: 'botanical',
      supportFamily: 'harvest',
    })
    expect(match.sheetIds[0]).toMatch(/botanic|leaf|olive|stem/)
    expect(match.sheetIds[0]).not.toMatch(/artdeco|islamic/)
  })

  it('decoration budget 0.18 cannot keep four heavy ornaments', () => {
    const panel = frontPanel()
    const slots = [0, 1, 2, 3].map((i) =>
      asSlot(stubAtom({ id: `h${i}`, roleGuess: 'ornament', design: { visualWeight: 0.35, complexity: 12 } }), {
        x: 4 + (i % 2) * 30,
        y: 4 + Math.floor(i / 2) * 40,
        w: 22,
        h: 22,
      }, { opacity: 0.55 }),
    )
    const capped = applyDecorationBudget(slots, panel, 0.18)
    expect(capped.length).toBeLessThan(slots.length)
    expect(capped.length).toBeGreaterThanOrEqual(1)
  })

  it('EARTHEN PREMIUM scores a botanic atom above an art-deco atom', () => {
    const job = JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury') as Job
    const plan = createPlan({
      brief: briefFrom(job),
      style: 'luxury',
      blankCanvas: true,
    })
    const panel = frontPanel()
    const box = { x: 8, y: 18, w: 18, h: 28 }
    const opts = { style: 'luxury' as const, seed: 0, sector: 'food' }
    const targets = compositionTargets(plan)
    const leaf = scoreCompositionSlots(
      'asymmetric-editorial',
      [asSlot(stubAtom({ id: 'leaf', sourceName: 'botanic-leaf.svg', tags: ['botanic', 'eco'] }), box)],
      panel,
      plan,
      opts,
      targets,
    )
    const deco = scoreCompositionSlots(
      'asymmetric-editorial',
      [asSlot(stubAtom({ id: 'deco', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }), box)],
      panel,
      plan,
      opts,
      targets,
    )
    expect(leaf.styleConsistency).toBeGreaterThan(deco.styleConsistency)
    expect(leaf.styleConsistency).toBeGreaterThan(70)
  })

  it('botanical filename maps to botanical family, artdeco does not', () => {
    expect(motifFamilyOf(stubAtom({ id: 'a', sourceName: 'botanic-leaf.svg', tags: ['eco'] }))).toBe('botanical')
    expect(motifFamilyOf(stubAtom({ id: 'b', sourceName: 'artdeco-frame.svg', tags: ['artdeco'] }))).toBe('geometric-deco')
  })

  it('blank oil generate stays deterministic and records the concept', () => {
    const engine = new FormaLocalEngine()
    const job = JOBS.find((j) => j.slug === '08-zeytinyagi-tuck-luxury') as Job
    const a = engine.generate({ brief: briefFrom(job), overridePatch: { blankCanvas: true, variationIndex: 0 } })
    resetArtMemory()
    const b = engine.generate({ brief: briefFrom(job), overridePatch: { blankCanvas: true, variationIndex: 0 } })
    const face = (spec: typeof a) => spec.artwork.layers.find((l) => l.panelId === 'front')?.markup ?? ''
    expect(face(a)).toBe(face(b))
    expect(a.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(a.preflight.exportOk).toBe(true)
  })
})
