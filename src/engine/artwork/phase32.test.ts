import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { StyleType } from '../../types'
import { applyPlanToSystem, createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { kitGradeOmitsCrestGlyph, kitGradeSkipsOverlay, lockupForConcept } from '../designSystem/conceptKitAlignment'
import { resolveDesignSystem } from '../designSystem/resolve'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { lastCompositionSearch } from './compositionCandidates'

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

  it('skips overlay clip-art on luxury, modern, minimal, and classic', () => {
    expect(kitGradeSkipsOverlay('luxury')).toBe(true)
    expect(kitGradeSkipsOverlay('modern')).toBe(true)
    expect(kitGradeSkipsOverlay('minimal')).toBe(true)
    expect(kitGradeSkipsOverlay('classic')).toBe(true)
    expect(kitGradeOmitsCrestGlyph('classic')).toBe(true)
    expect(kitGradeOmitsCrestGlyph('luxury')).toBe(false)
    expect(kitGradeSkipsOverlay('eco')).toBe(false)
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
