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

function chromeOf(svg: string, lockup: string): string {
  const m = svg.match(new RegExp(`<g data-lockup-chrome="${lockup}">([\\s\\S]*?)</g>`))
  return m?.[1] ?? ''
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

const PROOF = {
  cartouche: '10-kurabiye-tray-classic',
  plaque: '14-kulaklik-tuck-modern',
  stamp: '21-krem-eco-monstera',
  index: '27-krem-modern-zebra',
  badge: '09-cikolata-tray-playful',
} as const

describe('Phase 29 remaining lockup chrome (Faz 2.12)', () => {
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

  it('owns chrome for the remaining box LockupIds; labels stay skipped', () => {
    expect(lockupOwnsRule('serif-cartouche')).toBe(true)
    expect(lockupOwnsRule('metal-plaque')).toBe(true)
    expect(lockupOwnsRule('stamp-center')).toBe(true)
    expect(lockupOwnsRule('left-index')).toBe(true)
    expect(lockupOwnsRule('badge-capsule')).toBe(true)
    expect(lockupOwnsRule('label-wrap')).toBe(false)
    expect(lockupOwnsRule('label-stack')).toBe(false)
  })

  it('does not rematch 2.8 lockup ids for the remaining concepts', () => {
    const cookieBrief = briefFrom(jobOf(PROOF.cartouche))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(cookieBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: cookieBrief, style: 'classic', blankCanvas: false }),
      ).lockup,
    ).toBe('serif-cartouche')

    const plaqueBrief = { ...briefFrom(jobOf(PROOF.plaque)), styleType: 'luxury' as StyleType }
    expect(
      applyPlanToSystem(
        resolveDesignSystem(plaqueBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: plaqueBrief, style: 'luxury', blankCanvas: false }),
      ).lockup,
    ).toBe('metal-plaque')

    const stampBrief = briefFrom(jobOf(PROOF.stamp))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(stampBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: stampBrief, style: 'eco', blankCanvas: false }),
      ).lockup,
    ).toBe('stamp-center')

    const indexBrief = briefFrom(jobOf(PROOF.index))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(indexBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: indexBrief, style: 'modern', blankCanvas: false }),
      ).lockup,
    ).toBe('left-index')

    const badgeBrief = briefFrom(jobOf(PROOF.badge))
    expect(
      applyPlanToSystem(
        resolveDesignSystem(badgeBrief, undefined, { blankCanvas: false }),
        createPlan({ brief: badgeBrief, style: 'playful', blankCanvas: false }),
      ).lockup,
    ).toBe('badge-capsule')
  })

  it('paints LockupId chrome without moving type or reopening L-pack', { timeout: 40000 }, () => {
    const cartouche = layoutSnap(PROOF.cartouche)
    expect(cartouche.system.lockup).toBe('serif-cartouche')
    expect(cartouche.svg).toContain('data-lockup-chrome="serif-cartouche"')
    expect(cartouche.svg).toContain(`y="${cartouche.layout.brandY}"`)
    expect(cartouche.svg).toContain(`y="${cartouche.layout.productY}"`)
    const cartoucheChrome = chromeOf(cartouche.svg, 'serif-cartouche')
    expect(cartoucheChrome).toMatch(/<rect\b/)
    expect(cartoucheChrome).toMatch(/ C[\d.]+ /)
    expect(cartoucheChrome).not.toMatch(/data-art="l-bracket"/)
    expect(cartouche.svg).not.toMatch(
      /<rect [^>]*fill="none" stroke="[^"]+" stroke-opacity="0\.38" stroke-width="0\.16"/,
    )

    const plaque = layoutSnap(PROOF.plaque, 'luxury')
    expect(plaque.system.lockup).toBe('metal-plaque')
    expect(plaque.spec.designPlan?.visualConcept.id).toBe('signal-plaque')
    expect(plaque.svg).toContain('data-lockup-chrome="metal-plaque"')
    expect(plaque.svg).toContain(`y="${plaque.layout.brandY}"`)
    expect(plaque.svg).not.toContain('data-art="l-bracket"')
    expect(plaque.svg).not.toContain('data-art="sector-frame"')
    expect(chromeOf(plaque.svg, 'metal-plaque')).toMatch(/<rect\b/)
    expect((chromeOf(plaque.svg, 'metal-plaque').match(/<line\b/g) ?? []).length).toBeLessThan(16)

    const stamp = layoutSnap(PROOF.stamp)
    expect(stamp.system.lockup).toBe('stamp-center')
    expect(stamp.svg).toContain('data-lockup-chrome="stamp-center"')
    expect(stamp.svg).toContain(`y="${stamp.layout.brandY}"`)
    const stampChrome = chromeOf(stamp.svg, 'stamp-center')
    expect(stampChrome).toMatch(/<circle\b/)
    expect(stampChrome).not.toMatch(/<ellipse\b/)
    expect(stampChrome).not.toMatch(/olive|leaf/)

    const index = layoutSnap(PROOF.index)
    expect(index.system.lockup).toBe('left-index')
    expect(index.svg).toContain('data-lockup-chrome="left-index"')
    expect(index.svg).toContain(`y="${index.layout.brandY}"`)
    expect(index.svg).not.toContain('data-art="l-bracket"')
    expect(chromeOf(index.svg, 'left-index')).toMatch(/<line\b/)

    const badge = layoutSnap(PROOF.badge)
    expect(badge.system.lockup).toBe('badge-capsule')
    expect(badge.svg).toContain('data-lockup-chrome="badge-capsule"')
    expect(badge.svg).toContain(`y="${badge.layout.brandY}"`)
    const badgeChrome = chromeOf(badge.svg, 'badge-capsule')
    expect(badgeChrome).toMatch(/<rect\b/)
    expect(badgeChrome).toMatch(/rx="/)
    expect(badge.svg).not.toContain('data-art="l-bracket"')
    const budget = badge.spec.designPlan?.visualConcept.decorationBudget ?? 0.48
    expect(lastCompositionSearch()?.concept?.spend ?? 0).toBeLessThanOrEqual(budget + 0.05)
  })

  it('keeps 2.11 five-kit Y stack and harvest chrome', { timeout: 40000 }, () => {
    const earth = layoutSnap('08-zeytinyagi-tuck-luxury')
    expect(rnd(earth.layout.opticalY)).toBe(181.6)
    expect(rnd(earth.layout.brandY)).toBe(173.332)
    expect(earth.svg).toContain('data-lockup-chrome="harvest-seal"')
    expect(earth.svg).not.toContain('data-lockup-chrome="serif-cartouche"')

    const night = layoutSnap('01-parfum-tuck-luxury')
    expect(rnd(night.layout.brandY)).toBe(101.659)
    expect(night.svg).toContain('data-lockup-chrome="centered-crest"')
  })
})
