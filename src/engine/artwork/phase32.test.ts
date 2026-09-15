import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { StyleType } from '../../types'
import { applyPlanToSystem, createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { kitGradeOmitsCrestGlyph, kitGradeSkipsOverlay, lockupForConcept } from '../designSystem/conceptKitAlignment'
import { resolveDesignSystem } from '../designSystem/resolve'
import type { MotifAtom } from './artMotifAtomizer'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { lastCompositionSearch } from './compositionCandidates'
import type { MotifSlot } from './artMotifCompose'
import { critiqueCandidate } from './compositionCritic'
import { compositionTargets, type CompositionScore } from './compositionStrategy'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function kitOf(slug: string, style?: StyleType) {
  const brief = { ...briefFrom(jobOf(slug)), ...(style ? { styleType: style } : {}) }
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { blankCanvas: false, variationIndex: 0 },
  })
}

describe('Phase 32 kit-grade faces (luxury / modern / minimal)', () => {
  beforeEach(() => {
    resetArtMemory()
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
  })

  afterEach(() => {
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    clearArtMotifAtomizerCache()
    clearMotifBankCache()
  })

  it('skips overlay clip-art on luxury, modern, minimal, classic, and eco', () => {
    expect(kitGradeSkipsOverlay('luxury')).toBe(true)
    expect(kitGradeSkipsOverlay('modern')).toBe(true)
    expect(kitGradeSkipsOverlay('minimal')).toBe(true)
    expect(kitGradeSkipsOverlay('classic')).toBe(true)
    expect(kitGradeOmitsCrestGlyph('classic')).toBe(true)
    expect(kitGradeOmitsCrestGlyph('luxury')).toBe(false)
    expect(kitGradeSkipsOverlay('eco')).toBe(true)
    expect(kitGradeSkipsOverlay('playful')).toBe(false)
  })

  it('blank canvas remaps lockup from VisualConcept like the catalog kit', () => {
    const brief = briefFrom(jobOf('03-krem-tuck-luxury'))
    const plan = createPlan({ brief, style: 'luxury', blankCanvas: true })
    const system = applyPlanToSystem(resolveDesignSystem(brief, undefined, { blankCanvas: true }), plan)
    expect(lockupForConcept(plan.visualConcept, 'air-rule')).toBe('soft-oval')
    expect(system.lockup).toBe('soft-oval')
  })

  it('catalog kit luxury/modern/minimal faces paint chrome, not overlay images', { timeout: 40000 }, () => {
    const night = kitOf('01-parfum-tuck-luxury')
    expect(face(night)).toContain('data-lockup-chrome="centered-crest"')
    expect(face(night)).toContain('data-art="gold-bar"')
    expect(face(night)).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(face(night)).not.toContain('data-art="art-pattern-compose"')
    expect(lastCompositionSearch()).toBeUndefined()

    const serum = kitOf('04-serum-tuck-minimal')
    expect(face(serum)).toContain('data-lockup-chrome="air-rule"')
    expect(face(serum)).not.toContain('data-art="art-pattern-compose"')

    const tech = kitOf('14-kulaklik-tuck-modern')
    expect(face(tech)).toContain('data-lockup-chrome="tech-grid"')
    expect(face(tech)).not.toContain('data-art="art-pattern-compose"')
    expect(face(tech)).not.toContain('data-art="l-bracket"')

    const choco = kitOf('09-cikolata-tray-playful')
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect(lastCompositionSearch()?.concept?.winnerFamily).toBe('ornate-stamp')
  })

  it('classic perfume is kit chrome, not crest-bottle or corner overlay', { timeout: 20000 }, () => {
    const cologne = kitOf('02-kolonya-tuck-classic')
    const svg = face(cologne)
    expect(svg).toContain('data-lockup-chrome="centered-crest"')
    expect(svg).not.toContain('data-art="art-pattern-compose"')
    expect(svg).not.toContain('double-line-corner')
    expect(svg).not.toContain('data-hero="crest"')
    expect(svg).not.toContain('data-motif="perfume-bottle"')
    expect(lastCompositionSearch()).toBeUndefined()
    expect(cologne.preflight.exportOk).toBe(true)

    const cookie = kitOf('10-kurabiye-tray-classic')
    expect(face(cookie)).toContain('data-lockup-chrome="serif-cartouche"')
    expect(face(cookie)).not.toContain('data-art="art-pattern-compose"')
    expect(face(cookie)).not.toContain('double-line-corner')
    expect(face(cookie)).not.toContain('data-hero="crest"')
    expect(face(cookie)).toContain('data-hero="harvest"')
  })

  it('classic food pantry keeps harvest native hero, not crest glyph', { timeout: 20000 }, () => {
    const pantry = kitOf('18-evrensel-gida-tuck')
    expect(face(pantry)).toContain('data-hero="harvest"')
    expect(face(pantry)).not.toContain('data-hero="crest"')
    expect(face(pantry)).not.toContain('data-art="art-pattern-compose"')
    expect(pantry.preflight.exportOk).toBe(true)
  })

  it('family-exact under-budget candidate is KEEP even when decorationDensity score is low', () => {
    const plan = createPlan({ brief: briefFrom(jobOf('12-recel-label-eco')), style: 'eco' })
    const atom: MotifAtom = {
      id: 'harvest-grain-leaf__atom-01',
      sheetId: 'harvest-grain-leaf',
      sourceName: 'harvest-grain-leaf.svg',
      bbox: { x: 0, y: 0, w: 20, h: 20 },
      viewBox: '0 0 20 20',
      markup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect width="20" height="20" fill="#111"/></svg>',
      bytes: 120,
      tags: ['harvest'],
      roleGuess: 'stamp',
      complexity: 4,
      design: { family: 'harvest', subfamily: 'grain', visualWeight: 0.28, allowedRegions: ['nw', 'ne', 'sw', 'se', 'top', 'bottom'] },
    }
    const slot: MotifSlot = {
      atom,
      box: { x: 2, y: 2, w: 10, h: 10 },
      opacity: 0.7,
      par: 'xMidYMid meet',
      lockout: false,
      role: 'stamp',
    }
    const score: CompositionScore = {
      hierarchy: 80,
      balance: 80,
      whitespace: 80,
      styleConsistency: 80,
      familyConsistency: 90,
      decorationDensity: 22,
      assetCompatibility: 80,
      conceptFidelity: 90,
      alignment: 86,
      rhythm: 80,
      collisionSafety: 90,
      productionSafety: 88,
      total: 80,
    }
    const critic = critiqueCandidate({
      slots: [slot],
      lockup: { x: 18, y: 48, w: 34, h: 36 },
      targets: compositionTargets(plan),
      score,
      plan,
    })
    expect(critic.issues.some((i) => i.topic === 'DECORATION_OVERLOAD')).toBe(false)
    expect(critic.status).toBe('KEEP')
  })

  it('eco kit keeps native botanical hero, not a second leaf overlay', { timeout: 20000 }, () => {
    const cream = kitOf('21-krem-eco-monstera')
    expect(face(cream)).toContain('data-bg-kit="botanical-field"')
    expect(face(cream)).not.toContain('data-art="art-pattern-compose"')
    expect(lastCompositionSearch()).toBeUndefined()
    expect(cream.preflight.exportOk).toBe(true)

    const jam = kitOf('12-recel-label-eco')
    expect(jam.designPlan?.visualConcept.id).toBe('harvest-kraft')
    expect(face(jam)).toContain('data-lockup-chrome="label-stack"')
    expect(face(jam)).not.toContain('data-art="art-pattern-compose"')
  })

  it('studio-style blank luxury perfume still gets kit painter, not overlay clip-art', { timeout: 20000 }, () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const svg = face(spec)
    expect(svg).toContain('data-face="blank-canvas"')
    expect(svg).toContain('data-lockup-chrome="centered-crest"')
    expect(svg).toContain('data-art="gold-bar"')
    expect(svg).not.toContain('data-art="art-pattern-compose"')
    expect(lastCompositionSearch()).toBeUndefined()
    expect(spec.preflight.exportOk).toBe(true)
  })
})
