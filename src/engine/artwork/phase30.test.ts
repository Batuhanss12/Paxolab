import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { StyleType } from '../../types'
import { applyPlanToSystem, resetArtMemory, visualConceptFor } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { findHeroPanel } from '../dieline/panelKind'
import { layoutFrontLockup } from '../designSystem/lockupLayout'
import { resolveDesignSystem } from '../designSystem/resolve'
import { kitLexiconUsedByKit, kitSuppliesFocalLockup } from '../designSystem/conceptKitAlignment'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { lockupOwnsRule } from './panelRenderers/lockupChrome'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { lastCompositionSearch } from './compositionCandidates'
import { matchMotifs } from './artMotifMatch'
import { isRetiredOverlayAtom } from './assetCatalog/retiredOverlay'
import { allowedStrategies } from './compositionStrategy'
import { markupFamilyGate } from './assetCatalog/constraints'
import { reportAssetCoverage } from './assetCatalog/coverage'
import { loadAtomicFamilyAtoms } from './assetCatalog/familyAssets'
import { lookupAssetRecord, atomHasFamilyFile } from './assetCatalog/catalog'
import { motifFamilyOf } from './artMotifFamily'

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

function layoutSnap(slug: string, style?: StyleType) {
  const spec = kitOf(slug, style)
  const plan = spec.designPlan
  if (!plan) throw new Error(`missing plan ${slug}`)
  const system = applyPlanToSystem(
    resolveDesignSystem(spec.brief, spec.structureId, { blankCanvas: false }),
    plan,
  )
  const panel = findHeroPanel(spec.dieline.panels)
  if (!panel) throw new Error(`missing hero ${slug}`)
  const layout = layoutFrontLockup(panel, system, spec.copy, spec.overrides, system.grammar === 'label')
  return { spec, system, panel, layout, svg: face(spec) }
}

function rnd(v: number | undefined): number | null {
  return v == null ? null : Math.round(v * 1000) / 1000
}

function atomSvg(id: string): string {
  const atom = loadAtomicFamilyAtoms().find((a) => a.sheetId === id || a.id.startsWith(`${id}__`))
  expect(atom, id).toBeTruthy()
  return atom!.markup
}

function geomCount(svg: string): number {
  return (svg.match(/<(path|ellipse|circle|rect|line|polygon|polyline)\b/gi) ?? []).length
}

const LOCKUP_MATH = {
  '08-zeytinyagi-tuck-luxury': { opticalY: 181.6, brandY: 173.332, productY: 189.431, ruleY: 185.901, hasRule: true },
  '01-parfum-tuck-luxury': { opticalY: 105.7, brandY: 101.659, productY: 108.14, ruleY: 104.773, hasRule: true },
  '03-krem-tuck-luxury': { opticalY: 90.4, brandY: 86.941, productY: 93.066, ruleY: 89.699, hasRule: true },
  '04-serum-tuck-minimal': { opticalY: 120.2, brandY: 115.285, productY: 120.591, ruleY: 117.885, hasRule: true },
  '14-kulaklik-tuck-modern': { opticalY: 100.1, brandY: 96.809, productY: 102.334, ruleY: null as number | null, hasRule: false },
}

