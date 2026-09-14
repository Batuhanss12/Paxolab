import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { buildDieline } from './buildDieline'
import { generateForxaModel } from './forxaGenerate'
import { registry } from './forxa/registry'
import { kindFromForxaPanel, toDielineModel } from './forxaAdapter'
import { nativeKindFor } from './panelKind'

function boxBrief(patch: Partial<DesignBrief> = {}): DesignBrief {
  return {
    ...emptyBrief(),
    brandName: 'Aurelia',
    productName: 'Noir',
    packagingMode: 'box',
    templateId: 'perfume-box',
    dimensionsMm: { L: 70, W: 35, H: 140 },
    ...patch,
  }
}

describe('Forxa adapter (D7-A)', () => {
  it('converts a raw tuck-end without baked 3 mm bleed', () => {
    const engine = registry.get('tuck-end-box')
    expect(engine).toBeTruthy()
    const raw = engine!.generateDieline({ length: 70, width: 35, height: 140 })
    expect(raw.success).toBe(true)
    const model = toDielineModel(raw, { L: 70, W: 35, H: 140 }, 'tuck-end-box')
    expect(model.panels).toHaveLength(raw.panels.length)
    expect(model.panels.every((p) => p.w > 0 && p.h > 0 && Number.isFinite(p.x))).toBe(true)
    expect(model.cut.length).toBeGreaterThan(0)
    expect(model.crease.length).toBeGreaterThan(0)
    expect(model.glueIds.length).toBeGreaterThan(0)
    expect(model.panels.some((p) => p.kind === 'hero-front')).toBe(true)
    expect(model.panels.some((p) => p.kind === 'legal-back')).toBe(true)
    expect(model.width).toBeLessThan(raw.bounds.width + 1)
  })

  it('keeps native FORMA tuck-end panel count and positions', () => {
    const native = buildDieline('tuck-end-box', boxBrief())
    expect(native.panels).toHaveLength(13)
    expect(native.panels.find((p) => p.id === 'front')?.kind).toBe('hero-front')
    expect(native.panels.find((p) => p.id === 'glue')?.kind).toBe('glue')
    expect(nativeKindFor(native.panels[0]!)).toBeTruthy()
  })

  it('routes polygon-box through Forxa', () => {
    const model = generateForxaModel('polygon-box', { L: 60, W: 60, H: 120 }, { sides: 6, closureType: 0 })
    expect(model.consistent).toBe(true)
    expect(model.panels.some((p) => p.kind === 'hero-front')).toBe(true)
    expect(model.panels.some((p) => p.id === 'base')).toBe(true)
    expect(model.cut.length).toBeGreaterThan(0)
  })

  it('keeps hex and triangle C-family CUT free of self-intersection', () => {
    for (const sides of [3, 6]) {
      const model = generateForxaModel('polygon-box', { L: 60, W: 60, H: 120 }, { sides, closureType: 0 })
      const fatal = (model.structural?.findings ?? []).filter((f) => f.code === 'CUT_SELF_INTERSECTION')
      expect(fatal).toEqual([])
      expect(model.panels.every((p) => p.w > 0 && p.h > 0)).toBe(true)
      expect(model.glueIds.length).toBeGreaterThan(0)
      expect(model.panels.some((p) => p.id === 'glue-tab')).toBe(true)
    }
  })

  it('does not create zero-area zipper overlay panels', () => {
    const model = generateForxaModel('tuck-end-box', { L: 80, W: 40, H: 80 }, undefined, '12')
    expect(model.consistent).toBe(true)
    expect(model.panels.every((p) => p.w > 0 && p.h > 0)).toBe(true)
    expect(model.panels.some((p) => p.id.startsWith('aux-'))).toBe(true)
    expect(model.cut.length).toBeGreaterThan(0)
    expect((model.perf ?? []).length).toBeGreaterThan(0)
  })

  it('builds Forxa aux tuck with L×W lids and dust', () => {
    const model = generateForxaModel('tuck-end-box', { L: 70, W: 35, H: 140 }, undefined, '62')
    const top = model.panels.find((p) => p.id === 'top')
    const bottom = model.panels.find((p) => p.id === 'bottom')
    expect(model.panels.length).toBeGreaterThanOrEqual(13)
    expect(top?.w).toBeCloseTo(70, 0)
    expect(top?.h).toBeCloseTo(35, 0)
    expect(bottom?.w).toBeCloseTo(70, 0)
    expect(bottom?.h).toBeCloseTo(35, 0)
    expect(model.panels.some((p) => p.id.startsWith('dust-'))).toBe(true)
    expect(model.structural?.findings.some((f) => f.code === 'CUT_SELF_INTERSECTION')).toBe(false)
  })
})

describe('kindFromForxaPanel', () => {
  it('maps cell / glue / wall faces', () => {
    expect(kindFromForxaPanel({ id: 'cell-0', name: 'göz', polygon: [], face: 'cell' })).toBe('product-window')
    expect(kindFromForxaPanel({ id: 'glue-tab', name: 'y', polygon: [], face: 'glue' })).toBe('glue')
    expect(kindFromForxaPanel({ id: 'wall-2', name: 'd', polygon: [], face: 'side' })).toBe('polygon-wall')
    expect(kindFromForxaPanel({ id: 'front', name: 'ö', polygon: [], face: 'front' })).toBe('hero-front')
  })
})
