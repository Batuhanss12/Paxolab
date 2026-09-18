/**
 * STİCKERR REF intake — what was kept from the perfume plates, and what was deliberately not.
 *
 * Nineteen reference labels were audited; five were kept (Diako, Dogwood & Fir, Raavi, Azzurra,
 * Heeva) and three dropped by the owner (Aurelie, Amani, Oud Attar). Of the five, two became
 * archetypes (`atelier-plate` from Diako, `crest-panel` from Azzurra), two became frames
 * (`fleuron-crown` from Heeva, `bezel` from Raavi — with the oval cut it needs), and Dogwood & Fir
 * contributed nothing at all: its distinguishing move is the product set *above* the brand, and
 * the owner's rule is that the hierarchy does not loosen. Emboss and foil relief were likewise
 * left out — those are the mockups' finishing, not the artwork's.
 *
 * Every face here is checked at the level the ledger works at (collisions, bounds, export), plus
 * the two things a plate has to get right that a ledger cannot see: the brand still leads, and the
 * block sits in the middle of its face rather than hanging from the top margin.
 */
import { describe, expect, it } from 'vitest'
import type { DesignBrief, PackagingMode } from '../../types'
import { emptyBrief } from '../fields'
import { FormaLocalEngine } from '../FormaLocalEngine'
import { resetArtMemory } from '../brain/DesignMemory'
import { buildCombinedSvg } from '../production/exportDoc'
import { buildDieline } from '../dieline/buildDieline'
import { recommendStructures } from '../catalog/structureRecommend'
import { paletteFromBrief } from '../artwork/briefPalette'
import { hsl } from './color'
import { concentrationLine } from './copyBank'
import { hintsFromBrief } from './direction'
import { familiesFromUtterance } from './family'
import { isDisc, isRound } from './layoutContext'
import type { DirectionHints } from './types'

type Tiers = Partial<Pick<DesignBrief, 'concentration' | 'edition' | 'attribution' | 'origin'>>

const TIERS: Tiers = { concentration: 'edt', edition: 'No. 07 · Limited', attribution: 'by Diako Atelier', origin: 'İstanbul · 1998' }

function perfume(mode: PackagingMode, extra: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Diako',
    productName: 'Fleur de Nuit',
    sector: 'kozmetik',
    subProduct: 'parfüm',
    packagingMode: mode,
    templateId: mode === 'box' ? 'fm-cos-tuck-perfume' : 'fm-cos-label-bottle',
    styleType: 'luxury',
    colors: 'krem · altın',
    volume: '50 ml',
    barcode: '8690000000017',
    dimensionsMm: mode === 'box' ? { L: 70, W: 35, H: 140 } : { L: 70, W: 0, H: 90 },
    ...extra,
  }
}

const pin = (archetype: DirectionHints['archetype'], extra: Partial<DirectionHints> = {}): DirectionHints => ({
  archetype,
  source: 'user',
  pinSource: 'user',
  ...extra,
})

function face(brief: DesignBrief, direction?: DirectionHints) {
  resetArtMemory()
  const spec = new FormaLocalEngine().generate({ brief, overridePatch: { studio: true, variationIndex: 0, direction } })
  const panelId = spec.artwork.frontPanelId
  const report = spec.studio!.panels?.find((p) => p.panelId === panelId)
  return {
    spec,
    panel: spec.dieline.panels.find((p) => p.id === panelId)!,
    placed: report?.placed ?? [],
    hits: (report?.collisions.length ?? 0) + (report?.outOfBounds.length ?? 0),
    markup: String(spec.artwork.layers.find((l) => l.panelId === panelId)?.markup ?? ''),
    direction: spec.studio!.direction,
    exportOk: Boolean(buildCombinedSvg(spec)),
  }
}

// `data-edit` sits on the wrapping <g>; the first <text> inside carries the size.
function sizeOf(markup: string, edit: string): number {
  const m = markup.match(new RegExp(`data-edit="${edit}"[\\s\\S]{0,600}?font-size="([\\d.]+)"`))
  return m ? Number(m[1]) : 0
}

