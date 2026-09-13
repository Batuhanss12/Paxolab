/**
 * Forxa — Regular Slotted Carton (RSC / FEFCO 0201 style).
 * Major flaps on length panels, minor flaps on width panels.
 * Slot gap is a Forxa config default (3 mm), not a claimed mill standard.
 */
import type {
  DielineResult,
  FoldLine,
  PackagingStructure,
  Panel,
  Path,
  Point,
  StructureParameter,
  ValidationResult,
} from '../types'
import { bbox, linePath, polygonPath, rect, SVGBuilder } from '../svgBuilder'
import { getDefaultParams, mergeParams, validateParameters } from '../validator'

function close(points: Point[]): Path {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first) return []
  if (last && first.x === last.x && first.y === last.y) return polygonPath(points)
  return polygonPath([...points, { ...first }])
}

export class RscCarton implements PackagingStructure {
  id = 'rsc-carton'
  name = 'Regular Slotted Carton'
  category = 'box' as const
  description = 'RSC — major/minor flap, slot, score'
  icon = 'box'

  parameters: StructureParameter[] = [
    { key: 'length', label: 'Boy (L)', unit: 'mm', min: 40, max: 800, default: 200, step: 1, required: true },
    { key: 'width', label: 'En (W)', unit: 'mm', min: 30, max: 600, default: 150, step: 1, required: true },
    { key: 'height', label: 'Yükseklik (H)', unit: 'mm', min: 30, max: 600, default: 150, step: 1, required: true },
    { key: 'glueTabWidth', label: 'Yapıştırma', unit: 'mm', min: 18, max: 50, default: 30, step: 1, required: false },
    { key: 'slotWidth', label: 'Slot', unit: 'mm', min: 2, max: 8, default: 3, step: 0.5, required: false },
    { key: 'materialThickness', label: 'Kalınlık', unit: 'mm', min: 0, max: 8, default: 0, step: 0.1, required: false },
  ]

  getDefaultParameters(): Record<string, number> {
    return getDefaultParams(this.parameters)
  }

  validateParameters(params: Record<string, number>): ValidationResult {
    const base = validateParameters(params, this.parameters)
    if (!base.valid) return base
    const warnings: string[] = []
    if (params.slotWidth >= params.width / 2) {
      warnings.push('Slot genişliği flap derinliğine yaklaşıyor')
    }
    return { valid: true, errors: base.errors, warnings: [...base.warnings, ...warnings] }
  }