describe('Phase 30 catalog gaps (Faz 2.13)', () => {
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

  it('cartouche lockup is focal and does not clone crest; capsule lockup spends vintage not a second capsule', () => {
    const cartouche = visualConceptFor('classic', 'food', 'none', 'kurabiye')
    expect(cartouche.id).toBe('heraldic-cartouche')
    expect(kitSuppliesFocalLockup('serif-cartouche', 'none')).toBe(true)
    expect(kitLexiconUsedByKit(cartouche, 'serif-cartouche', 'none')).toEqual(expect.arrayContaining(['cartouche', 'crest']))
    expect(kitSuppliesFocalLockup('soft-oval', 'oval')).toBe(false)

    const badge = visualConceptFor('playful', 'food', 'none', 'çikolata')
    expect(badge.id).toBe('capsule-field')
    expect(kitLexiconUsedByKit(badge, 'badge-capsule', 'none')).toContain('capsule')
    expect(kitSuppliesFocalLockup('badge-capsule', 'none')).toBe(false)
  })

  it('empty families now have in-family SVG files, not only sheet fragments', () => {
    for (const id of [
      'harvest-olive-wreath',
      'harvest-press-stamp',
      'harvest-grain-leaf',
      'deco-foil-corner',
      'deco-hairline-frame',
      'mineral-band-rule',
      'vintage-badge',
    ]) {
      const rec = lookupAssetRecord(id)
      expect(rec?.file, id).toBeTruthy()
      const atom = loadAtomicFamilyAtoms().find((a) => a.sheetId === id || a.id.startsWith(`${id}__`))
      expect(atom, id).toBeTruthy()
      expect(atomHasFamilyFile(atom!)).toBe(true)
    }

    expect(lookupAssetRecord('harvest-olive-wreath')?.family).toBe('harvest')
    expect(motifFamilyOf(loadAtomicFamilyAtoms().find((a) => a.sheetId === 'harvest-olive-wreath')!)).toBe('harvest')
    expect(lookupAssetRecord('deco-foil-corner')?.family).toBe('geometric-deco')
    expect(lookupAssetRecord('vintage-badge')?.family).toBe('ornate-stamp')
    expect(lookupAssetRecord('mineral-band-rule')?.family).toBe('mineral-frame')

    expect(geomCount(atomSvg('harvest-olive-wreath'))).toBeGreaterThanOrEqual(8)
    expect(atomSvg('harvest-olive-wreath')).toMatch(/<ellipse\b/)
    expect(geomCount(atomSvg('vintage-badge'))).toBeGreaterThanOrEqual(5)
    expect(geomCount(atomSvg('deco-foil-corner'))).toBeGreaterThanOrEqual(6)
    expect(atomSvg('deco-hairline-frame')).not.toMatch(/stroke-width="[2-9]/)
  })

  it('holds 2.11/2.12 lockup ids, Y stack, and chrome ownership', () => {
    expect(lockupOwnsRule('harvest-seal')).toBe(true)
    expect(lockupOwnsRule('serif-cartouche')).toBe(true)
    expect(lockupOwnsRule('badge-capsule')).toBe(true)

    const earth = layoutSnap('08-zeytinyagi-tuck-luxury')
    expect(earth.system.lockup).toBe('harvest-seal')
    expect(rnd(earth.layout.opticalY)).toBe(LOCKUP_MATH['08-zeytinyagi-tuck-luxury'].opticalY)
    expect(rnd(earth.layout.brandY)).toBe(LOCKUP_MATH['08-zeytinyagi-tuck-luxury'].brandY)
    expect(earth.svg).toContain(`y="${earth.layout.brandY}"`)
    expect(earth.svg).toContain('data-lockup-chrome="harvest-seal"')

    const night = layoutSnap('01-parfum-tuck-luxury')
    expect(rnd(night.layout.brandY)).toBe(LOCKUP_MATH['01-parfum-tuck-luxury'].brandY)
    expect(night.svg).toContain('data-lockup-chrome="centered-crest"')

    const cookie = layoutSnap('10-kurabiye-tray-classic')
    expect(cookie.system.lockup).toBe('serif-cartouche')
    expect(cookie.svg).toContain('data-lockup-chrome="serif-cartouche"')
    expect(cookie.svg).toContain(`y="${cookie.layout.brandY}"`)
  })

  it('fills catalog holes on kit faces without reopening L-pack or family −1000', { timeout: 40000 }, () => {
    const cookie = kitOf('10-kurabiye-tray-classic')
    const cookieSearch = lastCompositionSearch()
    expect(cookie.designPlan?.visualConcept.id).toBe('heraldic-cartouche')
    expect(face(cookie)).toContain('data-lockup-chrome="serif-cartouche"')
    expect(cookieSearch).toBeUndefined()
    expect(face(cookie)).not.toContain('data-art="art-pattern-compose"')
    expect(face(cookie)).not.toMatch(/data-motif-atom="[^"]*(crest-spot|ribbon-corner|cartouche-arc|double-line-corner)/)
    expect(face(cookie)).not.toContain('data-art="l-bracket"')
    expect(markupFamilyGate(face(cookie), cookie.designPlan!).ok).toBe(true)

    const choco = kitOf('09-cikolata-tray-playful')
    const chocoSearch = lastCompositionSearch()
    const budget = choco.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect((chocoSearch?.concept?.winnerAssetId ?? '').toLowerCase()).toMatch(/vintage-badge|badge|vintage/)
    expect(chocoSearch?.concept?.winnerFamily).toBe('ornate-stamp')
    expect(chocoSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
    expect(face(choco)).not.toContain('data-art="l-bracket"')

    const grove = kitOf('08-zeytinyagi-tuck-luxury', 'classic')
    expect(grove.designPlan?.visualConcept.id).toBe('grove-press')
    expect(grove.designPlan?.visualConcept.family).toBe('harvest')
    expect(lastCompositionSearch()).toBeUndefined()
    expect(face(grove)).not.toContain('data-art="art-pattern-compose"')
    expect(face(grove)).not.toContain('data-art="l-bracket"')
    expect(markupFamilyGate(face(grove), grove.designPlan!).ok).toBe(true)

    const kraft = kitOf('12-recel-label-eco')
    const kraftSearch = lastCompositionSearch()
    expect(kraft.designPlan?.visualConcept.id).toBe('harvest-kraft')
    expect(kraftSearch?.concept?.winnerFamily).toBe('harvest')
    expect((kraftSearch?.concept?.winnerAssetId ?? '').toLowerCase()).toMatch(/harvest|grain|press|wreath/)

    const foilBrief = { ...briefFrom(jobOf('20-temizlik-tuck-minimal')), styleType: 'luxury' as StyleType }
    const foil = new FormaLocalEngine().generate({
      brief: foilBrief,
      overridePatch: { blankCanvas: false, variationIndex: 0 },
    })
    expect(foil.designPlan?.visualConcept.id).toBe('restrained-foil')
    expect(face(foil)).toContain('data-lockup-chrome="centered-crest"')
    expect(face(foil)).not.toContain('data-art="art-pattern-compose"')
    expect(face(foil)).not.toContain('data-art="l-bracket"')

    const tech = kitOf('14-kulaklik-tuck-modern')
    expect(face(tech)).not.toContain('data-art="l-bracket"')
    expect(face(tech)).not.toContain('data-art="sector-frame"')
    expect(allowedStrategies(tech.designPlan!)).not.toContain('balanced-corners')

    const report = reportAssetCoverage()
    expect(report.incompatibleWinnerCount).toBe(0)
  })

  it('never paints retired clip-art, UUID sheets, or oval flacon medallion', { timeout: 40000 }, () => {
    const match = matchMotifs({
      mood: 'luxury',
      sector: 'perfume',
      colors: '#1a0a0a #c9a227',
      seed: 0,
      family: 'heraldic',
      supportFamily: 'geometric-deco',
      conceptId: 'nocturne-crest',
    })
    expect(match.atoms.every((atom) => !isRetiredOverlayAtom(atom))).toBe(true)

    const banned = /data-motif-atom="[^"]*(crest-spot|ribbon-corner|cartouche-arc|double-line-corner|[0-9a-f]{8}-[0-9a-f]{4}-)/i
    for (const slug of [
      '01-parfum-tuck-luxury',
      '05-parfum-wrap-luxury',
      '10-kurabiye-tray-classic',
      '02-kolonya-tuck-classic',
      '03-krem-tuck-luxury',
      '11-bal-label-classic',
    ]) {
      const spec = kitOf(slug)
      const svg = spec.artwork.layers.map((layer) => layer.markup).join('\n')
      expect(svg, slug).not.toMatch(banned)
      expect(svg, slug).not.toContain('data-art="hero-oval"')
    }
  })
})