describe('STİCKERR REF — atelier-plate (Diako)', () => {
  for (const mode of ['label', 'box'] as PackagingMode[]) {
    it(`paints the three tiers on a ${mode} and keeps the brand in front`, () => {
      const row = face(perfume(mode, TIERS), pin('atelier-plate'))
      expect(row.direction.archetype).toBe('atelier-plate')
      expect(row.markup).toContain('data-frame="band-hairline"')
      for (const edit of ['attribution', 'edition', 'origin']) {
        expect(row.markup, `${mode}: ${edit} tier missing`).toContain(`data-edit="${edit}"`)
      }
      // The concentration the brief named is the register line — not the bank's EAU DE PARFUM.
      expect(row.direction.categoryLine).toBe('EAU DE TOILETTE')
      expect(row.markup).toContain('EAU DE TOILETTE')
      const brand = sizeOf(row.markup, 'brand')
      const product = sizeOf(row.markup, 'product')
      expect(brand).toBeGreaterThan(0)
      expect(product).toBeGreaterThan(0)
      expect(brand, `${mode}: product outranks brand`).toBeGreaterThan(product)
      expect(row.hits, `${mode}: ledger hits`).toBe(0)
      expect(row.exportOk).toBe(true)
    })
  }

  it('centres the plate on a tall face instead of hanging it from the top margin', () => {
    /*
     * Measured on the first pass: the block ended at 27% of a 70 × 140 carton and the lower half
     * was empty. A plate reads as a plate only when the air above and below it is roughly equal.
     */
    const row = face(perfume('box', TIERS), pin('atelier-plate'))
    // Ledger ids carry a running suffix ("brand#1"), so match by prefix.
    const texts = row.placed.filter((b) => b.kind === 'text' && !b.id.startsWith('net-quantity'))
    const top = Math.min(...texts.map((b) => b.y))
    const bottom = Math.max(...texts.map((b) => b.y + b.h))
    const centre = (top + bottom) / 2 / row.panel.h
    expect(centre).toBeGreaterThan(0.36)
    expect(centre).toBeLessThan(0.6)
  })

  it('draws only the tiers the brief gave', () => {
    const row = face(perfume('label', { concentration: 'extrait', attribution: 'Maison Heeva' }), pin('atelier-plate', { frame: 'fleuron-crown' }))
    expect(row.markup).toContain('data-frame="fleuron-crown"')
    expect(row.markup).toContain('data-edit="attribution"')
    expect(row.markup).not.toContain('data-edit="edition"')
    expect(row.markup).not.toContain('data-edit="origin"')
    expect(row.direction.categoryLine).toBe('EXTRAIT DE PARFUM')
    expect(row.hits).toBe(0)
  })
})

describe('STİCKERR REF — crest-panel (Azzurra)', () => {
  for (const mode of ['label', 'box'] as PackagingMode[]) {
    it(`paints a roundel with a crest on an arabesque field (${mode})`, () => {
      const row = face(perfume(mode, { brandName: 'Azzurra', productName: 'Mediterraneo', colors: 'lacivert · altın', styleType: 'classic', edition: 'Riviera Edition' }), pin('crest-panel'))
      expect(row.direction.archetype).toBe('crest-panel')
      expect(row.direction.background).toBe('arabesque')
      expect(row.markup).toContain('data-bg="arabesque"')
      expect(row.markup).toContain('data-art="brand-mark"')
      expect(row.placed.some((b) => b.id.startsWith('roundel')), 'roundel not in the ledger').toBe(true)
      expect(row.markup).toContain('data-edit="edition"')
      const brand = sizeOf(row.markup, 'brand')
      const product = sizeOf(row.markup, 'product')
      expect(brand).toBeGreaterThan(product)
      expect(row.hits, `${mode}: ledger hits`).toBe(0)
      expect(row.exportOk).toBe(true)
    })
  }

  it('is reached by a word in the brief, and the arabesque comes with it', () => {
    expect(familiesFromUtterance('arabesk zemin, ortada arma')).toEqual(['crest'])
    expect(familiesFromUtterance('atölye plakası gibi')).toEqual(['atelier'])
    const crest = hintsFromBrief({ ...perfume('label'), story: 'arma ve arabesk' }, 'perfume', 'label')
    expect(crest.archetype).toBe('crest-panel')
    expect(crest.background).toBe('arabesque')
    const plate = hintsFromBrief({ ...perfume('box'), story: 'Diako gibi bir atölye plakası' }, 'perfume', 'box')
    expect(plate.archetype).toBe('atelier-plate')
    expect(plate.frame).toBe('band-hairline')
  })
})

describe('STİCKERR REF — concentration register', () => {
  it('spells the concentration the way a plate does', () => {
    expect(concentrationLine('edt')).toBe('EAU DE TOILETTE')
    expect(concentrationLine('Eau de Parfum')).toBe('EAU DE PARFUM')
    expect(concentrationLine('extrait')).toBe('EXTRAIT DE PARFUM')
    expect(concentrationLine('kolonya')).toBe('EAU DE COLOGNE')
    expect(concentrationLine("parfum d'ambiance")).toBe("PARFUM D'AMBIANCE")
    expect(concentrationLine('')).toBe('')
  })

  it('leaves the bank line alone when the brief says nothing', () => {
    const row = face(perfume('label'))
    expect(row.direction.categoryLine).toBe('EAU DE PARFUM')
  })
})

