import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetArtMemory } from '../brain'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { emptyBrief } from '../fields'
import { JOBS, briefFrom, type Job } from '../../../scripts/catalog-jobs'
import type { MotifAtom } from './artMotifAtomizer'
import { atomizeArtPattern, clearArtMotifAtomizerCache } from './artMotifAtomizer'
import { clearArtPatternComposeCache } from './artPatternCompose'
import { clearArtPatternLibraryCache, ingestArtPatternLibrary } from './artPatternLibrary'
import { clearMotifBankCache } from './artMotifBank'
import { paintMotifRecipeFromAtoms } from './artMotifCompose'
import { scoreAtom, type MotifSheetVocab } from './artMotifMatch'
import { colorFamilyOf, parseBriefColors } from './briefPalette'
import {
  boxesCollide,
  buildDesignRegionMap,
  collectObstacles,
  regionById,
  resolveDesignRegion,
  scoreAtomForRegion,
  slotBox,
} from './artDesignRegions'
import { bboxIntersectionArea } from './artMotifGeom'
import { mergeMotifDesign, inferMotifDesign, resolveMotifDesign, visualWeightOf } from './artMotifMeta'
import type { Panel } from '../../types'

function jobSpec(slug: string, blankCanvas = false) {
  const job = JOBS.find((j) => j.slug === slug) as Job
  return new FormaLocalEngine().generate({
    brief: briefFrom(job),
    overridePatch: { variationIndex: 0, blankCanvas },
  })
}

function face(spec: { artwork: { layers: { panelId: string; markup: string }[] } }) {
  return spec.artwork.layers.find((l) => l.panelId === 'front' || l.panelId === 'label' || l.panelId === 'trayFront')?.markup ?? ''
}

function frontPanel(): Panel {
  const w = 70
  const h = 140
  return { id: 'front', role: 'body', x: 0, y: 0, w, h, polygon: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }] }
}

function stubAtom(partial: Partial<MotifAtom> & Pick<MotifAtom, 'id'>): MotifAtom {
  return {
    sheetId: 'stub',
    sourceName: 'stub.svg',
    bbox: { x: 0, y: 0, w: 20, h: 20 },
    viewBox: '0 0 20 20',
    markup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect width="20" height="20" fill="#111"/></svg>',
    bytes: 120,
    tags: [],
    roleGuess: 'stamp',
    complexity: 4,
    ...partial,
  }
}

const PALETTE = { bg: '#1a0a0a', fg: '#f5f0e8', accent: '#c9a227', muted: '#8a7a4a', paper: '#f5f0e8' }

