import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import { ART_PATTERN_ASSET_DIR, clearArtPatternLibraryCache, ingestArtPatternLibrary, loadArtPatternLibrary, usableArtPatterns } from './artPatternLibrary'
import { atomizeArtPattern, clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { pathBBox } from './artMotifGeom'
import { parseViewBox } from './artPatternLibrary'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearMotifBankCache } from './artMotifBank'

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

describe('Phase 14 motif atomizer', () => {
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

  it('pathBBox tracks moveto and lineto', () => {
    const box = pathBBox('M10 20 L30 40')
    expect(box).toMatchObject({ x: 10, y: 20, w: 20, h: 20 })
    const rel = pathBBox('m10 10 h20 v10')
    expect(rel?.w).toBeCloseTo(20, 5)
    expect(rel?.h).toBeCloseTo(10, 5)
  })

  it('clusters nearby primitives into ≥4 tight atoms', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p14-cl-'))
    const dest = path.join(dir, 'lib')
    const circles: string[] = []
    const spots = [
      [10, 10],
      [90, 10],
      [10, 90],
      [90, 90],
    ]
    for (const [cx, cy] of spots) {
      for (let i = 0; i < 4; i++) {
        circles.push(`<circle cx="${cx + (i % 2) * 3}" cy="${cy + Math.floor(i / 2) * 3}" r="1.2" fill="#111"/>`)
      }
    }
    writeFileSync(
      path.join(dir, 'atlas.svg'),
      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${circles.join('')}</svg>`,
      'utf8',
    )
    const [entry] = ingestArtPatternLibrary(dir, dest)
    const atoms = atomizeArtPattern(entry, readFileSync(path.join(dest, `${entry.id}.svg`), 'utf8'))
    expect(atoms.length).toBeGreaterThanOrEqual(4)
    const sheet = parseViewBox(readFileSync(path.join(dest, `${entry.id}.svg`), 'utf8'))
    for (const atom of atoms) {
      const vb = parseViewBox(atom.markup)
      expect(vb.w * vb.h).toBeLessThan(sheet.w * sheet.h * 0.5)
      expect(atom.bytes).toBeLessThan(entry.bytes)
    }
  })

  it('unwraps nested groups into ≥12 tight atoms', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p14-n-'))
    const dest = path.join(dir, 'lib')
    const cells = Array.from({ length: 12 }, (_, i) => {
      const x = 8 + (i % 4) * 24
      const y = 8 + Math.floor(i / 4) * 28
      return `<g><path d="M${x} ${y}h12v12H${x}z" fill="#111"/></g>`
    }).join('')
    writeFileSync(
      path.join(dir, 'nested.svg'),
      `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><g><g>${cells}</g></g></svg>`,
      'utf8',
    )
    const [entry] = ingestArtPatternLibrary(dir, dest)
    const atoms = atomizeArtPattern(entry, readFileSync(path.join(dest, `${entry.id}.svg`), 'utf8'))
    expect(atoms.length).toBeGreaterThanOrEqual(12)
    expect(atoms.every((a) => a.bytes < entry.bytes * 0.6)).toBe(true)
  })

  it('compose paints motif atoms and keeps perfume crest/gold-bar', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p14-co-'))
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
    const entries = ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    clearMotifBankCache()
    const live = atomizeArtPattern(entries[0], readFileSync(path.join(dest, `${entries[0].id}.svg`), 'utf8'))
    expect(live.length).toBeGreaterThanOrEqual(2)

    const composed = jobSpec('01-parfum-tuck-luxury', entries[0].id, true)
    const svg = face(composed)
    const painted = (svg.match(/data-motif-atom="/g) || []).length
    expect(svg).toContain('data-art="art-pattern-compose"')
    expect(painted).toBeGreaterThanOrEqual(2)
    expect(painted).toBeLessThanOrEqual(5)
    expect(svg).toContain('data-art="gold-bar"')
    expect(svg).toContain('data-hero="crest"')
    expect(svg).not.toContain('data-hero="seal"')
    const ops = [...svg.matchAll(/data-art="art-pattern-compose"[^>]*opacity="([0-9.]+)"/g)].map((m) => Number(m[1]))
    expect(ops.every((n) => n >= 0.28)).toBe(true)
    expect(composed.preflight.exportOk).toBe(true)
  })

  it('atomizes dense library sheets 47122 and 7f15 into ≥12 tight parts', () => {
    const a = path.join(ART_PATTERN_ASSET_DIR, '47122.svg')
    const b = path.join(ART_PATTERN_ASSET_DIR, '7f15fe79-4e1d-4526-b211-fe6dd617e458.svg')
    if (!existsSync(a) || !existsSync(b)) return
    const lib = usableArtPatterns(loadArtPatternLibrary(ART_PATTERN_ASSET_DIR))
    const dense = lib.filter((e) => e.id === '47122' || e.id.startsWith('7f15'))
    expect(dense.length).toBe(2)
    for (const entry of dense) {
      const atoms = atomizeArtPattern(entry, readFileSync(entry.assetPath, 'utf8'))
      expect(atoms.length, entry.id).toBeGreaterThanOrEqual(12)
      const full = entry.bytes
      expect(atoms.every((atom) => atom.bytes < full * 0.85)).toBe(true)
      const sheet = parseViewBox(readFileSync(entry.assetPath, 'utf8'))
      for (const atom of atoms.slice(0, 8)) {
        const vb = parseViewBox(atom.markup)
        expect(vb.w * vb.h).toBeLessThan(sheet.w * sheet.h * 0.85)
      }
    }
  })
})
