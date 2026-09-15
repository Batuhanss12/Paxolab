import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { StyleType } from '../../types'
import { applyPlanToSystem, createPlan, resetArtMemory, visualConceptFor } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { resolveDesignSystem } from '../designSystem/resolve'
import {
  CONCEPT_LOCKUP_TABLE,
  chromeForConcept,
  goldBarForConcept,
  kitLexiconUsedByKit,
  kitSuppliesFocalLockup,
  lockupForConcept,
  shouldPaintSectorFrame,
} from '../designSystem/conceptKitAlignment'
import { pickLockup } from '../designSystem/kits'
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

function winnerAssets(): string[] {
  return lastCompositionSearch()?.candidates.find((c) => c.decision === 'WINNER')?.assets ?? []
}

function kitOf(slug: string) {
  return new FormaLocalEngine().generate({
    brief: briefFrom(jobOf(slug)),
    overridePatch: { blankCanvas: false, variationIndex: 0 },
  })
}

function kitSystem(slug: string) {
  const brief = briefFrom(jobOf(slug))
  const plan = createPlan({ brief, style: (brief.styleType || 'luxury') as StyleType, blankCanvas: false })
  return applyPlanToSystem(resolveDesignSystem(brief, undefined, { blankCanvas: false }), plan)
}

