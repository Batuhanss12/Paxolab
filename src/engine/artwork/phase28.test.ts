import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { StyleType } from '../../types'
import { applyPlanToSystem, createPlan, resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { findHeroPanel } from '../dieline/panelKind'
import { layoutFrontLockup } from '../designSystem/lockupLayout'
import { resolveDesignSystem } from '../designSystem/resolve'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { lockupOwnsRule } from './panelRenderers/lockupChrome'
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

function chromeOf(svg: string, lockup: string): string {
  const m = svg.match(new RegExp(`<g data-lockup-chrome="${lockup}">([\\s\\S]*?)</g>`))
  return m?.[1] ?? ''
}

function layoutSnap(slug: string) {
  const spec = kitOf(slug)
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

const PROOF = {
  earth: '08-zeytinyagi-tuck-luxury',
  night: '01-parfum-tuck-luxury',
  oval: '03-krem-tuck-luxury',
  air: '04-serum-tuck-minimal',
  tech: '14-kulaklik-tuck-modern',
  hold: '09-cikolata-tray-playful',
} as const

/** Frozen lockup math — 2.11 paints chrome around these coordinates, it must not move them. */
const LOCKUP_MATH: Record<string, { opticalY: number; brandY: number; productY: number; ruleY: number | null; hasRule: boolean }> = {
  [PROOF.earth]: { opticalY: 181.6, brandY: 173.332, productY: 189.431, ruleY: 185.901, hasRule: true },
  [PROOF.night]: { opticalY: 105.7, brandY: 101.659, productY: 108.14, ruleY: 104.773, hasRule: true },
  [PROOF.oval]: { opticalY: 90.4, brandY: 86.941, productY: 93.066, ruleY: 89.699, hasRule: true },
  [PROOF.air]: { opticalY: 120.2, brandY: 115.285, productY: 120.591, ruleY: 117.885, hasRule: true },
  [PROOF.tech]: { opticalY: 100.1, brandY: 96.809, productY: 102.334, ruleY: null, hasRule: false },
}

describe('Phase 28 lockup chrome (Faz 2.11)', () => {
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

  it('owns chrome only for the five crafted LockupIds', () => {
    expect(lockupOwnsRule('harvest-seal')).toBe(true)
    expect(lockupOwnsRule('centered-crest')).toBe(true)
    expect(lockupOwnsRule('soft-oval')).toBe(true)
    expect(lockupOwnsRule('air-rule')).toBe(true)
    expect(lockupOwnsRule('tech-grid')).toBe(true)
  })

  it('does not rematch 2.8 lockup ids', () => {
    const brief = briefFrom(jobOf(PROOF.earth))
    const earth = applyPlanToSystem(
      resolveDesignSystem(brief, undefined, { blankCanvas: false }),
      createPlan({ brief, style: (brief.styleType || 'luxury') as StyleType, blankCanvas: false }),
    )
    expect(earth.lockup).toBe('harvest-seal')

    const nightBrief = briefFrom(jobOf(PROOF.night))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(nightBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: nightBrief, style: 'luxury', blankCanvas: false }),
      ).lockup,
    ).toBe('centered-crest')

    const ovalBrief = briefFrom(jobOf(PROOF.oval))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(ovalBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: ovalBrief, style: 'luxury', blankCanvas: false }),
      ).lockup,
    ).toBe('soft-oval')

    const airBrief = briefFrom(jobOf(PROOF.air))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(airBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: airBrief, style: 'minimal', blankCanvas: false }),
      ).lockup,
    ).toBe('air-rule')

    const techBrief = briefFrom(jobOf(PROOF.tech))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(techBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: techBrief, style: 'modern', blankCanvas: false }),
      ).lockup,
    ).toBe('tech-grid')
  })

  it('keeps layoutFrontLockup Y stack frozen and paints type on those Ys', { timeout: 40000 }, () => {
    for (const [slug, frozen] of Object.entries(LOCKUP_MATH)) {
      const { layout, svg, system } = layoutSnap(slug)
      expect(system.lockup, slug).toBe(
        slug === PROOF.earth
          ? 'harvest-seal'
          : slug === PROOF.night
            ? 'centered-crest'
            : slug === PROOF.oval
              ? 'soft-oval'
              : slug === PROOF.air
                ? 'air-rule'
                : 'tech-grid',
      )
      expect(layout.hasRule, slug).toBe(frozen.hasRule)
      expect(rnd(layout.opticalY), `${slug} opticalY`).toBe(frozen.opticalY)
      expect(rnd(layout.brandY), `${slug} brandY`).toBe(frozen.brandY)
      expect(rnd(layout.productY), `${slug} productY`).toBe(frozen.productY)
      expect(rnd(layout.ruleY), `${slug} ruleY`).toBe(frozen.ruleY)
      expect(svg, slug).toContain(`y="${layout.brandY}"`)
      expect(svg, slug).toContain(`y="${layout.productY}"`)
    }
  })

  it('five kit faces emit LockupId chrome without style-costume rules or L-pack', { timeout: 40000 }, () => {
    const earth = layoutSnap(PROOF.earth)
    expect(earth.svg).toContain('data-lockup-chrome="harvest-seal"')
    const earthChrome = chromeOf(earth.svg, 'harvest-seal')
    expect(earthChrome).toMatch(/<ellipse\b/)
    expect(earthChrome).not.toMatch(/L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ Z/)
    expect(earth.svg).not.toContain('data-art="sector-frame"')
    expect(earth.svg).not.toContain('data-art="l-bracket"')
    expect(earth.svg).not.toContain('data-art="gold-bar"')
    expect(earth.svg).not.toMatch(/stroke-width="0\.34" \/>\s*<path d="M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ Z"/)

    const night = layoutSnap(PROOF.night)
    expect(night.svg).toContain('data-lockup-chrome="centered-crest"')
    const nightChrome = chromeOf(night.svg, 'centered-crest')
    expect(nightChrome).toMatch(/C[\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+/)
    expect(nightChrome).not.toMatch(/olive|leaf/)
    expect(night.svg).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(night.svg).toContain('data-art="gold-bar"')
    expect(night.svg).not.toMatch(
      /<rect [^>]*fill="none" stroke="[^"]+" stroke-opacity="0\.38" stroke-width="0\.16"/,
    )

    const oval = layoutSnap(PROOF.oval)
    expect(oval.svg).toContain('data-lockup-chrome="soft-oval"')
    const ovalChrome = chromeOf(oval.svg, 'soft-oval')
    const rings = [...ovalChrome.matchAll(/<ellipse[^>]*\brx="([^"]+)"[^>]*\bry="([^"]+)"/g)]
    expect(rings.length).toBeGreaterThanOrEqual(2)
    for (const ring of rings) {
      expect(Number(ring[1]), 'oval rx stays on the type column').toBeLessThan(oval.panel.w * 0.42)
    }
    expect(oval.svg).not.toContain('data-art="sector-frame"')

    const air = layoutSnap(PROOF.air)
    expect(air.svg).toContain('data-lockup-chrome="air-rule"')
    const airChrome = chromeOf(air.svg, 'air-rule')
    expect(airChrome).toMatch(/<line\b/)
    expect(airChrome).not.toMatch(/<ellipse\b|<circle\b|<path\b/)
    expect(air.svg).not.toContain('data-lockup-chrome="soft-oval"')
    expect(air.svg).not.toContain('data-lockup-chrome="harvest-seal"')
    expect(air.svg).not.toContain('data-lockup-chrome="centered-crest"')
    expect(air.svg).not.toContain('data-art="sector-frame"')
    expect(air.svg).not.toContain('data-art="gold-bar"')

    const tech = layoutSnap(PROOF.tech)
    expect(tech.svg).toContain('data-lockup-chrome="tech-grid"')
    const techChrome = chromeOf(tech.svg, 'tech-grid')
    expect(techChrome).toMatch(/<rect\b/)
    expect(techChrome).not.toContain('data-art="l-bracket"')
    expect(tech.svg).not.toContain('data-art="l-bracket"')
    expect(tech.svg).not.toContain('data-art="sector-frame"')
    expect((techChrome.match(/<line\b/g) ?? []).length).toBeLessThan(12)

    const hold = kitOf(PROOF.hold)
    expect(face(hold)).not.toMatch(/data-lockup-chrome="(harvest-seal|centered-crest|soft-oval|air-rule|tech-grid)"/)
  })

  it('holds 2.6–2.10 motif contracts after lockup chrome', { timeout: 40000 }, () => {
    const earth = kitOf(PROOF.earth)
    const earthSearch = lastCompositionSearch()
    expect(earth.designPlan?.visualConcept.id).toBe('earthen-premium')
    expect(winnerAssets().join(' ')).toMatch(/olive-branch/)
    expect(winnerAssets().join(' ')).toMatch(/botanical-corner|botanical-accent/)
    expect(winnerAssets().length).toBeGreaterThanOrEqual(3)
    expect(earthSearch?.winner).toBe('asymmetric-editorial')
    expect(earthSearch?.concept?.spend ?? 0).toBeGreaterThanOrEqual(0.28)
    expect(earthSearch?.concept?.spend ?? 0).toBeLessThanOrEqual(0.45)
    expect(markupFamilyGate(face(earth), earth.designPlan!).ok).toBe(true)

    const night = kitOf(PROOF.night)
    const nightSearch = lastCompositionSearch()
    expect(night.designPlan?.visualConcept.id).toBe('nocturne-crest')
    expect(winnerAssets().join(' ')).toMatch(/ribbon|cartouche/)
    expect(winnerAssets().join(' ')).not.toMatch(/olive-branch|pattern16/)
    expect(nightSearch?.winner).not.toBe('balanced-corners')
    expect((nightSearch?.concept?.spend ?? 0)).toBeGreaterThanOrEqual(0.14)
    expect((nightSearch?.concept?.spend ?? 0)).toBeLessThanOrEqual(0.33)

    const oval = kitOf(PROOF.oval)
    const ovalSearch = lastCompositionSearch()
    expect(oval.designPlan?.visualConcept.id).toBe('soft-oval')
    expect(ovalSearch?.concept?.winnerAssetId).toMatch(/soft-oval|oval|ring|capsule/)
    expect(ovalSearch?.concept?.winnerAssetId).not.toMatch(/quiet-ticks/)

    const air = kitOf(PROOF.air)
    const airSearch = lastCompositionSearch()
    expect(air.designPlan?.visualConcept.id).toBe('air-paper')
    expect(winnerAssets().join(' ')).toMatch(/hairline|quiet-rule|ticks/)
    expect((airSearch?.concept?.spend ?? 0)).toBeLessThanOrEqual(0.21)

    const tech = kitOf(PROOF.tech)
    const techSearch = lastCompositionSearch()
    expect(tech.designPlan?.visualConcept.id).toBe('tech-glyph')
    expect(allowedStrategies(tech.designPlan!)).not.toContain('balanced-corners')
    expect(techSearch?.winner).not.toBe('balanced-corners')
    expect(techSearch?.candidates.some((c) => c.strategy === 'balanced-corners')).toBe(false)
    expect(techSearch?.concept?.winnerFamily).toBe('linear-tech')
    expect(markupFamilyGate(face(tech), tech.designPlan!).ok).toBe(true)

    const choco = kitOf(PROOF.hold)
    const budget = choco.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(choco.designPlan?.visualConcept.id).toBe('capsule-field')
    expect(lastCompositionSearch()?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
  })
})
