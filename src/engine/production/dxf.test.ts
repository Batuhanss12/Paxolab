import { describe, expect, it } from 'vitest'
import type { DesignBrief } from '../../types'
import { emptyBrief } from '../fields'
import { buildDieline } from '../dieline/buildDieline'
import { generateForxaModel } from '../dieline/forxaGenerate'
import { buildDielineDxf } from './dxf'

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

describe('buildDielineDxf', () => {
  it('exports CUT as closed LWPOLYLINE from outlineUnion rings plus CREASE lines', () => {
    const model = buildDieline('tuck-end-box', boxBrief())
    expect(model.cut).toHaveLength(1)
    const ring = model.cut[0]!
    expect(ring.length).toBeGreaterThan(4)
    expect(model.crease.length).toBeGreaterThan(0)

    const dxf = buildDielineDxf(model)
    expect(dxf).toContain('CUT')
    expect(dxf).toContain('CREASE')
    expect(dxf).toContain('LAYER')
    expect(dxf).toContain('TABLE')
    expect(dxf).toContain('LWPOLYLINE')
    expect(dxf).toContain('LINE')
    // closed polyline flag (group 70 = 1)
    expect(dxf).toMatch(/LWPOLYLINE[\s\S]*?\n70\n1\n/)
    // vertex count matches outlineUnion cut ring
    expect(dxf).toContain(`90\n${ring.length}\n`)
    // first vertex of the union ring is present (Y flipped for DXF)
    expect(dxf).toContain(`10\n${ring[0]!.x}\n`)
    expect(dxf).toContain(`20\n${-ring[0]!.y}\n`)
    expect(dxf).toContain('2\nCUT\n70\n0\n62\n1\n')
    expect(dxf).toContain('2\nCREASE\n70\n0\n62\n5\n')
    expect(dxf).toContain('2\nPERF\n70\n0\n62\n6\n')
  })

  it('puts zipper perforation on PERF, not CUT', () => {
    const model = generateForxaModel('tuck-end-box', { L: 80, W: 40, H: 80 }, undefined, '12')
    const dxf = buildDielineDxf(model)
    expect((model.perf ?? []).length).toBeGreaterThan(0)
    expect(dxf).toContain('PERF')
  })

  it('wrap-label DXF keeps CUT closed rings and one CREASE', () => {
    const model = buildDieline(
      'wrap-label',
      boxBrief({ packagingMode: 'label', dimensionsMm: { L: 90, W: 0, H: 70 } }),
    )
    const dxf = buildDielineDxf(model)
    expect(model.cut).toHaveLength(2)
    expect(model.crease).toHaveLength(1)
    expect(dxf).toContain('CUT')
    expect(dxf).toContain('CREASE')
    const closedFlags = dxf.match(/\n70\n1\n/g) ?? []
    expect(closedFlags.length).toBeGreaterThanOrEqual(2)
  })
})
