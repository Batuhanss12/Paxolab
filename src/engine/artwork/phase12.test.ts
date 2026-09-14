import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { scoreVisualCraft } from '../brain/DesignScore'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import {
  ART_PATTERN_SOURCE_DIR,
  FORBIDDEN_SOURCE_NAME,
  assignMixPatterns,
  clearArtPatternLibraryCache,
  ingestArtPatternLibrary,
  normalizeArtPatternSvg,
  paintArtPattern,
  skipReasonForSvg,
  slugFromFilename,
  tagsFromFilename,
} from './artPatternLibrary'
import { analyzeAndExtract } from './artPatternExtract'
import { clearArtPatternComposeCache, resolveLibraryRecipe } from './artPatternCompose'

function jobSpec(slug: string, artPatternId?: string, artPatternCompose = false) {
  const job = JOBS.find((j) => j.slug === slug) as Job
  return new FormaLocalEngine().generate({
    brief: briefFrom(job),
    overridePatch: { variationIndex: 0, heroFamily: job.heroFamily, artPatternId, artPatternCompose },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

const WHITE_PLATE = `<?xml version="1.0"?>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100" height="100" fill="#fff"/>
  <path d="M10 10h20" fill="#111"/>
</svg>`

const DIELINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 261">
  <title>Rebull — FORMA dieline</title>
  <text x="15" y="130">glue</text>
  <text x="92" y="16">topTuck</text>
  <line x1="0" y1="0" x2="10" y2="10" stroke="#c00"/>
</svg>`

describe('Phase 12 art-pattern library mix', () => {
  beforeEach(() => {
    resetArtMemory()
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  afterEach(() => {
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  it('reads only ART-PATTERN-DESİGN and never Stil-Referans', () => {
    expect(ART_PATTERN_SOURCE_DIR).toMatch(/ART-PATTERN-DESİGN$/i)
    expect(ART_PATTERN_SOURCE_DIR).not.toContain(FORBIDDEN_SOURCE_NAME)
    expect(ART_PATTERN_SOURCE_DIR).not.toMatch(/Stil-Referans/i)
  })

  it('slugs converted names and tags artdeco / vintage / frame', () => {
    expect(slugFromFilename('Art-Deco-Pattern-Gold-Black-166 [Dönüştürülmüş].svg')).toBe(
      'art-deco-pattern-gold-black-166',
    )
    expect(tagsFromFilename('artdeco_frame.svg')).toEqual(expect.arrayContaining(['classic', 'artdeco']))
    expect(tagsFromFilename('588vintage.svg')).toEqual(expect.arrayContaining(['vintage', 'classic']))
    expect(skipReasonForSvg('22.svg', DIELINE)).toBe('dieline-not-pattern')
  })

  it('strips full-bleed white plates and maps fills to currentColor', () => {
    const { markup, viewBox } = normalizeArtPatternSvg(WHITE_PLATE)
    expect(viewBox).toBe('0 0 100 100')
    expect(markup).toMatch(/fill="none"/)
    expect(markup).toMatch(/fill="currentColor"/)
    expect(markup).not.toMatch(/fill="#fff"/i)
  })

  it('empty source fails clearly without falling back', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-empty-'))
    expect(() => ingestArtPatternLibrary(dir, path.join(dir, 'out'))).toThrow(/empty|not found|ART-PATTERN/i)
  })

  it('ingests a drop folder, skips dielines with reason, mixes unique ids', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-src-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(path.join(dir, 'artdeco_gold.svg'), WHITE_PLATE.replace('#111', '#c9a24e'), 'utf8')
    writeFileSync(path.join(dir, '588vintage.svg'), WHITE_PLATE.replace('#111', '#4a3'), 'utf8')
    writeFileSync(path.join(dir, 'pattern16.svg'), WHITE_PLATE, 'utf8')
    writeFileSync(path.join(dir, 'misc-a.svg'), WHITE_PLATE, 'utf8')
    writeFileSync(path.join(dir, 'misc-b.svg'), WHITE_PLATE, 'utf8')
    writeFileSync(path.join(dir, 'misc-c.svg'), WHITE_PLATE, 'utf8')
    writeFileSync(path.join(dir, '22.svg'), DIELINE, 'utf8')
    const entries = ingestArtPatternLibrary(dir, dest)
    expect(entries).toHaveLength(7)
    const skipped = entries.find((e) => e.sourceName === '22.svg')
    expect(skipped?.skipReason).toBe('dieline-not-pattern')
    const mix = assignMixPatterns(
      entries,
      [
        { sectorKey: 'parfum', preferTags: ['artdeco', 'classic'] },
        { sectorKey: 'krem', preferTags: ['misc'] },
        { sectorKey: 'serum', preferTags: ['misc'] },
        { sectorKey: 'gida', preferTags: ['vintage'] },
        { sectorKey: 'elektronik', preferTags: ['geometric'] },
        { sectorKey: 'temizlik', preferTags: ['misc'] },
      ],
      12,
    )
    expect(mix).toHaveLength(6)
    const ids = mix.map((m) => m.entry.id)
    expect(new Set(ids).size).toBe(6)
    expect(ids).not.toContain(skipped?.id)
    expect(mix.find((m) => m.sectorKey === 'parfum')?.entry.tags).toEqual(expect.arrayContaining(['artdeco']))
    expect(mix.find((m) => m.sectorKey === 'gida')?.entry.tags).toEqual(expect.arrayContaining(['vintage']))
  })

  it('P12 overlay is opt-in: default perfume has no art-pattern, override paints it as <image>', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-paint-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'crest-field.svg'),
      `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M2 2h8v8H2z" fill="#111"/></svg>`,
      'utf8',
    )
    const entries = ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()

    const plain = jobSpec('01-parfum-tuck-luxury')
    expect(face(plain)).not.toContain('data-art="art-pattern"')
    expect(face(plain)).toContain('data-hero="crest"')
    expect(face(plain)).not.toContain('data-hero="seal"')

    const mixed = jobSpec('01-parfum-tuck-luxury', entries[0].id)
    const svg = face(mixed)
    expect(svg).toContain('data-art="art-pattern"')
    expect(svg).toContain(`data-pattern-lib="${entries[0].id}"`)
    expect(svg).toContain('<image')
    expect(svg).toContain('data-hero="crest"')
    expect(svg).toContain('data-art="gold-bar"')
    expect(svg).not.toContain('data-hero="seal"')
    expect(svg).toContain(`url(#lockout-`)
    expect(scoreVisualCraft(mixed, mixed.designPlan!).visualCraft).toBeGreaterThanOrEqual(77)
    expect(mixed.preflight.exportOk).toBe(true)
  })

  it('paintArtPattern does not wrap an extra group that can leak </g>', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-g-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'grouped.svg'),
      `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><g><path d="M0 0h2" fill="#000"/></g></svg>`,
      'utf8',
    )
    const [entry] = ingestArtPatternLibrary(dir, dest)
    const panel = { id: 'front', x: 0, y: 0, w: 70, h: 140, role: 'body' as const, polygon: [] }
    const p = { bg: '#111', fg: '#eee', accent: '#c9a24e', muted: '#888', paper: '#f4efe4' }
    const svg = paintArtPattern(panel, p, entry, { style: 'luxury' })
    expect(svg.startsWith('<image')).toBe(true)
    expect(svg).not.toMatch(/^<g/)
    expect(svg).toContain('data-art="art-pattern"')
  })

  it('extracts crops plus top-level parts from a small multi-path SVG', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-ex-'))
    const dest = path.join(dir, 'lib')
    const raw = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h12v12H4z" fill="#111"/>
        <path d="M40 8h20v8H40z" fill="#222"/>
        <g><circle cx="60" cy="60" r="8" fill="#333"/></g>
      </svg>`
    writeFileSync(path.join(dir, 'ornament.svg'), raw, 'utf8')
    const [entry] = ingestArtPatternLibrary(dir, dest)
    const analysis = analyzeAndExtract(entry, readFileSync(path.join(dest, `${entry.id}.svg`), 'utf8'))
    const kinds = analysis.parts.map((p) => p.kind)
    expect(kinds).toEqual(expect.arrayContaining(['full', 'tile-center', 'frame-ring', 'medallion', 'band-top', 'part']))
    expect(analysis.parts.filter((p) => p.kind === 'part').length).toBeGreaterThanOrEqual(2)
    expect(analysis.counts.topLevel).toBeGreaterThanOrEqual(3)

    const recipe = resolveLibraryRecipe(analysis, 'luxury')
    expect(recipe.intent).toBe('hero-ornament')
    expect(recipe.keepHero).toBe(false)
    expect(recipe.layers.length).toBe(1)
    expect(recipe.layers[0]?.kind).toBe('full')
  })

  it('compose mode uses a frame recipe and keeps gallery crest/gold-bar', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-ap-co-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'artdeco-frame.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 10h180v180H10z" fill="none" stroke="#111"/>
        <path d="M40 40h120v120H40z" fill="#c9a24e"/>
      </svg>`,
      'utf8',
    )
    const entries = ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    clearArtPatternComposeCache()

    const ossified = jobSpec('01-parfum-tuck-luxury')
    expect(face(ossified)).toContain('data-hero="crest"')
    expect(face(ossified)).toContain('data-art="gold-bar"')
    expect(face(ossified)).not.toContain('data-art="art-pattern-compose"')

    const composed = jobSpec('01-parfum-tuck-luxury', entries[0].id, true)
    const svg = face(composed)
    expect(svg).toContain('data-art="art-pattern-compose"')
    expect(svg).toContain('data-art="gold-bar"')
    expect(svg).toContain('data-hero="crest"')
    expect(svg).toContain('data-art="hero"')
    expect((svg.match(/data-art="art-pattern-compose"/g) || []).length).toBeLessThanOrEqual(5)
    expect(svg).not.toContain('data-hero="seal"')
    expect(svg).not.toContain('data-bg-kit="night-topo"')
    expect(composed.preflight.exportOk).toBe(true)
  })
})