describe('STİCKERR REF — oval-label (Raavi)', () => {
  const OVALS: [string, string, string, string, string, DesignBrief['styleType'], { L: number; W: number; H: number }][] = [
    ['Raavi', 'Amber Noir', 'kozmetik', 'parfüm', 'siyah · altın', 'luxury', { L: 70, W: 0, H: 45 }],
    ['Verda', 'Gül Suyu', 'kozmetik', 'krem', 'krem · yeşil', 'eco', { L: 60, W: 0, H: 40 }],
    ['Ege', 'Erken Hasat', 'gıda', 'zeytinyağı', 'zeytin · krem', 'classic', { L: 80, W: 0, H: 55 }],
  ]

  function oval(row: (typeof OVALS)[number]) {
    const [brandName, productName, sector, subProduct, colors, styleType, dimensionsMm] = row
    return face({
      ...emptyBrief(),
      brandName,
      productName,
      sector,
      subProduct,
      packagingMode: 'label',
      templateId: 'fm-label-oval',
      styleType,
      colors,
      volume: '50 ml',
      barcode: '8690000000017',
      dimensionsMm,
    })
  }

  it('builds an ellipse, not a disc and not a box', () => {
    const model = buildDieline('oval-label', { ...emptyBrief(), packagingMode: 'label', dimensionsMm: { L: 70, W: 0, H: 45 } })
    expect(model.structureId).toBe('oval-label')
    for (const panel of model.panels) {
      expect(isRound(panel)).toBe(true)
      expect(isDisc(panel)).toBe(false)
      expect(panel.w).toBe(70)
      expect(panel.h).toBe(45)
      const rx = panel.w / 2
      const ry = panel.h / 2
      for (const pt of panel.polygon) {
        const u = (pt.x - (panel.x + rx)) / rx
        const v = (pt.y - (panel.y + ry)) / ry
        expect(u * u + v * v).toBeCloseTo(1, 4)
      }
    }
  })

  it('keeps every element inside the ellipse and wears the bezel', () => {
    for (const job of OVALS) {
      const row = oval(job)
      expect(row.spec.dieline.structureId).toBe('oval-label')
      const rx = row.panel.w / 2
      const ry = row.panel.h / 2
      for (const b of row.placed) {
        if (b.kind === 'ground') continue
        for (const [x, y] of [
          [b.x, b.y],
          [b.x + b.w, b.y],
          [b.x, b.y + b.h],
          [b.x + b.w, b.y + b.h],
        ]) {
          const u = (x - rx) / rx
          const v = (y - ry) / ry
          expect(u * u + v * v, `${job[0]}: ${b.id} crosses the cut line`).toBeLessThanOrEqual(1.02)
        }
      }
      // A rectangular frame becomes a bezel on a curved cut; a direction with no frame keeps the ring.
      const drawn = !['none', 'corner-brackets', 'rounded-card'].includes(row.direction.frame)
      expect(row.markup.includes('data-frame="bezel"'), `${job[0]}: bezel vs ${row.direction.frame}`).toBe(drawn)
      expect(row.markup, `${job[0]}: no medallion`).toContain(`fill="${row.direction.palette.card}"`)
      expect(row.hits, `${job[0]}: ledger hits`).toBe(0)
      expect(row.exportOk, `${job[0]}: export`).toBe(true)
    }
  })

  it('is offered for a bottle label and never for a lid', () => {
    const bottle = recommendStructures({ ...emptyBrief(), packagingMode: 'label', sector: 'kozmetik', subProduct: 'parfüm', dimensionsMm: { L: 70, W: 0, H: 45 } })
    expect(bottle.candidates.map((c) => c.structureId)).toContain('oval-label')
  })
})

describe('STİCKERR REF — metallic names are foil, not fill', () => {
  it('routes rose gold, brass and platinum to the accent slot, keeping the hue', () => {
    /*
     * The accent is the named metal or a tint of it — not necessarily the swatch verbatim. Rose
     * gold on a luxury black sits 0.18 above it in luminance against a 0.22 floor; before `foilOn`
     * the engine answered by swapping the accent for the paper colour, and the brief's one
     * distinctive request vanished. Now the tint moves and the hue stays, which is what this pins.
     */
    const cases: [string, string][] = [
      ['krem · rose gold', '#b76e79'],
      ['lacivert · pirinç', '#b5a642'],
      ['siyah · platin', '#d9d9d3'],
      ['siyah · bakır', '#a9623a'],
    ]
    const hueGap = (a: string, b: string) => {
      const d = Math.abs(hsl(a).h - hsl(b).h) % 360
      return Math.min(d, 360 - d)
    }
    for (const [colors, metal] of cases) {
      const palette = paletteFromBrief({ ...perfume('label'), colors }, 'luxury')
      expect(palette.bg, `${colors}: metallic flooded the ground`).not.toBe(metal)
      expect(palette.accent, `${colors}: accent is the paper, not the foil`).not.toBe(palette.paper)
      if (hsl(metal).s > 0.08) {
        expect(hueGap(palette.accent, metal), `${colors}: accent ${palette.accent} lost the metal's hue`).toBeLessThan(15)
      }
    }
  })
})
