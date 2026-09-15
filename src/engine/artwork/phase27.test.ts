import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { lastCompositionSearch } from './compositionCandidates'
import { allowedStrategies } from './compositionStrategy'
import { markupFamilyGate } from './assetCatalog/constraints'
import { loadAtomicFamilyAtoms } from './assetCatalog/familyAssets'
import { lookupAssetRecord } from './assetCatalog/catalog'

function jobOf(slug: string): Job {
  const job = JOBS.find((j) => j.slug === slug)
  if (!job) throw new Error(`missing job ${slug}`)
  return job
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function winnerAssets(): string[] {
  return lastCompositionSearch()?.candidates.find((c) => c.decision === 'WINNER')?.assets ?? []
}

function kitOf(slug: string) {
  return new FormaLocalEngine().generate({
    brief: briefFrom(jobOf(slug)),
    overridePatch: { blankCanvas: false, variationIndex: 0 },
  })
}

function atomSvg(id: string): string {
  const atom = loadAtomicFamilyAtoms().find((a) => a.sheetId === id || a.id.startsWith(`${id}__`))
  expect(atom, id).toBeTruthy()
  return atom!.markup
}

function geomCount(svg: string): number {
  return (svg.match(/<(path|ellipse|circle|rect|line|polygon|polyline)\b/gi) ?? []).length
}

describe('Phase 27 in-family atom drawing weight', () => {
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

  it('lexicon SVGs carry finished in-family geometry, not a single hairline', () => {
    const olive = atomSvg('olive-branch-side')
    expect(geomCount(olive)).toBeGreaterThanOrEqual(12)
    expect(olive).toMatch(/stroke-width="1\.[5-9]/)
    expect(olive).toMatch(/<ellipse\b/)

    const corner = atomSvg('botanical-corner')
    expect(geomCount(corner)).toBeGreaterThanOrEqual(8)
    expect(corner).toMatch(/<ellipse\b|<circle\b/)

    const ring = atomSvg('soft-oval-ring')
    expect((ring.match(/<ellipse\b/gi) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(ring).toMatch(/stroke-width="1\.[3-9]/)

    const crest = atomSvg('crest-spot')
    expect(geomCount(crest)).toBeGreaterThanOrEqual(7)
    expect(crest).toMatch(/C36 82|C36 74/)

    const ribbon = atomSvg('ribbon-corner')
    expect(geomCount(ribbon)).toBeGreaterThanOrEqual(5)

    const cartouche = atomSvg('cartouche-arc')
    expect(geomCount(cartouche)).toBeGreaterThanOrEqual(5)

    const glyph = atomSvg('tech-glyph-mark')
    expect(lookupAssetRecord('tech-glyph-mark')?.family).toBe('linear-tech')
    expect(geomCount(glyph)).toBeGreaterThanOrEqual(8)
    expect(glyph).toMatch(/<rect\b/)

    const hair = atomSvg('hairline-corner-l')
    expect(geomCount(hair)).toBeGreaterThanOrEqual(3)
    expect(hair).not.toMatch(/stroke-width="[2-9]/)
  })

  it('five kit faces keep 2.6–2.9 contracts with heavier atoms', { timeout: 20000 }, () => {
    const earth = kitOf('08-zeytinyagi-tuck-luxury')
    const earthSearch = lastCompositionSearch()
    expect(earth.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(face(earth)).not.toContain('data-art="sector-frame"')
    expect(winnerAssets().join(' ')).toMatch(/olive-branch/)
    expect(winnerAssets().join(' ')).toMatch(/botanical-corner|botanical-accent/)
    expect(winnerAssets().length).toBeGreaterThanOrEqual(3)
    expect(earthSearch?.winner).toBe('asymmetric-editorial')
    expect(earthSearch?.concept?.spend ?? 0).toBeGreaterThanOrEqual(0.28)
    expect(earthSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(0.45)
    expect(markupFamilyGate(face(earth), earth.designPlan!).ok).toBe(true)

    const night = kitOf('01-parfum-tuck-luxury')
    const nightSearch = lastCompositionSearch()
    const nightAssets = winnerAssets().join(' ')
    expect(night.designPlan?.visualConcept.id).toBe('nocturne-crest')
    expect(face(night)).toContain('data-art="gold-bar"')
    expect(face(night)).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(nightSearch?.winner).not.toBe('balanced-corners')
    expect(nightAssets).toMatch(/ribbon|cartouche/)
    expect(nightAssets).not.toMatch(/olive-branch|pattern16/)
    expect((nightSearch?.concept?.spend ?? 0)).toBeGreaterThanOrEqual(0.14)
    expect((nightSearch?.concept?.spend ?? 0)).toBeLessThanOrEqual(0.33)
    expect((nightSearch?.concept?.conceptFidelity ?? 0)).toBeGreaterThan(48)

    const oval = kitOf('03-krem-tuck-luxury')
    const ovalSearch = lastCompositionSearch()
    expect(oval.designPlan?.visualConcept.id).toBe('soft-oval')
    expect(face(oval)).not.toContain('data-art="sector-frame"')
    expect(ovalSearch?.concept?.winnerAssetId).toMatch(/soft-oval|oval|ring|capsule/)
    expect(ovalSearch?.concept?.winnerAssetId).not.toMatch(/quiet-ticks/)
    expect((ovalSearch?.concept?.spend ?? 0)).toBeGreaterThanOrEqual(0.12)

    const air = kitOf('04-serum-tuck-minimal')
    const airSearch = lastCompositionSearch()
    expect(air.designPlan?.visualConcept.id).toBe('air-paper')
    expect(face(air)).not.toContain('data-art="sector-frame"')
    expect(air.designPlan?.artDirection.chrome).toBe('quiet')
    expect(winnerAssets().join(' ')).toMatch(/hairline|quiet-rule|ticks/)
    expect((airSearch?.concept?.spend ?? 0)).toBeLessThanOrEqual(0.21)

    const tech = kitOf('14-kulaklik-tuck-modern')
    const techSearch = lastCompositionSearch()
    const techFace = face(tech)
    expect(tech.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(techFace).not.toContain('data-art="l-bracket"')
    expect(techFace).not.toContain('data-art="sector-frame"')
    expect(allowedStrategies(tech.designPlan!)).not.toContain('balanced-corners')
    expect(techSearch?.winner).not.toBe('balanced-corners')
    expect(techSearch?.candidates.some((c) => c.strategy === 'balanced-corners')).toBe(false)
    expect(winnerAssets().length).toBeLessThan(4)
    expect(techSearch?.concept?.winnerFamily).toBe('linear-tech')
    expect((techSearch?.concept?.winnerAssetId ?? '').toLowerCase()).toMatch(/tech-glyph|tech-index|glyph|index/)
    expect(markupFamilyGate(techFace, tech.designPlan!).ok).toBe(true)

    const choco = kitOf('09-cikolata-tray-playful')
    const chocoSearch = lastCompositionSearch()
    const budget = choco.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
  })
})