describe('Phase 25 kit ↔ VisualConcept alignment', () => {
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

  it('maps concept ids to compatible lockups; style costume does not win', () => {
    expect(CONCEPT_LOCKUP_TABLE['earthen-premium']).toBe('harvest-seal')
    expect(CONCEPT_LOCKUP_TABLE['nocturne-crest']).toBe('centered-crest')
    expect(CONCEPT_LOCKUP_TABLE['heraldic-crest']).toBe('centered-crest')
    expect(CONCEPT_LOCKUP_TABLE['soft-oval']).toBe('soft-oval')
    expect(CONCEPT_LOCKUP_TABLE['air-paper']).toBe('air-rule')
    expect(CONCEPT_LOCKUP_TABLE['tech-glyph']).toBe('tech-grid')
    expect(CONCEPT_LOCKUP_TABLE['capsule-field']).toBe('badge-capsule')

    const earth = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı')
    expect(earth.id).toBe('earthen-premium')
    expect(pickLockup('luxury', 'food', 'box', false, earth)).toBe('harvest-seal')

    const night = visualConceptFor('luxury', 'perfume', 'crest')
    expect(night.id).toBe('nocturne-crest')
    expect(pickLockup('luxury', 'perfume', 'box', false, night)).toBe('centered-crest')

    const classicPerfume = visualConceptFor('classic', 'perfume', 'crest')
    expect(classicPerfume.id).toBe('heraldic-crest')
    expect(pickLockup('classic', 'perfume', 'box', false, classicPerfume)).toBe('centered-crest')
    expect(lockupForConcept(classicPerfume, 'serif-cartouche')).toBe('centered-crest')

    const oval = visualConceptFor('luxury', 'cream', 'oval')
    expect(pickLockup('luxury', 'cream', 'box', false, oval)).toBe('soft-oval')

    const air = visualConceptFor('minimal', 'serum', 'none')
    expect(air.id).toBe('air-paper')
    expect(pickLockup('minimal', 'serum', 'box', false, air)).toBe('air-rule')

    const tech = visualConceptFor('modern', 'electronics', 'tech')
    expect(pickLockup('modern', 'electronics', 'box', false, tech)).toBe('tech-grid')
  })

  it('honors avoid on kit frame / goldBar / chrome', () => {
    const earth = visualConceptFor('luxury', 'food', 'harvest', 'zeytinyağı')
    expect(earth.avoid).toContain('heavy-frame')
    expect(shouldPaintSectorFrame(earth, 'luxury', 'food')).toBe(false)
    expect(goldBarForConcept(earth, true)).toBe(false)
    expect(chromeForConcept(earth, 'full')).toBe('quiet')

    const oval = visualConceptFor('luxury', 'cream', 'oval')
    expect(shouldPaintSectorFrame(oval, 'luxury', 'cream')).toBe(false)
    expect(goldBarForConcept(oval, true)).toBe(true)
    expect(chromeForConcept(oval, 'full')).toBe('quiet')

    const air = visualConceptFor('minimal', 'serum', 'none')
    expect(shouldPaintSectorFrame(air, 'minimal', 'serum')).toBe(false)
    expect(chromeForConcept(air, 'full')).toBe('quiet')

    const tech = visualConceptFor('modern', 'electronics', 'tech')
    expect(tech.avoid).toContain('generic-corners')
    expect(shouldPaintSectorFrame(tech, 'modern', 'electronics')).toBe(false)

    const night = visualConceptFor('luxury', 'perfume', 'crest')
    expect(goldBarForConcept(night, true)).toBe(true)
    expect(shouldPaintSectorFrame(night, 'luxury', 'perfume')).toBe(true)
  })

  it('kit crest focal marks lexicon used so overlay prefers companions', () => {
    const night = visualConceptFor('luxury', 'perfume', 'crest')
    expect(kitSuppliesFocalLockup('centered-crest', 'crest')).toBe(true)
    expect(kitSuppliesFocalLockup('soft-oval', 'oval')).toBe(false)
    expect(kitLexiconUsedByKit(night, 'centered-crest', 'crest')).toContain('crest')
    expect(kitLexiconUsedByKit(night, 'soft-oval', 'oval')).not.toContain('crest')
  })

  it('resolve + applyPlan lockups follow concept, not classic cartouche costume', () => {
    const earth = kitSystem('08-zeytinyagi-tuck-luxury')
    expect(earth.lockup).toBe('harvest-seal')
    expect(earth.goldBar).toBe(false)

    const night = kitSystem('01-parfum-tuck-luxury')
    expect(night.lockup).toBe('centered-crest')
    expect(night.goldBar).toBe(true)

    const oval = kitSystem('03-krem-tuck-luxury')
    expect(oval.lockup).toBe('soft-oval')
    expect(oval.goldBar).toBe(true)

    const air = kitSystem('04-serum-tuck-minimal')
    expect(air.lockup).toBe('air-rule')

    const tech = kitSystem('14-kulaklik-tuck-modern')
    expect(tech.lockup).toBe('tech-grid')

    const classic = kitSystem('02-kolonya-tuck-classic')
    expect(classic.lockup).toBe('centered-crest')
    expect(classic.decor).toBe('crest')
  })

  it('five kit faces share concept story; spend and 2.7 linear hold', { timeout: 20000 }, () => {
    const earth = kitOf('08-zeytinyagi-tuck-luxury')
    const earthFace = face(earth)
    const earthSearch = lastCompositionSearch()
    expect(earth.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(earthFace).not.toContain('data-art="sector-frame"')
    expect(earthFace).not.toContain('data-art="l-bracket"')
    expect(earthFace).not.toContain('data-art="gold-bar"')
    expect(winnerAssets().join(' ')).toMatch(/olive-branch|botanical-corner|botanical-accent/)
    expect(earthSearch?.winner).not.toBe('balanced-corners')
    expect(earthSearch?.concept?.spend ?? 0).toBeLessThanOrEqual((earth.designPlan?.visualConcept.decorationBudget ?? 0.42) + 0.05)

    const night = kitOf('01-parfum-tuck-luxury')
    const nightFace = face(night)
    const nightSearch = lastCompositionSearch()
    expect(night.designPlan?.visualConcept.id).toBe('nocturne-crest')
    expect(nightFace).toContain('data-art="gold-bar"')
    expect(nightFace).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(nightSearch?.winner).not.toBe('balanced-corners')
    const nightAssets = winnerAssets().join(' ')
    expect(nightAssets).toMatch(/ribbon|cartouche/)
    expect(night.designPlan?.artDirection.chrome).toBe('full')

    const oval = kitOf('03-krem-tuck-luxury')
    const ovalFace = face(oval)
    const ovalSearch = lastCompositionSearch()
    expect(oval.designPlan?.visualConcept.id).toBe('soft-oval')
    expect(ovalFace).not.toContain('data-art="sector-frame"')
    expect(oval.designPlan?.artDirection.chrome).toBe('quiet')
    expect(oval.designPlan?.patternSystem.family).not.toMatch(/contour|ornament/)
    expect(ovalSearch?.concept?.winnerAssetId).toMatch(/soft-oval|oval|ring|capsule/)
    expect(ovalSearch?.concept?.winnerAssetId).not.toMatch(/quiet-ticks/)

    const air = kitOf('04-serum-tuck-minimal')
    const airFace = face(air)
    expect(air.designPlan?.visualConcept.id).toBe('air-paper')
    expect(airFace).not.toContain('data-art="sector-frame"')
    expect(airFace).not.toContain('data-art="gold-bar"')
    expect(air.designPlan?.artDirection.chrome).toBe('quiet')
    expect(air.designPlan?.patternSystem.family).toBe('none')
    expect(winnerAssets().join(' ')).toMatch(/hairline|quiet-rule|ticks/)

    const tech = kitOf('14-kulaklik-tuck-modern')
    const techFace = face(tech)
    const techSearch = lastCompositionSearch()
    expect(tech.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(techFace).not.toContain('data-art="l-bracket"')
    expect(techFace).not.toContain('data-art="sector-frame"')
    expect(allowedStrategies(tech.designPlan!)).not.toContain('balanced-corners')
    expect(techSearch?.winner).not.toBe('balanced-corners')
    expect(techSearch?.candidates.some((c) => c.strategy === 'balanced-corners')).toBe(false)
    expect(techSearch?.concept?.winnerFamily).toBe('linear-tech')
    expect(markupFamilyGate(techFace, tech.designPlan!).ok).toBe(true)

    const choco = kitOf('09-cikolata-tray-playful')
    const chocoSearch = lastCompositionSearch()
    const budget = choco.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThan(1)
  })
})
