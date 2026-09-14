import { describe, expect, it } from 'vitest'
import { buildPressProofKit, PRESS_PROOF_SKUS } from './pressProof'

describe('press-proof die-shop pack', () => {
  const kit = buildPressProofKit()
  const primary = kit.packs.find((p) => p.sku.role === 'primary')!
  const alt = kit.packs.find((p) => p.sku.role === 'alternate')!

  it('keeps perfume tuck as the one SKU to cut first', () => {
    expect(PRESS_PROOF_SKUS[0]!.role).toBe('primary')
    expect(primary.sku.templateId).toBe('fm-cos-tuck-perfume')
    expect(primary.sku.dims).toEqual({ L: 70, W: 35, H: 140 })
    expect(primary.spec.structureId).toBe('tuck-end-box')
    expect(primary.spec.dieline.panels).toHaveLength(13)
    expect(primary.spec.preflight.exportOk).toBe(true)
  })

  it('ships DXF layers and PDF/X-4 sRGB without a FOGRA claim', () => {
    const dxf = primary.files.find((f) => f.name.endsWith('.dxf'))!.data as string
    expect(dxf).toContain('CUT')
    expect(dxf).toContain('CREASE')
    const pdf = primary.files.find((f) => f.name.endsWith('.pdf'))!.data as Uint8Array
    const head = String.fromCharCode(...pdf.slice(0, 8))
    expect(head).toBe('%PDF-1.6')
    const text = Buffer.from(pdf).toString('latin1')
    expect(text).toContain('PDF/X-4')
    expect(text).toContain('sRGB IEC61966-2.1')
    expect(text).toContain('/Trapped /False')
    expect(text).not.toContain('FOGRA39')
  })

  it('keeps A60 as the mill-drawing alternate only', () => {
    expect(alt.sku.templateId).toBe('fm-box-ecma-a60')
    expect(alt.sku.dims).toEqual({ L: 100, W: 50, H: 150 })
    expect(alt.spec.dieline.structural?.ecmaCode).toBe('A60.20.00.03')
    expect(alt.spec.preflight.exportOk).toBe(true)
  })

  it('writes a shop brief that does not claim the board sits', () => {
    expect(kit.brief).toContain('70×35×140')
    expect(kit.brief).toContain('dieline.dxf')
    expect(kit.brief).toContain('trap')
    expect(kit.brief).toContain('FOGRA')
    expect(kit.brief).toContain('Motor yeşili')
    expect(kit.brief).toContain('200')
  })
})
