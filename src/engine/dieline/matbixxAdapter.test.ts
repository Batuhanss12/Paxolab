import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { buildDieline } from './buildDieline'
import { generateMatbixxModel } from './matbixxGenerate'
import { registry } from './matbixx/registry'
import { kindFromMatbixxPanel, toDielineModel } from './matbixxAdapter'
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

describe('MatBixx adapter (D7-A)', () => {
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

  it('routes polygon-box through MatBixx', () => {
    const model = generateMatbixxModel('polygon-box', { L: 60, W: 60, H: 120 }, { sides: 6, closureType: 0 })
    expect(model.consistent).toBe(true)
    expect(model.panels.some((p) => p.kind === 'hero-front')).toBe(true)
    expect(model.panels.some((p) => p.id === 'base')).toBe(true)
    expect(model.cut.length).toBeGreaterThan(0)
  })
})

describe('kindFromMatbixxPanel', () => {
  it('maps cell / glue / wall faces', () => {
    expect(kindFromMatbixxPanel({ id: 'cell-0', name: 'göz', polygon: [], face: 'cell' })).toBe('product-window')
    expect(kindFromMatbixxPanel({ id: 'glue-tab', name: 'y', polygon: [], face: 'glue' })).toBe('glue')
    expect(kindFromMatbixxPanel({ id: 'wall-2', name: 'd', polygon: [], face: 'side' })).toBe('polygon-wall')
    expect(kindFromMatbixxPanel({ id: 'front', name: 'ö', polygon: [], face: 'front' })).toBe('hero-front')
  })
})
