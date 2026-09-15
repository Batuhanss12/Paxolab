import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyPlanToSystem, resetArtMemory } from '../brain'
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

function chromeMaxX(chrome: string): number {
  const xs = [...chrome.matchAll(/\b(?:x|x1|x2|cx)="([\d.]+)"/g)].map((m) => Number(m[1]))
  return xs.length ? Math.max(...xs) : 0
}

const PROOF = {
  wrapLux: '05-parfum-wrap-luxury',
  wrapMin: '07-serum-wrap-minimal',
  wrapMod: '06-krem-wrap-modern',
  stackClassic: '11-bal-label-classic',
  stackEco: '12-recel-label-eco',
} as const

const LOCKUP_MATH = {
  [PROOF.wrapLux]: { opticalY: 32.2, brandY: 27.812, productY: 33.688, ruleY: 30.362, hasRule: true },
  [PROOF.wrapMin]: { opticalY: 32.2, brandY: 27.811, productY: 34.104, ruleY: 30.791, hasRule: true },
  [PROOF.stackClassic]: { opticalY: 31.5, brandY: 27.104, productY: 32.888, ruleY: 29.481, hasRule: true },
  [PROOF.stackEco]: { opticalY: 31.5, brandY: 27.292, productY: 33.138, ruleY: 29.772, hasRule: true },
  [PROOF.wrapMod]: { opticalY: 31.5, brandY: 27.544, productY: 32.608, ruleY: null as number | null, hasRule: false },
}

describe('Phase 31 label lockup chrome (Faz 2.14)', () => {
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

  it('owns wrap/stack chrome; does not remap labels to box LockupIds', { timeout: 20000 }, () => {
    expect(lockupOwnsRule('label-wrap')).toBe(true)
    expect(lockupOwnsRule('label-stack')).toBe(true)
    expect(layoutSnap(PROOF.wrapLux).system.lockup).toBe('label-wrap')
    expect(layoutSnap(PROOF.stackClassic).system.lockup).toBe('label-stack')
    expect(layoutSnap(PROOF.wrapLux).system.lockup).not.toBe('centered-crest')
    expect(layoutSnap(PROOF.stackClassic).system.lockup).not.toBe('serif-cartouche')
  })

  it('paints grammar-native chrome without moving type or crossing SEAM', { timeout: 40000 }, () => {
    const wrap = layoutSnap(PROOF.wrapLux)
    expect(wrap.system.lockup).toBe('label-wrap')
    expect(wrap.system.wrapSeam).toBe(true)
    expect(wrap.svg).toContain('data-lockup-chrome="label-wrap"')
    expect(wrap.svg).toContain('data-art="seam"')
    expect(wrap.svg).not.toMatch(/>SEAM</)
    expect(wrap.svg).toContain(`y="${wrap.layout.brandY}"`)
    expect(wrap.svg).toContain(`y="${wrap.layout.productY}"`)
    expect(rnd(wrap.layout.opticalY)).toBe(LOCKUP_MATH[PROOF.wrapLux].opticalY)
    expect(rnd(wrap.layout.brandY)).toBe(LOCKUP_MATH[PROOF.wrapLux].brandY)
    const wrapChrome = chromeOf(wrap.svg, 'label-wrap')
    expect(wrapChrome).toMatch(/<line\b/)
    expect(wrapChrome).not.toMatch(/<ellipse\b|<circle\b/)
    expect(wrapChrome).not.toMatch(/data-art="l-bracket"/)
    const seam = wrap.panel.x + wrap.panel.w - Math.max(12, wrap.panel.w * 0.16)
    expect(chromeMaxX(wrapChrome)).toBeLessThan(seam)
    expect(wrap.svg).not.toContain('data-art="l-bracket"')

    const quiet = layoutSnap(PROOF.wrapMin)
    expect(quiet.system.lockup).toBe('label-wrap')
    expect(rnd(quiet.layout.brandY)).toBe(LOCKUP_MATH[PROOF.wrapMin].brandY)
    expect(chromeOf(quiet.svg, 'label-wrap')).toMatch(/<line\b/)

    const modern = layoutSnap(PROOF.wrapMod)
    expect(modern.system.lockup).toBe('label-wrap')
    expect(rnd(modern.layout.brandY)).toBe(LOCKUP_MATH[PROOF.wrapMod].brandY)
    expect(modern.layout.hasRule).toBe(false)
    expect(modern.svg).toContain('data-lockup-chrome="label-wrap"')

    const stack = layoutSnap(PROOF.stackClassic)
    expect(stack.system.lockup).toBe('label-stack')
    expect(stack.svg).toContain('data-lockup-chrome="label-stack"')
    expect(stack.svg).toContain(`y="${stack.layout.brandY}"`)
    expect(rnd(stack.layout.brandY)).toBe(LOCKUP_MATH[PROOF.stackClassic].brandY)
    const stackChrome = chromeOf(stack.svg, 'label-stack')
    expect(stackChrome).toMatch(/<line\b/)
    expect(stackChrome).not.toMatch(/<ellipse\b|<circle\b|<rect\b/)
    expect(stack.svg).not.toContain('data-art="l-bracket"')

    const eco = layoutSnap(PROOF.stackEco)
    expect(eco.system.lockup).toBe('label-stack')
    expect(rnd(eco.layout.brandY)).toBe(LOCKUP_MATH[PROOF.stackEco].brandY)
    expect(eco.spec.designPlan?.visualConcept.id).toBe('harvest-kraft')
    expect(lastCompositionSearch()).toBeUndefined()
    expect(eco.svg).not.toContain('data-art="art-pattern-compose"')
  })

  it('holds 2.11 box Y stack and 2.7 linear lock', { timeout: 40000 }, () => {
    const earth = layoutSnap('08-zeytinyagi-tuck-luxury')
    expect(rnd(earth.layout.opticalY)).toBe(181.6)
    expect(rnd(earth.layout.brandY)).toBe(173.332)
    expect(earth.svg).toContain('data-lockup-chrome="harvest-seal"')
    expect(earth.svg).not.toContain('data-lockup-chrome="label-wrap"')

    const tech = layoutSnap('14-kulaklik-tuck-modern')
    expect(tech.svg).not.toContain('data-art="l-bracket"')
    expect(allowedStrategies(tech.spec.designPlan!)).not.toContain('balanced-corners')
  })
})
