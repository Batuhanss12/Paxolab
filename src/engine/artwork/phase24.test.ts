import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlan, resetArtMemory, visualConceptFor } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { lastCompositionSearch } from './compositionCandidates'
import { allowedStrategies } from './compositionStrategy'
import { markupFamilyGate } from './assetCatalog/constraints'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

describe('Phase 24 linear language ≠ corner pack', () => {
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

  it('TECH GLYPH / SIGNAL PLAQUE drop balanced-corners', () => {
    const tech = visualConceptFor('modern', 'electronics', 'tech')
    expect(tech.avoid).toContain('generic-corners')
    const techPlan = createPlan({ brief: briefFrom(jobOf('14-kulaklik-tuck-modern')), style: 'modern', blankCanvas: true })
    expect(allowedStrategies(techPlan)).not.toContain('balanced-corners')
    expect(allowedStrategies(techPlan)).toContain('asymmetric-editorial')
    expect(allowedStrategies(techPlan).length).toBeGreaterThanOrEqual(3)

    const plaque = visualConceptFor('luxury', 'electronics', 'tech')
    expect(plaque.id).toBe('signal-plaque')
    const plaquePlan = createPlan({
      brief: {
        ...briefFrom(jobOf('14-kulaklik-tuck-modern')),
        styleType: 'luxury',
      },
      style: 'luxury',
      blankCanvas: true,
    })
    expect(plaquePlan.visualConcept.id).toBe('signal-plaque')
    expect(allowedStrategies(plaquePlan)).not.toContain('balanced-corners')
  })

  it('NOX live winner is not a corner pack; pattern16 / family lock hold', () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const search = lastCompositionSearch()
    expect(spec.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(search).toBeUndefined()
    expect(allowedStrategies(spec.designPlan!)).not.toContain('balanced-corners')
    expect(face(spec)).toContain('data-lockup-chrome="tech-grid"')
    expect(face(spec)).not.toContain('data-art="art-pattern-compose"')
    expect(face(spec)).not.toContain('data-art="l-bracket"')
    expect(markupFamilyGate(face(spec), spec.designPlan!).ok).toBe(true)
    expect(face(spec)).not.toMatch(/islamic-border/)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('EARTHEN / NOCTURNE companions still open when unused tokens exist', () => {
    const earthSpec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(face(earthSpec)).toContain('data-lockup-chrome="harvest-seal"')
    expect(face(earthSpec)).not.toContain('data-art="art-pattern-compose"')

    const nightSpec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(face(nightSpec)).not.toContain('data-art="art-pattern-compose"')
    expect(face(nightSpec)).not.toMatch(/data-motif-atom="[^"]*(crest-spot|ribbon-corner|cartouche-arc)/)
  })
})
