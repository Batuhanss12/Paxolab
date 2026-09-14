import { describe, expect, it } from 'vitest'
import { emptyBrief } from '../../fields'
import { buildDieline } from '../buildDieline'
import { generateForxaModel } from '../forxaGenerate'
import { registry } from '../forxa/registry'
import { renderStructureDoc } from '../renderDielineSvg'
import { buildDielinePdf, encodePdfBytes } from './pdfDieline'
import { boxFromMm, classifyGrammar, resolveMaterial, solveDimensions } from './solver'

describe('Forxa structural pipeline', () => {
  it('does not treat W/D/H as raw SVG pixels — A60 solver uses the becf-11101 ratios', () => {
    const solved = solveDimensions(
      'tuck-top-auto-bottom',
      boxFromMm(100, 50, 150),
      resolveMaterial('carton-300'),
    )
    expect(solved.glueWidth).toBeCloseTo(13, 0)
    expect(solved.tuckLength).toBe(50)
    expect(solved.tuckHead).toBeCloseTo(14, 0)
    expect(solved.dustFlapLength).toBeCloseTo(32, 0)
    expect(solved.lockDepth).toBeCloseTo(36, 0)
    expect(solved.bleed.amount).toBe(3)
    expect(classifyGrammar('tuck-top-auto-bottom').ecmaCode).toBe('A60.20.00.03')
    expect(resolveMaterial('carton-300').thicknessMm).toBeCloseTo(0.389, 3)
  })

  it('builds ECMA A60 100×50×150 with closed CUT, creases, glue, and zones', () => {
    const model = generateForxaModel('tuck-top-auto-bottom', { L: 100, W: 50, H: 150 })
    expect(model.consistent).toBe(true)
    expect(model.cut.length).toBeGreaterThan(0)
    expect(model.crease.length).toBeGreaterThanOrEqual(8)
    expect(model.panels.some((p) => p.kind === 'hero-front' && p.id === 'front')).toBe(true)
    expect(model.panels.some((p) => p.kind === 'glue')).toBe(true)
    expect(model.panels.filter((p) => p.id.startsWith('auto-bottom')).length).toBe(4)
    expect(model.structural?.grammar).toBe('tuck-top-auto-bottom')
    expect(model.structural?.ecmaCode).toBe('A60.20.00.03')
    expect(model.structural?.glueAreas.length).toBeGreaterThan(0)
    expect(model.structural?.artworkZones.some((z) => z.face === 'front')).toBe(true)
    expect(model.structural?.findings.some((f) => f.severity === 'FATAL')).toBe(false)
    const front = model.panels.find((p) => p.id === 'front')!
    expect(front.w).toBeCloseTo(100, 1)
    expect(front.h).toBeCloseTo(150, 1)
    const glue = model.panels.find((p) => p.kind === 'glue')!
    expect(glue.w).toBeGreaterThanOrEqual(10)
    expect(glue.w).toBeLessThanOrEqual(16)
  })

  it('builds RSC with major/minor flaps and a closed cut', () => {
    const model = generateForxaModel('rsc-carton', { L: 200, W: 150, H: 150 })
    expect(model.consistent).toBe(true)
    expect(model.panels.filter((p) => p.id.startsWith('major-')).length).toBe(4)
    expect(model.panels.filter((p) => p.id.startsWith('minor-')).length).toBe(4)
    expect(model.structural?.grammar).toBe('rsc')
    expect(model.structural?.solved.flapDepth).toBe(75)
    expect(model.cut[0]!.length).toBeGreaterThan(8)
  })

  it('tags SVG cut/crease metadata and writes a vector PDF', () => {
    const model = generateForxaModel('tuck-top-auto-bottom', { L: 100, W: 50, H: 150 })
    const svg = renderStructureDoc(model, 'A60')
    expect(svg).toContain('data-type="cut"')
    expect(svg).toContain('data-type="crease"')
    const pdf = buildDielinePdf(model, 'A60')
    expect(pdf.startsWith('%PDF-1.6')).toBe(true)
    expect(pdf).toContain('%%EOF')
    expect(pdf).toContain('/S /GTS_PDFX')
    expect(pdf).toContain('PDF/X-4')
    expect(pdf).toContain('sRGB IEC61966-2.1')
    expect(pdf).toContain('/TrimBox')
    expect(pdf).toContain('/BleedBox')
    expect(pdf).toContain('/MediaBox')
    expect(pdf).toContain('/OutputIntents')
    expect(pdf).toContain('/Trapped /False')
    expect(pdf).toContain('DestOutputProfile')
    expect(pdf).not.toContain('Helvetica')
    expect(pdf).not.toContain('not PDF/X')
    const bytes = encodePdfBytes(pdf)
    expect(bytes[0]).toBe(0x25)
    expect(bytes[7]).toBe(0x36)
    expect(bytes[10]).toBe(0xe2)
  })

  it('writes PERF as its own layer for zipper aux', () => {
    const model = generateForxaModel('tuck-end-box', { L: 80, W: 40, H: 80 }, undefined, '12')
    expect((model.perf ?? []).length).toBeGreaterThan(0)
    const svg = renderStructureDoc(model, 'zipper')
    expect(svg).toContain('data-type="perf"')
    const pdf = buildDielinePdf(model, 'zipper')
    expect(pdf).toContain('0.75 0 0.75 RG')
    expect(pdf).toContain('/S /GTS_PDFX')
  })

  it('keeps native perfume tuck-end off the A60 engine', () => {
    const native = buildDieline('tuck-end-box', {
      ...emptyBrief(),
      packagingMode: 'box',
      dimensionsMm: { L: 70, W: 35, H: 140 },
    })
    expect(native.panels).toHaveLength(13)
    expect(native.structural?.grammar).toBe('straight-tuck-end')
    expect(registry.get('tuck-top-auto-bottom')?.id).toBe('tuck-top-auto-bottom')
  })
})