describe('Phase 16 asset intelligence + region foundation', () => {
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

  it('same brief twice yields identical front SVG', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p16-det-'))
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
    ingestArtPatternLibrary(dir, dest)
    process.env.FORMA_ART_PATTERN_LIBRARY = dest
    clearArtPatternLibraryCache()
    const brief = {
      ...emptyBrief(),
      brandName: 'AURELIA',
      productName: 'Noir',
      sector: 'parfüm',
      subProduct: 'eau de parfum',
      packagingMode: 'box' as const,
      templateId: 'fm-cos-tuck-perfume',
      dimensionsMm: { L: 70, W: 40, H: 140 },
      volume: '50 ml',
      styleType: 'luxury' as const,
      colors: '#1a0a0a #c9a227',
    }
    const engine = new FormaLocalEngine()
    resetArtMemory()
    const a = engine.generate({ brief, overridePatch: { variationIndex: 0, blankCanvas: true } })
    resetArtMemory()
    const b = engine.generate({ brief, overridePatch: { variationIndex: 0, blankCanvas: true } })
    expect(face(a)).toBe(face(b))
    expect(a.preflight.exportOk).toBe(true)
  })

  it('NE region does not overlap lockup', () => {
    const panel = frontPanel()
    const lockup = { x: 38, y: 2, w: 30, h: 36 }
    const map = buildDesignRegionMap({ panel, lockup })
    const ne = regionById(map, 'ne')
    expect(ne).toBeTruthy()
    if (ne?.available) {
      expect(bboxIntersectionArea(ne.rect, lockup)).toBe(0)
    }
    const placed = resolveDesignRegion({
      panel,
      kind: 'ne',
      map,
      obstacles: collectObstacles({ panel, lockup }),
    })
    if (!placed.rejected) {
      expect(boxesCollide(placed.rect, lockup, 0)).toBe(false)
      expect(bboxIntersectionArea(placed.rect, lockup)).toBe(0)
    } else {
      expect(placed.reason).toMatch(/collision|protected|too-small/)
    }
  })

  it('hero and motif AABBs do not overlap', () => {
    const panel = frontPanel()
    const hero = { x: 22, y: 8, w: 26, h: 22 }
    const lockup = { x: 12, y: 48, w: 46, h: 42 }
    const atoms = [
      stubAtom({ id: 'c__atom-00', roleGuess: 'corner', sourceName: 'artdeco-frame.svg', bbox: { x: 8, y: 8, w: 28, h: 28 } }),
      stubAtom({ id: 'c__atom-01', roleGuess: 'corner', sourceName: 'artdeco-frame.svg', bbox: { x: 164, y: 8, w: 28, h: 28 } }),
      stubAtom({ id: 'c__atom-02', roleGuess: 'stamp', sourceName: 'artdeco-frame.svg' }),
    ]
    const painted = paintMotifRecipeFromAtoms(panel, PALETTE, atoms, {
      style: 'luxury',
      seed: 0,
      lockup,
      heroBox: hero,
      recipeId: 'corner-deco',
    })
    expect(painted.slots.length).toBeGreaterThan(0)
    for (const slot of painted.slots) {
      expect(boxesCollide(slot.box, hero, 0), `${slot.atom.id} vs hero`).toBe(false)
      expect(boxesCollide(slot.box, lockup, 0), `${slot.atom.id} vs lockup`).toBe(false)
    }
  })

  it('Art Deco asset scores higher on an Art Deco / luxury brief', () => {
    const query = { mood: 'luxury' as const, sector: 'perfume', colors: '#1a0a0a #c9a227' }
    const family = colorFamilyOf(parseBriefColors(query.colors))
    const deco = stubAtom({
      id: 'artdeco-frame__atom-00',
      sourceName: 'artdeco-frame.svg',
      tags: ['artdeco', 'classic', 'corner'],
      roleGuess: 'corner',
    })
    const leaf = stubAtom({
      id: 'botanic-leaf__atom-00',
      sourceName: 'botanic-leaf.svg',
      tags: ['eco'],
      roleGuess: 'corner',
    })
    const decoScore = scoreAtom(deco, query, { moods: ['luxury', 'classic'], sectors: ['perfume'], tags: ['artdeco'], color: 'dark-metal' }, family)
    const leafScore = scoreAtom(leaf, query, { moods: ['eco', 'minimal'], sectors: ['food'], tags: ['eco'], color: 'botanical' }, family)
    expect(decoScore).toBeGreaterThan(leafScore)
  })

  it('corner-role assets are not preferred for center', () => {
    const corner = stubAtom({ id: 'c__atom-00', roleGuess: 'corner', sourceName: 'corner-ornament.svg' })
    const stamp = stubAtom({ id: 's__atom-00', roleGuess: 'stamp', sourceName: 'stamp.svg' })
    expect(scoreAtomForRegion(corner, 'center', 'luxury', 'perfume')).toBeLessThan(
      scoreAtomForRegion(corner, 'ne', 'luxury', 'perfume'),
    )
    expect(scoreAtomForRegion(corner, 'center', 'luxury')).toBeLessThan(scoreAtomForRegion(stamp, 'center', 'luxury'))
  })

  it('barcode / protected region is not used for decoration', () => {
    const panel = frontPanel()
    const barcode = { x: 0, y: 118, w: 70, h: 22 }
    const extras = [{ id: 'barcode', rect: barcode, kind: 'barcode' as const, gap: 0.8 }]
    const map = buildDesignRegionMap({ panel, extras, goldBar: true })
    const se = regionById(map, 'se')
    const bottom = regionById(map, 'bottom')
    if (se?.available) expect(bboxIntersectionArea(se.rect, barcode)).toBe(0)
    if (bottom?.available) expect(bboxIntersectionArea(bottom.rect, barcode)).toBe(0)
    const placed = resolveDesignRegion({
      panel,
      kind: 'se',
      map,
      obstacles: collectObstacles({ panel, extras, goldBar: true }),
    })
    if (!placed.rejected) expect(boxesCollide(placed.rect, barcode, 0)).toBe(false)
    else expect(placed.rejected).toBe(true)
  })

  it('legacy atoms without metadata still generate', () => {
    const atom = stubAtom({ id: 'legacy__atom-00', roleGuess: 'stamp' })
    delete atom.design
    const painted = paintMotifRecipeFromAtoms(frontPanel(), PALETTE, [atom], { style: 'luxury', seed: 0 })
    expect(painted.markup).toContain('data-motif-atom="legacy__atom-00"')
    expect(painted.slots.length).toBeGreaterThan(0)
  })

  it('explicit metadata beats inferred metadata', () => {
    const atom = stubAtom({
      id: 'w__atom-00',
      sourceName: 'artdeco-frame.svg',
      roleGuess: 'corner',
      complexity: 80,
      bbox: { x: 0, y: 0, w: 180, h: 180 },
    })
    const inferred = inferMotifDesign(atom, { x: 0, y: 0, w: 200, h: 200 })
    expect(inferred.visualWeight ?? 0).toBeGreaterThan(0.3)
    const merged = mergeMotifDesign(inferred, { visualWeight: 0.11, source: 'explicit' })
    const resolved = resolveMotifDesign({ ...atom, design: { visualWeight: 0.11, source: 'explicit' } })
    expect(merged.visualWeight).toBe(0.11)
    expect(resolved.visualWeight).toBe(0.11)
    expect(resolved.visualWeight).not.toBe(inferred.visualWeight)
    expect(visualWeightOf({ ...atom, design: { visualWeight: 0.11, source: 'explicit' } })).toBe(0.11)
  })

  it('extreme visualWeight is down-scored on low-density / minimal mood', () => {
    const queryMin = { mood: 'minimal' as const, sector: 'perfume', colors: '#f5f0e8 #2d6a4f' }
    const family = colorFamilyOf(parseBriefColors(queryMin.colors))
    const vocab: MotifSheetVocab = {
      moods: ['minimal', 'luxury'],
      sectors: ['perfume'],
      tags: ['stamp'],
      color: 'light',
    }
    const heavy = stubAtom({
      id: 'h__atom-00',
      roleGuess: 'field-fill',
      design: { visualWeight: 0.96, density: 'high', source: 'explicit' },
    })
    const light = stubAtom({
      id: 'l__atom-00',
      roleGuess: 'stamp',
      design: { visualWeight: 0.2, density: 'low', source: 'explicit' },
    })
    expect(scoreAtom(heavy, queryMin, vocab, family)).toBeLessThan(scoreAtom(light, queryMin, vocab, family))
  })

  it('placed scale stays inside atom min/max', () => {
    const panel = frontPanel()
    const atom = stubAtom({
      id: 'sc__atom-00',
      roleGuess: 'stamp',
      design: { minScale: 0.5, maxScale: 0.62, source: 'explicit' },
    })
    const fallback = slotBox(panel, 'nw')
    const placed = resolveDesignRegion({ panel, kind: 'nw', atom })
    expect(placed.rejected).toBe(false)
    const scale = placed.rect.w / fallback.w
    expect(scale).toBeGreaterThanOrEqual(0.5 - 0.001)
    expect(scale).toBeLessThanOrEqual(0.62 + 0.001)
  })

  it('atomizer attaches inferred design metadata at ingest/atomize time', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'forma-p16-at-'))
    const dest = path.join(dir, 'lib')
    writeFileSync(
      path.join(dir, 'artdeco-frame.svg'),
      `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><path d="M8 8h28v28H8z" fill="#111"/></g>
        <g><path d="M164 8h28v28H164z" fill="#111"/></g>
      </svg>`,
      'utf8',
    )
    const [entry] = ingestArtPatternLibrary(dir, dest)
    const atoms = atomizeArtPattern(entry, `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g><path d="M8 8h28v28H8z" fill="#111"/></g>
        <g><path d="M164 8h28v28H164z" fill="#111"/></g>
      </svg>`)
    expect(atoms.length).toBeGreaterThan(0)
    expect(atoms[0].roleGuess).toBeTruthy()
    expect(atoms[0].design?.visualWeight).toBeGreaterThanOrEqual(0)
    expect(atoms[0].design?.visualWeight).toBeLessThanOrEqual(1)
    expect(atoms[0].design?.source).toBe('inferred')
  })
})

describe('Phase 16 live generate still exports', () => {
  beforeEach(() => {
    resetArtMemory()
    delete process.env.FORMA_ART_PATTERN_LIBRARY
  })

  it('catalog perfume job still exportOk', () => {
    const spec = jobSpec('01-parfum-tuck-luxury', false)
    expect(spec.preflight.exportOk).toBe(true)
    expect(face(spec)).toContain('AURELIA')
  })
})
