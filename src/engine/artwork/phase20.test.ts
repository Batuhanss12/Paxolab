import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { emptyBrief } from '../fields'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { matchMotifs } from './artMotifMatch'
import { lastCompositionSearch } from './compositionCandidates'
import { motifFamilyOf } from './artMotifFamily'
import { markupFamilyGate } from './assetCatalog/constraints'
import { validateAssetLibrary } from './assetCatalog/validate'
import { accentContrastsGround, paletteFromBrief, parseBriefColors } from './briefPalette'
import { catalogRecords } from './assetCatalog/catalog'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

describe('Phase 20 family richness + kit path', () => {
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

  it('P20-A: TERRA GROVE blank spends botanical budget without leaving family', () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const svg = face(spec)
    const search = lastCompositionSearch()
    expect(spec.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(spec.designPlan?.visualConcept.family).toBe('botanical')
    expect(svg).not.toMatch(/islamic-border/)
    expect(svg).toContain('data-lockup-chrome="harvest-seal"')
    expect(svg).not.toContain('data-art="art-pattern-compose"')
    expect(search).toBeUndefined()
    expect(markupFamilyGate(svg, spec.designPlan!).ok).toBe(true)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('P20-B: quiet-line match prefers a non-grain atom', () => {
    const match = matchMotifs({
      mood: 'minimal',
      sector: 'serum',
      colors: '#f5f0e8 #2d6a4f',
      seed: 0,
      family: 'quiet-line',
      conceptId: 'air-paper',
    })
    expect(match.atoms.length).toBeGreaterThan(0)
    expect(match.atoms.every((a) => motifFamilyOf(a) === 'quiet-line')).toBe(true)
    expect(match.atoms.some((a) => !/paper-grain/.test(a.sheetId) && !/paper-grain/.test(a.id))).toBe(true)

    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('04-serum-tuck-minimal')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    const search = lastCompositionSearch()
    const budget = spec.designPlan?.visualConcept.decorationBudget ?? 0
    expect(spec.designPlan?.visualConcept.family).toBe('quiet-line')
    expect(budget).toBeGreaterThanOrEqual(0.18)
    expect(face(spec)).toContain('data-lockup-chrome="air-rule"')
    expect(face(spec)).not.toContain('data-art="art-pattern-compose"')
    expect(search).toBeUndefined()
  })

  it('P20-C: oil kit uses the family pipeline without becoming blank-canvas', () => {
    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('08-zeytinyagi-tuck-luxury')),
      overridePatch: { blankCanvas: false, variationIndex: 0 },
    })
    const svg = face(spec)
    const search = lastCompositionSearch()
    expect(svg).not.toContain('data-face="blank-canvas"')
    expect(svg).toContain('data-lockup-chrome="harvest-seal"')
    expect(svg).not.toContain('data-art="art-pattern-compose"')
    expect(search).toBeUndefined()
    expect(svg).not.toMatch(/islamic-border/)
    expect(markupFamilyGate(svg, spec.designPlan!).ok).toBe(true)
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('P20-D: single-swatch black brief lifts accent off the ground', () => {
    expect(parseBriefColors('siyah')).toEqual(['#1a0a0a'])
    const pal = paletteFromBrief({ ...emptyBrief(), colors: 'siyah', styleType: 'modern' }, 'modern')
    expect(accentContrastsGround(pal.bg, pal.accent)).toBe(true)
    expect(pal.accent.toLowerCase()).not.toBe(pal.bg.toLowerCase())

    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('14-kulaklik-tuck-modern')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(accentContrastsGround(spec.palette.bg, spec.palette.accent)).toBe(true)
    const item = spec.preflight.items.find((i) => i.id === 'accent-ground')
    expect(item?.status).not.toBe('fail')
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('P20-E: heraldic match prefers named family files', () => {
    const named = catalogRecords().filter((r) => r.family === 'heraldic' && r.file)
    expect(named.length).toBeGreaterThanOrEqual(4)
    const match = matchMotifs({
      mood: 'luxury',
      sector: 'perfume',
      colors: '#1a0a0a #c9a227',
      seed: 0,
      family: 'heraldic',
      supportFamily: 'geometric-deco',
      conceptId: 'nocturne-crest',
    })
    expect(match.atoms.every((a) => !/crest-spot|ribbon-corner|cartouche-arc|double-line-corner/.test(a.sheetId))).toBe(true)

    const spec = new FormaLocalEngine().generate({
      brief: briefFrom(jobOf('01-parfum-tuck-luxury')),
      overridePatch: { blankCanvas: true, variationIndex: 0 },
    })
    expect(spec.preflight.exportOk).toBe(true)
    expect(face(spec)).not.toMatch(/islamic-border/)
    expect(face(spec)).toContain('data-lockup-chrome="centered-crest"')
    expect(face(spec)).not.toContain('data-art="art-pattern-compose"')
    expect(lastCompositionSearch()).toBeUndefined()
  })

  it('quiet-line and heraldic catalog files exist', () => {
    const report = validateAssetLibrary()
    expect(report.issues.filter((i) => i.level === 'error')).toEqual([])
    expect(report.counts.MINIMAL).toBeGreaterThanOrEqual(8)
    expect(report.counts.HERALDIC).toBeGreaterThanOrEqual(4)
    expect(report.counts.BOTANICAL).toBeGreaterThanOrEqual(14)
  })
})
