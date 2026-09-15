import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DesignPlan } from '../brain/DesignPlan'
import { resetArtMemory, visualConceptFor } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import {
  applyDecorationBudget,
  craftFillFloor,
  decorationSpendOf,
  fillDecorationBudget,
  lastCompositionSearch,
} from './compositionCandidates'
import { allowedStrategies } from './compositionStrategy'
import { conceptFidelityOf } from './visualLanguage'
import { markupFamilyGate } from './assetCatalog/constraints'
import type { MotifSlot } from './artMotifCompose'
import type { Panel } from '../../types'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function kitOf(slug: string) {
  return new FormaLocalEngine().generate({
    brief: briefFrom(jobOf(slug)),
    overridePatch: { blankCanvas: false, variationIndex: 0 },
  })
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
    opacity: extra.opacity ?? 0.4,
    par: 'xMidYMid meet',
    lockout: extra.lockout ?? false,
    role: extra.role ?? atom.roleGuess,
  }
}

describe('Phase 26 craft fill inside concept budget', () => {
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

  it('fills thin slots toward the floor and still honors the cap', () => {
    const concept = visualConceptFor('luxury', 'perfume', 'crest')
    const plan = { visualConcept: concept } as DesignPlan
    const panel = frontPanel()
    const thin = [
      asSlot(
        stubAtom({
          id: 'ribbon-corner',
          sourceName: 'ribbon-corner.svg',
          design: { family: 'heraldic', subfamily: 'ribbon', visualWeight: 0.22, occupiedAreaRatio: 0.12, maxOpacity: 0.92 },
        }),
        { x: 4, y: 4, w: 10, h: 10 },
        { opacity: 0.4, role: 'corner' },
      ),
    ]
    const budget = 0.28
    expect(decorationSpendOf(thin, panel)).toBeLessThan(craftFillFloor(plan, budget))
    const filled = fillDecorationBudget(thin, panel, budget, plan, { kitSuppliesFocal: true })
    expect(decorationSpendOf(filled, panel)).toBeGreaterThan(decorationSpendOf(thin, panel))
    expect(decorationSpendOf(filled, panel)).toBeLessThanOrEqual(budget + 0.03)
    const capped = applyDecorationBudget(filled, panel, budget)
    expect(decorationSpendOf(capped, panel)).toBeLessThanOrEqual(budget + 0.05)
  })

  it('kit crest counts as the focal token for fidelity', () => {
    const plan = { visualConcept: visualConceptFor('luxury', 'perfume', 'crest') } as DesignPlan
    const ribbon = asSlot(
      stubAtom({ id: 'ribbon-corner', sourceName: 'ribbon-corner.svg', design: { family: 'heraldic', subfamily: 'ribbon' } }),
      { x: 6, y: 8, w: 12, h: 12 },
      { role: 'corner' },
    )
    const withKit = conceptFidelityOf([ribbon], plan, ['crest'])
    const motifOnly = conceptFidelityOf([ribbon], plan)
    expect(withKit).toBeGreaterThan(motifOnly)
    expect(withKit).toBeGreaterThan(48)
    expect(motifOnly).toBeLessThanOrEqual(48)
  })

  it('five kit faces fill craft without regressing 2.6–2.8', { timeout: 20000 }, () => {
    const earth = kitOf('08-zeytinyagi-tuck-luxury')
    expect(earth.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(face(earth)).not.toContain('data-art="sector-frame"')
    expect(face(earth)).toContain('data-lockup-chrome="harvest-seal"')
    expect(face(earth)).not.toContain('data-art="art-pattern-compose"')

    const night = kitOf('01-parfum-tuck-luxury')
    expect(night.designPlan?.visualConcept.id).toBe('nocturne-crest')
    expect(face(night)).toContain('data-art="gold-bar"')
    expect(face(night)).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(face(night)).toContain('data-lockup-chrome="centered-crest"')
    expect(face(night)).not.toContain('data-art="art-pattern-compose"')

    const oval = kitOf('03-krem-tuck-luxury')
    expect(oval.designPlan?.visualConcept.id).toBe('soft-oval')
    expect(face(oval)).not.toContain('data-art="sector-frame"')
    expect(face(oval)).toContain('data-lockup-chrome="soft-oval"')
    expect(face(oval)).not.toContain('data-art="art-pattern-compose"')

    const air = kitOf('04-serum-tuck-minimal')
    expect(air.designPlan?.visualConcept.id).toBe('air-paper')
    expect(face(air)).not.toContain('data-art="sector-frame"')
    expect(air.designPlan?.artDirection.chrome).toBe('quiet')
    expect(face(air)).toContain('data-lockup-chrome="air-rule"')
    expect(face(air)).not.toContain('data-art="art-pattern-compose"')

    const tech = kitOf('14-kulaklik-tuck-modern')
    const techFace = face(tech)
    expect(tech.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(techFace).not.toContain('data-art="l-bracket"')
    expect(techFace).not.toContain('data-art="sector-frame"')
    expect(techFace).toContain('data-lockup-chrome="tech-grid"')
    expect(techFace).not.toContain('data-art="art-pattern-compose"')
    expect(allowedStrategies(tech.designPlan!)).not.toContain('balanced-corners')
    expect(markupFamilyGate(techFace, tech.designPlan!).ok).toBe(true)

    const choco = kitOf('09-cikolata-tray-playful')
    const chocoSearch = lastCompositionSearch()
    const budget = choco.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThan(1)
  })
})