  generateDieline(userParams: Record<string, number>): DielineResult {
    const params = mergeParams(this.getDefaultParameters(), userParams)
    const validation = this.validateParameters(params)
    if (!validation.valid) {
      return {
        success: false,
        structureId: this.id,
        structureName: this.name,
        svg: '',
        paths: { cut: [], crease: [], glue: [], perf: [] },
        folds: [],
        panels: [],
        bounds: { width: 0, height: 0 },
        metadata: {
          totalArea: 0,
          materialUsage: 0,
          wastePercentage: 0,
          boundingBox: { width: 0, height: 0 },
          recommendedMaterial: '',
          complexity: 'simple',
          industryCompliance: ['FEFCO-0201'],
        },
        warnings: validation.warnings,
        errors: validation.errors,
      }
    }

    const L = params.length
    const W = params.width
    const H = params.height
    const G = params.glueTabWidth
    const slot = params.slotWidth
    const F = W / 2
    const glueAngle = G * 0.12

    const x0 = 0
    const x1 = G
    const x2 = G + L
    const x3 = G + L + W
    const x4 = G + L + W + L
    const x5 = G + L + W + L + W

    const y0 = 0
    const y1 = F
    const y2 = F + H
    const y3 = F + H + F

    const s = slot / 2
    const outer: Point[] = [
      { x: x0, y: y1 + glueAngle },
      { x: x1, y: y1 },
      { x: x1 + s, y: y1 },
      { x: x1 + s, y: y0 },
      { x: x2 - s, y: y0 },
      { x: x2 - s, y: y1 },
      { x: x2 + s, y: y1 },
      { x: x2 + s, y: y0 },
      { x: x3 - s, y: y0 },
      { x: x3 - s, y: y1 },
      { x: x3 + s, y: y1 },
      { x: x3 + s, y: y0 },
      { x: x4 - s, y: y0 },
      { x: x4 - s, y: y1 },
      { x: x4 + s, y: y1 },
      { x: x4 + s, y: y0 },
      { x: x5 - s, y: y0 },
      { x: x5 - s, y: y1 },
      { x: x5, y: y1 },
      { x: x5, y: y2 },
      { x: x5 - s, y: y2 },
      { x: x5 - s, y: y3 },
      { x: x4 + s, y: y3 },
      { x: x4 + s, y: y2 },
      { x: x4 - s, y: y2 },
      { x: x4 - s, y: y3 },
      { x: x3 + s, y: y3 },
      { x: x3 + s, y: y2 },
      { x: x3 - s, y: y2 },
      { x: x3 - s, y: y3 },
      { x: x2 + s, y: y3 },
      { x: x2 + s, y: y2 },
      { x: x2 - s, y: y2 },
      { x: x2 - s, y: y3 },
      { x: x1 + s, y: y3 },
      { x: x1 + s, y: y2 },
      { x: x1, y: y2 },
      { x: x0, y: y2 - glueAngle },
    ]

    const cutPaths: Path[] = [close(outer)]
    for (const x of [x2, x3, x4]) {
      cutPaths.push(linePath({ x, y: y0 }, { x, y: y1 }))
      cutPaths.push(linePath({ x, y: y2 }, { x, y: y3 }))
    }

    const creasePaths: Path[] = [
      linePath({ x: x1, y: y1 }, { x: x1, y: y2 }),
      linePath({ x: x2, y: y1 }, { x: x2, y: y2 }),
      linePath({ x: x3, y: y1 }, { x: x3, y: y2 }),
      linePath({ x: x4, y: y1 }, { x: x4, y: y2 }),
      linePath({ x: x1, y: y1 }, { x: x5, y: y1 }),
      linePath({ x: x1, y: y2 }, { x: x5, y: y2 }),
    ]

    const gluePoly = close([
      { x: x0, y: y1 + glueAngle },
      { x: x1, y: y1 },
      { x: x1, y: y2 },
      { x: x0, y: y2 - glueAngle },
    ])

    const folds: FoldLine[] = creasePaths.map((p) => ({
      from: p[0]!,
      to: p[1]!,
      angle: 90,
      type: 'valley' as const,
    }))

    const panels: Panel[] = [
      { id: 'glue-tab', name: 'Yapıştırma', polygon: gluePoly, face: 'glue' },
      { id: 'front', name: 'Ön', polygon: rect(x1, y1, L, H), face: 'front' },
      { id: 'side-left', name: 'Sol', polygon: rect(x2, y1, W, H), face: 'left' },
      { id: 'back', name: 'Arka', polygon: rect(x3, y1, L, H), face: 'back' },
      { id: 'side-right', name: 'Sağ', polygon: rect(x4, y1, W, H), face: 'right' },
      { id: 'major-top-front', name: 'Üst major ön', polygon: rect(x1 + s, y0, L - slot, F), face: 'top' },
      { id: 'minor-top-left', name: 'Üst minor sol', polygon: rect(x2 + s, y0, W - slot, F), face: 'top' },
      { id: 'major-top-back', name: 'Üst major arka', polygon: rect(x3 + s, y0, L - slot, F), face: 'top' },
      { id: 'minor-top-right', name: 'Üst minor sağ', polygon: rect(x4 + s, y0, W - slot, F), face: 'top' },
      { id: 'major-bottom-front', name: 'Alt major ön', polygon: rect(x1 + s, y2, L - slot, F), face: 'bottom' },
      { id: 'minor-bottom-left', name: 'Alt minor sol', polygon: rect(x2 + s, y2, W - slot, F), face: 'bottom' },
      { id: 'major-bottom-back', name: 'Alt major arka', polygon: rect(x3 + s, y2, L - slot, F), face: 'bottom' },
      { id: 'minor-bottom-right', name: 'Alt minor sağ', polygon: rect(x4 + s, y2, W - slot, F), face: 'bottom' },
    ]

    const builder = new SVGBuilder({
      width: x5,
      height: y3,
      margin: 12,
      showGrid: false,
      showDimensions: true,
      showRegMarks: true,
    })
    for (const p of cutPaths) builder.addCutPath(p)
    for (const p of creasePaths) builder.addCreasePath(p)
    builder.addGluePath(gluePoly)
    for (const f of folds) builder.addFold(f)
    for (const panel of panels) builder.addPanel(panel)

    const bb = bbox([...cutPaths, ...creasePaths])
    return {
      success: true,
      structureId: this.id,
      structureName: this.name,
      svg: builder.build(),
      paths: { cut: cutPaths, crease: creasePaths, glue: [gluePoly], perf: [] },
      folds,
      panels,
      bounds: { width: x5, height: y3 },
      metadata: {
        totalArea: bb.w * bb.h,
        materialUsage: 2 * L * H + 2 * W * H + 2 * L * F + 2 * W * F + G * H,
        wastePercentage: 0,
        boundingBox: { width: x5, height: y3 },
        recommendedMaterial: '',
        complexity: 'simple',
        industryCompliance: ['FEFCO-0201'],
      },
      warnings: validation.warnings,
      errors: [],
    }
  }
}

export default RscCarton
