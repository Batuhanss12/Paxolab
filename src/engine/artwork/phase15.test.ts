import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { allowGoldBar, moodPrior } from '../brain/moodPriors'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { askCopy } from '../conversationAsk'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import {
  clearArtPatternLibraryCache,
  ingestArtPatternLibrary,
} from './artPatternLibrary'
import { clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearMotifBankCache } from './artMotifBank'
import { matchMotifs } from './artMotifMatch'
import { hexLuminance, parseBriefColors, paletteFromBrief } from './briefPalette'
import { composeBlankFace } from './composeBlankFace'
import { resolveSector } from '../designSystem/sector'

function jobSpec(slug: string, blankCanvas = false, colors?: string, styleType?: Job['styleType']) {
  const job = JOBS.find((j) => j.slug === slug) as Job
  const brief = { ...briefFrom(job), ...(colors ? { colors } : {}), ...(styleType ? { styleType } : {}) }
  return new FormaLocalEngine().generate({
    brief,
    overridePatch: { variationIndex: 0, blankCanvas },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

describe('Phase 15 blank-canvas director', () => {
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

  it('parses brief hex colors and builds palette from them, not the luxury costume', () => {
    const brief = {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      packagingMode: 'box' as const,
      styleType: 'luxury' as const,
      colors: '#1a0a0a · #c9a227',
    }
    const pal = paletteFromBrief(brief, 'luxury')
    expect(parseBriefColors(brief.colors)).toEqual(['#1a0a0a', '#c9a227'])
    expect(hexLuminance(pal.bg)).toBeLessThan(0.2)
    expect(pal.bg.toLowerCase()).toBe('#1a0a0a')
    expect(pal.accent.toLowerCase()).toBe('#c9a227')
    expect(pal.bg).not.toBe('#060606')

    const air = paletteFromBrief({ ...brief, colors: '#f5f0e8 · #2d6a4f', styleType: 'minimal' }, 'minimal')
    expect(hexLuminance(air.bg)).toBeGreaterThan(0.7)
    expect(air.bg.toLowerCase()).toBe('#f5f0e8')
    expect(air.accent.toLowerCase()).toBe('#2d6a4f')
    expect(air.bg).not.toBe(pal.bg)
    expect(air.accent).not.toBe(pal.accent)
  })

  it('gates gold-bar by sector, not by luxury costume', () => {
    expect(allowGoldBar('perfume', 'luxury', 'box')).toBe(true)
    expect(allowGoldBar('electronics', 'luxury', 'box')).toBe(false)
    expect(allowGoldBar('perfume', 'minimal', 'box')).toBe(false)
    expect(moodPrior('luxury').serif).toBe(true)
    expect(moodPrior('modern').serif).toBe(false)
  })

  it('blank perfume uses brief colors + crest/gold-bar on the kit-grade face', () => {
    const spec = jobSpec('01-parfum-tuck-luxury', true, '#1a0a0a #c9a227', 'luxury')
    const svg = face(spec)
    expect(svg).toContain('data-face="blank-canvas"')
    expect(svg).toContain('data-art="gold-bar"')
    expect(svg).toMatch(/data-hero="crest"|data-art="hero"/)
    expect(svg).toContain('data-lockup-chrome="centered-crest"')
    expect(svg).not.toContain('data-art="art-pattern-compose"')
    expect(svg).not.toContain('data-hero="seal"')
    expect(spec.palette.bg.toLowerCase()).toBe('#1a0a0a')
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('blank electronics luxury does not stamp gold-bar or style kits', () => {
    const spec = jobSpec('14-kulaklik-tuck-modern', true, '#1a0a0a #c9a227', 'luxury')
    const svg = face(spec)
    expect(svg).toContain('data-face="blank-canvas"')
    expect(svg).not.toContain('data-art="gold-bar"')
    expect(svg).not.toContain('data-bg-kit="night-topo"')
    expect(svg).not.toContain('data-art="modern-grid"')
    expect(svg).not.toContain('data-art="modern-rail"')
    expect(spec.preflight.exportOk).toBe(true)
  })

  it('same brand/product, different colors+mood → different motif sets (temp bank)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p15-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'artdeco-frame.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><path d="M8 8h28v28H8z" fill="#111"/></g>
        <g><path d="M164 8h28v28H164z" fill="#111"/></g>
        <g><path d="M8 164h28v28H8z" fill="#111"/></g>
        <g><path d="M164 164h28v28H164z" fill="#111"/></g>
      </svg>`,
      'utf8',
    )
    writeFileSync(
      path.join(dir, 'botanic-leaf.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><circle cx="24" cy="24" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="176" cy="24" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="24" cy="176" r="10" fill="#2d6a4f"/></g>
        <g><circle cx="176" cy="176" r="10" fill="#2d6a4f"/></g>
      </svg>`,
      'utf8',
    )
    ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    clearMotifBankCache()
    clearArtMotifAtomizerCache()

    const luxMatch = matchMotifs({ mood: 'luxury', sector: 'perfume', colors: '#1a0a0a #c9a227', seed: 0 })
    const minMatch = matchMotifs({ mood: 'minimal', sector: 'perfume', colors: '#f5f0e8 #2d6a4f', seed: 0 })
    expect(luxMatch.sheetIds.length).toBeGreaterThan(0)
    expect(minMatch.sheetIds.length).toBeGreaterThan(0)
    expect(luxMatch.sheetIds[0]).not.toBe(minMatch.sheetIds[0])

    const engine = new FormaLocalEngine()
    const shared = {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box' as const,
      templateId: 'fm-cos-tuck-perfume',
      dimensionsMm: { L: 70, W: 40, H: 140 },
      volume: '50 ml',
    }
    const luxury = engine.generate({
      brief: { ...shared, styleType: 'luxury', colors: '#1a0a0a #c9a227' },
      overridePatch: { blankCanvas: true },
    })
    resetArtMemory()
    const minimal = engine.generate({
      brief: { ...shared, styleType: 'minimal', colors: '#f5f0e8 #2d6a4f' },
      overridePatch: { blankCanvas: true },
    })
    expect(luxury.palette.bg).not.toBe(minimal.palette.bg)
    expect(luxury.palette.accent).not.toBe(minimal.palette.accent)
    const luxFace = face(luxury)
    const minFace = face(minimal)
    expect(luxFace).toContain('data-face="blank-canvas"')
    expect(minFace).toContain('data-face="blank-canvas"')
    expect(luxFace).toContain('data-lockup-chrome="centered-crest"')
    expect(minFace).toContain('data-lockup-chrome="air-rule"')
    expect(luxFace).not.toContain('data-art="art-pattern-compose"')
    expect(minFace).not.toContain('data-art="art-pattern-compose"')
    expect(luxFace).toContain('AURELIA')
    expect(minFace).toContain('AURELIA')
    expect(luxury.preflight.exportOk).toBe(true)
    expect(minimal.preflight.exportOk).toBe(true)
  })

  it('blank face has lockup craft and no styleProfile chrome dump', () => {
    const blank = composeBlankFace(
      { ...emptyBrief(), brandName: 'AURELIA', styleType: 'luxury', packagingMode: 'box', colors: '#1a0a0a #c9a227', sector: 'parfüm' },
      resolveSector({ ...emptyBrief(), sector: 'parfüm', subProduct: 'eau de parfum', productName: 'Noir' }),
      { grammar: 'box' },
    )
    expect(blank.finish.goldBar).toBe(true)
    expect(blank.finish.heroFamily).toBe('crest')
    expect(blank.finish.decor).toBe('crest')
    const tech = composeBlankFace(
      { ...emptyBrief(), brandName: 'NOVA', styleType: 'luxury', packagingMode: 'box', colors: '#1a0a0a #c9a227', sector: 'elektronik' },
      resolveSector({ ...emptyBrief(), sector: 'elektronik', subProduct: 'kulaklık', productName: 'Pulse' }),
      { grammar: 'box' },
    )
    expect(tech.finish.goldBar).toBe(false)
    expect(tech.finish.heroFamily).toBe('none')
    expect(tech.finish.decor).toBe('none')
  })

  it('chat copy treats chips as mood and asks for colour in plain language', () => {
    expect(askCopy(emptyBrief(), 'styleType')).toMatch(/ruh hali/i)
    // C2 moved the intake off hex codes: the director asks for colour / stance / story.
    expect(askCopy(emptyBrief(), 'colors')).toMatch(/renk/i)
    expect(askCopy(emptyBrief(), 'colors')).not.toMatch(/hex/i)
  })
})
