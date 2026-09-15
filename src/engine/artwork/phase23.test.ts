import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import type { MotifSlot } from './artMotifCompose'
import { applyDecorationBudget, decorationSpendOf, lastCompositionSearch } from './compositionCandidates'
import { conceptFidelityOf } from './visualLanguage'
import { markupFamilyGate } from './assetCatalog/constraints'
import type { Panel } from '../../types'

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
    opacity: extra.opacity ?? 0.8,
    par: 'xMidYMid meet',
    lockout: extra.lockout ?? false,
    role: extra.role ?? atom.roleGuess,
  }
}

describe('Phase 23 companion not clone / hard budget', () => {
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

  it('same lexicon token stacked scores below distinct companions', () => {
    const plan = createPlan({ brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')), style: 'luxury', blankCanvas: true })
    const oliveA = stubAtom({
      id: 'olive-branch-side',
      sourceName: 'olive-branch-side.svg',
      design: { family: 'botanical', subfamily: 'olive-branch' },
    })
    const oliveB = stubAtom({
      id: 'olive-branch-corner',
      sourceName: 'olive-branch-corner.svg',
      design: { family: 'botanical', subfamily: 'olive-branch' },
    })
    const corner = stubAtom({
      id: 'botanical-corner',
      sourceName: 'botanical-corner.svg',
      design: { family: 'botanical', subfamily: 'botanical-frame' },
    })
    const accent = stubAtom({
      id: 'botanical-accent-bottom',
      sourceName: 'botanical-accent-bottom.svg',
      design: { family: 'botanical', subfamily: 'botanical-frame' },
    })
    const clones = [
      asSlot(oliveA, { x: 4, y: 4, w: 14, h: 18 }, { role: 'corner' }),
      asSlot(oliveB, { x: 4, y: 110, w: 14, h: 18 }, { role: 'stamp' }),
    ]
    const mixed = [
      asSlot(oliveA, { x: 4, y: 4, w: 14, h: 18 }, { role: 'corner' }),
      asSlot(corner, { x: 4, y: 110, w: 14, h: 18 }, { role: 'stamp' }),
      asSlot(accent, { x: 18, y: 118, w: 34, h: 10 }, { role: 'accent' }),
    ]
    expect(conceptFidelityOf(mixed, plan)).toBeGreaterThan(conceptFidelityOf(clones, plan))
    expect(conceptFidelityOf(clones, plan)).toBeLessThanOrEqual(68)
  })

  it('decoration budget cannot keep a slot that still exceeds the cap', () => {
    const panel = frontPanel()
    const huge = asSlot(
      stubAtom({
        id: 'vintage-field',
        sourceName: '588vintage.svg',
        design: { visualWeight: 0.95, complexity: 90, occupiedAreaRatio: 0.99 },
      }),
      { x: 0, y: 0, w: 70, h: 140 },
      { opacity: 0.95 },
    )
    const light = asSlot(
      stubAtom({ id: 'tick', sourceName: 'quiet-ticks.svg', design: { visualWeight: 0.14, complexity: 4, occupiedAreaRatio: 0.08 } }),
      { x: 4, y: 4, w: 10, h: 10 },
      { opacity: 0.4 },
    )
    const capped = applyDecorationBudget([huge, light], panel, 0.18)
    expect(decorationSpendOf(capped, panel)).toBeLessThanOrEqual(0.21)
    expect(capped.every((s) => s.atom.id !== 'vintage-field' || decorationSpendOf([s], panel) <= 0.21)).toBe(true)
  })

  it('five-concept live: companions distinct, budget held, 2.1 stories return', { timeout: 15000 }, () => {
    const engine = new FormaLocalEngine()
    const earthSpec = engine.generate({
      brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(earthSpec.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(face(earthSpec)).toContain('data-lockup-chrome="harvest-seal"')
    expect(face(earthSpec)).not.toContain('data-art="art-pattern-compose"')

    const ovalSpec = engine.generate({
      brief: briefFrom(jobOf('03-krem-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(face(ovalSpec)).toContain('data-lockup-chrome="soft-oval"')
    expect(face(ovalSpec)).not.toContain('data-art="art-pattern-compose"')

    const airSpec = engine.generate({
      brief: briefFrom(jobOf('04-serum-tuck-minimal')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(airSpec.designPlan?.visualConcept.id).toBe('air-paper')
    expect(face(airSpec)).toContain('data-lockup-chrome="air-rule"')
    expect(face(airSpec)).not.toContain('data-art="art-pattern-compose"')

    const nightSpec = engine.generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(face(nightSpec)).toContain('data-lockup-chrome="centered-crest"')
    expect(face(nightSpec)).not.toContain('data-art="art-pattern-compose"')

    const tech = engine.generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(face(tech)).toContain('data-lockup-chrome="tech-grid"')
    expect(face(tech)).not.toContain('data-art="art-pattern-compose"')
    expect(markupFamilyGate(face(tech), tech.designPlan!).ok).toBe(true)

    const chocolate = engine.generate({
      brief: briefFrom(jobOf('09-cikolata-tray-playful')),
      overridePatch: { blankCanvas: false, variationIndex: 0 },
    })
    const choco = lastCompositionSearch()
    const budget = chocolate.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
  })
})
